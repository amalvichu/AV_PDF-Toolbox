import React, { useState, useCallback } from 'react';
import { usePDF } from '../hooks/usePDF';
import { File as FileIcon, X, Minimize2, CheckCircle, ArrowDown } from 'lucide-react';

export const CompressPDFTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ originalSize: number; newSize: number; data: Uint8Array } | null>(null);
  const { compressPDF, downloadBlob } = usePDF();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setResult(null);
      } else {
        alert('Please select a valid PDF file.');
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setResult(null);
      } else {
        alert('Please drop a valid PDF file.');
      }
    }
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const compressedData = await compressPDF(file);
      setResult({
        originalSize: file.size,
        newSize: compressedData.length,
        data: compressedData
      });
    } catch (error) {
      console.error('Error compressing PDF:', error);
      alert('An error occurred during compression.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result && file) {
      downloadBlob(result.data, `compressed-${file.name}`);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const savings = result ? (((result.originalSize - result.newSize) / result.originalSize) * 100).toFixed(1) : "0";

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-slate-700 rounded-xl p-12 text-center bg-slate-900/50 cursor-pointer hover:border-blue-500 transition-all group"
        >
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            id="compress-upload"
          />
          <label htmlFor="compress-upload" className="cursor-pointer">
            <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Minimize2 className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-slate-300 font-medium text-lg">Click to upload or drag and drop</p>
            <p className="text-slate-500 mt-2">Optimize and reduce the file size of your PDF</p>
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-red-500/10 p-3 rounded-lg">
                  <FileIcon className="w-6 h-6 text-red-500" />
                </div>
                <div className="truncate">
                  <p className="text-white font-medium truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                  <p className="text-slate-500 text-sm">{formatSize(file.size)}</p>
                </div>
              </div>
              <button 
                onClick={() => { setFile(null); setResult(null); }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {!result ? (
            <button
              onClick={handleCompress}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg shadow-blue-500/20"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white mr-3"></div>
                  Optimizing PDF...
                </>
              ) : (
                'Compress PDF'
              )}
            </button>
          ) : (
            <div className="bg-slate-900 rounded-xl border border-blue-500/30 p-8 text-center animate-in fade-in zoom-in duration-300">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Compression Complete!</h3>
              <div className="flex items-center justify-center space-x-8 my-6">
                <div className="text-center">
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Before</p>
                  <p className="text-slate-300 font-semibold">{formatSize(result.originalSize)}</p>
                </div>
                <div className="text-blue-500">
                  <ArrowDown className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">After</p>
                  <p className="text-green-400 font-bold">{formatSize(result.newSize)}</p>
                </div>
              </div>
              
              {parseFloat(savings) > 0 ? (
                <p className="text-blue-400 font-medium mb-8">Reduced by {savings}%</p>
              ) : (
                <p className="text-slate-400 text-sm mb-8 italic">Your PDF was already highly optimized.</p>
              )}

              <button
                onClick={handleDownload}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-500/20"
              >
                Download Compressed PDF
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};