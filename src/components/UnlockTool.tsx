import React, { useState } from 'react';
import { usePDF, ADMIN_KEY } from '../hooks/usePDF';
import { File as FileIcon, X, Unlock, Lock, Key, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export const UnlockTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [adminKey, setAdminKey] = useState('');
  const [pdfPassword, setPdfPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>('');
  const { unlockPDF, pdfToImages, imagesToPDF, downloadBlob } = usePDF();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUnlock = async () => {
    if (!file) return;

    if (adminKey.trim() !== ADMIN_KEY) {
      alert('ACCESS DENIED: The Admin Master Key is incorrect.');
      return;
    }

    if (!pdfPassword) {
      alert('REQUIRED: Please enter the original PDF password.');
      return;
    }

    setIsProcessing(true);
    setStatus('Initializing master bypass...');
    
    try {
      // Step 1: Attempt standard structural unlock
      setStatus('Attempting structural decryption...');
      const unlockedPdf = await unlockPDF(file, pdfPassword);
      downloadBlob(unlockedPdf, `unlocked-${file.name}`);
      
      setFile(null);
      setAdminKey('');
      setPdfPassword('');
      alert('Success! The PDF has been successfully unlocked.');
    } catch (error: any) {
      console.error('Unlock Error:', error);
      
      // Step 2: Automatic Fallback for AES-256 / Compatibility Issues
      setStatus('Structural unlock unsupported. Activating High-Fidelity Reconstruction...');
      try {
        // 1. Render pages at high-resolution (300 DPI)
        setStatus('Rendering pages at ultra-high resolution...');
        const imageBlobs = await pdfToImages(file, pdfPassword);
        
        // 2. Re-build the PDF from the images
        setStatus('Re-building high-fidelity document...');
        const reconstructedPdf = await imagesToPDF(imageBlobs);
        
        downloadBlob(reconstructedPdf, `master-recovery-${file.name}`);
        setFile(null);
        setAdminKey('');
        setPdfPassword('');
        alert('Master Recovery Complete! A high-quality, unlocked copy has been generated.');
      } catch (recoveryError: any) {
        console.error('Recovery Error:', recoveryError);
        alert('Unlock failed. Please ensure the PDF password is correct for this specific file.');
      }
    } finally {
      setIsProcessing(false);
      setStatus('');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!file ? (
        <div className="border-2 border-dashed border-slate-700 rounded-3xl p-16 text-center bg-slate-900/50 hover:border-blue-500 transition-all cursor-pointer group">
          <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" id="unlock-upload" />
          <label htmlFor="unlock-upload" className="cursor-pointer">
            <Unlock className="w-16 h-16 text-blue-500 mx-auto mb-6 group-hover:scale-110 transition-transform" />
            <p className="text-slate-200 font-bold text-2xl mb-2">Secure Unlock Portal</p>
            <p className="text-slate-500 text-sm font-medium tracking-wide">Master Key Authorization Required</p>
          </label>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl relative">
          <div className="absolute top-0 right-0 p-6">
            <button onClick={() => setFile(null)} className="text-slate-600 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center space-x-4 mb-10">
            <div className="bg-red-500/10 p-4 rounded-2xl">
              <FileIcon className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg truncate max-w-[200px] sm:max-w-md">{file.name}</h3>
              <p className="text-slate-500 text-xs uppercase tracking-widest font-black">Authorized Recovery Mode</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl">
              <label className="block text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center">
                <Key className="w-4 h-4 mr-2" /> 1. Admin Master Key
              </label>
              <input
                type="password"
                placeholder="Enter Private Admin Key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
              />
            </div>

            <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl">
              <label className="block text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center">
                <Lock className="w-4 h-4 mr-2" /> 2. Original PDF Password
              </label>
              <input
                type="password"
                placeholder="Enter exact original password"
                value={pdfPassword}
                onChange={(e) => setPdfPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div className="pt-4">
              <button
                onClick={handleUnlock}
                disabled={isProcessing || !adminKey || !pdfPassword}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl flex flex-col items-center justify-center disabled:bg-slate-800 disabled:text-slate-600 transition-all shadow-xl"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin mb-2" />
                    <span className="text-[10px] uppercase tracking-widest font-black">{status}</span>
                  </>
                ) : (
                  <span className="flex items-center uppercase tracking-widest text-sm">
                    <ShieldCheck className="w-5 h-5 mr-2" /> Authorize & Decrypt
                  </span>
                )}
              </button>
              
              <div className="mt-6 flex items-start bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                <AlertCircle className="w-4 h-4 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-slate-500 text-[10px] leading-relaxed">
                  <span className="text-blue-400 font-bold uppercase">Master Bypass Active:</span> If standard structural decryption fails due to AES-256 encryption, the tool will automatically perform a high-fidelity reconstruction to recover the whole content visually.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};