import React, { useState, useCallback } from 'react';
import { usePDF } from '../hooks/usePDF';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';

export const MergeTool: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { mergePDFs, downloadBlob } = usePDF();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      alert('Please upload at least two PDF files to merge.');
      return;
    }
    setIsProcessing(true);
    try {
      const mergedPdf = await mergePDFs(files);
      downloadBlob(mergedPdf, `merged-pdfs-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error merging PDFs:', error);
      alert('An error occurred while merging the PDFs.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center bg-slate-900 cursor-pointer hover:border-blue-500 transition-colors"
      >
        <input
          type="file"
          multiple
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <UploadCloud className="w-12 h-12 mx-auto text-slate-500 mb-4" />
          <p className="text-slate-400">Drag & drop your PDFs here, or click to browse.</p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Uploaded Files:</h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between bg-slate-800 p-3 rounded-md">
                <div className="flex items-center">
                  <FileIcon className="w-5 h-5 mr-3 text-slate-400" />
                  <span className="text-sm">{file.name}</span>
                </div>
                <button onClick={() => removeFile(index)} className="text-slate-500 hover:text-red-500">
                  <X className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={handleMerge}
          disabled={isProcessing || files.length < 2}
          className="bg-blue-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed transition-all flex items-center justify-center mx-auto"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Processing...
            </>
          ) : (
            'Generate & Download Merged PDF'
          )}
        </button>
      </div>
    </div>
  );
};
