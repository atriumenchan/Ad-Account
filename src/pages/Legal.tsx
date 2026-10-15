import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";

export function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const title = kind === "terms" ? "Terms and Conditions" : "Privacy Policy";
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Logo />
        <Link to="/login" className="text-sm font-medium text-brand">Log in</Link>
      </header>
      <article className="mx-auto max-w-3xl space-y-4 px-6 py-8 text-sm leading-6 text-slate-700">
        <h1 className="text-3xl font-semibold text-ink">{title}</h1>
        <p>Admexo Workspace stores account, wallet, and campaign data in your browser only. It does not send data to Meta, Google, TikTok, or any payment network.</p>
        <p>Sample balances, creatives, and reports are fictional. Actions such as deposits, top-ups, appeals, and campaign launches change that local data so you can walk the product structure.</p>
        <p>Do not enter real card numbers, passwords you use elsewhere, or customer lists. The password field is checked for length and shape, then discarded.</p>
        {kind === "privacy" ? <p>Clear the workspace from Settings, or remove the site data for this origin, to delete the saved preview.</p> : <p>Admexo Workspace is an internal tool for planning account, wallet, and campaign work. Platform connections in this build are simulated.</p>}
      </article>
    </div>
  );
}
