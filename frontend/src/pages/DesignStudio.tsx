import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Download, Instagram, LoaderCircle, RotateCcw, Save, Share2, Sparkles, WandSparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import BeforeAfter from "@/components/BeforeAfter";
import PhotoPicker from "@/components/PhotoPicker";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost } from "@/lib/api";
import type { Design, DesignGenerateRequest, Tile } from "@/lib/api";
import { releaseImage } from "@/lib/imageProcessing";
import type { ProcessedImage } from "@/lib/imageProcessing";

const areas = ["All Areas", "Bathroom", "Kitchen", "Living Room", "Bedroom", "Floor", "Full Flooring", "Wall", "Entrance Wall", "Elevation", "Balcony", "Staircase", "Shop", "Office", "Commercial Space", "Outdoor Area", "Other / Custom Area"];
const sizes = ["2×2", "2×4", "4×4", "4×8", "12×24", "24×24", "24×48", "Custom Size"];
const surfaces = ["Main Wall", "Feature Wall", "Floor", "Full Wall", "Full Floor", "Selected Area"];
const styles = ["Recommended", "Full Wall", "Feature Wall", "Premium", "Budget-Friendly", "Modern", "Luxury", "Minimal"];

const resultImages: Record<string, string> = {
  Bathroom: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1600&q=90",
  default: "https://images.unsplash.com/photo-1630699144919-681cf308ae82?auto=format&fit=crop&w=1600&q=90",
};

interface StudioTile {
  id: string;
  name: string;
  image: string;
  preview: string;
  asset?: ProcessedImage;
  surface: string;
  size: string;
}

export default function DesignStudio() {
  const [params] = useSearchParams();
  const showroomMode = params.get("showroom") === "true";
  const queryClient = useQueryClient();
  const [area, setArea] = useState("Bathroom");
  const [roomPhoto, setRoomPhoto] = useState<ProcessedImage | null>(null);
  const [tiles, setTiles] = useState<StudioTile[]>([]);
  const [style, setStyle] = useState("Recommended");
  const [customerName, setCustomerName] = useState("");
  const [result, setResult] = useState<Design | null>(null);
  const [generationStage, setGenerationStage] = useState("");
  const [generationStep, setGenerationStep] = useState(0);
  const [generationError, setGenerationError] = useState(false);

  const catalogue = useQuery({ queryKey: ["tiles"], queryFn: () => apiGet<Tile[]>("/tiles"), retry: false });

  const generate = useMutation({
    mutationFn: async (payload: DesignGenerateRequest) => {
      setGenerationError(false);
      // Real AI takes 10-40 s. Show progress stages while the request runs instead of a fake delay.
      const stages = ["Analyzing your room…", "Detecting surfaces…", "Applying your tile…", "Creating realistic lighting…", "Finalizing your design…"];
      let index = 0;
      setGenerationStep(1);
      setGenerationStage(stages[0]);
      const timer = window.setInterval(() => {
        index = Math.min(index + 1, stages.length - 1);
        setGenerationStep(index + 1);
        setGenerationStage(stages[index]);
      }, 5000);
      try {
        return await apiPost<Design>("/designs/generate", payload);
      } finally {
        window.clearInterval(timer);
      }
    },
    onSuccess: (data) => {
      setResult(data);
      setGenerationStage("");
      setGenerationStep(0);
      queryClient.invalidateQueries({ queryKey: ["designs"] });
      toast.success("Design generated and saved");
    },
    onError: () => {
      setGenerationStage("");
      setGenerationStep(0);
      setGenerationError(true);
      toast.error("We couldn’t complete your design. Check your connection and try again.");
    },
  });

  const canGenerate = Boolean(roomPhoto && tiles.length > 0 && !generate.isPending);
  const progress = useMemo(() => [Boolean(area), Boolean(roomPhoto), tiles.length > 0], [area, roomPhoto, tiles.length]);

  const confirmRoom = (image: ProcessedImage) => {
    releaseImage(roomPhoto);
    setRoomPhoto(image);
    setResult(null);
    window.setTimeout(() => document.querySelector('[data-testid="tile-upload-section"]')?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  };

  const addTilePhoto = (asset: ProcessedImage) => {
    if (tiles.length >= 3) { releaseImage(asset); return; }
    setTiles((current) => [...current, { id: crypto.randomUUID(), name: asset.fileName.replace(/\.[^/.]+$/, ""), image: asset.workingDataUrl, preview: asset.originalUrl, asset, surface: surfaces[current.length] ?? "Selected Area", size: "24×48" }]);
    setResult(null);
    window.setTimeout(() => document.querySelector('[data-testid="generate-design-button"]')?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
  };

  const addCatalogueTile = (tile: Tile) => {
    if (tiles.length >= 3 || tiles.some((item) => item.image === tile.image)) return;
    setTiles((current) => [...current, { id: crypto.randomUUID(), name: tile.name, image: tile.image, preview: tile.image, surface: surfaces[current.length] ?? "Selected Area", size: tile.size }]);
  };

  const updateTile = (id: string, patch: Partial<StudioTile>) => setTiles((current) => current.map((tile) => tile.id === id ? { ...tile, ...patch } : tile));

  const replaceTilePhoto = (id: string, asset: ProcessedImage) => {
    setTiles((current) => current.map((tile) => {
      if (tile.id !== id) return tile;
      releaseImage(tile.asset);
      return { ...tile, name: asset.fileName.replace(/\.[^/.]+$/, ""), image: asset.workingDataUrl, preview: asset.originalUrl, asset };
    }));
    setResult(null);
  };

  const removeTile = (id: string) => setTiles((current) => current.filter((tile) => {
    if (tile.id === id) releaseImage(tile.asset);
    return tile.id !== id;
  }));

  const submit = () => {
    if (!canGenerate) return;
    generate.mutate({
      area,
      room_image: roomPhoto?.workingDataUrl ?? "",
      generated_image: resultImages[area] ?? resultImages.default,
      style,
      tile_assignments: tiles.map((tile) => ({ tile_name: tile.name, tile_image: tile.image, surface: tile.surface, size: tile.size })),
      customer_name: customerName || null,
      showroom_mode: showroomMode,
    });
  };

  const reset = () => {
    releaseImage(roomPhoto);
    tiles.forEach((tile) => releaseImage(tile.asset));
    setRoomPhoto(null);
    setTiles([]);
    setResult(null);
    setStyle("Recommended");
    setGenerationStage("");
    setGenerationError(false);
  };
  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`Tiles Hub design: ${window.location.href}`)}`, "_blank", "noopener,noreferrer");
  const shareInstagram = async () => {
    if (navigator.share) {
      await navigator.share({ title: "My Tiles Hub design", url: window.location.href }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Design link copied for Instagram");
  };

  const exportComparison = async () => {
    if (!result) return;
    const load = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
    try {
      const [before, after] = await Promise.all([load(result.room_image), load(result.generated_image)]);
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 700;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      const drawCover = (image: HTMLImageElement, x: number) => {
        const scale = Math.max(800 / image.width, 700 / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        context.drawImage(image, x + (800 - width) / 2, (700 - height) / 2, width, height);
      };
      drawCover(before, 0);
      drawCover(after, 800);
      context.fillStyle = "rgba(28,25,23,.82)";
      context.fillRect(0, 0, 1600, 54);
      context.fillStyle = "white";
      context.font = "600 22px sans-serif";
      context.fillText("BEFORE", 24, 35);
      context.fillText(result.generation_mode === "ai_generated" ? "AFTER · TILES HUB AI" : "AFTER · TILES HUB DEMO", 824, 35);
      const link = document.createElement("a");
      link.download = "tiles-hub-before-after.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      toast.error("Comparison export is unavailable for this image source");
    }
  };

  return (
    <div className="min-h-[calc(100svh-64px)] bg-stone-100">
      <div className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <div data-testid="studio-eyebrow" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8B7355]">{showroomMode ? "Showroom workspace" : "AI Design Studio"}</div>
            <h1 data-testid="studio-title" className="mt-1 font-heading text-3xl font-semibold tracking-tight">Create a room concept</h1>
          </div>
          <div className="flex items-center gap-2" data-testid="studio-progress">
            {progress.map((complete, index) => <div key={index} data-testid={`progress-step-${index + 1}`} className={`h-1.5 w-12 rounded-full ${complete ? "bg-[#8B7355]" : "bg-stone-200"}`} />)}
            <span data-testid="progress-label" className="ml-2 text-xs font-medium text-stone-500">{progress.filter(Boolean).length}/3 ready</span>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[390px_1fr]">
        <aside className="border-b border-stone-200 bg-white p-5 lg:min-h-[calc(100svh-153px)] lg:border-r lg:border-b-0 lg:p-7" data-testid="studio-controls-panel">
          <div className="space-y-8">
            <section data-testid="area-selection-section">
              <div className="mb-3 flex items-center justify-between"><h2 data-testid="area-selection-title" className="text-sm font-semibold">1. Select area</h2><span data-testid="area-selection-required" className="text-xs text-stone-400">Required</span></div>
              <select value={area} onChange={(event) => setArea(event.target.value)} data-testid="area-select" className="h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm outline-none focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10">
                {areas.map((item) => <option key={item}>{item}</option>)}
              </select>
            </section>

            <section data-testid="room-upload-section">
              <div className="mb-3 flex items-center justify-between"><h2 data-testid="room-upload-title" className="text-sm font-semibold">2. Add Room Photo</h2>{roomPhoto && <span data-testid="room-upload-status" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><Check className="size-3" /> Ready</span>}</div>
              <PhotoPicker id="room" kind="room" title="Room Photo" value={roomPhoto} onConfirm={confirmRoom} onClear={() => { releaseImage(roomPhoto); setRoomPhoto(null); setResult(null); }} legacyGalleryTestId="room-file-input" />
            </section>

            <section data-testid="tile-upload-section">
              <div className="mb-3 flex items-center justify-between"><h2 data-testid="tile-upload-title" className="text-sm font-semibold">3. Add Tile Photo</h2><span data-testid="tile-count" className="text-xs text-stone-400">{tiles.length}/3</span></div>
              <div className="space-y-3">
                {tiles.map((tile, index) => (
                  <div key={tile.id} className="rounded-xl border border-stone-200 p-3" data-testid={`tile-assignment-${index + 1}`}>
                    {tile.asset ? <PhotoPicker id={`tile-${index + 1}`} kind="tile" title={`Tile ${index + 1} Photo`} value={tile.asset} onConfirm={(asset) => replaceTilePhoto(tile.id, asset)} onClear={() => removeTile(tile.id)} /> : <div className="flex gap-3"><img src={tile.preview} alt={`${tile.name} reference`} className="size-14 rounded-lg object-cover" data-testid={`tile-preview-${index + 1}`} /><div className="min-w-0 flex-1"><div data-testid={`tile-name-${index + 1}`} className="truncate text-sm font-semibold">Tile {index + 1} · {tile.name}</div><button type="button" data-testid={`remove-tile-${index + 1}-button`} onClick={() => removeTile(tile.id)} className="mt-1 text-xs font-medium text-red-600 hover:text-red-700">Remove</button></div></div>}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <select value={tile.surface} onChange={(event) => updateTile(tile.id, { surface: event.target.value })} data-testid={`tile-surface-${index + 1}-select`} className="h-9 rounded-lg border border-stone-200 bg-white px-2 text-xs outline-none focus:border-stone-950">{surfaces.map((item) => <option key={item}>{item}</option>)}</select>
                      <select value={tile.size} onChange={(event) => updateTile(tile.id, { size: event.target.value })} data-testid={`tile-size-${index + 1}-select`} className="h-9 rounded-lg border border-stone-200 bg-white px-2 text-xs outline-none focus:border-stone-950">{sizes.map((item) => <option key={item}>{item}</option>)}</select>
                    </div>
                  </div>
                ))}
                {tiles.length < 3 && <PhotoPicker id="tile-new" kind="tile" title="Tile Photo" onConfirm={addTilePhoto} legacyGalleryTestId="tile-file-input" />}
              </div>
              {tiles.length < 3 && catalogue.data && catalogue.data.length > 0 && (
                <div className="mt-4" data-testid="catalogue-quick-pick"><div data-testid="catalogue-quick-pick-label" className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">Or choose from collection</div><div className="flex gap-2 overflow-x-auto pb-1">{catalogue.data.slice(0, 4).map((tile) => <button key={tile.id} type="button" title={tile.name} onClick={() => addCatalogueTile(tile)} data-testid={`catalogue-tile-${tile.id}-button`} className="shrink-0 rounded-lg border border-stone-200 p-1 transition-transform duration-200 hover:-translate-y-0.5"><img src={tile.image} alt={tile.name} className="size-12 rounded-md object-cover" data-testid={`catalogue-tile-${tile.id}-image`} /></button>)}</div></div>
              )}
            </section>

            {showroomMode && <section data-testid="customer-details-section"><label htmlFor="customer-name" data-testid="customer-name-label" className="mb-2 block text-sm font-semibold">Customer name</label><input id="customer-name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="e.g. Arjun Patel" data-testid="customer-name-input" className="h-11 w-full rounded-xl border border-stone-300 px-3 text-sm outline-none focus:border-stone-950" /></section>}

            <section data-testid="design-style-section"><h2 data-testid="design-style-title" className="mb-3 text-sm font-semibold">Design suggestion</h2><div className="flex flex-wrap gap-2">{styles.map((item) => <button key={item} type="button" onClick={() => setStyle(item)} data-testid={`style-${item.toLowerCase().replaceAll(' ', '-')}-button`} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${style === item ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"}`}>{item}</button>)}</div></section>

            <div className="space-y-2">
              <Button type="button" size="lg" disabled={!canGenerate} onClick={submit} data-testid="generate-design-button" className="h-13 w-full rounded-xl bg-[#8B7355] text-white hover:bg-[#755f45] disabled:bg-stone-300">
                {generate.isPending ? <><LoaderCircle className="size-4 animate-spin" /> Generating design…</> : <><WandSparkles className="size-4" /> Generate My Tile Design</>}
              </Button>
              {generationError && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3" data-testid="generation-error"><p data-testid="generation-error-message" className="text-xs leading-5 text-amber-900">We couldn’t finish your design. Your photos are safe—check your connection and try again.</p><button type="button" onClick={submit} data-testid="generation-try-again-button" className="mt-2 text-xs font-semibold text-amber-950">Try Again</button></div>}
              <button type="button" onClick={reset} data-testid="reset-design-button" className="flex h-10 w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold text-stone-500 transition-colors duration-200 hover:bg-stone-100 hover:text-stone-950"><RotateCcw className="size-3.5" /> Reset workspace</button>
            </div>
          </div>
        </aside>

        <section className="p-4 sm:p-7 lg:p-10" data-testid="studio-preview-panel">
          <div className="mx-auto max-w-5xl">
            {generate.isPending ? (
              <div className="grid min-h-[460px] place-items-center rounded-3xl border border-stone-200 bg-white p-8 text-center sm:min-h-[620px]" data-testid="generation-loading-state">
                <div><div className="relative mx-auto grid size-20 place-items-center rounded-full bg-[#8B7355]/10"><div className="absolute inset-0 animate-ping rounded-full border border-[#8B7355]/30" /><Sparkles className="size-7 animate-pulse text-[#8B7355]" /></div><h2 data-testid="generation-stage" className="mt-7 font-heading text-2xl font-semibold">{generationStage}</h2><p data-testid="generation-disclaimer" className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-500">AI is placing your exact tiles on your room photo. This can take up to a minute.</p><div className="mx-auto mt-6 flex max-w-xs gap-1.5">{[1,2,3,4,5].map((step) => <div key={step} data-testid={`generation-progress-${step}`} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${step <= generationStep ? "bg-[#8B7355]" : "bg-stone-100"}`} />)}</div></div>
              </div>
            ) : result ? (
              <div data-testid="generated-result">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div data-testid="result-status" className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"><Check className="size-3" /> Concept ready</div><h2 data-testid="result-title" className="mt-3 font-heading text-2xl font-semibold">{result.style} {result.area} design</h2><p data-testid="result-mode-note" className="mt-1 text-sm text-stone-500">{result.generation_mode === "ai_generated" ? "AI generated" : "Demo preview (AI unavailable)"} · Saved to My Designs</p></div><div className="flex gap-3"><button type="button" onClick={() => { setResult(null); document.querySelector('[data-testid="tile-upload-section"]')?.scrollIntoView({ behavior: "smooth" }); }} data-testid="change-tile-button" className="text-sm font-semibold text-[#8B7355] hover:text-[#755f45]">Change Tile</button><button type="button" onClick={() => setResult(null)} data-testid="try-another-design-button" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-950"><RotateCcw className="size-4" /> Generate Another Design</button></div></div>
                <BeforeAfter before={roomPhoto?.originalUrl ?? result.room_image} after={result.generated_image} isDemo={result.generation_mode !== "ai_generated"} />
                <div className="mt-4 grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div><div data-testid="result-tile-summary" className="text-sm font-semibold">{result.tile_assignments.length} tile{result.tile_assignments.length > 1 ? "s" : ""} mapped</div><div data-testid="result-surface-summary" className="mt-1 text-xs text-stone-500">{result.tile_assignments.map((tile) => `${tile.surface}: ${tile.tile_name} (${tile.size})`).join(" · ")}</div></div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => toast.success("Design is saved in My Designs")} data-testid="save-design-button" className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 px-3 text-xs font-semibold transition-colors duration-200 hover:bg-stone-50"><Save className="size-4" /> Save design</button>
                    <a href={result.generated_image} download="tiles-hub-design.jpg" data-testid="download-design-link" className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 px-3 text-xs font-semibold transition-colors duration-200 hover:bg-stone-50"><Download className="size-4" /> Download</a>
                    <button type="button" onClick={exportComparison} data-testid="export-comparison-button" className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 px-3 text-xs font-semibold transition-colors duration-200 hover:bg-stone-50">Before / after</button>
                    <button type="button" onClick={() => window.print()} data-testid="generate-pdf-button" className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 px-3 text-xs font-semibold transition-colors duration-200 hover:bg-stone-50">Design PDF</button>
                    <button type="button" onClick={shareInstagram} data-testid="share-instagram-button" className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 px-3 text-xs font-semibold transition-colors duration-200 hover:bg-stone-50"><Instagram className="size-4" /> Instagram</button>
                    <button type="button" onClick={shareWhatsApp} data-testid="share-whatsapp-button" className="inline-flex h-10 items-center gap-2 rounded-lg bg-stone-950 px-3 text-xs font-semibold text-white transition-colors duration-200 hover:bg-stone-800"><Share2 className="size-4" /> Share with customer</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative min-h-[620px] overflow-hidden rounded-3xl border border-stone-200 bg-stone-950" data-testid="studio-empty-preview">
                <img src="https://images.unsplash.com/photo-1630699144919-681cf308ae82?auto=format&fit=crop&w=1600&q=88" alt="Modern room visualization example" className="absolute inset-0 size-full object-cover opacity-55" data-testid="studio-placeholder-image" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-10">
                  <div data-testid="preview-demo-badge" className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur"><Sparkles className="size-3.5" /> Visualization workspace</div>
                  <h2 data-testid="preview-placeholder-title" className="max-w-xl font-heading text-3xl font-medium tracking-tight sm:text-4xl">Your room transformation will appear here.</h2>
                  <p data-testid="preview-placeholder-copy" className="mt-3 max-w-lg text-sm leading-6 text-white/70">Upload a clear room photo and at least one tile. We’ll map your selections to the surfaces you choose.</p>
                  <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-white/80" data-testid="preview-next-action"><ArrowRight className="size-4" /> Start with the controls on the left</div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}