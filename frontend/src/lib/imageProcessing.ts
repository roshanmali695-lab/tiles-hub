export interface ProcessedImage {
  originalFile: File;
  originalUrl: string;
  workingDataUrl: string;
  width: number;
  height: number;
  originalBytes: number;
  workingBytes: number;
  converted: boolean;
  fileName: string;
  source: "camera" | "gallery";
}

interface OptimizeOptions {
  kind: "room" | "tile";
  source: "camera" | "gallery";
  onProgress?: (progress: number) => void;
}

const HEIC_PATTERN = /\.(heic|heif)$/i;
const SUPPORTED_PATTERN = /\.(jpe?g|png|webp|heic|heif)$/i;

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function isAcceptedImage(file: File): boolean {
  return file.type.startsWith("image/") || SUPPORTED_PATTERN.test(file.name);
}

async function compatibleBlob(file: File): Promise<{ blob: Blob; converted: boolean }> {
  const isHeic = file.type === "image/heic" || file.type === "image/heif" || HEIC_PATTERN.test(file.name);
  if (!isHeic) return { blob: file, converted: false };
  try {
    const { default: heic2any } = await import("heic2any");
    const output = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.96 });
    return { blob: Array.isArray(output) ? output[0] : output, converted: true };
  } catch {
    // Safari and some mobile browsers decode HEIC natively; try that path next.
    return { blob: file, converted: false };
  }
}

async function decodeImage(blob: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // Fall through to the HTML image decoder, which has broader support on Safari.
    }
  }

  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.decoding = "async";
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("decode"));
      image.src = url;
    });
    return { source: image, width: image.naturalWidth, height: image.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("unsupported");
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("encode")), "image/jpeg", quality);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(blob);
  });
}

export async function optimizeImage(file: File, options: OptimizeOptions): Promise<ProcessedImage> {
  if (!isAcceptedImage(file)) throw new Error("Please choose a JPG, PNG, WEBP, HEIC or HEIF photo.");

  const originalUrl = URL.createObjectURL(file);
  options.onProgress?.(8);
  try {
    const { blob, converted } = await compatibleBlob(file);
    options.onProgress?.(24);
    const decoded = await decodeImage(blob);
    options.onProgress?.(42);

    try {
      const maxDimension = options.kind === "room" ? 3072 : 2560;
      const targetBytes = options.kind === "room" ? 3.5 * 1024 * 1024 : 2.5 * 1024 * 1024;
      const initialScale = Math.min(1, maxDimension / Math.max(decoded.width, decoded.height));
      let width = Math.max(1, Math.round(decoded.width * initialScale));
      let height = Math.max(1, Math.round(decoded.height * initialScale));
      let quality = 0.92;
      let workingBlob: Blob | null = null;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("canvas");
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(decoded.source, 0, 0, width, height);
        workingBlob = await canvasToBlob(canvas, quality);
        options.onProgress?.(55 + attempt * 8);
        if (workingBlob.size <= targetBytes || attempt === 4) break;
        width = Math.max(1, Math.round(width * 0.86));
        height = Math.max(1, Math.round(height * 0.86));
        quality = Math.max(0.78, quality - 0.035);
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }

      if (!workingBlob) throw new Error("encode");
      const workingDataUrl = await blobToDataUrl(workingBlob);
      options.onProgress?.(100);
      return {
        originalFile: file,
        originalUrl,
        workingDataUrl,
        width: decoded.width,
        height: decoded.height,
        originalBytes: file.size,
        workingBytes: workingBlob.size,
        converted,
        fileName: file.name || `${options.kind}-photo.jpg`,
        source: options.source,
      };
    } finally {
      decoded.close();
    }
  } catch (error) {
    URL.revokeObjectURL(originalUrl);
    if (error instanceof Error && error.message.startsWith("Please choose")) throw error;
    throw new Error("Your photo is being optimized. Please wait a moment and try again.");
  }
}

export function releaseImage(image: ProcessedImage | null | undefined): void {
  if (image?.originalUrl.startsWith("blob:")) URL.revokeObjectURL(image.originalUrl);
}