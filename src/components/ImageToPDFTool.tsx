import React from 'react';
import { FileImage } from 'lucide-react';

export const ImageToPDFTool: React.FC = () => {
  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      <FileImage className="w-16 h-16 mx-auto text-slate-500 mb-4" />
      <h3 className="text-2xl font-bold text-white mb-2">Image to PDF</h3>
      <p className="text-slate-400">This feature is coming soon!</p>
      <div className="mt-8 p-12 bg-slate-900 rounded-lg border border-slate-800">
        <p>This tool will allow you to convert JPG, PNG, and other image formats into a single PDF document.</p>
      </div>
    </div>
  );
};
