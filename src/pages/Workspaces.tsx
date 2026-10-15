import { useState } from "react";
import { Button, Card, Field, PageHeader, SelectInput, TextInput } from "../components/ui";
import { useStore } from "../lib/store";
import type { Currency } from "../types";

export function WorkspacesPage() {
  const { state, createWorkspace, setWorkspace } = useStore();
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <PageHeader title="Workspaces" subtitle="File accounts by market. The switcher in the header filters Home, accounts, and intelligence." />
      <div className="grid gap-3 md:grid-cols-2">
        {state.workspaces.map((workspace) => {
          const count = state.accounts.filter((account) => account.workspaceId === workspace.id).length;
          const active = state.workspaceId === workspace.id;
          return (
            <Card key={workspace.id}>
              <h2 className="font-semibold">{workspace.name}</h2>
              <p className="text-sm text-muted">{workspace.region} · {workspace.currency} · {count} accounts</p>
              <Button className="mt-3" variant={active ? "secondary" : "primary"} onClick={() => setWorkspace(workspace.id)}>{active ? "Viewing" : "Switch to this workspace"}</Button>
            </Card>
          );
        })}
      </div>
      <Card>
        <h2 className="font-semibold">New workspace</h2>
        <form className="mt-3 grid gap-3 md:grid-cols-3" onSubmit={(event) => {
          event.preventDefault();
          const message = createWorkspace(name, region, currency);
          if (message) setError(message);
          else { setName(""); setRegion(""); setError(null); }
        }}>
          <Field label="Name"><TextInput value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Region"><TextInput value={region} onChange={(e) => setRegion(e.target.value)} placeholder="APAC" /></Field>
          <Field label="Currency"><SelectInput value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}><option>USD</option><option>EUR</option><option>GBP</option></SelectInput></Field>
          {error ? <p className="text-sm text-brand md:col-span-3">{error}</p> : null}
          <Button type="submit">Create workspace</Button>
        </form>
      </Card>
    </div>
  );
}
