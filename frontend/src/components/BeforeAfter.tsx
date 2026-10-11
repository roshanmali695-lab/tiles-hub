import { GripVertical } from "lucide-react";
import { useState } from "react";

interface BeforeAfterProps {
  before: string;
  after: string;
  isDemo?: boolean;
}

export default function BeforeAfter({ before, after, isDemo = false }: BeforeAfterProps) {
  const [position, setPosition] = useState(50);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-stone-200" data-testid="before-after-viewer">
      <img src={after} alt="Generated tile visualization" className="absolute inset-0 size-full object-cover" data-testid="after-design-image" />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={before} alt="Original uploaded room" className="absolute inset-0 size-full object-cover" data-testid="before-room-image" />
      </div>

      <div className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-white shadow-lg" style={{ left: `${position}%` }} data-testid="comparison-divider">
        <div className="absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-stone-950 text-white shadow-xl">
          <GripVertical className="size-5" aria-hidden="true" />
        </div>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        aria-label="Compare before and after"
        data-testid="before-after-slider"
        className="absolute inset-0 z-30 size-full cursor-col-resize opacity-0"
      />
      <div className="pointer-events-none absolute top-4 left-4 z-20 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-stone-950 shadow-sm backdrop-blur" data-testid="before-label">BEFORE</div>
      <div className="pointer-events-none absolute top-4 right-4 z-20 rounded-full bg-stone-950/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur" data-testid="after-label">{isDemo ? "AFTER · DEMO" : "AFTER · AI"}</div>
    </div>
  );
}