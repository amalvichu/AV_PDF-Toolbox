import React, { useEffect, useState, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, Loader2, Download, Trash2, Zap, Wifi } from 'lucide-react';
import { usePDF } from '../hooks/usePDF';

export const ScanTool: React.FC = () => {
  const [peerId, setPeerId] = useState<string>('');
  const [status, setStatus] = useState<'initializing' | 'waiting' | 'connected'>('initializing');
  const [scannedPages, setScannedPages] = useState<{ blob: Blob; url: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const peerInstance = useRef<Peer | null>(null);
  const connection = useRef<DataConnection | null>(null);
  const { imagesToPDF, downloadBlob } = usePDF();

  useEffect(() => {
    // 1. Initialize Peer with robust STUN servers
    const peer = new Peer({
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
        ]
      }
    });

    peerInstance.current = peer;

    peer.on('open', (id) => {
      setPeerId(id);
      setStatus('waiting');
    });

    peer.on('connection', (conn) => {
      // 2. Wait for the channel to open before setting state
      conn.on('open', () => {
        connection.current = conn;
        setStatus('connected');
        
        // 3. Handshake
        conn.send({ type: 'WELCOME' });
      });

      conn.on('data', (data: any) => {
        if (data.type === 'IMAGE' && data.payload) {
          // 4. Handle incoming blob safely
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
  }, []);

  const handleGenerate = async () => {
    if (scannedPages.length === 0) return;
    setIsProcessing(true);
    try {
      const blobs = scannedPages.map(p => p.blob);
      const pdfBytes = await imagesToPDF(blobs);
      downloadBlob(pdfBytes, `scan-${Date.now()}.pdf`);
      // Optional: clear after save
      // setScannedPages([]);
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

  if (status === 'initializing') {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Initializing Secure P2P Bridge...</p>
      </div>
    );
  }

  const mobileUrl = `${window.location.origin}${window.location.pathname}?mode=mobile-sender&target=${peerId}`;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {status === 'connected' && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Smartphone className="w-6 h-6 text-emerald-500" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h4 className="text-emerald-400 font-bold text-sm">Phone Linked</h4>
              <p className="text-emerald-500/60 text-xs">Waiting for images from your mobile device...</p>
            </div>
          </div>
          <button 
            onClick={() => setStatus('waiting')}
            className="text-[10px] uppercase font-black tracking-widest text-emerald-500/40 hover:text-emerald-500 transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}

      {status === 'waiting' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-8 animate-in fade-in duration-500">
          <div className="space-y-6">
            <div className="bg-blue-600/10 w-16 h-16 rounded-2xl flex items-center justify-center">
              <Wifi className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-3xl font-black text-white leading-tight">Connect Your <br/><span className="text-blue-500">Smartphone</span></h3>
            <p className="text-slate-400 leading-relaxed">
              Scan the QR code to turn your phone into a high-fidelity wireless scanner. 
              No app installation required.
            </p>
            <div className="flex items-center space-x-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Peer ID: {peerId}</span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-blue-500/10 border-8 border-slate-800/50">
              <QRCodeSVG value={mobileUrl} size={220} level="H" includeMargin />
            </div>
            <div className="mt-6 flex items-center text-slate-500 text-sm font-medium">
              <Smartphone className="w-4 h-4 mr-2" /> Scan with Camera App
            </div>
          </div>
        </div>
      )}

      {scannedPages.length > 0 && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-white font-bold text-lg flex items-center">
              <Zap className="w-5 h-5 mr-2 text-amber-500 fill-amber-500" />
              Captured Pages ({scannedPages.length})
            </h3>
            <button 
              onClick={() => {
                scannedPages.forEach(p => URL.revokeObjectURL(p.url));
                setScannedPages([]);
              }} 
              className="text-slate-500 hover:text-red-400 text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {scannedPages.map((page, index) => (
              <div key={index} className="relative aspect-[3/4] bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 group shadow-lg transition-transform hover:scale-[1.02]">
                <img src={page.url} alt={`Page ${index + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => removePage(index)} 
                    className="bg-red-500 p-2 rounded-full text-white shadow-xl hover:scale-110 active:scale-90 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] text-white font-black border border-white/10">
                  PAGE {index + 1}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-black py-5 rounded-2xl flex items-center justify-center disabled:bg-slate-800 disabled:text-slate-600 transition-all shadow-2xl shadow-blue-600/20"
          >
            {isProcessing ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating PDF...</>
            ) : (
              <><Download className="w-5 h-5 mr-2" /> Save Scanned PDF</>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
