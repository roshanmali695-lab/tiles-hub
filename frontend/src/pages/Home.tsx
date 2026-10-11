import { ArrowRight, Boxes, Camera, Check, ImageIcon, Layers3, Sparkles, Store, Upload } from "lucide-react";
import { Link } from "react-router-dom";

const roomImage = "https://images.unsplash.com/photo-1661107259637-4e1c55462428?auto=format&fit=crop&w=1600&q=88";
const tileImage = "https://images.unsplash.com/photo-1551554781-c46200ea959d?auto=format&fit=crop&w=700&q=88";

const steps = [
  { number: "01", title: "Upload your space", copy: "Use any clear photo of your bathroom, kitchen, living area or commercial space.", icon: Camera },
  { number: "02", title: "Add exact tiles", copy: "Upload up to three tile references and map each one to a wall, floor or feature area.", icon: Layers3 },
  { number: "03", title: "Visualize the design", copy: "Review a professional before-and-after concept, then save or share it with a customer.", icon: Sparkles },
];

export default function Home() {
  return (
    <div className="overflow-hidden bg-white">
      <section className="relative border-b border-stone-200">
        <div className="absolute inset-y-0 right-0 hidden w-[46%] bg-stone-100 lg:block" aria-hidden="true" />
        <div className="relative mx-auto grid min-h-[calc(100svh-64px)] max-w-[1440px] items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-20">
          <div className="relative z-10 max-w-2xl">
            <div data-testid="hero-eyebrow" className="mb-6 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">
              <Sparkles className="size-3.5 text-[#8B7355]" aria-hidden="true" /> AI tile visualization
            </div>
            <h1 data-testid="hero-title" className="font-heading text-5xl font-light leading-[0.97] tracking-[-0.045em] text-stone-950 sm:text-6xl lg:text-[76px]">
              Visualize your tiles <span className="font-medium text-[#8B7355]">in your space.</span>
            </h1>
            <p data-testid="hero-description" className="mt-7 max-w-xl text-lg leading-8 text-stone-600">
              Turn a room photo and your exact tile reference into a polished interior concept—in a few simple steps.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/ai-design" data-testid="hero-create-design-link" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-stone-950 px-6 text-sm font-semibold text-white shadow-lg shadow-stone-950/10 transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-stone-800">
                <Sparkles className="size-4" aria-hidden="true" /> Create New Design
              </Link>
              <Link to="/ai-design" data-testid="hero-upload-room-link" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-6 text-sm font-semibold text-stone-950 transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-stone-50">
                <Upload className="size-4" aria-hidden="true" /> Upload Room Photo
              </Link>
            </div>
            <Link to="/ai-design" data-testid="hero-upload-tile-link" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-stone-600 transition-colors duration-200 hover:text-stone-950">Upload Tile Photo <ArrowRight className="size-4" /></Link>
            <div className="mt-7 grid grid-cols-3 gap-2" data-testid="home-quick-actions">
              {[{ to: "/my-designs", label: "My Designs", icon: ImageIcon }, { to: "/my-tiles", label: "My Tiles", icon: Boxes }, { to: "/showroom", label: "Showroom Mode", icon: Store }].map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} data-testid={`home-${label.toLowerCase().replaceAll(" ", "-")}-link`} className="flex min-h-20 flex-col items-center justify-center rounded-xl border border-stone-200 bg-stone-50 px-2 text-center transition-[background-color,transform] duration-200 active:scale-[0.98] hover:bg-stone-100">
                  <Icon className="size-4 text-[#8B7355]" /><span data-testid={`home-${label.toLowerCase().replaceAll(" ", "-")}-label`} className="mt-2 text-[11px] font-semibold text-stone-700">{label}</span>
                </Link>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-500" data-testid="hero-benefits">
              {['Exact tile reference', 'Multiple surfaces', 'Ready to share'].map((item) => (
                <span key={item} data-testid={`benefit-${item.toLowerCase().replaceAll(' ', '-')}`} className="inline-flex items-center gap-1.5"><Check className="size-4 text-[#8B7355]" />{item}</span>
              ))}
            </div>
          </div>

          <div className="relative min-h-[460px] lg:min-h-[620px]" data-testid="hero-visual">
            <div className="absolute top-0 right-0 bottom-10 left-6 overflow-hidden rounded-[2rem] shadow-[0_30px_80px_rgba(28,25,23,0.2)] sm:left-16">
              <img src={roomImage} alt="Premium tiled bathroom inspiration" className="size-full object-cover" data-testid="hero-room-image" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950/70 to-transparent p-7 pt-24">
                <div data-testid="hero-visual-caption" className="text-sm font-medium text-white">Bathroom concept · Calacatta Gold</div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-40 rounded-2xl border-4 border-white bg-white p-2 shadow-2xl sm:w-52" data-testid="tile-reference-card">
              <img src={tileImage} alt="Calacatta tile reference" className="aspect-square w-full rounded-xl object-cover" data-testid="hero-tile-image" />
              <div className="px-2 pt-3 pb-2">
                <div data-testid="tile-reference-label" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">Exact reference</div>
                <div data-testid="tile-reference-name" className="mt-1 text-sm font-semibold text-stone-950">Calacatta Gold</div>
              </div>
            </div>
            <div className="absolute top-7 right-0 rounded-2xl border border-white/50 bg-white/90 p-4 shadow-xl backdrop-blur sm:right-[-12px]" data-testid="surface-detection-card">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-full bg-[#8B7355]/10 text-[#8B7355]"><Sparkles className="size-4" /></div>
                <div><div data-testid="detection-status" className="text-sm font-semibold">Surfaces detected</div><div data-testid="detection-detail" className="text-xs text-stone-500">Wall · Floor · Fixtures</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-stone-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div data-testid="process-eyebrow" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8B7355]">Simple by design</div>
            <h2 data-testid="process-title" className="mt-4 font-heading text-3xl font-medium tracking-tight sm:text-5xl">From photo to presentation in three steps.</h2>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-stone-200 bg-stone-200 md:grid-cols-3">
            {steps.map(({ number, title, copy, icon: Icon }) => (
              <article key={number} className="group bg-white p-7 transition-colors duration-300 hover:bg-[#fbfaf8] sm:p-9" data-testid={`process-step-${number}`}>
                <div className="flex items-center justify-between"><span data-testid={`step-number-${number}`} className="font-mono text-xs text-stone-400">{number}</span><Icon className="size-5 text-[#8B7355] transition-transform duration-300 group-hover:scale-110" /></div>
                <h3 data-testid={`step-title-${number}`} className="mt-16 font-heading text-xl font-semibold">{title}</h3>
                <p data-testid={`step-copy-${number}`} className="mt-3 text-sm leading-6 text-stone-500">{copy}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/ai-design" data-testid="process-generate-design-link" className="inline-flex items-center gap-2 rounded-xl bg-[#8B7355] px-6 py-3 text-sm font-semibold text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#755f45]">Generate my design <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}