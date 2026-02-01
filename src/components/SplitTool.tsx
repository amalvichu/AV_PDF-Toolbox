import React, { useState, useCallback } from 'react';
import { usePDF } from '../hooks/usePDF';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import { PDFPreview } from './PDFPreview';

export const SplitTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [range, setRange] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { splitPDF, downloadBlob } = usePDF();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].type === 'application/pdf') {
        setFile(e.target.files[0]);
      } else {
        alert('Please upload a valid PDF file.');
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
       if (e.dataTransfer.files[0].type === 'application/pdf') {
        setFile(e.dataTransfer.files[0]);
      } else {
        alert('Please upload a valid PDF file.');
      }
    }
  }, []);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleSplit = async () => {
    if (!file || !range) {
      alert('Please upload a file and specify a page range.');
      return;
    }
    setIsProcessing(true);
    try {
      const splitPdf = await splitPDF(file, range);
      downloadBlob(splitPdf, `split-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error splitting PDF:', error);
      alert('An error occurred while splitting the PDF. Please check the page range and file integrity.');
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
          className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center bg-slate-900 cursor-pointer hover:border-blue-500 transition-colors"
        >
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload-split"
          />
          <label htmlFor="file-upload-split" className="cursor-pointer">
            <UploadCloud className="w-12 h-12 mx-auto text-slate-500 mb-4" />
            <p className="text-slate-400">Drag & drop a PDF here, or click to browse.</p>
          </label>
        </div>
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
           {file && <PDFPreview file={file} />}
        </div>
      )}

      {file && (
        <div className="mt-6">
          <label htmlFor="page-range" className="block text-lg font-semibold mb-2">Page Range</label>
          <input
            type="text"
            id="page-range"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            placeholder='e.g., "1-3, 5, 8-10"'
            className="w-full bg-slate-800 border border-slate-700 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
          />
           <p className="text-xs text-slate-500 mt-2">Use commas to separate page numbers or ranges.</p>
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={handleSplit}
          disabled={isProcessing || !file || !range}
          className="bg-blue-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed transition-all flex items-center justify-center mx-auto"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Processing...
            </>
          ) : (
            'Generate & Download Split PDF'
          )}
        </button>
      </div>
    </div>
  );
};
