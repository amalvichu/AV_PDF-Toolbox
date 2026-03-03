import React, { useState, useRef, useEffect } from 'react';
import { usePDF } from '../hooks/usePDF';
import { Upload, X, Download, Trash2, Zap, Smartphone, Wifi, Monitor, Info } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Peer from 'peerjs';

export const ScanTool: React.FC = () => {
  const [scannedPages, setScannedPages] = useState<{ blob: Blob; preview: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [peerId, setPeerId] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'waiting' | 'connected'>('disconnected');
  const [connectionLog, setConnectionLog] = useState<string>('Initializing server...');
  
  const [appBaseUrl, setAppBaseUrl] = useState(() => {
    const saved = localStorage.getItem('av_pdf_toolbox_public_url');
    if (saved) return saved;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal) {
        const url = window.location.origin + window.location.pathname;
        return url.endsWith('/') ? url : url + '/';
    }
    return '';
  });

  useEffect(() => {
    if (appBaseUrl && (appBaseUrl.startsWith('http') || appBaseUrl.startsWith('https'))) {
       localStorage.setItem('av_pdf_toolbox_public_url', appBaseUrl);
    }
  }, [appBaseUrl]);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { imagesToPDF, downloadBlob } = usePDF();

  useEffect(() => {
    const newPeer = new Peer({
      host: '0.peerjs.com',
      port: 443,
      secure: true,
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
        ]
      }
    });
    
    newPeer.on('open', (id) => {
      setPeerId(id);
      setConnectionStatus('waiting');
      setConnectionLog('Ready! Waiting for phone...');
    });

    newPeer.on('error', (err) => {
      console.error('Peer error:', err);
      setConnectionLog(`Server Error: ${err.type}`);
    });

    newPeer.on('connection', (conn) => {
      setConnectionLog('Phone found. Opening bridge...');

      conn.on('open', () => {
        setConnectionStatus('connected');
        setShowQR(false); 
        setConnectionLog('Connected!');
        conn.send({ type: 'WELCOME' });
      });

      conn.on('data', (data: any) => {
        if (data.type === 'PING') {
          conn.send({ type: 'PONG' });
          return;
        }
        
        if (data.file) {
          setConnectionLog('Image received!');
          const blob = new Blob([data.file], { type: data.type || 'image/jpeg' });
          const preview = URL.createObjectURL(blob);
          setScannedPages(prev => [...prev, { blob, preview }]);
          setTimeout(() => setConnectionLog('Connected!'), 2000);
        }
      });

      conn.on('close', () => {
        setConnectionStatus('waiting');
        setConnectionLog('Disconnected. Waiting...');
      });

      conn.on('error', (err) => {
        setConnectionLog('Link error. Please retry.');
      });
    });

    setPeer(newPeer);
    return () => newPeer.destroy();
  }, []); 

  const getMobileUrl = () => {
    if (!peerId) return '';
    const baseUrl = (appBaseUrl && appBaseUrl.startsWith('http')) 
      ? appBaseUrl 
      : window.location.origin + window.location.pathname;
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return `${cleanBaseUrl}?mode=mobile-sender&hostId=${encodeURIComponent(peerId)}`;
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newPages = files.map(file => ({
        blob: file,
        preview: URL.createObjectURL(file)
      }));
      setScannedPages(prev => [...prev, ...newPages]);
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
      setScannedPages([]);
    } catch (error) {
      alert('Failed to generate PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleCapture} />
      <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleCapture} />

      {connectionStatus === 'connected' && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between animate-in slide-in-from-top-4">
          <div className="flex items-center space-x-3">
            <Smartphone className="w-6 h-6 text-emerald-500" />
            <div>
              <h4 className="text-emerald-400 font-bold text-sm">Phone Active</h4>
              <p className="text-emerald-500/60 text-xs">Waiting for images from your device...</p>
            </div>
          </div>
          <div className="text-[10px] font-mono text-emerald-500/40 bg-black/20 px-2 py-1 rounded">ID: {peerId}</div>
        </div>
      )}

      {scannedPages.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 rounded-3xl p-10 text-center bg-slate-900/40 hover:border-blue-500/50 transition-all cursor-pointer group"
          >
            <Upload className="w-8 h-8 text-blue-500 mx-auto mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white mb-2">Upload from Laptop</h3>
            <p className="text-slate-500 text-xs">Select images from this computer.</p>
          </div>

          <div 
            onClick={() => setShowQR(true)}
            className={`border-2 border-dashed border-slate-800 rounded-3xl p-10 text-center bg-slate-900/40 hover:border-emerald-500/50 transition-all cursor-pointer group`}
          >
            <Wifi className="w-8 h-8 text-emerald-500 mx-auto mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white mb-2">Connect Phone</h3>
            <p className="text-slate-500 text-xs">Use phone camera as a wireless scanner.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-white font-bold text-lg flex items-center">
              <Zap className="w-5 h-5 mr-2 text-amber-500 fill-amber-500" />
              Scanned Pages ({scannedPages.length})
            </h3>
            <div className="flex space-x-4">
              <button onClick={() => setShowQR(true)} className="flex items-center text-emerald-400 text-xs font-bold uppercase hover:text-emerald-300">
                <Wifi className="w-4 h-4 mr-1" /> {connectionStatus === 'connected' ? 'Phone Linked' : 'Reconnect Phone'}
              </button>
              <button onClick={() => setScannedPages([])} className="text-slate-500 hover:text-red-400 text-xs font-bold uppercase">Clear All</button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {scannedPages.map((page, index) => (
              <div key={index} className="relative aspect-[3/4] bg-slate-800 rounded-xl overflow-hidden border border-slate-700 group shadow-lg animate-in zoom-in">
                <img src={page.preview} alt={`Page ${index + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => removePage(index)} className="bg-red-500 p-2 rounded-full text-white hover:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></button>
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

      {showQR && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full relative shadow-2xl">
            <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="bg-white p-4 rounded-3xl inline-block mb-6 shadow-xl min-w-[232px] min-h-[232px] flex items-center justify-center">
                {peerId ? <QRCodeSVG value={getMobileUrl()} size={200} level="H" /> : <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>}
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Scan to Connect</h3>
              <p className="text-slate-400 text-sm mb-6 font-mono text-xs">Laptop ID: {peerId}</p>

              <div className="bg-slate-800/50 p-3 rounded-xl mb-6 text-left border border-slate-700 flex items-center">
                <Info className="w-4 h-4 text-blue-400 mr-3 shrink-0" />
                <p className="text-xs text-blue-400 font-medium">{connectionLog}</p>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-xl text-left">
                <label className="block text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center">
                  <Monitor className="w-3 h-3 mr-2" /> App URL (Required)
                </label>
                <div className="flex space-x-2">
                  <input type="text" value={appBaseUrl} onChange={(e) => setAppBaseUrl(e.target.value)} className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-xs font-mono focus:border-blue-500 focus:outline-none" placeholder="https://your-app.com/" />
                  <button onClick={() => { localStorage.setItem('av_pdf_toolbox_public_url', appBaseUrl); alert('URL Saved!'); }} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold">Save</button>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 leading-tight">Must match the URL showing in your browser right now.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
