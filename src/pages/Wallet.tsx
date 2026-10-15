import { useMemo, useState } from "react";
import { Badge, Button, Card, Field, Modal, PageHeader, SelectInput, Stat, TextInput, toneFor } from "../components/ui";
import { downloadCsv, formatWhen, money } from "../lib/format";
import { useStore } from "../lib/store";

export function WalletPage() {
  const { state, deposit, withdraw, claimCashback, settleDeposit, addCard, removeCard } = useStore();
  const [mode, setMode] = useState<"deposit" | "withdraw" | "card" | null>(null);
  const [amount, setAmount] = useState("1000");
  const [method, setMethod] = useState<"card" | "bank" | "crypto">("card");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("Visa");
  const [last4, setLast4] = useState("");
  const [exp, setExp] = useState("");
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => state.transactions.filter((tx) => {
    const matchesType = filter === "all" || tx.type === filter;
    const q = search.trim().toLowerCase();
    return matchesType && (!q || tx.description.toLowerCase().includes(q) || tx.method.toLowerCase().includes(q));
  }), [state.transactions, filter, search]);

  function close() {
    setMode(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet"
        subtitle="Fund campaigns from one balance. Card deposits clear immediately. Bank and crypto stay pending until you mark them received."
        action={<div className="flex gap-2"><Button variant="secondary" onClick={() => setMode("withdraw")}>Withdraw</Button><Button onClick={() => setMode("deposit")}>Deposit</Button></div>}
      />
      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="Available" value={money(state.wallet.available, "USD", state.locale)} hint="Ready to assign" />
        <Stat label="Pending" value={money(state.wallet.pending, "USD", state.locale)} hint="Waiting to clear" />
        <Stat label="Cashback" value={money(state.wallet.cashback, "USD", state.locale)} hint="Credit it back to the wallet" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => { const message = claimCashback(); if (message) setError(message); }}>Credit cashback</Button>
        <Button variant="secondary" onClick={() => setMode("card")}>Add card</Button>
        {error && !mode ? <p className="self-center text-sm text-brand">{error}</p> : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <Card>
          <h2 className="font-semibold">Cards</h2>
          <div className="mt-3 space-y-2">
            {state.cards.length === 0 ? <p className="text-sm text-muted">No saved cards.</p> : state.cards.map((card) => (
              <div key={card.id} className="rounded-xl border border-line p-3 text-sm">
                <p className="font-medium">{card.brand} ···· {card.last4}</p>
                <p className="text-xs text-muted">Exp {card.exp}</p>
                <button className="mt-2 text-xs text-brand" onClick={() => removeCard(card.id)}>Remove</button>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="mr-auto font-semibold">Transactions</h2>
            <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="h-9 max-w-48" />
            <SelectInput value={filter} onChange={(e) => setFilter(e.target.value)} className="h-9 max-w-40">
              {["all", "deposit", "topup", "withdrawal", "cashback", "fee", "refund"].map((type) => <option key={type} value={type}>{type}</option>)}
            </SelectInput>
            <Button variant="secondary" onClick={() => downloadCsv("wallet.csv", [["Date", "Type", "Description", "Method", "Amount", "Status"], ...rows.map((tx) => [tx.createdAt, tx.type, tx.description, tx.method, String(tx.amount), tx.status])])}>Export</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted"><tr><th className="py-2">When</th><th>Description</th><th>Method</th><th>Status</th><th className="text-right">Amount</th><th></th></tr></thead>
              <tbody>
                {rows.map((tx) => (
                  <tr key={tx.id} className="border-t border-line">
                    <td className="py-2 text-muted">{formatWhen(tx.createdAt, state.locale)}</td>
                    <td>{tx.description}</td>
                    <td>{tx.method}</td>
                    <td><Badge tone={toneFor(tx.status)}>{tx.status}</Badge></td>
                    <td className="text-right">{money(tx.amount, "USD", state.locale)}</td>
                    <td className="text-right">{tx.status === "pending" && tx.type === "deposit" ? <button className="text-xs font-semibold text-brand" onClick={() => settleDeposit(tx.id)}>Mark received</button> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      {mode === "deposit" || mode === "withdraw" ? (
        <Modal title={mode === "deposit" ? "Deposit" : "Withdraw"} onClose={close}>
          <form className="space-y-3" onSubmit={(event) => {
            event.preventDefault();
            const value = Number(amount);
            const message = mode === "deposit" ? deposit(value, method) : withdraw(value);
            if (message) setError(message);
            else close();
          }}>
            <Field label="Amount (USD)"><TextInput type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
            {mode === "deposit" ? (
              <Field label="Method" hint={method === "card" ? "2.9% processing fee, available immediately." : "Stays pending until you mark it received."}>
                <SelectInput value={method} onChange={(e) => setMethod(e.target.value as "card" | "bank" | "crypto")}>
                  <option value="card">Card</option>
                  <option value="bank">Bank transfer</option>
                  <option value="crypto">Crypto (USDT)</option>
                </SelectInput>
              </Field>
            ) : null}
            {method === "crypto" && mode === "deposit" ? <p className="rounded-xl bg-canvas p-3 text-xs text-muted">Send USDT on Ethereum to 0xA11CE00000000000000000000000000000DEMO. This address is fictional.</p> : null}
            {error ? <p className="text-sm text-brand">{error}</p> : null}
            <Button type="submit" className="w-full">{mode === "deposit" ? "Deposit" : "Withdraw"}</Button>
          </form>
        </Modal>
      ) : null}
      {mode === "card" ? (
        <Modal title="Add card" onClose={close}>
          <form className="space-y-3" onSubmit={(event) => {
            event.preventDefault();
            const message = addCard(brand, last4, exp);
            if (message) setError(message);
            else close();
          }}>
            <Field label="Brand"><SelectInput value={brand} onChange={(e) => setBrand(e.target.value)}><option>Visa</option><option>Mastercard</option><option>Amex</option></SelectInput></Field>
            <Field label="Last 4"><TextInput value={last4} onChange={(e) => setLast4(e.target.value)} placeholder="4242" maxLength={4} /></Field>
            <Field label="Expiry"><TextInput value={exp} onChange={(e) => setExp(e.target.value)} placeholder="08/28" /></Field>
            {error ? <p className="text-sm text-brand">{error}</p> : null}
            <Button type="submit" className="w-full">Save card</Button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
