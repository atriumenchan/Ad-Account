import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, Button, PageHeader, SelectInput, TextInput, toneFor } from "../components/ui";
import { money, roas } from "../lib/format";
import { statusLabel, useStore } from "../lib/store";

export function AdsPage() {
  const { state, accountsInScope, setCampaignStatus } = useStore();
  const navigate = useNavigate();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const scoped = new Set(accountsInScope().map((account) => account.id));
  const rows = useMemo(() => state.campaigns.filter((campaign) => {
    const q = search.trim().toLowerCase();
    return scoped.has(campaign.accountId) && (status === "all" || campaign.status === status) && (!q || campaign.name.toLowerCase().includes(q));
  }), [state.campaigns, scoped, status, search]);

  return (
    <div className="space-y-5">
      <PageHeader title="Ads Manager" subtitle="Build, pause, and review campaigns across the accounts in this workspace." action={<Button onClick={() => navigate("/ads/new")}>Create campaign</Button>} />
      <div className="flex flex-wrap gap-2">
        <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search campaigns" className="h-10 max-w-64" />
        <SelectInput value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 max-w-44">
          {["all", "active", "paused", "draft", "in_review", "rejected"].map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
        </SelectInput>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-xs uppercase text-muted">
            <tr><th className="px-4 py-3">Campaign</th><th>Objective</th><th>Status</th><th className="text-right">Daily</th><th className="text-right">Spend</th><th className="text-right">ROAS</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((campaign) => {
              const account = state.accounts.find((item) => item.id === campaign.accountId);
              return (
                <tr key={campaign.id} className="border-t border-line">
                  <td className="px-4 py-3"><Link className="font-medium hover:text-brand" to={`/ads/${campaign.id}`}>{campaign.name}</Link><p className="text-xs text-muted">{account?.name}</p></td>
                  <td>{campaign.objective}</td>
                  <td><Badge tone={toneFor(campaign.status)}>{statusLabel(campaign.status)}</Badge></td>
                  <td className="text-right">{money(campaign.dailyBudget, account?.currency ?? "USD", state.locale)}</td>
                  <td className="text-right">{money(campaign.spend, account?.currency ?? "USD", state.locale)}</td>
                  <td className="text-right">{roas(campaign.revenue, campaign.spend).toFixed(2)}</td>
                  <td className="px-4 text-right">
                    {campaign.status === "active" ? <button className="text-xs font-semibold text-brand" onClick={() => setCampaignStatus(campaign.id, "paused")}>Pause</button> : null}
                    {campaign.status === "paused" || campaign.status === "draft" ? <button className="text-xs font-semibold text-brand" onClick={() => setCampaignStatus(campaign.id, "active")}>Launch</button> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="px-4 py-8 text-center text-sm text-muted">No campaigns match.</p> : null}
      </div>
    </div>
  );
}
