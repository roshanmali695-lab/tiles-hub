import { Camera, Check, ImageIcon, LoaderCircle, RefreshCw, Replace, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatBytes, optimizeImage, releaseImage } from "@/lib/imageProcessing";
import type { ProcessedImage } from "@/lib/imageProcessing";

interface PhotoPickerProps {
  id: string;
  kind: "room" | "tile";
  title: string;
  value?: ProcessedImage | null;
  onConfirm: (image: ProcessedImage) => void;
  onClear?: () => void;
  legacyGalleryTestId?: string;
}

const ACCEPTED = "image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif";

export default function PhotoPicker({ id, kind, title, value, onConfirm, onClear, legacyGalleryTestId }: PhotoPickerProps) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const pendingRef = useRef<ProcessedImage | null>(null);
  const [pending, setPending] = useState<ProcessedImage | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => () => releaseImage(pendingRef.current), []);

  const process = async (file: File | undefined, source: "camera" | "gallery") => {
    if (!file) return;
    releaseImage(pending);
    setPending(null);
    pendingRef.current = null;
    setError("");
    setProcessing(true);
    setProgress(3);
    try {
      const optimized = await optimizeImage(file, { kind, source, onProgress: setProgress });
      pendingRef.current = optimized;
      setPending(optimized);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your photo is being optimized. Please wait a moment and try again.");
    } finally {
      setProcessing(false);
      if (cameraInput.current) cameraInput.current.value = "";
      if (galleryInput.current) galleryInput.current.value = "";
    }
  };

  const openCamera = async () => {
    setError("");
    try {
      if (navigator.permissions?.query) {
        const permission = await navigator.permissions.query({ name: "camera" as PermissionName });
        if (permission.state === "denied") {
          setError("Camera access is off. Enable it in your browser settings, or choose a photo from your gallery.");
          return;
        }
      }
    } catch {
      // Camera permission cannot be queried on every mobile browser; the native picker handles it.
    }
    cameraInput.current?.click();
  };

  const usePending = () => {
    if (!pending) return;
    pendingRef.current = null;
    onConfirm(pending);
    setPending(null);
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-3" data-testid={`${id}-photo-picker`}>
      <input ref={cameraInput} type="file" accept={ACCEPTED} capture="environment" onChange={(event) => process(event.target.files?.[0], "camera")} data-testid={`${id}-camera-input`} className="sr-only" />
      <input ref={galleryInput} type="file" accept={ACCEPTED} onChange={(event) => process(event.target.files?.[0], "gallery")} data-testid={legacyGalleryTestId ?? `${id}-gallery-input`} className="sr-only" />

      {processing ? (
        <div className="grid min-h-40 place-items-center p-5 text-center" data-testid={`${id}-optimization-progress`}>
          <div className="w-full max-w-xs">
            <div className="relative mx-auto grid size-12 place-items-center rounded-full bg-[#8B7355]/10 text-[#8B7355]"><LoaderCircle className="size-5 animate-spin" /></div>
            <div data-testid={`${id}-optimization-title`} className="mt-4 text-sm font-semibold">Optimizing your photo…</div>
            <div data-testid={`${id}-optimization-copy`} className="mt-1 text-xs leading-5 text-stone-500">Keeping the original safe while preparing a high-quality working copy.</div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-stone-100"><div data-testid={`${id}-optimization-bar`} className="h-full rounded-full bg-[#8B7355] transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
      ) : pending ? (
        <div data-testid={`${id}-review-state`}>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-100">
            <img src={pending.originalUrl} alt={`${title} preview`} className="size-full object-cover" data-testid={`${id}-review-preview`} />
            <div className="absolute top-2 left-2 rounded-full bg-stone-950/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur" data-testid={`${id}-review-label`}>Review {title}</div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-stone-500" data-testid={`${id}-review-meta`}><ShieldCheck className="size-3.5 text-emerald-600" /> Original {formatBytes(pending.originalBytes)} · {pending.width}×{pending.height}</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={usePending} data-testid={`${id}-use-photo-button`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-stone-950 text-sm font-semibold text-white transition-colors duration-200 hover:bg-stone-800"><Check className="size-4" /> Use Photo</button>
            <button type="button" onClick={openCamera} data-testid={`${id}-retake-button`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 text-sm font-semibold transition-colors duration-200 hover:bg-stone-50"><RefreshCw className="size-4" /> Retake</button>
            <button type="button" onClick={() => galleryInput.current?.click()} data-testid={`${id}-review-gallery-button`} className="col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-stone-600 transition-colors duration-200 hover:bg-stone-50"><ImageIcon className="size-4" /> Choose from Gallery</button>
          </div>
        </div>
      ) : value ? (
        <div data-testid={`${id}-selected-state`}>
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-stone-100">
            <img src={value.originalUrl} alt={`${title} selected`} className="size-full object-cover" data-testid={`${id}-selected-preview`} />
            <div className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur" data-testid={`${id}-ready-badge`}><Check className="size-3" /> Ready</div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="min-w-0"><div data-testid={`${id}-selected-title`} className="truncate text-xs font-semibold">{title}</div><div data-testid={`${id}-selected-meta`} className="mt-0.5 text-[10px] text-stone-400">Original {formatBytes(value.originalBytes)} · Working copy {formatBytes(value.workingBytes)}</div></div>
            {onClear && <button type="button" onClick={onClear} data-testid={`${id}-change-photo-button`} className="shrink-0 text-xs font-semibold text-[#8B7355] hover:text-[#755f45]">Change Photo</button>}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={openCamera} data-testid={`${id}-selected-retake-button`} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-stone-200 text-xs font-semibold hover:bg-stone-50"><Camera className="size-3.5" /> Retake</button>
            <button type="button" onClick={() => galleryInput.current?.click()} data-testid={`${id}-selected-gallery-button`} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-stone-200 text-xs font-semibold hover:bg-stone-50"><ImageIcon className="size-3.5" /> Gallery</button>
          </div>
        </div>
      ) : (
        <div className="p-1" data-testid={`${id}-source-options`}>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={openCamera} data-testid={`${id}-take-photo-button`} className="flex min-h-24 flex-col items-center justify-center rounded-xl bg-stone-950 px-3 text-center text-white transition-[background-color,transform] duration-200 active:scale-[0.98] hover:bg-stone-800"><Camera className="size-5" /><span data-testid={`${id}-take-photo-label`} className="mt-2 text-xs font-semibold">Take Photo</span></button>
            <button type="button" onClick={() => galleryInput.current?.click()} data-testid={`${id}-choose-gallery-button`} className="flex min-h-24 flex-col items-center justify-center rounded-xl border border-stone-200 bg-stone-50 px-3 text-center transition-[background-color,transform] duration-200 active:scale-[0.98] hover:bg-stone-100"><ImageIcon className="size-5 text-[#8B7355]" /><span data-testid={`${id}-choose-gallery-label`} className="mt-2 text-xs font-semibold">Choose from Gallery</span></button>
          </div>
          <p data-testid={`${id}-format-help`} className="mt-3 text-center text-[10px] leading-4 text-stone-400">JPG, PNG, WEBP, HEIC or HEIF · Large photos optimized automatically</p>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3" data-testid={`${id}-upload-error`}>
          <p data-testid={`${id}-upload-error-message`} className="text-xs leading-5 text-amber-900">{error}</p>
          <button type="button" onClick={() => { setError(""); galleryInput.current?.click(); }} data-testid={`${id}-try-again-button`} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-950"><Replace className="size-3.5" /> Try Again</button>
        </div>
      )}
    </div>
  );
}