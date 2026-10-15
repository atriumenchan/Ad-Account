import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, Button, Field, Modal, PageHeader, SelectInput, TextInput, toneFor } from "../components/ui";
import { downloadCsv, money, runwayDays } from "../lib/format";
import { statusLabel, useStore } from "../lib/store";
import type { Platform } from "../types";

export function AccountsPage() {
  const { state, accountsInScope, topUp } = useStore();
  const navigate = useNavigate();
  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [topUpId, setTopUpId] = useState<string | null>(null);
  const [amount, setAmount] = useState("500");
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => accountsInScope().filter((account) => {
    const q = search.trim().toLowerCase();
    return (platform === "all" || account.platform === platform) && (status === "all" || account.status === status) && (!q || account.name.toLowerCase().includes(q));
  }), [accountsInScope, platform, status, search]);

  const platforms = ["all", ...new Set(state.accounts.map((account) => account.platform))] as Array<"all" | Platform>;

  return (
    <div className="space-y-5">
      <PageHeader title="Ad accounts" subtitle="Request, top up, and manage accounts in one place." action={<Button onClick={() => navigate("/accounts/new")}>Add account</Button>} />
      <div className="flex flex-wrap gap-2">
        <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search accounts" className="h-10 max-w-64" />
        <SelectInput value={platform} onChange={(e) => setPlatform(e.target.value)} className="h-10 max-w-40">{platforms.map((item) => <option key={item} value={item}>{item}</option>)}</SelectInput>
        <SelectInput value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 max-w-40">
          {["all", "active", "paused", "restricted", "pending", "in_review", "disabled"].map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
        </SelectInput>
        <Button variant="secondary" onClick={() => downloadCsv("accounts.csv", [["Name", "Platform", "Status", "Balance", "Spend 7d"], ...rows.map((a) => [a.name, a.platform, a.status, String(a.balance), String(a.spend7d)])])}>Export</Button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-xs uppercase text-muted">
            <tr><th className="px-4 py-3">Account</th><th>Platform</th><th>Status</th><th className="text-right">Balance</th><th className="text-right">7d spend</th><th className="text-right">Runway</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((account) => {
              const days = runwayDays(account.balance, account.spend7d);
              return (
                <tr key={account.id} className="border-t border-line">
                  <td className="px-4 py-3"><Link to={`/accounts/${account.id}`} className="font-medium hover:text-brand">{account.name}</Link><p className="text-xs text-muted">{account.page}</p></td>
                  <td>{account.platform}</td>
                  <td><Badge tone={toneFor(account.status)}>{statusLabel(account.status)}</Badge></td>
                  <td className="text-right">{money(account.balance, account.currency, state.locale)}</td>
                  <td className="text-right">{money(account.spend7d, account.currency, state.locale)}</td>
                  <td className="text-right">{account.spend7d > 0 ? `${days.toFixed(1)}d` : "—"}</td>
                  <td className="px-4 text-right">
                    <button className="text-xs font-semibold text-brand" onClick={() => { setTopUpId(account.id); setError(null); }}>Top up</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="px-4 py-8 text-center text-sm text-muted">No accounts match these filters.</p> : null}
      </div>
      {topUpId ? (
        <Modal title="Top-up account" onClose={() => setTopUpId(null)}>
          <form className="space-y-3" onSubmit={(event) => {
            event.preventDefault();
            const message = topUp(topUpId, Number(amount));
            if (message) setError(message);
            else setTopUpId(null);
          }}>
            <Field label="Amount in the account currency" hint="Taken from the USD wallet at a fixed preview rate.">
              <TextInput type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            {error ? <p className="text-sm text-brand">{error}</p> : null}
            <Button type="submit" className="w-full">Top up</Button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
