import * as pdfjsLib from 'pdfjs-dist';

// Point to worker hosted on unpkg CDN (avoids bundler issues)
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';

const SCALE = 2; // 2x scale for good quality
const IMAGE_QUALITY = 0.85; // JPEG quality

/**
 * Converts a PDF File into an array of JPEG File objects (one per page).
 * All work happens in the browser – no server round-trip.
 */
export async function convertPdfToImages(
  pdfFile: File,
  maxPages = 50
): Promise<File[]> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const totalPages = Math.min(pdf.numPages, maxPages);
  const images: File[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: SCALE });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Convert canvas to Blob, then File
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
        'image/jpeg',
        IMAGE_QUALITY
      );
    });

    const baseName = pdfFile.name.replace(/\.pdf$/i, '');
    const fileName = `${baseName}_page-${String(pageNum).padStart(4, '0')}.jpg`;
    const file = new File([blob], fileName, { type: 'image/jpeg' });
    images.push(file);
  }

  return images;
}
