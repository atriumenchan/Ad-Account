import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, PageHeader, toneFor } from "../components/ui";
import { compact, formatDate, money, roas } from "../lib/format";
import { statusLabel, useStore } from "../lib/store";

export function CampaignDetailPage() {
  const { id = "" } = useParams();
  const { state, setCampaignStatus, setLeadStatus } = useStore();
  const campaign = state.campaigns.find((item) => item.id === id);
  if (!campaign) return <p>Campaign not found. <Link to="/ads" className="text-brand">Back</Link></p>;
  const account = state.accounts.find((item) => item.id === campaign.accountId);
  const leads = state.leads.filter((lead) => lead.campaignId === campaign.id);
  const currency = account?.currency ?? "USD";

  return (
    <div className="space-y-6">
      <PageHeader
        title={campaign.name}
        subtitle={`${account?.name ?? "Account"} · ${campaign.countries.join(", ")} · starts ${formatDate(campaign.startDate, state.locale)}`}
        action={campaign.status === "active"
          ? <Button variant="secondary" onClick={() => setCampaignStatus(campaign.id, "paused")}>Pause</Button>
          : <Button onClick={() => setCampaignStatus(campaign.id, "active")}>Launch</Button>}
      />
      <Badge tone={toneFor(campaign.status)}>{statusLabel(campaign.status)}</Badge>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          ["Daily budget", money(campaign.dailyBudget, currency, state.locale)],
          ["Spend", money(campaign.spend, currency, state.locale)],
          ["Impressions", compact(campaign.impressions, state.locale)],
          ["Clicks", compact(campaign.clicks, state.locale)],
          ["Results", compact(campaign.conversions, state.locale)],
          ["ROAS", roas(campaign.revenue, campaign.spend).toFixed(2)],
        ].map(([label, value]) => (
          <Card key={label}><p className="text-xs text-muted">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></Card>
        ))}
      </div>
      <Card>
        <h2 className="font-semibold">Setup</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">Objective</dt><dd>{campaign.objective}</dd></div>
          <div><dt className="text-muted">End date</dt><dd>{campaign.endDate ? formatDate(campaign.endDate, state.locale) : "None"}</dd></div>
        </dl>
      </Card>
      {campaign.objective === "Leads" ? (
        <Card>
          <h2 className="font-semibold">Leads</h2>
          <div className="mt-3 divide-y divide-line">
            {leads.length === 0 ? <p className="text-sm text-muted">No leads yet.</p> : leads.map((lead) => (
              <div key={lead.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div><p className="font-medium">{lead.name}</p><p className="text-xs text-muted">{lead.email}</p></div>
                <select value={lead.status} onChange={(event) => setLeadStatus(lead.id, event.target.value as "new" | "contacted")} className="h-9 rounded-lg border border-line px-2 text-xs">
                  <option value="new">new</option>
                  <option value="contacted">contacted</option>
                </select>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
