import React, { useEffect, useState, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { Camera, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, Send, Wifi } from 'lucide-react';

export const MobileSender: React.FC<{ hostId: string }> = ({ hostId }) => {
  const [status, setStatus] = useState<'searching' | 'connected' | 'error' | 'sending' | 'success'>('searching');
  const [sentCount, setSentCount] = useState(0);
  const connection = useRef<DataConnection | null>(null);

  useEffect(() => {
    if (!hostId) {
      setStatus('error');
      return;
    }

    const peer = new Peer({
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ]
      }
    });

    peer.on('open', () => {
      const conn = peer.connect(hostId, { reliable: true });
      
      conn.on('open', () => {
        connection.current = conn;
        // The laptop will send a WELCOME signal to confirm the handshake
      });

      conn.on('data', (data: any) => {
        if (data.type === 'WELCOME') {
          setStatus('connected');
        }
      });
      
      conn.on('close', () => setStatus('error'));
      conn.on('error', () => setStatus('error'));
    });

    peer.on('error', () => setStatus('error'));

    return () => {
      peer.destroy();
    };
  }, [hostId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !connection.current || status !== 'connected') return;

    setStatus('sending');
    const fileList = Array.from(files);
    let processed = 0;

    fileList.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          connection.current?.send({ 
            type: 'IMAGE', 
            payload: event.target.result 
          });
          
          processed++;
          if (processed === fileList.length) {
            setSentCount(prev => prev + fileList.length);
            setStatus('success');
            setTimeout(() => setStatus('connected'), 2000);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    });
    
    // Clear input
    e.target.value = '';
  };

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-20 h-20 text-red-500 mb-6" />
        <h1 className="text-2xl font-black text-white mb-2 tracking-tighter">LINK EXPIRED</h1>
        <p className="text-slate-500 mb-8 max-w-xs">The connection bridge was lost. Please refresh your laptop and rescan the code.</p>
        <button onClick={() => window.location.reload()} className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs">Retry</button>
      </div>
    );
  }

  if (status === 'searching') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-10">
          <Loader2 className="w-24 h-24 text-blue-600 animate-spin" />
          <Wifi className="w-8 h-8 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2 tracking-tighter italic">SYNCING</h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Establishing Secure Bridge</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className={`mb-10 p-8 rounded-[3rem] transition-all duration-500 ${
        status === 'success' ? 'bg-green-500/20 ring-8 ring-green-500/5' : 
        status === 'sending' ? 'bg-blue-500/20 animate-pulse' : 
        'bg-slate-900 shadow-2xl'
      }`}>
        {status === 'success' ? <CheckCircle2 className="w-24 h-24 text-green-500" /> :
         status === 'sending' ? <Send className="w-24 h-24 text-blue-500" /> :
         <SmartphoneIcon className="w-24 h-24 text-emerald-500" />}
      </div>

      <div className="mb-12">
        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter italic">CONNECTED</h1>
        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 px-4 py-1 rounded-full border border-emerald-500/20">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            {sentCount} Pages Pushed
          </span>
        </div>
      </div>

      <div className="flex flex-col w-full space-y-6 max-w-sm">
        {/* Opens Camera directly on mobile */}
        <label className="group relative flex flex-col items-center justify-center bg-blue-600 active:scale-95 transition-all py-10 rounded-[2.5rem] cursor-pointer shadow-2xl shadow-blue-600/30 border-b-8 border-blue-800">
          <Camera className="w-12 h-12 text-white mb-2" />
          <span className="text-xl font-black text-white uppercase tracking-tighter">Snap Document</span>
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
        </label>

        {/* Opens Mobile Gallery */}
        <label className="flex items-center justify-center bg-slate-900 active:bg-slate-800 transition-colors py-6 rounded-3xl cursor-pointer border border-slate-800 shadow-xl">
          <ImageIcon className="w-6 h-6 text-slate-400 mr-3" />
          <span className="text-lg font-bold text-slate-200">Gallery</span>
          <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      <p className="mt-12 text-slate-600 text-[10px] font-black uppercase tracking-widest max-w-[200px] leading-relaxed">
        Images will appear instantly on your laptop waitlist.
      </p>

      {status === 'sending' && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in duration-200">
          <Loader2 className="w-20 h-20 text-blue-500 animate-spin mb-6" />
          <p className="text-white font-black text-2xl tracking-tighter italic">UPLOADING...</p>
        </div>
      )}
    </div>
  );
};

const SmartphoneIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
    <path d="M12 18h.01"/>
  </svg>
);
