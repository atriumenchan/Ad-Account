import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Bars, Card, PageHeader, Stat, toneFor } from "../components/ui";
import { formatWhen, money, roas, runwayDays } from "../lib/format";
import { statusLabel, useStore } from "../lib/store";

export function HomePage() {
  const { state, accountsInScope } = useStore();
  const [range, setRange] = useState<"7" | "30" | "90">("30");
  const accounts = accountsInScope();
  const accountIds = new Set(accounts.map((account) => account.id));
  const campaigns = state.campaigns.filter((campaign) => accountIds.has(campaign.accountId));

  const metrics = useMemo(() => {
    const spend = accounts.reduce((sum, account) => sum + (range === "7" ? account.spend7d : range === "30" ? account.spend30d : account.spend30d * 2.6), 0);
    const revenue = accounts.reduce((sum, account) => {
      const ratio = account.spend30d > 0 ? account.spend7d / account.spend30d : 0;
      if (range === "7") return sum + account.revenue30d * ratio;
      if (range === "30") return sum + account.revenue30d;
      return sum + account.revenue30d * 2.4;
    }, 0);
    return { spend, revenue, roas: roas(revenue, spend) };
  }, [accounts, range]);

  const attention = accounts.filter((account) => account.status === "restricted" || account.status === "disabled" || (account.status === "active" && runwayDays(account.balance, account.spend7d) < 3));
  const requests = accounts.filter((account) => account.status === "pending" || account.status === "in_review");
  const series = campaigns.slice(0, 8).map((campaign) => campaign.spend || 40);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good afternoon, ${state.user.name.split(" ")[0]}`}
        subtitle="Accounts, spend, and anything that needs a decision today."
        action={
          <select value={range} onChange={(event) => setRange(event.target.value as "7" | "30" | "90")} className="h-10 rounded-xl border border-line bg-white px-3 text-sm" aria-label="Date range">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        }
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Ad spend" value={money(metrics.spend, "USD", state.locale)} hint={`${range} day window`} />
        <Stat label="Revenue" value={money(metrics.revenue, "USD", state.locale)} hint="Reported from ad platforms" />
        <Stat label="ROAS" value={metrics.roas.toFixed(2)} hint="Revenue divided by spend" />
        <Stat label="Wallet" value={money(state.wallet.available, "USD", state.locale)} hint={`${money(state.wallet.pending, "USD", state.locale)} pending`} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Spend by campaign</h2>
            <Link to="/ads" className="text-sm font-medium text-brand">Ads Manager</Link>
          </div>
          <Bars values={series.length ? series : [1]} />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr><th className="py-2 font-medium">Account</th><th>Platform</th><th>Status</th><th className="text-right">Balance</th><th className="text-right">7d spend</th></tr>
              </thead>
              <tbody>
                {accounts.slice(0, 6).map((account) => (
                  <tr key={account.id} className="border-t border-line">
                    <td className="py-2"><Link to={`/accounts/${account.id}`} className="font-medium hover:text-brand">{account.name}</Link></td>
                    <td>{account.platform}</td>
                    <td><Badge tone={toneFor(account.status)}>{statusLabel(account.status)}</Badge></td>
                    <td className="text-right">{money(account.balance, account.currency, state.locale)}</td>
                    <td className="text-right">{money(account.spend7d, account.currency, state.locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold">Needs attention</h2>
            <div className="mt-3 space-y-2">
              {attention.length === 0 ? <p className="text-sm text-muted">Nothing is blocked.</p> : attention.map((account) => (
                <Link key={account.id} to={`/accounts/${account.id}`} className="block rounded-xl bg-canvas px-3 py-2">
                  <p className="text-sm font-medium">{account.name}</p>
                  <p className="text-xs text-muted">{account.status === "active" ? `${runwayDays(account.balance, account.spend7d).toFixed(1)} days of balance` : statusLabel(account.status)}</p>
                </Link>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="font-semibold">Requests in flight</h2>
            <div className="mt-3 space-y-2">
              {requests.length === 0 ? <p className="text-sm text-muted">No open requests.</p> : requests.map((account) => (
                <Link key={account.id} to={`/accounts/${account.id}`} className="flex items-center justify-between rounded-xl bg-canvas px-3 py-2 text-sm">
                  <span>{account.name}</span>
                  <Badge tone={toneFor(account.status)}>{statusLabel(account.status)}</Badge>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <Card>
        <h2 className="font-semibold">Activity</h2>
        <ul className="mt-3 divide-y divide-line">
          {state.activity.slice(0, 6).map((item) => (
            <li key={item.id} className="flex items-center justify-between py-2 text-sm">
              <span>{item.text}</span>
              <span className="text-xs text-muted">{formatWhen(item.at, state.locale)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
