import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { Camera, Upload, Send, Wifi, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MobileSenderProps {
  hostId: string;
}

export const MobileSender: React.FC<MobileSenderProps> = ({ hostId }) => {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [conn, setConn] = useState<any>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'sending' | 'error'>('connecting');
  const [statusMsg, setStatusMsg] = useState('Connecting to Laptop...');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize Peer (Client)
    const newPeer = new Peer(undefined, { debug: 1 });
    setPeer(newPeer);

    newPeer.on('open', (id) => {
      console.log('Mobile Peer ID:', id);
      // Connect to the Host (Laptop)
      const connection = newPeer.connect(hostId, {
        reliable: true
      });
      
      const handleOpen = () => {
        setConn(connection);
        setStatus('connected');
        setStatusMsg('Connected! Ready to scan.');
      };

      if (connection.open) {
        handleOpen();
      } else {
        connection.on('open', handleOpen);
      }

      connection.on('close', () => {
        setStatus('disconnected');
        setStatusMsg('Connection lost. Please rescan QR.');
      });

      connection.on('error', (err) => {
        console.error('Connection Error:', err);
        setStatus('error');
        setStatusMsg('Failed to connect to laptop.');
      });
    });

    newPeer.on('error', (err) => {
      console.error('Peer Error:', err);
      setStatus('error');
      setStatusMsg('Connection failed. Is the laptop tool open?');
    });

    return () => {
      newPeer.destroy();
    };
  }, [hostId]);

  const sendFile = (file: File) => {
    if (!conn || status !== 'connected') return;

    setStatus('sending');
    setStatusMsg(`Sending ${file.name}...`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const blob = new Blob([new Uint8Array(e.target?.result as ArrayBuffer)], { type: file.type });
      
      conn.send({
        file: blob,
        filename: file.name,
        type: file.type
      });

      setTimeout(() => {
        setStatus('connected');
        setStatusMsg('Sent successfully! Take another?');
      }, 800);
    };
    reader.readAsArrayBuffer(file);
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
      <div className={`mb-8 p-4 rounded-full ${status === 'connected' ? 'bg-green-500/20' : 'bg-slate-800'}`}>
        {status === 'connected' ? <Wifi className="w-12 h-12 text-green-500 animate-pulse" /> :
         status === 'sending' ? <Send className="w-12 h-12 text-blue-500 animate-bounce" /> :
         status === 'error' ? <AlertCircle className="w-12 h-12 text-red-500" /> :
         <Wifi className="w-12 h-12 text-slate-500" />}
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">Remote Scanner</h1>
      <p className={`text-sm mb-12 font-medium ${
        status === 'connected' ? 'text-green-400' :
        status === 'error' ? 'text-red-400' :
        'text-slate-400'
      }`}>
        {statusMsg}
      </p>

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
          
          <p className="text-slate-500 text-xs">Photos are sent directly to your laptop.</p>
        </div>
      )}

      {status === 'sending' && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-6"></div>
          <p className="text-white font-bold text-xl">Sending to Laptop...</p>
        </div>
      )}
    </div>
  );
};