import React, { useEffect, useState, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { Camera, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const MobileSender: React.FC<{ hostId: string }> = ({ hostId }) => {
  const [status, setStatus] = useState<'searching' | 'connected' | 'error' | 'sending' | 'success'>('searching');
  const connection = useRef<DataConnection | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!hostId) {
      setStatus('error');
      return;
    }

    // 1. Initialize Peer
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
      // 2. Connect to laptop
      const conn = peer.connect(hostId, { reliable: true });
      
      conn.on('open', () => {
        connection.current = conn;
        // Wait for WELCOME from laptop to confirm sync
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

    // 3. Start Camera
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      } 
    })
      .then(stream => { 
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream; 
      })
      .catch(err => {
        console.error(err);
        setStatus('error');
      });

    return () => { 
      peer.destroy(); 
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [hostId]);

  const snapDocument = () => {
    if (!canvasRef.current || !videoRef.current || !connection.current || status !== 'connected') return;
    
    setStatus('sending');
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    
    if (context) {
      context.drawImage(videoRef.current, 0, 0);
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          // 4. Send raw blob inside the payload wrapper
          connection.current?.send({ type: 'IMAGE', payload: blob });
          setStatus('success');
          setTimeout(() => setStatus('connected'), 1500);
        }
      }, 'image/jpeg', 0.85);
    }
  };

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Connection Failed</h2>
        <p className="text-slate-400 mb-6 text-sm">Could not link to the laptop. Please refresh both devices and try again.</p>
        <button onClick={() => window.location.reload()} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold">Retry</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted
        className="w-full h-full object-cover" 
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Header UI */}
      <div className="absolute top-0 w-full p-6 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center">
        <div>
          <h1 className="text-white font-black tracking-tighter text-xl italic">REMOTE SCANNER</h1>
          <div className="flex items-center mt-1">
            <div className={`w-2 h-2 rounded-full mr-2 ${status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
            <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">
              {status === 'connected' ? 'Linked & Ready' : 'Establishing Secure Link...'}
            </span>
          </div>
        </div>
      </div>

      {/* Success Overlay */}
      {status === 'success' && (
        <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="bg-emerald-500 p-4 rounded-full shadow-2xl animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <p className="text-white font-black mt-4 text-2xl tracking-tighter italic">PAGE SENT!</p>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 w-full p-10 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center">
        {status === 'searching' ? (
          <div className="flex flex-col items-center text-white space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="text-sm font-bold uppercase tracking-[0.2em] opacity-60">Syncing with Laptop...</p>
          </div>
        ) : (
          <div className="relative group">
            <div className="absolute -inset-4 bg-blue-600/20 rounded-full blur-xl group-active:bg-blue-600/40 transition-all"></div>
            <button 
              onClick={snapDocument}
              disabled={status === 'sending'}
              className="relative w-24 h-24 bg-white rounded-full border-8 border-white/20 flex items-center justify-center active:scale-90 transition-transform shadow-2xl shadow-white/10"
            >
              <div className="w-16 h-16 rounded-full border-4 border-slate-900 flex items-center justify-center">
                <Camera className="w-8 h-8 text-slate-900" />
              </div>
            </button>
          </div>
        )}
        
        <p className="mt-8 text-white/40 text-[10px] font-bold uppercase tracking-widest">
          {status === 'connected' ? 'Tap to capture page' : 'Please wait...'}
        </p>
      </div>
    </div>
  );
};
