import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { Camera, Upload, Send, Wifi, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MobileSenderProps {
  hostId: string;
}

export const MobileSender: React.FC<MobileSenderProps> = ({ hostId }) => {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [conn, setConn] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'linking' | 'connected' | 'sending' | 'error' | 'success'>('linking');
  const [statusMsg, setStatusMsg] = useState('Initializing P2P...');
  const [debugLog, setDebugLog] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string) => {
    setDebugLog(prev => [msg, ...prev].slice(0, 5));
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
        
        canvas.toBlob((blob) => {
          resolve(blob || file);
        }, 'image/jpeg', 0.7);
      };
    });
  };

  const initConnection = () => {
    if (peer) peer.destroy();
    
    addLog('Connecting to cloud server...');
    setStatus('linking');

    const newPeer = new Peer({
      debug: 2, // Moderate logging
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
        ]
      }
    });

    newPeer.on('open', (id) => {
      addLog(`Server ready. Searching for laptop...`);
      const activeConn = newPeer.connect(hostId, {
        reliable: true,
        serialization: 'binary'
      });

      activeConn.on('open', () => {
        setConn(activeConn);
        setStatus('connected');
        addLog('Connected to Laptop!');
      });

      activeConn.on('error', (err) => {
        console.error('Conn Error:', err);
        setStatus('error');
        addLog('Link failed. Is the laptop tool open?');
      });

      activeConn.on('close', () => {
        setStatus('error');
        addLog('Connection lost.');
      });
    });

    newPeer.on('error', (err) => {
      console.error('Peer Error:', err);
      setStatus('error');
      addLog(`Server Error: ${err.type}`);
    });

    setPeer(newPeer);
  };

  // Initialize on mount
  useEffect(() => {
    initConnection();
    return () => {
      if (peer) peer.destroy();
    };
  }, [hostId]);

  const sendFile = async (file: File) => {
    if (!conn || status !== 'connected') return;

    setStatus('sending');
    setStatusMsg('Compressing & Sending...');

    try {
      const compressedBlob = await compressImage(file);

      // Keep the raw buffer fix which solves the loading issue
      const arrayBuffer = await compressedBlob.arrayBuffer();

      conn.send({
        file: arrayBuffer,
        filename: file.name,
        type: 'image/jpeg'
      });

      setStatus('success');
      setStatusMsg('Sent successfully!');
      setTimeout(() => {
        setStatus('connected');
        setStatusMsg('Ready to scan');
      }, 2000);

    } catch (err) {
      console.error('Send error:', err);
      setStatus('error');
      setStatusMsg('Failed to send.');
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
      <div className={`mb-8 p-4 rounded-full ${status === 'success' ? 'bg-green-500/20' : status === 'sending' ? 'bg-blue-500/20' : 'bg-slate-800'}`}>
        {status === 'success' ? <CheckCircle2 className="w-12 h-12 text-green-500 animate-in zoom-in" /> :
         status === 'sending' ? <Send className="w-12 h-12 text-blue-500 animate-bounce" /> :
         status === 'error' ? <AlertCircle className="w-12 h-12 text-red-500 animate-shake" /> :
         status === 'connected' ? <Wifi className="w-12 h-12 text-green-500 animate-pulse" /> :
         <Wifi className="w-12 h-12 text-slate-500" />}
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">Remote Scanner</h1>
      <p className={`text-sm mb-12 font-medium ${
        status === 'success' ? 'text-green-400' :
        status === 'error' ? 'text-red-400' :
        status === 'connected' ? 'text-green-400' :
        'text-slate-400'
      }`}>
        {statusMsg}
      </p>

      {(status === 'error' || status === 'linking') && (
        <div className="flex flex-col items-center space-y-4 animate-in fade-in duration-700">
          <button 
            onClick={initConnection}
            className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center transition-all border border-slate-700"
          >
            <Wifi className="w-4 h-4 mr-2" /> Retry Connection
          </button>
          
          <div className="max-w-xs text-[10px] text-slate-600 font-mono bg-black/20 p-3 rounded-lg border border-white/5 text-left overflow-hidden">
            <p className="uppercase text-slate-500 font-black mb-1 border-b border-white/5 pb-1">Debug History</p>
            {debugLog.map((log, i) => (
              <p key={i} className="truncate">>{log}</p>
            ))}
          </div>

          {window.location.hostname === 'localhost' && (
            <div className="max-w-xs bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-left">
              <p className="text-amber-500 text-[10px] font-black uppercase mb-1">Localhost Warning</p>
              <p className="text-amber-500/60 text-[10px] leading-tight">You are on localhost. Your phone cannot reach this laptop unless you use your laptop's Local IP address in the URL.</p>
            </div>
          )}
        </div>
      )}

      {status === 'connected' && (
        <div className="w-full max-w-sm space-y-6 animate-in slide-in-from-bottom-10 fade-in duration-500">
          <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileChange} />
          <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />

          <button 
            onClick={() => cameraInputRef.current?.click()}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black py-8 rounded-3xl flex flex-col items-center justify-center transition-all shadow-xl shadow-blue-500/20 ring-4 ring-blue-500/20"
          >
            <Camera className="w-12 h-12 mb-2" />
            <span className="text-xl">SNAP PHOTO</span>
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold py-6 rounded-2xl flex items-center justify-center transition-all border border-slate-700"
          >
            <Upload className="w-6 h-6 mr-3 text-slate-400" />
            <span className="text-lg">Select from Gallery</span>
          </button>
        </div>
      )}

      {status === 'sending' && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-6"></div>
          <p className="text-white font-bold text-xl">Sending to Laptop...</p>
        </div>
      )}
      
      {status === 'linking' && (
        <p className="text-slate-500 text-xs animate-pulse">Establishing secure P2P bridge...</p>
      )}
    </div>
  );
};
