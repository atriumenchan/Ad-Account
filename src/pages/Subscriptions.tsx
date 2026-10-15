import { useState } from "react";
import { Badge, Button, Card, PageHeader, toneFor } from "../components/ui";
import { PLAN_CASHBACK, PLAN_LIMITS, PLAN_PRICE, formatDate, money } from "../lib/format";
import { useStore } from "../lib/store";
import type { PlanId } from "../types";

const PLANS: { id: PlanId; name: string; detail: string }[] = [
  { id: "starter", name: "Starter", detail: "Two live accounts. No cashback." },
  { id: "growth", name: "Growth", detail: "Fifteen accounts, 3% cashback, shared support." },
  { id: "scale", name: "Scale", detail: "Room for a large account book, 7% cashback." },
];

export function SubscriptionsPage() {
  const { state, changePlan } = useStore();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-5">
      <PageHeader title="Subscriptions" subtitle="The plan sets how many accounts you can hold and the cashback rate on cleared deposits." />
      {error ? <p className="text-sm text-brand">{error}</p> : null}
      <div className="grid gap-3 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={state.plan === plan.id ? "border-ink" : ""}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{plan.name}</h2>
              {state.plan === plan.id ? <Badge tone="good">Current</Badge> : null}
            </div>
            <p className="mt-2 text-2xl font-semibold">{money(PLAN_PRICE[plan.id], "USD", state.locale)}<span className="text-sm font-normal text-muted"> / mo</span></p>
            <p className="mt-2 text-sm text-muted">{plan.detail}</p>
            <p className="mt-2 text-xs text-muted">{PLAN_LIMITS[plan.id] === 99 ? "High account limit" : `${PLAN_LIMITS[plan.id]} accounts`} · {Math.round(PLAN_CASHBACK[plan.id] * 100)}% cashback</p>
            <Button className="mt-4" variant={state.plan === plan.id ? "secondary" : "primary"} disabled={state.plan === plan.id} onClick={() => setError(changePlan(plan.id))}>
              {state.plan === plan.id ? "Current plan" : "Switch"}
            </Button>
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="font-semibold">Invoices</h2>
        <div className="mt-3 divide-y divide-line">
          {state.invoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between py-2 text-sm">
              <span>{invoice.plan}</span>
              <span>{formatDate(invoice.issuedAt, state.locale)}</span>
              <span>{money(invoice.amount, "USD", state.locale)}</span>
              <Badge tone={toneFor(invoice.status)}>{invoice.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
