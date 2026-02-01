import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Merge, Split, FileImage, Shield, ArrowLeft } from 'lucide-react';
import { MergeTool } from './components/MergeTool';
import { SplitTool } from './components/SplitTool';
import { ImageToPDFTool } from './components/ImageToPDFTool';
import { ProtectTool } from './components/ProtectTool';

// --- Types and Data ---
type Tool = 'Merge' | 'Split' | 'Image to PDF' | 'Protect';

const toolData: { name: Tool; icon: React.ReactNode; description: string }[] = [
  { name: 'Merge', icon: <Merge className="w-8 h-8" />, description: 'Combine multiple PDFs into one.' },
  { name: 'Split', icon: <Split className="w-8 h-8" />, description: 'Extract pages from a PDF.' },
  { name: 'Image to PDF', icon: <FileImage className="w-8 h-8" />, description: 'Convert images to a PDF file.' },
  { name: 'Protect', icon: <Shield className="w-8 h-8" />, description: 'Add a password to a PDF.' },
];

const toolComponents: Record<Tool, React.FC> = {
  'Merge': MergeTool,
  'Split': SplitTool,
  'Image to PDF': ImageToPDFTool,
  'Protect': ProtectTool,
};

// --- Main App Component ---
const App: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const CurrentTool = selectedTool ? toolComponents[selectedTool] : null;

  const handleBack = () => setSelectedTool(null);

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
      <h1 className="text-4xl sm:text-5xl font-bold text-white">AV_PDF-Toolbox</h1>
      <p className="text-slate-400 mt-2">A versatile, offline-first PDF toolkit.</p>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
      {toolData.map((tool) => (
        <motion.div
          key={tool.name}
          onClick={() => onToolSelect(tool.name)}
          className="bg-slate-900 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer border border-slate-800 hover:border-blue-500 transition-colors duration-300"
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="text-blue-500 mb-4">{tool.icon}</div>
          <h3 className="text-xl font-semibold text-white mb-2">{tool.name}</h3>
          <p className="text-slate-400 text-sm">{tool.description}</p>
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
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    className="max-w-4xl mx-auto"
  >
    <button
      onClick={onBack}
      className="flex items-center text-blue-500 hover:text-blue-400 transition-colors duration-300 mb-8 font-semibold"
    >
      <ArrowLeft className="w-5 h-5 mr-2" />
      Back to Dashboard
    </button>
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold text-white">{toolName}</h2>
    </div>
    {children}
  </motion.div>
);

export default App;
