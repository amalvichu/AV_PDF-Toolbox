import React, { useState } from 'react';
import { usePDF } from '../hooks/usePDF';
import { Download, Globe, Link as LinkIcon, AlertCircle, Info } from 'lucide-react';

export const HTMLToPDFTool: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { htmlToPDF, downloadBlob } = usePDF();

  const handleConvert = async () => {
    if (!url) return;
    
    let targetUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      targetUrl = 'https://' + url;
    }

    setIsProcessing(true);
    try {
      const pdfBytes = await htmlToPDF(targetUrl);
      const fileName = targetUrl.split('/').pop() || 'website-convert';
      downloadBlob(pdfBytes, `${fileName}.pdf`);
    } catch (error: any) {
      console.error('Error converting URL to PDF:', error);
      alert(error.message || 'Failed to convert website to PDF. Some sites block external access.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-xl">
        <div className="text-center mb-8">
          <div className="bg-blue-600/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Website to PDF</h3>
          <p className="text-slate-500 text-sm">Convert any public webpage to a high-quality PDF</p>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <LinkIcon className="h-5 w-5 text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="https://www.example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-11 pr-4 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <button
            onClick={handleConvert}
            disabled={isProcessing || !url}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center disabled:bg-slate-800 transition-all shadow-lg shadow-blue-500/20"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white mr-3"></div>
                Analyzing & Capturing Webpage...
              </>
            ) : (
              <><Download className="w-5 h-5 mr-2" /> Convert to PDF</>
            )}
          </button>
        </div>
      </div>

      <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-6 space-y-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-blue-400 font-bold text-sm uppercase tracking-wider mb-1">How it works</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Enter the full URL of the webpage you want to convert. This tool captures the visual layout and styles of the page.
            </p>
          </div>
        </div>
        
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-amber-500 font-bold text-sm uppercase tracking-wider mb-1">Important Limitation</h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              Due to modern web security (CORS), some websites block direct conversion. If the tool fails, it means the target website is protected. For complex sites, using a dedicated server-side API is the industry standard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};