import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Field, PageHeader, SelectInput, TextInput } from "../components/ui";
import { useStore } from "../lib/store";
import type { Objective } from "../types";

const STEPS = ["Account", "Setup", "Audience", "Creative", "Review"];

export function CampaignFormPage() {
  const { state, createCampaign } = useStore();
  const navigate = useNavigate();
  const ready = state.accounts.filter((account) => account.status === "active" || account.status === "paused");
  const [step, setStep] = useState(0);
  const [accountId, setAccountId] = useState(ready[0]?.id ?? "");
  const [name, setName] = useState("");
  const [objective, setObjective] = useState<Objective>("Sales");
  const [budget, setBudget] = useState("200");
  const [countries, setCountries] = useState("United States");
  const [start, setStart] = useState("2026-10-16");
  const [creativeId, setCreativeId] = useState(state.creatives.find((item) => item.status === "ready")?.id ?? "");
  const account = state.accounts.find((item) => item.id === accountId);
  const creative = state.creatives.find((item) => item.id === creativeId);

  function launch(status: "draft" | "active") {
    if (!accountId || name.trim().length < 2) return;
    const id = createCampaign({
      accountId,
      name: name.trim(),
      objective,
      status,
      dailyBudget: Number(budget) || 0,
      countries: countries.split(",").map((item) => item.trim()).filter(Boolean),
      startDate: start,
      endDate: null,
    });
    if (id) navigate(`/ads/${id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="New campaign" subtitle="Admins enter the campaign here. It is saved to Supabase with the rest of the workspace." />
      <div className="flex flex-wrap gap-2">{STEPS.map((label, index) => <span key={label} className={`rounded-full px-3 py-1 text-xs font-medium ${index === step ? "bg-ink text-white" : "bg-white text-muted"}`}>{label}</span>)}</div>
      <Card className="space-y-4">
        {step === 0 ? <Field label="Ad account"><SelectInput value={accountId} onChange={(e) => setAccountId(e.target.value)}>{ready.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.platform}</option>)}</SelectInput></Field> : null}
        {step === 1 ? (
          <>
            <Field label="Name"><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Prospecting · spring" /></Field>
            <Field label="Objective"><SelectInput value={objective} onChange={(e) => setObjective(e.target.value as Objective)}><option>Sales</option><option>Leads</option><option>Traffic</option><option>Awareness</option></SelectInput></Field>
            <Field label={`Daily budget (${account?.currency ?? "USD"})`}><TextInput type="number" min="1" value={budget} onChange={(e) => setBudget(e.target.value)} /></Field>
            <Field label="Start date"><TextInput type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
          </>
        ) : null}
        {step === 2 ? <Field label="Countries" hint="Comma separated."><TextInput value={countries} onChange={(e) => setCountries(e.target.value)} /></Field> : null}
        {step === 3 ? <Field label="Creative"><SelectInput value={creativeId} onChange={(e) => setCreativeId(e.target.value)}>{state.creatives.filter((item) => item.status === "ready" || item.status === "draft").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectInput></Field> : null}
        {step === 4 ? (
          <div className="space-y-1 text-sm">
            <p>{name || "Untitled"} · {objective}</p>
            <p className="text-muted">{account?.name} · {budget}/day · {countries}</p>
            <p className="text-muted">Creative · {creative?.name ?? "None"}</p>
          </div>
        ) : null}
        <div className="flex justify-between">
          <Button variant="secondary" onClick={() => step === 0 ? navigate("/ads") : setStep((v) => v - 1)}>Back</Button>
          {step < 4 ? <Button onClick={() => setStep((v) => v + 1)} disabled={step === 1 && name.trim().length < 2}>Continue</Button> : (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => launch("draft")}>Save draft</Button>
              <Button onClick={() => launch("active")}>Launch</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
