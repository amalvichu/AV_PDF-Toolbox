import React, { useEffect, useState, useRef } from 'react';
import Peer from 'peerjs';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, Monitor, CheckCircle, Loader2, Download, Trash2, Zap, Wifi } from 'lucide-react';
import { usePDF } from '../hooks/usePDF';

export const ScanTool: React.FC = () => {
  const [source, setSource] = useState<'idle' | 'local' | 'phone'>('idle');
  const [peerId, setPeerId] = useState<string>('');
  const [status, setStatus] = useState<'initializing' | 'waiting' | 'connected'>('initializing');
  const [scannedPages, setScannedPages] = useState<{ blob: Blob; url: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const peerInstance = useRef<Peer | null>(null);
  const { imagesToPDF, downloadBlob } = usePDF();

  // Handle local computer uploads
  const handleLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        blob: file,
        url: URL.createObjectURL(file)
      }));
      setScannedPages(prev => [...prev, ...newFiles]);
      setSource('local');
    }
  };

  // Initialize PeerJS ONLY if 'phone' is selected
  useEffect(() => {
    if (source !== 'phone') return;

    const peer = new Peer({
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ]
      }
    });
    peerInstance.current = peer;

    peer.on('open', (id) => {
      setPeerId(id);
      setStatus('waiting');
    });

    peer.on('connection', (conn) => {
      conn.on('open', () => {
        setStatus('connected');
        conn.send({ type: 'WELCOME' });
      });

      conn.on('data', (data: any) => {
        if (data.type === 'IMAGE' && data.payload) {
          const blob = new Blob([data.payload], { type: 'image/jpeg' });
          const url = URL.createObjectURL(blob);
          setScannedPages((prev) => [...prev, { blob, url }]);
        }
      });
      
      conn.on('close', () => setStatus('waiting'));
      conn.on('error', () => setStatus('waiting'));
    });

    return () => {
      peer.destroy();
    };
  }, [source]);

  const handleGenerate = async () => {
    if (scannedPages.length === 0) return;
    setIsProcessing(true);
    try {
      const blobs = scannedPages.map(p => p.blob);
      const pdfBytes = await imagesToPDF(blobs);
      downloadBlob(pdfBytes, `scanned-doc-${Date.now()}.pdf`);
      // Cleanup URLs
      scannedPages.forEach(p => URL.revokeObjectURL(p.url));
      setScannedPages([]);
      setSource('idle');
    } catch (error) {
      alert('Failed to generate PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const removePage = (index: number) => {
    setScannedPages(prev => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const mobileUrl = `${window.location.origin}${window.location.pathname}?mode=mobile-sender&target=${peerId}`;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {source === 'idle' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-12 animate-in fade-in zoom-in duration-500">
          <label className="group flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-800 rounded-[2.5rem] bg-slate-900/40 cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all">
            <div className="bg-blue-600/10 p-6 rounded-3xl mb-6 group-hover:scale-110 transition-transform">
              <Monitor size={48} className="text-blue-500" />
            </div>
            <span className="text-xl font-bold text-white mb-2">From Computer</span>
            <p className="text-slate-500 text-sm text-center">Select existing images from your drive</p>
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleLocalUpload} />
          </label>

          <button 
            onClick={() => setSource('phone')}
            className="group flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-800 rounded-[2.5rem] bg-slate-900/40 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
          >
            <div className="bg-emerald-600/10 p-6 rounded-3xl mb-6 group-hover:scale-110 transition-transform">
              <Smartphone size={48} className="text-emerald-500" />
            </div>
            <span className="text-xl font-bold text-white mb-2">From Phone</span>
            <p className="text-slate-500 text-sm text-center">Use your phone as a wireless scanner</p>
          </button>
        </div>
      )}

      {source === 'phone' && (
        <div className="space-y-6">
          {status === 'initializing' && (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-slate-400 font-medium animate-pulse">Generating Secure Bridge...</p>
            </div>
          )}

          {status === 'waiting' && (
            <div className="bg-slate-900/60 rounded-[2.5rem] p-10 border border-slate-800 flex flex-col md:flex-row items-center gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex-1 space-y-6 text-center md:text-left">
                <div className="bg-blue-600/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto md:mx-0">
                  <Wifi className="text-blue-500 w-6 h-6" />
                </div>
                <h3 className="text-3xl font-black text-white leading-tight">Wireless <br/><span className="text-blue-500">Sync Active</span></h3>
                <p className="text-slate-400">Scan this code with your phone's camera app to start pushing images directly to this list.</p>
                <div className="inline-flex items-center space-x-3 bg-black/40 px-4 py-2 rounded-full border border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>ID: {peerId}</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] shadow-2xl">
                <QRCodeSVG value={mobileUrl} size={200} level="H" />
              </div>
            </div>
          )}

          {status === 'connected' && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl flex items-center justify-between animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center space-x-4">
                <div className="bg-emerald-500 p-3 rounded-2xl">
                  <CheckCircle className="text-white w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-emerald-400 font-bold">Phone Connected</h4>
                  <p className="text-emerald-500/60 text-xs">Waiting for scans from your device...</p>
                </div>
              </div>
              <button onClick={() => setSource('idle')} className="text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">Stop Sync</button>
            </div>
          )}
        </div>
      )}

      {scannedPages.length > 0 && (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-white font-black text-xl tracking-tight flex items-center">
              <Zap className="w-5 h-5 mr-2 text-amber-500 fill-amber-500" />
              Waitlist ({scannedPages.length})
            </h3>
            <div className="flex space-x-4">
              {source === 'local' && (
                <button onClick={() => setSource('idle')} className="text-blue-400 hover:text-blue-300 text-xs font-black uppercase tracking-widest transition-colors">Add More</button>
              )}
              <button 
                onClick={() => {
                  scannedPages.forEach(p => URL.revokeObjectURL(p.url));
                  setScannedPages([]);
                  setSource('idle');
                }} 
                className="text-slate-500 hover:text-red-400 text-xs font-black uppercase tracking-widest transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {scannedPages.map((page, index) => (
              <div key={index} className="relative aspect-[3/4] bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 group shadow-xl">
                <img src={page.url} alt={`Page ${index + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                  <button 
                    onClick={() => removePage(index)} 
                    className="bg-red-500 p-3 rounded-full text-white shadow-2xl hover:scale-110 active:scale-90 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] text-white font-black border border-white/10">
                  PAGE {index + 1}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-black py-6 rounded-3xl flex items-center justify-center disabled:bg-slate-800 disabled:text-slate-600 transition-all shadow-2xl shadow-blue-600/20 text-lg uppercase tracking-tighter"
          >
            {isProcessing ? (
              <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Finalizing PDF...</>
            ) : (
              <><Download className="w-6 h-6 mr-3" /> Generate Final PDF</>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
