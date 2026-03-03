import React, { useState } from 'react';
import { usePDF } from '../hooks/usePDF';
import { X, FileSpreadsheet, Download, CheckCircle2 } from 'lucide-react';

export const ExcelToPDFTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultData, setResultData] = useState<Uint8Array | null>(null);
  const { excelToPDF, downloadBlob } = usePDF();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResultData(null);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const pdfBytes = await excelToPDF(file);
      setResultData(pdfBytes);
    } catch (error) {
      console.error('Error converting Excel to PDF:', error);
      alert('Failed to convert Excel to PDF. Ensure the file contains valid data.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultData && file) {
      const fileName = `${file.name.replace(/\.[^/.]+$/, "")}.pdf`;
      downloadBlob(resultData, fileName);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!file ? (
        <div className="border-2 border-dashed border-slate-700 rounded-xl p-12 text-center bg-slate-900/50 hover:border-green-500 transition-all cursor-pointer">
          <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" id="excel-upload" />
          <label htmlFor="excel-upload" className="cursor-pointer">
            <FileSpreadsheet className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-slate-300 font-medium text-lg">Upload Excel file (.xlsx, .xls)</p>
            <p className="text-slate-500 text-sm mt-2">Convert spreadsheets to PDF tables</p>
          </label>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-xl p-8 border border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="bg-green-500/10 p-3 rounded-lg">
                <FileSpreadsheet className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <span className="text-white font-medium block truncate max-w-[250px]">{file.name}</span>
                <span className="text-slate-500 text-xs">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
            <button onClick={() => { setFile(null); setResultData(null); }} className="text-slate-500 hover:text-white p-2">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {!resultData ? (
            <button
              onClick={handleConvert}
              disabled={isProcessing}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl flex items-center justify-center disabled:bg-slate-800 transition-all shadow-lg shadow-green-500/10"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white mr-3"></div>
                  Converting to PDF...
                </>
              ) : (
                <><Download className="w-5 h-5 mr-2" /> Convert to PDF</>
              )}
            </button>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-center text-green-400 font-medium py-3 bg-green-500/5 border border-green-500/20 rounded-lg mb-4">
                <CheckCircle2 className="w-5 h-5 mr-2" /> Ready for Download
              </div>
              <button
                onClick={handleDownload}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"
              >
                <Download className="w-5 h-5 mr-2" /> Download PDF File
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};