import React, { useEffect, useState, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { Camera, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';

interface MobileSenderProps {
  hostId: string;
}

export const MobileSender: React.FC<MobileSenderProps> = ({ hostId }) => {
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
    if (!files || !connection.current) return;

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
            setTimeout(() => setStatus('connected'), 1500);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    });
    
    e.target.value = '';
  };

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-10 text-center">
        <h1 className="text-red-500 font-bold text-xl mb-4">Link Expired</h1>
        <p className="text-slate-400 text-sm">Please rescan the QR Code on your laptop.</p>
      </div>
    );
  }

  if (status === 'searching') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <Loader2 className="animate-spin mb-4 text-blue-500" size={48}/> 
        <p className="font-bold tracking-widest uppercase text-xs opacity-60">Syncing with Laptop...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white px-6">
      <div className="text-center mb-12 animate-in fade-in duration-700">
        <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">Connected</h1>
        <p className="text-slate-400 mt-2 font-medium">Pages sent to laptop: <span className="text-white">{sentCount}</span></p>
      </div>

      <div className="flex flex-col w-full space-y-6 max-w-sm animate-in slide-in-from-bottom-10 duration-500">
        {/* Opens Native File Manager */}
        <label className="flex items-center justify-center bg-blue-600 py-8 rounded-[2rem] cursor-pointer hover:bg-blue-500 active:scale-95 transition-all shadow-2xl shadow-blue-600/20 text-xl font-black uppercase tracking-tighter border-b-8 border-blue-800">
          <ImageIcon className="mr-3" size={28} /> 
          File Manager
          <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>

        {/* Opens Native Camera */}
        <label className="flex items-center justify-center bg-slate-900 py-8 rounded-[2rem] cursor-pointer hover:bg-slate-800 active:scale-95 transition-all shadow-xl text-xl font-black uppercase tracking-tighter border border-slate-800">
          <Camera className="mr-3" size={28} /> 
          Use Camera
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      {status === 'sending' && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-50">
          <Loader2 className="w-20 h-20 text-blue-500 animate-spin mb-6" />
          <p className="text-white font-black text-2xl tracking-tighter italic uppercase">Uploading...</p>
        </div>
      )}
    </div>
  );
};
