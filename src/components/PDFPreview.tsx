import React, { useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker source for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFPreviewProps {
  file: File;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({ file }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!file || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const fileReader = new FileReader();
    fileReader.onload = async function() {
      if (this.result) {
        try {
          const typedArray = new Uint8Array(this.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
          const page = await pdf.getPage(1); // Get the first page

          const viewport = page.getViewport({ scale: 0.5 }); // Adjust scale for thumbnail size
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          
          await page.render(renderContext).promise;
        } catch (error) {
          console.error('Error rendering PDF preview:', error);
          context.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas on error
        }
      }
    };
    fileReader.readAsArrayBuffer(file);

    // Cleanup function
    return () => {
      // If there's an ongoing render, you might want to cancel it
      // pdf.js rendering is async but doesn't have a direct cancel method for render()
      // For this simple case, cleanup is minimal
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [file]);

  return (
    <div className="mt-6 p-4 bg-slate-800 rounded-lg flex justify-center items-center">
      <canvas ref={canvasRef} className="rounded-md shadow-lg" />
    </div>
  );
};
