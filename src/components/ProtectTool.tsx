import React, { useState } from 'react';
import { usePDF } from '../hooks/usePDF';
import { UploadCloud, File as FileIcon, X, Shield } from 'lucide-react';

export const ProtectTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { protectPDF, downloadBlob } = usePDF();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].type === 'application/pdf') {
        setFile(e.target.files[0]);
      } else {
        alert('Please upload a valid PDF file.');
      }
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleProtect = async () => {
    if (!file || !password) {
      alert('Please upload a file and enter a password.');
      return;
    }
    setIsProcessing(true);
    try {
      const protectedPdf = await protectPDF(file, password);
      downloadBlob(protectedPdf, `protected-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error protecting PDF:', error);
      alert('An error occurred while protecting the PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!file ? (
        <label
          htmlFor="file-upload-protect"
          className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center bg-slate-900 cursor-pointer hover:border-blue-500 transition-colors block"
        >
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload-protect"
          />
          <UploadCloud className="w-12 h-12 mx-auto text-slate-500 mb-4" />
          <p className="text-slate-400">Drag & drop or click to upload a PDF.</p>
        </label>
      ) : (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Uploaded File:</h3>
          <div className="flex items-center justify-between bg-slate-800 p-3 rounded-md">
            <div className="flex items-center">
              <FileIcon className="w-5 h-5 mr-3 text-slate-400" />
              <span className="text-sm">{file.name}</span>
            </div>
            <button onClick={removeFile} className="text-slate-500 hover:text-red-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {file && (
        <div className="mt-6">
          <label htmlFor="password-input" className="block text-lg font-semibold mb-2">Password</label>
          <input
            type="password"
            id="password-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full bg-slate-800 border border-slate-700 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
          />
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={handleProtect}
          disabled={isProcessing || !file || !password}
          className="bg-blue-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed transition-all flex items-center justify-center mx-auto"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Processing...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5 mr-2" />
              Protect & Download PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
};
