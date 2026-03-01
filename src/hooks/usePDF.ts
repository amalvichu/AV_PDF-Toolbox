import { PDFDocument, PDFName } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

// Configure PDF.js worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

// Global Admin Key for the Unlock feature
export const ADMIN_KEY = "AV_ADMIN_2026"; 

export const usePDF = () => {
  const mergePDFs = async (files: File[]): Promise<Uint8Array> => {
    const mergedPdf = await PDFDocument.create();
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    return await mergedPdf.save();
  };

  const splitPDF = async (file: File, range: string): Promise<Uint8Array> => {
    const newPdf = await PDFDocument.create();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pageIndices = new Set<number>();
    const ranges = range.split(',');
    for (const part of ranges) {
      const trimmedPart = part.trim();
      if (trimmedPart.includes('-')) {
        const [start, end] = trimmedPart.split('-').map(num => parseInt(num, 10));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) pageIndices.add(i - 1);
        }
      } else {
        const pageNum = parseInt(trimmedPart, 10);
        if (!isNaN(pageNum)) pageIndices.add(pageNum - 1);
      }
    }
    const sortedPageIndices = Array.from(pageIndices).sort((a, b) => a - b);
    const validPageIndices = sortedPageIndices.filter(index => index >= 0 && index < pdf.getPageCount());
    const copiedPages = await newPdf.copyPages(pdf, validPageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));
    return await newPdf.save();
  };

  const downloadBlob = (data: Uint8Array | Blob[], name: string): void => {
    if (Array.isArray(data)) {
      data.forEach((blob, index) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name.replace(/\.[^/.]+$/, "")}-page-${index + 1}.jpg`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 100);
      });
    } else {
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name.toLowerCase().endsWith('.pdf') ? name : `${name}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    }
  };

  const protectPDF = async (file: File, password: string): Promise<Uint8Array> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pdfBytes = await pdfDoc.save();
    return await encryptPDF(pdfBytes, password);
  };

  const unlockPDF = async (file: File, pdfPassword: string): Promise<Uint8Array> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { password: pdfPassword });
    pdfDoc.context.trailer.delete(PDFName.of('Encrypt'));
    return await pdfDoc.save({ useObjectStreams: false });
  };

  const reconstructPDFFromImages = async (imageBlobs: Blob[]): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.create();
    for (const blob of imageBlobs) {
      const arrayBuffer = await blob.arrayBuffer();
      const image = await pdfDoc.embedJpg(arrayBuffer);
      const { width, height } = image.scale(1);
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(image, { x: 0, y: 0, width, height });
    }
    return await pdfDoc.save();
  };

  const pdfToImages = async (file: File, password?: string): Promise<Blob[]> => {
    const images: Blob[] = [];
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, password: password, stopAtErrors: false });
    const pdf = await loadingTask.promise;
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 3.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get 2D context');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport }).promise;
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95);
      });
      images.push(blob);
    }
    return images;
  };

  const compressPDF = async (file: File): Promise<Uint8Array> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    return await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
  };

  const excelToPDF = async (file: File): Promise<Uint8Array> => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true, cellNF: true, cellText: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    if (!rawData || rawData.length === 0) throw new Error("Excel file is empty or unreadable.");
    const cleanData = rawData.map(row => row.map(cell => (cell === null || cell === undefined) ? "" : String(cell)));
    const doc = new jsPDF('l', 'mm', 'a4');
    autoTable(doc, {
      head: [cleanData[0]],
      body: cleanData.slice(1),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      margin: { top: 15, bottom: 15 },
    });
    return new Uint8Array(doc.output('arraybuffer'));
  };

  /**
   * Robust Website to PDF: Improved HTML cleaning and link repairing.
   */
  const htmlToPDF = async (url: string): Promise<Uint8Array> => {
    try {
      // 1. Fetch via Proxy
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("This website is blocking external access.");
      
      let html = await response.text();
      
      // 2. Fix Relative Links (Critical for images/styles to show up)
      const urlObj = new URL(url);
      const rootUrl = urlObj.origin;
      // Replace "/link" with "https://site.com/link"
      html = html.replace(/(src|href)\s*=\s*"\/(?!\/)/g, `$1="${rootUrl}/`);
      
      // 3. Inject into Hidden Frame
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-10000px'; // Hide it
      iframe.style.width = '1200px'; // Standard Desktop width
      iframe.style.height = '1600px';
      document.body.appendChild(iframe);
      
      iframe.contentDocument?.open();
      iframe.contentDocument?.write(html);
      iframe.contentDocument?.close();

      // 4. Wait for rendering (Extended for slow sites)
      await new Promise(resolve => setTimeout(resolve, 3500));

      // 5. Capture with CORS support
      const canvas = await html2canvas(iframe.contentDocument?.body || document.body, { 
        useCORS: true, 
        allowTaint: true,
        scale: 1.5,
        logging: false,
        width: 1200,
        windowWidth: 1200
      });
      
      document.body.removeChild(iframe);
      
      // 6. Convert to PDF
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      return new Uint8Array(pdf.output('arraybuffer'));
    } catch (error: any) {
      console.error('HTML Conversion Detail:', error);
      if (error.message.includes('fetch')) {
        throw new Error("CORS BLOCK: This website blocks unauthorized tools from reading its content.");
      }
      throw new Error(error.message || "The website layout is too complex for browser-level conversion.");
    }
  };

  return { mergePDFs, splitPDF, downloadBlob, protectPDF, unlockPDF, pdfToImages, reconstructPDFFromImages, compressPDF, excelToPDF, htmlToPDF };
};