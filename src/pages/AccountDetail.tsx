import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Bars, Button, Card, Field, Modal, PageHeader, TextArea, TextInput, toneFor } from "../components/ui";
import { formatDate, money, runwayDays } from "../lib/format";
import { statusLabel, useStore } from "../lib/store";
import type { AccountStatus } from "../types";

export function AccountDetailPage() {
  const { id = "" } = useParams();
  const { state, topUp, clearFunds, renameAccount, appealAccount, markAccountReady, saveAccountEntry } = useStore();
  const account = state.accounts.find((item) => item.id === id);
  const [mode, setMode] = useState<"topup" | "clear" | "rename" | "appeal" | "figures" | null>(null);
  const [amount, setAmount] = useState("500");
  const [name, setName] = useState(account?.name ?? "");
  const [note, setNote] = useState("");
  const [figures, setFigures] = useState({ balance: "", spend7d: "", spend30d: "", revenue30d: "", status: "active" as AccountStatus });
  const [error, setError] = useState<string | null>(null);
  if (!account) return <p>Account not found. <Link to="/accounts" className="text-brand">Back</Link></p>;
  const campaigns = state.campaigns.filter((campaign) => campaign.accountId === account.id);
  const series = Array.from({ length: 14 }, (_, index) => Math.round((account.spend7d / 7) * (0.55 + ((index * 3) % 7) / 10)));

  function close() { setMode(null); setError(null); }

  return (
    <div className="space-y-6">
      <PageHeader
        title={account.name}
        subtitle={`${account.platform} · ${account.page} · ${account.timezone}`}
        action={<div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => { setFigures({ balance: String(account.balance), spend7d: String(account.spend7d), spend30d: String(account.spend30d), revenue30d: String(account.revenue30d), status: account.status }); setMode("figures"); }}>Edit entry</Button>
          <Button variant="secondary" onClick={() => { setName(account.name); setMode("rename"); }}>Rename</Button>
          <Button variant="secondary" onClick={() => setMode("clear")}>Clear funds</Button>
          {account.status === "restricted" ? <Button variant="danger" onClick={() => setMode("appeal")}>Appeal</Button> : null}
          {account.status === "pending" || account.status === "in_review" ? <Button variant="secondary" onClick={() => markAccountReady(account.id)}>Mark ready</Button> : null}
          <Button onClick={() => setMode("topup")}>Top up</Button>
        </div>}
      />
      <div className="flex items-center gap-2">
        <Badge tone={toneFor(account.status)}>{statusLabel(account.status)}</Badge>
        {account.appeal ? <span className="text-xs text-muted">Appeal filed</span> : null}
        <span className="text-xs text-muted">Opened {formatDate(account.createdAt, state.locale)}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <Card><p className="text-xs text-muted">Balance</p><p className="mt-1 text-xl font-semibold">{money(account.balance, account.currency, state.locale)}</p></Card>
        <Card><p className="text-xs text-muted">7 day spend</p><p className="mt-1 text-xl font-semibold">{money(account.spend7d, account.currency, state.locale)}</p></Card>
        <Card><p className="text-xs text-muted">30 day ROAS</p><p className="mt-1 text-xl font-semibold">{account.spend30d ? (account.revenue30d / account.spend30d).toFixed(2) : "—"}</p></Card>
        <Card><p className="text-xs text-muted">Runway</p><p className="mt-1 text-xl font-semibold">{account.spend7d ? `${runwayDays(account.balance, account.spend7d).toFixed(1)} days` : "—"}</p></Card>
      </div>
      <Card>
        <h2 className="mb-3 font-semibold">Spend by day</h2>
        <Bars values={series} />
      </Card>
      {account.appeal ? <Card><h2 className="font-semibold">Appeal</h2><p className="mt-2 text-sm text-muted">{account.appeal}</p></Card> : null}
      <Card>
        <h2 className="font-semibold">Campaigns</h2>
        <div className="mt-3 divide-y divide-line">
          {campaigns.length === 0 ? <p className="text-sm text-muted">No campaigns on this account yet.</p> : campaigns.map((campaign) => (
            <Link key={campaign.id} to={`/ads/${campaign.id}`} className="flex items-center justify-between py-2 text-sm">
              <span>{campaign.name}</span>
              <Badge tone={toneFor(campaign.status)}>{statusLabel(campaign.status)}</Badge>
            </Link>
          ))}
        </div>
      </Card>
      {mode ? (
        <Modal title={mode === "topup" ? "Top up" : mode === "clear" ? "Clear funds" : mode === "rename" ? "Rename account" : mode === "figures" ? "Edit entry" : "Appeal restriction"} onClose={close}>
          <form className="space-y-3" onSubmit={(event) => {
            event.preventDefault();
            const message = mode === "topup"
              ? topUp(account.id, Number(amount))
              : mode === "clear"
                ? clearFunds(account.id, Number(amount))
                : mode === "rename"
                  ? renameAccount(account.id, name)
                  : mode === "figures"
                    ? saveAccountEntry(account.id, {
                      balance: Number(figures.balance),
                      spend7d: Number(figures.spend7d),
                      spend30d: Number(figures.spend30d),
                      revenue30d: Number(figures.revenue30d),
                      status: figures.status,
                    })
                    : appealAccount(account.id, note);
            if (message) setError(message);
            else close();
          }}>
            {mode === "topup" || mode === "clear" ? <Field label={`Amount (${account.currency})`}><TextInput type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field> : null}
            {mode === "rename" ? <Field label="Name"><TextInput value={name} onChange={(e) => setName(e.target.value)} /></Field> : null}
            {mode === "appeal" ? <Field label="What should the reviewer know?"><TextArea rows={4} value={note} onChange={(e) => setNote(e.target.value)} /></Field> : null}
            {mode === "figures" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Balance"><TextInput type="number" min="0" value={figures.balance} onChange={(e) => setFigures({ ...figures, balance: e.target.value })} /></Field>
                <Field label="Status">
                  <select value={figures.status} onChange={(e) => setFigures({ ...figures, status: e.target.value as AccountStatus })} className="h-11 w-full rounded-xl border border-line px-3 text-sm">
                    {["active", "paused", "restricted", "pending", "in_review", "disabled"].map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                  </select>
                </Field>
                <Field label="Spend, 7 days"><TextInput type="number" min="0" value={figures.spend7d} onChange={(e) => setFigures({ ...figures, spend7d: e.target.value })} /></Field>
                <Field label="Spend, 30 days"><TextInput type="number" min="0" value={figures.spend30d} onChange={(e) => setFigures({ ...figures, spend30d: e.target.value })} /></Field>
                <Field label="Revenue, 30 days"><TextInput type="number" min="0" value={figures.revenue30d} onChange={(e) => setFigures({ ...figures, revenue30d: e.target.value })} /></Field>
              </div>
            ) : null}
            {error ? <p className="text-sm text-brand">{error}</p> : null}
            <Button type="submit" className="w-full">Save</Button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
