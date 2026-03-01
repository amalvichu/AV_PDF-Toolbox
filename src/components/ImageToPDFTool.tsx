import React, { useState, useCallback, useEffect } from 'react';
import { usePDF } from '../hooks/usePDF';
import { UploadCloud, File as FileIcon, X, FileImage as ImageIcon, ArrowUp, ArrowDown } from 'lucide-react';

interface FileWithPreview extends File {
  preview?: string;
}

export const ImageToPDFTool: React.FC = () => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { imagesToPDF, downloadBlob } = usePDF();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
        .filter(file => file.type === 'image/jpeg' || file.type === 'image/png')
        .map(file => Object.assign(file, {
          preview: URL.createObjectURL(file)
        }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files)
        .filter(file => file.type === 'image/jpeg' || file.type === 'image/png')
        .map(file => Object.assign(file, {
          preview: URL.createObjectURL(file)
        }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      return newFiles.filter((_, i) => i !== index);
    });
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    setFiles(prev => {
      const newFiles = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex >= 0 && targetIndex < newFiles.length) {
        [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
      }
      return newFiles;
    });
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      alert('Please upload at least one image file.');
      return;
    }
    setIsProcessing(true);
    try {
      const pdf = await imagesToPDF(files);
      downloadBlob(pdf, `images-to-pdf-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error converting images to PDF:', error);
      alert('An error occurred while converting images to PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    // Cleanup previews on unmount
    return () => files.forEach(file => {
      if (file.preview) URL.revokeObjectURL(file.preview);
    });
  }, []);

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
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          className="hidden"
          id="image-file-upload"
        />
        <label htmlFor="image-file-upload" className="cursor-pointer">
          <UploadCloud className="w-12 h-12 mx-auto text-slate-500 mb-4" />
          <p className="text-slate-400 font-medium">Drag & drop your JPG/PNG images here</p>
          <p className="text-slate-500 text-sm mt-1">or click to browse from your computer</p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Selected Images ({files.length}):</h3>
            <button 
              onClick={() => {
                files.forEach(f => f.preview && URL.revokeObjectURL(f.preview));
                setFiles([]);
              }}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Clear all
            </button>
          </div>
          <ul className="space-y-3">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center justify-between bg-slate-800/50 border border-slate-700 p-3 rounded-lg group hover:border-slate-600 transition-all">
                <div className="flex items-center space-x-4 overflow-hidden">
                  <div className="w-12 h-12 rounded bg-slate-700 flex-shrink-0 overflow-hidden border border-slate-600">
                    {file.preview ? (
                      <img src={file.preview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-full h-full p-2 text-slate-500" />
                    )}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 ml-4">
                  <button 
                    onClick={() => moveFile(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                    title="Move up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => moveFile(index, 'down')}
                    disabled={index === files.length - 1}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                    title="Move down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => removeFile(index)} 
                    className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                    title="Remove"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 text-center">
        <button
          onClick={handleConvert}
          disabled={isProcessing || files.length === 0}
          className="w-full sm:w-auto min-w-[200px] bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-xl disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-all flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white mr-3"></div>
              Processing Images...
            </>
          ) : (
            'Generate & Download PDF'
          )}
        </button>
        <p className="text-slate-500 text-xs mt-4">
          Each image will be placed on its own page with original orientation preserved.
        </p>
      </div>
    </div>
  );
};