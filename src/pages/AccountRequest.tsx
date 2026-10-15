import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Field, PageHeader, SelectInput, TextInput } from "../components/ui";
import { useStore } from "../lib/store";
import type { Currency, Platform } from "../types";

const STEPS = ["Platform", "Workspace", "Page", "Name", "Funds", "Review"];

export function AccountRequestPage() {
  const { state, requestAccount } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [platform, setPlatform] = useState<Platform>("Meta");
  const [workspaceId, setWorkspaceId] = useState(state.workspaces[0]?.id ?? "");
  const [page, setPage] = useState("");
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [topUp, setTopUp] = useState("0");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workspace = state.workspaces.find((item) => item.id === workspaceId);

  function next() {
    if (step === 2 && !page.trim()) return setError("Add a page or site.");
    if (step === 3 && name.trim().length < 2) return setError("Name the account.");
    setError(null);
    setStep((value) => value + 1);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Request an account" subtitle="Tell us the platform, who it is for, and whether to reserve a top-up." />
      <div className="flex flex-wrap gap-2">
        {STEPS.map((label, index) => (
          <span key={label} className={`rounded-full px-3 py-1 text-xs font-medium ${index === step ? "bg-ink text-white" : "bg-white text-muted"}`}>{index + 1}. {label}</span>
        ))}
      </div>
      <Card className="space-y-4">
        {step === 0 ? <Field label="Platform"><SelectInput value={platform} onChange={(e) => setPlatform(e.target.value as Platform)}>{["Meta", "Google", "TikTok", "Snapchat", "Taboola", "Bing"].map((item) => <option key={item}>{item}</option>)}</SelectInput></Field> : null}
        {step === 1 ? <Field label="Workspace"><SelectInput value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)}>{state.workspaces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectInput></Field> : null}
        {step === 2 ? <Field label={platform === "Google" || platform === "Bing" || platform === "Taboola" ? "Site" : "Facebook Page or profile"}><TextInput value={page} onChange={(e) => setPage(e.target.value)} placeholder="Northline" /></Field> : null}
        {step === 3 ? <Field label="Account name"><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="US Prospecting 2" /></Field> : null}
        {step === 4 ? (
          <>
            <Field label="Currency"><SelectInput value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}><option>USD</option><option>EUR</option><option>GBP</option></SelectInput></Field>
            <Field label="Reserve a top-up" hint="Optional. Held as pending until the account is marked ready."><TextInput type="number" min="0" value={topUp} onChange={(e) => setTopUp(e.target.value)} /></Field>
          </>
        ) : null}
        {step === 5 ? (
          <div className="space-y-2 text-sm">
            <p><span className="text-muted">Platform</span> · {platform}</p>
            <p><span className="text-muted">Workspace</span> · {workspace?.name}</p>
            <p><span className="text-muted">Page</span> · {page}</p>
            <p><span className="text-muted">Name</span> · {name}</p>
            <p><span className="text-muted">Top-up</span> · {topUp} {currency}</p>
            <label className="flex items-start gap-2 pt-2"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 accent-brand" /> I agree this request is stored only in this browser preview.</label>
          </div>
        ) : null}
        {error ? <p className="text-sm text-brand">{error}</p> : null}
        <div className="flex justify-between">
          <Button variant="secondary" onClick={() => step === 0 ? navigate("/accounts") : setStep((value) => value - 1)}>Back</Button>
          {step < 5 ? <Button onClick={next}>Continue</Button> : (
            <Button disabled={!agree} onClick={() => {
              const message = requestAccount({ platform, workspaceId, name, page, currency, topUp: Number(topUp) || 0 });
              if (message) setError(message);
              else navigate("/accounts");
            }}>Send request</Button>
          )}
        </div>
      </Card>
    </div>
  );
}
