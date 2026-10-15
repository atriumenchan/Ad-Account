import { useMemo, useState } from "react";
import { Button, Card, Field, PageHeader, Tabs, TextArea, TextInput } from "../components/ui";
import { money, roas } from "../lib/format";
import { useStore } from "../lib/store";

export function IntelligencePage() {
  const { state, accountsInScope, applyMove, saveReport, deleteReport } = useStore();
  const [tab, setTab] = useState("overview");
  const [name, setName] = useState("Monday readout");
  const [summary, setSummary] = useState("");
  const accounts = accountsInScope();
  const ids = new Set(accounts.map((account) => account.id));
  const campaigns = state.campaigns.filter((campaign) => ids.has(campaign.accountId));
  const totals = useMemo(() => {
    const spend = accounts.reduce((sum, account) => sum + account.spend30d, 0);
    const revenue = accounts.reduce((sum, account) => sum + account.revenue30d, 0);
    return { spend, revenue, value: roas(revenue, spend) };
  }, [accounts]);
  const storeRevenue = totals.revenue * 1.12;

  return (
    <div className="space-y-5">
      <PageHeader title="Intelligence" subtitle="Spend, attribution, audience pressure, and the budget moves waiting for a confirm." />
      <Tabs tabs={["overview", "attribution", "audiences", "moves", "reports"]} value={tab} onChange={setTab} />
      {tab === "overview" ? (
        <div className="grid gap-3 md:grid-cols-3">
          <Card><p className="text-xs text-muted">30 day spend</p><p className="mt-1 text-2xl font-semibold">{money(totals.spend, "USD", state.locale)}</p></Card>
          <Card><p className="text-xs text-muted">Reported revenue</p><p className="mt-1 text-2xl font-semibold">{money(totals.revenue, "USD", state.locale)}</p></Card>
          <Card><p className="text-xs text-muted">Blended ROAS</p><p className="mt-1 text-2xl font-semibold">{totals.value.toFixed(2)}</p></Card>
          <Card className="md:col-span-3">
            <h2 className="font-semibold">By account</h2>
            <div className="mt-3 space-y-2">
              {accounts.map((account) => (
                <div key={account.id}>
                  <div className="mb-1 flex justify-between text-sm"><span>{account.name}</span><span>{money(account.spend30d, account.currency, state.locale)}</span></div>
                  <div className="h-2 rounded-full bg-canvas"><div className="h-2 rounded-full bg-brand" style={{ width: `${totals.spend ? Math.min(100, (account.spend30d / totals.spend) * 100) : 0}%` }} /></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
      {tab === "attribution" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Card><p className="text-xs text-muted">Platform-reported revenue</p><p className="mt-1 text-2xl font-semibold">{money(totals.revenue, "USD", state.locale)}</p></Card>
          <Card><p className="text-xs text-muted">Store revenue</p><p className="mt-1 text-2xl font-semibold">{money(storeRevenue, "USD", state.locale)}</p><p className="mt-1 text-xs text-muted">Sample store is 12% higher than platform-reported revenue.</p></Card>
          <Card className="md:col-span-2">
            <h2 className="font-semibold">Credit by channel</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {campaigns.map((campaign) => (
                <li key={campaign.id} className="flex justify-between"><span>{campaign.name}</span><span>{campaign.spend ? `${Math.round((campaign.revenue / Math.max(totals.revenue, 1)) * 100)}%` : "0%"}</span></li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}
      {tab === "audiences" ? (
        <Card>
          <h2 className="font-semibold">Saturation</h2>
          <p className="mt-1 text-sm text-muted">A simple read of spend against results. Higher spend with a weaker ROAS is treated as saturated.</p>
          <div className="mt-4 space-y-3">
            {campaigns.map((campaign) => {
              const value = roas(campaign.revenue, campaign.spend);
              const saturated = campaign.spend > 3000 && value < 1.5;
              return (
                <div key={campaign.id} className="flex items-center justify-between text-sm">
                  <span>{campaign.name}</span>
                  <span className={saturated ? "text-brand" : "text-emerald-700"}>{saturated ? "Saturated" : "Room to spend"} · {value.toFixed(2)} ROAS</span>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}
      {tab === "moves" ? (
        <div className="space-y-3">
          {state.budgetMoves.map((move) => {
            const from = state.campaigns.find((campaign) => campaign.id === move.fromId);
            const to = state.campaigns.find((campaign) => campaign.id === move.toId);
            return (
              <Card key={move.id}>
                <p className="font-medium">Move {money(move.amount, "USD", state.locale)} / day from {from?.name} to {to?.name}</p>
                <p className="mt-1 text-sm text-muted">{move.reason}</p>
                <Button className="mt-3" disabled={move.applied} onClick={() => applyMove(move.id)}>{move.applied ? "Applied" : "Apply move"}</Button>
              </Card>
            );
          })}
        </div>
      ) : null}
      {tab === "reports" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); saveReport(name, "Last 30 days", summary || `Spend ${money(totals.spend)} at ${totals.value.toFixed(2)} ROAS.`); setSummary(""); }}>
              <Field label="Report name"><TextInput value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="Notes"><TextArea rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="What should the team remember?" /></Field>
              <Button type="submit">Save report</Button>
            </form>
          </Card>
          <div className="space-y-3">
            {state.reports.map((report) => (
              <Card key={report.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-xs text-muted">{report.range}</p>
                    <p className="mt-2 text-sm">{report.summary}</p>
                  </div>
                  <button className="text-xs text-brand" onClick={() => deleteReport(report.id)}>Delete</button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
