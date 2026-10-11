import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Boxes,
  Download,
  House,
  ImageIcon,
  LayoutDashboard,
  Menu,
  Sparkles,
  Store,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";

const navItems = [
  { to: "/", label: "Home", icon: House },
  { to: "/ai-design", label: "AI Design", icon: Sparkles },
  { to: "/my-tiles", label: "My Tiles", icon: Boxes },
  { to: "/my-designs", label: "My Designs", icon: ImageIcon },
  { to: "/showroom", label: "Showroom", icon: Store },
  { to: "/profile", label: "Profile", icon: UserRound },
];

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function NavItems({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  return navItems.map(({ to, label, icon: Icon }) => (
    <NavLink
      key={to}
      to={to}
      end={to === "/"}
      onClick={onNavigate}
      data-testid={`nav-${label.toLowerCase().replace(" ", "-")}-link`}
      className={({ isActive }) =>
        mobile
          ? `flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-semibold transition-colors duration-200 ${isActive ? "bg-stone-950 text-white" : "text-stone-500 hover:bg-stone-100"}`
          : `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${isActive ? "bg-stone-950 text-white" : "text-stone-600 hover:bg-stone-100 hover:text-stone-950"}`
      }
    >
      <Icon className={mobile ? "size-4" : "size-4"} aria-hidden="true" />
      <span data-testid={`nav-${label.toLowerCase().replace(" ", "-")}-label`}>{label}</span>
    </NavLink>
  ));
}

export default function AppShell() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <div className="min-h-svh bg-stone-50 text-stone-950">
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <NavLink to="/" className="group flex items-center gap-3" data-testid="brand-home-link">
            <div className="grid size-9 place-items-center rounded-xl bg-stone-950 text-white shadow-sm transition-transform duration-200 group-hover:-rotate-3">
              <LayoutDashboard className="size-4" aria-hidden="true" />
            </div>
            <div>
              <div data-testid="brand-name" className="font-heading text-base font-semibold tracking-[0.16em]">TILES HUB</div>
              <div data-testid="brand-tagline" className="hidden text-[10px] font-medium uppercase tracking-[0.17em] text-stone-400 sm:block">Visual design studio</div>
            </div>
          </NavLink>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            <NavItems />
          </nav>

          <div className="flex items-center gap-2">
            {installPrompt && (
              <button type="button" onClick={installApp} data-testid="install-app-button" className="hidden h-9 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 transition-colors duration-200 hover:bg-stone-50 sm:inline-flex">
                <Download className="size-3.5" /> Install app
              </button>
            )}
            <NavLink
              to="/ai-design"
              data-testid="header-new-design-link"
              className="hidden rounded-xl bg-[#8B7355] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#755f45] sm:block"
            >
              New design
            </NavLink>
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              data-testid="mobile-menu-button"
              onClick={() => setMenuOpen((value) => !value)}
              className="grid size-10 place-items-center rounded-xl border border-stone-200 bg-white text-stone-700 transition-colors duration-200 hover:bg-stone-100 lg:hidden"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="border-t border-stone-100 bg-white p-3 lg:hidden" aria-label="Mobile navigation" data-testid="mobile-navigation">
            <div className="mx-auto grid max-w-xl grid-cols-2 gap-2">
              <NavItems onNavigate={() => setMenuOpen(false)} />
            </div>
          </nav>
        )}
      </header>

      <main className={location.pathname === "/ai-design" ? "pb-0" : "pb-24 lg:pb-0"}>
        <Outlet />
      </main>

      {location.pathname !== "/ai-design" && (
        <nav className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 flex items-center justify-around rounded-2xl border border-stone-200 bg-white/95 p-1.5 shadow-[0_12px_40px_rgba(28,25,23,0.16)] backdrop-blur-xl lg:hidden" aria-label="Bottom navigation" data-testid="bottom-navigation">
          <NavItems mobile />
        </nav>
      )}
      <Toaster richColors />
    </div>
  );
}