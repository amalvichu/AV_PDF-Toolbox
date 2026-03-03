import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { Camera, Upload, Send, Wifi, AlertCircle, CheckCircle2, RefreshCw, Loader2, Smartphone } from 'lucide-react';

interface MobileSenderProps {
  hostId: string;
}

export const MobileSender: React.FC<MobileSenderProps> = ({ hostId }) => {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [conn, setConn] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'linking' | 'connected' | 'sending' | 'error' | 'success'>('linking');
  const [statusMsg, setStatusMsg] = useState('Initializing...');
  const [logs, setLogs] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<any>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 3));
    setStatusMsg(msg);
  };

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 0.7);
      };
    });
  };

  const initConnection = () => {
    if (peer) peer.destroy();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    setStatus('linking');
    addLog('Connecting to cloud...');

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
      addLog('Linking to laptop...');
      const activeConn = newPeer.connect(hostId, { reliable: true });

      // 30 second timeout for the actual bridge
      timeoutRef.current = setTimeout(() => {
        if (!activeConn.open) {
          setStatus('error');
          addLog('Handshake timed out.');
          activeConn.close();
        }
      }, 30000);

      activeConn.on('open', () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        addLog('Connected!');
        setConn(activeConn);
        setStatus('connected');
      });

      activeConn.on('data', (data: any) => {
        if (data.type === 'WELCOME') {
          addLog('Ready to scan');
          setStatus('connected');
        }
      });

      activeConn.on('error', (err) => {
        setStatus('error');
        addLog('Link failed.');
      });

      activeConn.on('close', () => {
        setStatus('error');
        addLog('Laptop disconnected.');
      });
    });

    newPeer.on('error', (err) => {
      setStatus('error');
      addLog(`Server: ${err.type}`);
    });

    setPeer(newPeer);
  };

  useEffect(() => {
    initConnection();
    return () => {
      if (peer) peer.destroy();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [hostId]);

  const sendFile = async (file: File) => {
    if (!conn || status !== 'connected') return;
    setStatus('sending');
    addLog('Sending image...');
    try {
      const compressedBlob = await compressImage(file);
      const arrayBuffer = await compressedBlob.arrayBuffer();
      conn.send({ file: arrayBuffer, filename: file.name, type: 'image/jpeg' });
      setStatus('success');
      addLog('Sent!');
      setTimeout(() => {
        setStatus('connected');
        addLog('Ready to scan');
      }, 2000);
    } catch (err) {
      setStatus('error');
      addLog('Failed to send.');
      setTimeout(() => setStatus('connected'), 3000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      sendFile(e.target.files[0]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center text-center">
      <div className={`mb-10 p-8 rounded-[2.5rem] transition-all duration-500 shadow-2xl ${
        status === 'success' ? 'bg-green-500/20 shadow-green-500/10 scale-110' : 
        status === 'sending' ? 'bg-blue-500/20 animate-pulse' : 
        status === 'connected' ? 'bg-emerald-500/10 shadow-emerald-500/10' :
        'bg-slate-900 shadow-black/50'
      }`}>
        {status === 'success' ? <CheckCircle2 className="w-20 h-20 text-green-500" /> :
         status === 'sending' ? <Loader2 className="w-20 h-20 text-blue-500 animate-spin" /> :
         status === 'error' ? <AlertCircle className="w-20 h-20 text-red-500" /> :
         status === 'connected' ? <Smartphone className="w-20 h-20 text-emerald-500" /> :
         <Wifi className="w-20 h-20 text-slate-700 animate-pulse" />}
      </div>

      <div className="mb-12">
        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter italic">SCANNER</h1>
        <div className="bg-white/5 border border-white/10 rounded-full px-6 py-1 inline-block">
          <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${
            status === 'connected' ? 'text-emerald-400' : 'text-slate-500'
          }`}>
            {statusMsg}
          </p>
        </div>
      </div>

      {status === 'connected' ? (
        <div className="w-full max-w-sm space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
          <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileChange} />
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

          <button 
            onClick={() => cameraInputRef.current?.click()}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black py-12 rounded-[3rem] flex flex-col items-center justify-center transition-all shadow-2xl shadow-blue-600/40 border-b-8 border-blue-800"
          >
            <Camera className="w-16 h-16 mb-4" />
            <span className="text-3xl tracking-tighter">TAKE PHOTO</span>
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold py-6 rounded-[2rem] flex items-center justify-center transition-all border border-slate-800 shadow-xl"
          >
            <Upload className="w-6 h-6 mr-3 text-slate-500" />
            <span className="text-xl">Gallery</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8 max-w-xs">
          <div className="flex flex-col items-center space-y-2">
            {logs.map((log, i) => (
              <p key={i} className="text-[10px] text-slate-600 font-mono">>{log}</p>
            ))}
          </div>
          
          <button 
            onClick={initConnection}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all border border-slate-800 active:scale-95 flex items-center justify-center shadow-2xl"
          >
            <RefreshCw className={`w-4 h-4 mr-3 ${status === 'linking' ? 'animate-spin' : ''}`} />
            Retry Link
          </button>

          <div className="text-[10px] text-slate-700 font-medium leading-relaxed italic">
            Target Laptop ID: <span className="text-slate-500 font-mono">{hostId}</span>
          </div>
        </div>
      )}

      {status === 'sending' && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center z-50">
          <div className="relative mb-8">
            <Loader2 className="w-24 h-24 text-blue-500 animate-spin" />
            <Send className="w-10 h-10 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-white font-black text-3xl tracking-tighter italic">UPLOADING...</p>
          <p className="text-blue-500/50 text-[10px] mt-4 font-black uppercase tracking-widest">Do not close this window</p>
        </div>
      )}
    </div>
  );
};
