import { PDFDocument } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';

export const usePDF = () => {
  /**
   * Merges multiple PDF files into a single PDF.
   * @param files - An array of File objects to be merged.
   * @returns A Promise that resolves with a Uint8Array of the merged PDF.
   */
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

  /**
   * Splits a PDF file based on a given page range string.
   * @param file - The PDF File object to split.
   * @param range - A string representing page ranges (e.g., "1, 3, 5-7").
   * @returns A Promise that resolves with a Uint8Array of the new PDF containing the selected pages.
   */
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
          for (let i = start; i <= end; i++) {
            pageIndices.add(i - 1); // User input is 1-based, pdf-lib is 0-based
          }
        }
      } else {
        const pageNum = parseInt(trimmedPart, 10);
        if (!isNaN(pageNum)) {
          pageIndices.add(pageNum - 1); // User input is 1-based, pdf-lib is 0-based
        }
      }
    }
    
    const sortedPageIndices = Array.from(pageIndices).sort((a, b) => a - b);
    const validPageIndices = sortedPageIndices.filter(index => index >= 0 && index < pdf.getPageCount());

    const copiedPages = await newPdf.copyPages(pdf, validPageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    return await newPdf.save();
  };

  /**
   * Triggers a browser download for a given data blob.
   * @param data - The Uint8Array data to be downloaded.
   * @param name - The filename for the download (e.g., "merged-document.pdf").
   */
  const downloadBlob = (data: Uint8Array, name: string): void => {
    const blob = new Blob([data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  /**
   * Encrypts a PDF file with a user-provided password.
   * @param file - The PDF File object to encrypt.
   * @param password - The password to apply to the PDF.
   * @returns A Promise that resolves with a Uint8Array of the encrypted PDF.
   */
  const protectPDF = async (file: File, password: string): Promise<Uint8Array> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Save the PDF without encryption to get a clean Uint8Array
    const pdfBytes = await pdfDoc.save();

    // Use the external library for encryption
    const encryptedBytes = await encryptPDF(pdfBytes, password);

    return encryptedBytes;
  };

  /**
   * Converts multiple image files into a single PDF.
   * Supports JPEG and PNG images. Each image will be placed on its own page.
   * @param files - An array of image File objects (JPEG or PNG).
   * @returns A Promise that resolves with a Uint8Array of the new PDF.
   */
  const imagesToPDF = async (files: File[]): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.create();

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      let image;
      let imgDim;

      if (file.type === 'image/jpeg') {
        image = await pdfDoc.embedJpg(arrayBuffer);
        imgDim = image.scale(1); // Get original dimensions
      } else if (file.type === 'image/png') {
        image = await pdfDoc.embedPng(arrayBuffer);
        imgDim = image.scale(1); // Get original dimensions
      } else {
        console.warn(`Skipping unsupported image type: ${file.type}`);
        continue;
      }

      // Add a blank page to the document
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();

      // Calculate scale to fit image to page
      const scaleX = width / imgDim.width;
      const scaleY = height / imgDim.height;
      const scale = Math.min(scaleX, scaleY);

      // Scale image dimensions
      const scaledWidth = imgDim.width * scale;
      const scaledHeight = imgDim.height * scale;

      // Center the image on the page
      const x = (width - scaledWidth) / 2;
      const y = (height - scaledHeight) / 2;

      page.drawImage(image, {
        x,
        y,
        width: scaledWidth,
        height: scaledHeight,
      });
    }

    return await pdfDoc.save();
  };

  return { mergePDFs, splitPDF, downloadBlob, protectPDF, imagesToPDF };
};
