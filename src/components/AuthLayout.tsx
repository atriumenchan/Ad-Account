import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useStore } from "../lib/store";
import { Logo } from "./Logo";

const SLIDES = [
  { quote: "We fund every account from one wallet and see the same numbers the buyers see.", name: "Mark, CMO at a D2C brand", chips: ["Wallet", "Ad accounts", "Campaigns"] },
  { quote: "Creative, research, and the ads manager finally live in the same place.", name: "Lina, head of growth", chips: ["Creative", "Research", "Intelligence"] },
  { quote: "Spend, ROAS, and store revenue sit on one screen before the Monday meeting.", name: "Owen, finance lead", chips: ["Ad spend", "ROAS", "Revenue"] },
];

const LOCALES = [
  { id: "en", label: "EN English" },
  { id: "de", label: "DE Deutsch" },
  { id: "es", label: "ES Español" },
  { id: "fr", label: "FR Français" },
  { id: "pt", label: "PT Português" },
];

export function AuthLayout() {
  const { state, setLocale } = useStore();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % SLIDES.length), 4200);
    return () => window.clearInterval(timer);
  }, []);
  const slide = SLIDES[index];

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      <div className="flex min-h-screen flex-col px-6 py-8">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          <Logo />
          <div className="flex flex-1 flex-col justify-center py-10">
            <Outlet />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-muted">
            <span>© Admexo 2026</span>
            <select value={state.locale} onChange={(event) => setLocale(event.target.value)} className="bg-transparent text-xs" aria-label="Language">
              {LOCALES.map((locale) => <option key={locale.id} value={locale.id}>{locale.label}</option>)}
            </select>
            <span className="flex gap-3">
              <Link to="/privacy" className="hover:text-ink">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-ink">Terms and Conditions</Link>
            </span>
          </div>
        </div>
      </div>
      <aside className="hidden bg-ink text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <p className="text-sm text-white/60">Admexo Workspace</p>
        <div>
          <p className="max-w-md text-3xl font-semibold leading-snug">“{slide.quote}”</p>
          <p className="mt-4 text-sm text-white/70">— {slide.name}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            {slide.chips.map((chip) => (
              <span key={chip} className="rounded-full border border-white/15 px-3 py-1 text-sm">{chip}</span>
            ))}
          </div>
          <div className="mt-8 flex gap-2">
            {SLIDES.map((item, slideIndex) => (
              <button key={item.name} aria-label={`Show quote ${slideIndex + 1}`} onClick={() => setIndex(slideIndex)} className={`h-1.5 rounded-full ${slideIndex === index ? "w-8 bg-brand" : "w-4 bg-white/30"}`} />
            ))}
          </div>
        </div>
        <p className="text-sm text-white/50">Sample workspace. No live ad platform is connected.</p>
      </aside>
    </div>
  );
}
