import { useState, useEffect } from "react";
import { Camera, Check, ChevronDown, Sparkles } from "lucide-react";

export type BackgroundKey = "A" | "aaa" | "pic8";

export interface ResidenceBackgroundOption {
  key: BackgroundKey;
  src: string;
  title: string;
  subtitle: string;
  tag: string;
}

export const RESIDENCE_BACKGROUNDS: ResidenceBackgroundOption[] = [
  {
    key: "A",
    src: "/images/A.jpg",
    title: "Evening Glow",
    subtitle: "Golden hour sunset over residence blocks",
    tag: "Block Facade",
  },
  {
    key: "aaa",
    src: "/images/aaa.jpg",
    title: "After the Rain",
    subtitle: "Rainbow horizon over Corridor Hills",
    tag: "Campus Sky",
  },
  {
    key: "pic8",
    src: "/images/pic8.jpg",
    title: "After Hours",
    subtitle: "Architectural lighting & nocturnal pathways",
    tag: "Night Campus",
  },
];

interface PlatformBackgroundProps {
  defaultKey: BackgroundKey;
  children?: React.ReactNode;
}

export function PlatformBackground({ defaultKey, children }: PlatformBackgroundProps) {
  const [activeKey, setActiveKey] = useState<BackgroundKey>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ch_platform_backdrop") as BackgroundKey | null;
      if (stored && RESIDENCE_BACKGROUNDS.some((b) => b.key === stored)) {
        return stored;
      }
    }
    return defaultKey;
  });

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Sync if prop changes and user hasn't explicitly set a preference
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ch_platform_backdrop") as BackgroundKey | null;
      if (!stored) {
        setActiveKey(defaultKey);
      }
    }
  }, [defaultKey]);

  const selectBackground = (key: BackgroundKey) => {
    setActiveKey(key);
    if (typeof window !== "undefined") {
      localStorage.setItem("ch_platform_backdrop", key);
    }
    setMenuOpen(false);
  };

  const current =
    RESIDENCE_BACKGROUNDS.find((b) => b.key === activeKey) || RESIDENCE_BACKGROUNDS[0];

  return (
    <>
      {/* Fixed Full-bleed Architectural Image & Gradient Scrim */}
      <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none select-none bg-[#061325]">
        {/* Render each image layer for instant smooth crossfade */}
        {RESIDENCE_BACKGROUNDS.map((bg) => (
          <img
            key={bg.key}
            src={bg.src}
            alt={bg.title}
            className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ease-out ${
              bg.key === activeKey
                ? "opacity-60 scale-100 filter brightness-[0.72] contrast-[1.08]"
                : "opacity-0 scale-105 pointer-events-none"
            }`}
            loading="eager"
            decoding="async"
          />
        ))}

        {/* Cinematic Multi-Stop Scrim: Keeps sky/rooflines visible while ensuring AAA text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#061325]/85 via-[#061325]/65 to-[#061325]/95" />

        {/* Ambient TUT Institutional Accents */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[500px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0, 80, 160, 0.32) 0%, rgba(16, 160, 128, 0.14) 50%, transparent 75%)",
            filter: "blur(60px)",
          }}
        />

        {/* Radial Edge Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(6,19,37,0.85)_100%)] pointer-events-none" />
      </div>

      {/* Floating Backdrop Switcher Pill in Top Right / Header */}
      <div className="relative z-30">
        <div className="fixed bottom-6 right-6 hidden md:block">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="group flex items-center gap-2 rounded-full border border-white/15 bg-[#0B1E38]/90 px-3.5 py-1.5 text-xs font-semibold text-slate-300 shadow-xl backdrop-blur-md transition-all hover:border-teal-400/50 hover:bg-[#0E2546] hover:text-white"
              title="Change residence architectural backdrop"
            >
              <Camera className="h-3.5 w-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
              <span>View: {current.title}</span>
              <ChevronDown
                className={`h-3 w-3 text-slate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {menuOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-72 overflow-hidden rounded-2xl border border-white/15 bg-[#0B1E38]/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
                <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-400">
                  Corridor Hills Campus Views
                </div>
                <div className="mt-1 space-y-1">
                  {RESIDENCE_BACKGROUNDS.map((bg) => {
                    const isSelected = bg.key === activeKey;
                    return (
                      <button
                        key={bg.key}
                        type="button"
                        onClick={() => selectBackground(bg.key)}
                        className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors ${
                          isSelected
                            ? "bg-teal-500/20 text-white border border-teal-500/40"
                            : "text-slate-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <img
                          src={bg.src}
                          alt={bg.title}
                          className="h-10 w-14 shrink-0 rounded-lg object-cover border border-white/10"
                        />
                        <div className="flex-1 truncate">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{bg.title}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-teal-400" />}
                          </div>
                          <span className="block truncate text-[10px] text-slate-400">
                            {bg.tag}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {children}
    </>
  );
}
