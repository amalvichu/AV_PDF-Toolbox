import React, { useState, useRef, useEffect } from 'react';
import { usePDF } from '../hooks/usePDF';
import { Camera, Upload, X, Plus, Download, Trash2, Zap, Smartphone, QrCode, Wifi, Monitor } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Peer from 'peerjs';
import { v4 as uuidv4 } from 'uuid';

export const ScanTool: React.FC = () => {
  const [scannedPages, setScannedPages] = useState<{ blob: Blob; preview: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [peerId, setPeerId] = useState('');
  const [peer, setPeer] = useState<Peer | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'waiting' | 'connected'>('disconnected');
  
  // State for the base URL (defaults to current origin + path)
  const [appBaseUrl, setAppBaseUrl] = useState(() => {
    // 1. Try to get from LocalStorage
    const saved = localStorage.getItem('av_pdf_toolbox_public_url');
    if (saved) return saved;

    // 2. If on public domain (not localhost), use current URL
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal) {
        const url = window.location.origin + window.location.pathname;
        return url.endsWith('/') ? url : url + '/';
    }

    // 3. Fallback for localhost (will prompt user)
    return '';
  });

  // Save URL when changed
  useEffect(() => {
    if (appBaseUrl && (appBaseUrl.startsWith('http') || appBaseUrl.startsWith('https'))) {
       localStorage.setItem('av_pdf_toolbox_public_url', appBaseUrl);
    }
  }, [appBaseUrl]);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { imagesToPDF, downloadBlob } = usePDF();

  // Initialize Peer on Mount
  useEffect(() => {
    const id = uuidv4().split('-')[0]; // Short, clean ID
    const newPeer = new Peer(id, {
      debug: 1
    });
    
    newPeer.on('open', (id) => {
      setPeerId(id);
      setConnectionStatus('waiting');
    });

    newPeer.on('connection', (conn) => {
      setConnectionStatus('connected');
      setShowQR(false); 
      
      conn.on('data', (data: any) => {
        if (data.file) {
          const blob = new Blob([data.file], { type: data.type });
          const preview = URL.createObjectURL(blob);
          setScannedPages(prev => [...prev, { blob, preview }]);
        }
      });

      conn.on('close', () => {
        setConnectionStatus('waiting');
      });
    });

    setPeer(newPeer);

    return () => {
      newPeer.destroy();
    };
  }, []); 

  const getMobileUrl = () => {
    if (!peerId) return '';
    const baseUrl = window.location.origin + window.location.pathname;
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return `${cleanBaseUrl}?mode=mobile-sender&hostId=${peerId}`;
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newPages = files.map(file => ({
        blob: file,
        preview: URL.createObjectURL(file)
      }));
      setScannedPages(prev => [...prev, ...newPages]);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePage = (index: number) => {
    setScannedPages(prev => {
      const newPages = [...prev];
      URL.revokeObjectURL(newPages[index].preview);
      return newPages.filter((_, i) => i !== index);
    });
  };

  const handleGenerate = async () => {
    if (scannedPages.length === 0) return;
    setIsProcessing(true);
    try {
      const blobs = scannedPages.map(p => p.blob);
      const pdfBytes = await imagesToPDF(blobs);
      downloadBlob(pdfBytes, `scan-${Date.now()}.pdf`);
      scannedPages.forEach(p => URL.revokeObjectURL(p.preview));
      setScannedPages([]);
    } catch (error) {
      console.error('Scan to PDF Error:', error);
      alert('Failed to generate PDF from scans.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Hidden Inputs */}
      <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleCapture} />
      <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleCapture} />

      {/* Connection Status Banner (Only when connected) */}
      {connectionStatus === 'connected' && (
        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Smartphone className="w-6 h-6 text-green-500" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse border-2 border-slate-900"></div>
            </div>
            <div>
              <h4 className="text-green-400 font-bold text-sm">Phone Connected!</h4>
              <p className="text-green-500/60 text-xs">Files sent from phone will appear below automatically.</p>
            </div>
          </div>
        </div>
      )}

      {scannedPages.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 rounded-3xl p-10 text-center bg-slate-900/40 hover:border-blue-500/50 transition-all cursor-pointer group"
          >
            <div className="bg-blue-600/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Upload from Laptop</h3>
            <p className="text-slate-500 text-xs leading-relaxed">Select images directly from this computer.</p>
          </div>

          <div 
            onClick={() => setShowQR(true)}
            className={`border-2 border-dashed border-slate-800 rounded-3xl p-10 text-center bg-slate-900/40 hover:border-emerald-500/50 transition-all cursor-pointer group ${connectionStatus === 'connected' ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}
          >
            <div className="bg-emerald-600/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Wifi className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Connect Phone Camera</h3>
            <p className="text-slate-500 text-xs leading-relaxed">Scan a QR code to use your phone as a remote scanner.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-white font-bold text-lg flex items-center">
              <Zap className="w-5 h-5 mr-2 text-amber-500 fill-amber-500" />
              Captured Pages ({scannedPages.length})
            </h3>
            <div className="flex space-x-4">
              <button onClick={() => setShowQR(true)} className="flex items-center text-emerald-400 text-xs font-bold uppercase tracking-widest hover:text-emerald-300">
                <Wifi className="w-4 h-4 mr-1" /> {connectionStatus === 'connected' ? 'Phone Active' : 'Connect Phone'}
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="text-blue-400 text-xs font-bold uppercase tracking-widest hover:text-blue-300">Add from Laptop</button>
              <button onClick={() => setScannedPages([])} className="text-slate-500 hover:text-red-400 text-xs font-bold uppercase tracking-widest">Clear All</button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {scannedPages.map((page, index) => (
              <div key={index} className="relative aspect-[3/4] bg-slate-800 rounded-xl overflow-hidden border border-slate-700 group shadow-lg animate-in zoom-in duration-300">
                <img src={page.preview} alt={`Page ${index + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => removePage(index)} className="bg-red-500 p-2 rounded-full text-white shadow-xl hover:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white font-bold">#{index + 1}</div>
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl flex items-center justify-center disabled:bg-slate-800 transition-all shadow-2xl"
          >
            {isProcessing ? 'Generating PDF...' : <><Download className="w-5 h-5 mr-2" /> Save Scanned PDF</>}
          </button>
        </div>
      )}

      {/* QR Code Modal Overlay */}
      {showQR && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="bg-white p-4 rounded-3xl inline-block mb-6 shadow-xl">
                <QRCodeSVG value={getMobileUrl()} size={200} level="H" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Scan with Phone</h3>
              <p className="text-slate-400 text-sm mb-6">
                Open your phone's camera app and scan this code to connect instantly.
              </p>

              <div className="bg-slate-800/50 p-4 rounded-xl text-left">
                <label className="block text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center">
                  <Monitor className="w-3 h-3 mr-2" /> App URL (Required)
                </label>
                <input 
                  type="text" 
                  value={appBaseUrl}
                  onChange={(e) => setAppBaseUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-sm font-mono focus:border-blue-500 focus:outline-none"
                  placeholder="https://your-app.com/"
                />
                <div className="mt-3 space-y-2">
                  <p className="text-slate-500 text-[10px] leading-relaxed">
                    <strong className="text-slate-300">Different Networks?</strong> (e.g. Phone SIM vs Laptop Wi-Fi): Use the <span className="text-blue-400">publicly deployed URL</span> of this app (like your GitHub Pages link).
                  </p>
                  <p className="text-slate-500 text-[10px] leading-relaxed">
                    <strong className="text-slate-300">Same Wi-Fi?</strong> Use your laptop's local IP (e.g., <span className="text-emerald-400">http://192.168.1.5:5173/</span>).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};