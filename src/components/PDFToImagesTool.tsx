import React, { useState, useCallback } from 'react';
import { usePDF } from '../hooks/usePDF';
import { UploadCloud, File as FileIcon, X, Image as ImageIcon, Download } from 'lucide-react';

export const PDFToImagesTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { pdfToImages, downloadBlob } = usePDF();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
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
      } else {
        alert('Please drop a valid PDF file.');
      }
    }
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const imageBlobs = await pdfToImages(file);
      downloadBlob(imageBlobs, file.name);
    } catch (error) {
      console.error('Error converting PDF to images:', error);
      alert('An error occurred during conversion.');
    } finally {
      setIsProcessing(false);
    }
  };

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
            id="pdf-to-image-upload"
          />
          <label htmlFor="pdf-to-image-upload" className="cursor-pointer">
            <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-slate-300 font-medium text-lg">Click to upload or drag and drop</p>
            <p className="text-slate-500 mt-2">Convert your PDF pages into high-quality JPEGs</p>
          </label>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="bg-red-500/10 p-3 rounded-lg">
                <FileIcon className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-white font-medium truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                <p className="text-slate-500 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button 
              onClick={() => setFile(null)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleConvert}
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg shadow-blue-500/20"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white mr-3"></div>
                Converting Pages...
              </>
            ) : (
              <>
                <ImageIcon className="w-5 h-5 mr-2" />
                Convert to Images (JPEG)
              </>
            )}
          </button>
          
          <p className="text-center text-slate-500 text-xs mt-4">
            Each page will be downloaded as a separate high-resolution JPEG image.
          </p>
        </div>
      )}
    </div>
  );
};