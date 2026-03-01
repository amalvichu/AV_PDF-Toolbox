import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Merge, Split, FileImage, Shield, ArrowLeft, Minimize2, Image as ImageIcon, Unlock, FileSpreadsheet, Globe, Camera } from 'lucide-react';
import { MergeTool } from './components/MergeTool';
import { SplitTool } from './components/SplitTool';
import { ImageToPDFTool } from './components/ImageToPDFTool';
import { ProtectTool } from './components/ProtectTool';
import { CompressPDFTool } from './components/CompressPDFTool';
import { PDFToImagesTool } from './components/PDFToImagesTool';
import { UnlockTool } from './components/UnlockTool';
import { ExcelToPDFTool } from './components/ExcelToPDFTool';
import { HTMLToPDFTool } from './components/HTMLToPDFTool';
import { ScanTool } from './components/ScanTool';
import { MobileSender } from './components/MobileSender';

// --- Types and Data ---
type Tool = 'Merge' | 'Split' | 'Image to PDF' | 'Protect' | 'Compress' | 'PDF to Images' | 'Unlock' | 'Excel to PDF' | 'HTML to PDF' | 'Scan to PDF';

const toolData: { name: Tool; icon: React.ReactNode; description: string }[] = [
  { name: 'Merge', icon: <Merge className="w-8 h-8" />, description: 'Combine multiple PDFs into one.' },
  { name: 'Split', icon: <Split className="w-8 h-8" />, description: 'Extract pages from a PDF.' },
  { name: 'Scan to PDF', icon: <Camera className="w-8 h-8" />, description: 'Capture pages from your phone camera.' },
  { name: 'Image to PDF', icon: <FileImage className="w-8 h-8" />, description: 'Convert images to a PDF file.' },
  { name: 'PDF to Images', icon: <ImageIcon className="w-8 h-8" />, description: 'Convert PDF pages into JPEG images.' },
  { name: 'Compress', icon: <Minimize2 className="w-8 h-8" />, description: 'Reduce the file size of a PDF.' },
  { name: 'Excel to PDF', icon: <FileSpreadsheet className="w-8 h-8" />, description: 'Convert Excel files to PDF tables.' },
  { name: 'HTML to PDF', icon: <Globe className="w-8 h-8" />, description: 'Generate a PDF from a website URL.' },
  { name: 'Protect', icon: <Shield className="w-8 h-8" />, description: 'Add a password to a PDF.' },
  { name: 'Unlock', icon: <Unlock className="w-8 h-8" />, description: 'Remove security from a PDF.' },
];

const toolComponents: Record<Tool, React.FC> = {
  'Merge': MergeTool,
  'Split': SplitTool,
  'Image to PDF': ImageToPDFTool,
  'Protect': ProtectTool,
  'Compress': CompressPDFTool,
  'PDF to Images': PDFToImagesTool,
  'Unlock': UnlockTool,
  'Excel to PDF': ExcelToPDFTool,
  'HTML to PDF': HTMLToPDFTool,
  'Scan to PDF': ScanTool,
};

// --- Main App Component ---
const App: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [hostId, setHostId] = useState('');

  const CurrentTool = selectedTool ? toolComponents[selectedTool] : null;

  const handleBack = () => setSelectedTool(null);

  useEffect(() => {
    // Check for mobile sender mode
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const id = params.get('hostId');

    if (mode === 'mobile-sender' && id) {
      setIsMobileMode(true);
      setHostId(id);
    }
  }, []);

  if (isMobileMode) {
    return <MobileSender hostId={hostId} />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 p-4 sm:p-8">
      <AnimatePresence mode="wait">
        {!selectedTool ? (
          <Dashboard key="dashboard" onToolSelect={setSelectedTool} />
        ) : (
          <ToolView key="tool-view" toolName={selectedTool} onBack={handleBack}>
            {CurrentTool && <CurrentTool />}
          </ToolView>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Dashboard Component ---
interface DashboardProps {
  onToolSelect: (tool: Tool) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onToolSelect }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    <header className="text-center mb-12">
      <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">AV_PDF-Toolbox</h1>
      <p className="text-slate-400 mt-2 font-medium">A versatile, offline-first PDF toolkit.</p>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto pb-12">
      {toolData.map((tool) => (
        <motion.div
          key={tool.name}
          onClick={() => onToolSelect(tool.name)}
          className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer border border-slate-800/80 hover:border-blue-500/50 transition-all duration-300 shadow-xl group"
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="text-blue-500 mb-4 bg-blue-500/10 p-4 rounded-2xl group-hover:bg-blue-500/20 transition-colors">{tool.icon}</div>
          <h3 className="text-xl font-bold text-white mb-2">{tool.name}</h3>
          <p className="text-slate-400 text-sm leading-relaxed">{tool.description}</p>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

// --- Tool View Component ---
interface ToolViewProps {
  toolName: string;
  onBack: () => void;
  children: React.ReactNode;
}

const ToolView: React.FC<ToolViewProps> = ({ toolName, onBack, children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.2 }}
    className="max-w-4xl mx-auto"
  >
    <button
      onClick={onBack}
      className="flex items-center text-slate-400 hover:text-white transition-colors duration-300 mb-8 font-medium group"
    >
      <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
      Back to Dashboard
    </button>
    <div className="text-center mb-12">
      <h2 className="text-4xl font-bold text-white mb-2">{toolName}</h2>
      <div className="h-1.5 w-20 bg-blue-600 mx-auto rounded-full"></div>
    </div>
    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-8 rounded-3xl shadow-2xl">
      {children}
    </div>
  </motion.div>
);

export default App;
