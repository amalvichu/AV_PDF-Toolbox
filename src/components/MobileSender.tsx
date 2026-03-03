import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { Camera, Upload, Send, Wifi, AlertCircle, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';

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
  const pingIntervalRef = useRef<any>(null);

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
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    
    setStatus('linking');
    addLog('Connecting to P2P Server...');

    const newPeer = new Peer({
      host: '0.peerjs.com',
      port: 443,
      secure: true,
      debug: 1
    });

    newPeer.on('open', (id) => {
      addLog('Server Ready. Linking...');
      const activeConn = newPeer.connect(hostId, { reliable: true });

      activeConn.on('open', () => {
        addLog('Link Established!');
        setConn(activeConn);
        setStatus('connected');
        
        // Start Heartbeat
        pingIntervalRef.current = setInterval(() => {
          activeConn.send({ type: 'PING' });
        }, 3000);
      });

      activeConn.on('data', (data: any) => {
        if (data.type === 'WELCOME' || data.type === 'PONG') {
          if (status !== 'connected') {
            setStatus('connected');
            addLog('Ready to scan');
          }
        }
      });

      activeConn.on('error', (err) => {
        console.error('Conn error:', err);
        setStatus('error');
        addLog('Link failed.');
      });

      activeConn.on('close', () => {
        setStatus('error');
        addLog('Disconnected.');
      });
    });

    newPeer.on('error', (err) => {
      console.error('Peer error:', err);
      setStatus('error');
      addLog(`Error: ${err.type}`);
    });

    setPeer(newPeer);
  };

  useEffect(() => {
    initConnection();
    return () => {
      if (peer) peer.destroy();
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [hostId]);

  const sendFile = async (file: File) => {
    if (!conn || status !== 'connected') return;
    setStatus('sending');
    addLog('Sending...');
    try {
      const compressedBlob = await compressImage(file);
      const arrayBuffer = await compressedBlob.arrayBuffer();
      conn.send({ file: arrayBuffer, filename: file.name, type: 'image/jpeg' });
      setStatus('success');
      addLog('Sent Successfully!');
      setTimeout(() => {
        setStatus('connected');
        addLog('Ready to scan');
      }, 2000);
    } catch (err) {
      setStatus('error');
      addLog('Send failed.');
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
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center text-center font-sans">
      <div className={`mb-8 p-6 rounded-full transition-all duration-500 ${
        status === 'success' ? 'bg-green-500/20 ring-8 ring-green-500/10' : 
        status === 'sending' ? 'bg-blue-500/20 animate-pulse' : 
        status === 'connected' ? 'bg-emerald-500/10 ring-8 ring-emerald-500/5' :
        'bg-slate-800'
      }`}>
        {status === 'success' ? <CheckCircle2 className="w-16 h-16 text-green-500" /> :
         status === 'sending' ? <Loader2 className="w-16 h-16 text-blue-500 animate-spin" /> :
         status === 'error' ? <AlertCircle className="w-16 h-16 text-red-500" /> :
         status === 'connected' ? <Wifi className="w-16 h-16 text-emerald-500" /> :
         <Wifi className="w-16 h-16 text-slate-600 animate-pulse" />}
      </div>

      <h1 className="text-3xl font-black text-white mb-2 tracking-tight">REMOTE SCANNER</h1>
      
      <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 mb-12">
        <p className={`text-xs font-bold uppercase tracking-widest ${
          status === 'connected' ? 'text-emerald-400' : 'text-slate-400'
        }`}>
          {statusMsg}
        </p>
      </div>

      {status === 'connected' ? (
        <div className="w-full max-w-sm space-y-4 animate-in fade-in zoom-in duration-500">
          <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileChange} />
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

          <button 
            onClick={() => cameraInputRef.current?.click()}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black py-10 rounded-[2.5rem] flex flex-col items-center justify-center transition-all shadow-2xl shadow-blue-600/20 border-b-8 border-blue-800"
          >
            <Camera className="w-14 h-14 mb-3" />
            <span className="text-2xl uppercase tracking-tighter">Snap Document</span>
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold py-6 rounded-3xl flex items-center justify-center transition-all border border-slate-700"
          >
            <Upload className="w-6 h-6 mr-3 text-slate-400" />
            <span className="text-lg">Gallery</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col items-center space-y-2">
            {logs.map((log, i) => (
              <p key={i} className="text-[10px] text-slate-500 font-mono opacity-60">[{new Date().toLocaleTimeString()}] {log}</p>
            ))}
          </div>
          
          <button 
            onClick={initConnection}
            className="bg-slate-800 hover:bg-slate-700 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all border border-slate-700 active:scale-95 flex items-center shadow-xl"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${status === 'linking' ? 'animate-spin' : ''}`} />
            Force Reconnect
          </button>
        </div>
      )}

      {status === 'sending' && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-50">
          <Loader2 className="w-20 h-20 text-blue-500 animate-spin mb-6" />
          <p className="text-white font-black text-2xl tracking-tighter uppercase">Uploading to Laptop...</p>
        </div>
      )}
    </div>
  );
};
