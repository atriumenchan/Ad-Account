import { useState } from "react";
import { Badge, Card, PageHeader, Stat, toneFor } from "../components/ui";
import { formatDate, money } from "../lib/format";
import { useStore } from "../lib/store";

export function AffiliatePage() {
  const { state } = useStore();
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/signup?ref=${state.affiliate.code}`;
  const commission = state.affiliate.spendReferred * state.affiliate.rate;

  return (
    <div className="space-y-5">
      <PageHeader title="Affiliate" subtitle="Share a referral link. Commission here is calculated from the sample referred spend." />
      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Clicks" value={String(state.affiliate.clicks)} />
        <Stat label="Signups" value={String(state.affiliate.signups)} />
        <Stat label="Referred spend" value={money(state.affiliate.spendReferred, "USD", state.locale)} />
        <Stat label="Commission" value={money(commission, "USD", state.locale)} hint={`${Math.round(state.affiliate.rate * 100)}% of referred spend`} />
      </div>
      <Card>
        <p className="text-sm font-medium">Your link</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <code className="flex-1 rounded-xl bg-canvas px-3 py-2 text-sm">{link}</code>
          <button className="rounded-xl bg-ink px-4 text-sm font-semibold text-white" onClick={() => { navigator.clipboard.writeText(link); setCopied(true); }}>{copied ? "Copied" : "Copy"}</button>
        </div>
        <p className="mt-2 text-xs text-muted">Code {state.affiliate.code}</p>
      </Card>
      <Card>
        <h2 className="font-semibold">Payouts</h2>
        <div className="mt-3 divide-y divide-line">
          {state.affiliate.payouts.map((payout) => (
            <div key={payout.id} className="flex items-center justify-between py-2 text-sm">
              <span>{formatDate(payout.at, state.locale)}</span>
              <span>{money(payout.amount, "USD", state.locale)}</span>
              <Badge tone={toneFor(payout.status)}>{payout.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
