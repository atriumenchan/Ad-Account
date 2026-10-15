import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Field, Modal, PageHeader, SelectInput, TextInput } from "../components/ui";
import { money } from "../lib/format";
import { useStore } from "../lib/store";

export function LauncherPage() {
  const { state, launchTemplate } = useStore();
  const navigate = useNavigate();
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState(state.accounts.find((a) => a.status === "active")?.id ?? "");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ready = state.accounts.filter((account) => account.status === "active" || account.status === "paused");
  const template = state.templates.find((item) => item.id === templateId);

  return (
    <div className="space-y-6">
      <PageHeader title="Launcher" subtitle="Start from a saved setup and put it on an account that is ready to spend." />
      <div className="grid gap-3 md:grid-cols-2">
        {state.templates.map((item) => (
          <Card key={item.id}>
            <p className="text-xs font-medium uppercase text-muted">{item.platform} · {item.objective}</p>
            <h2 className="mt-1 font-semibold">{item.name}</h2>
            <p className="mt-2 text-sm text-muted">{item.notes}</p>
            <p className="mt-3 text-sm">Suggested {money(item.dailyBudget, "USD", state.locale)} / day</p>
            <Button className="mt-4" onClick={() => { setTemplateId(item.id); setName(item.name); setError(null); }}>Launch</Button>
          </Card>
        ))}
      </div>
      {template ? (
        <Modal title={`Launch ${template.name}`} onClose={() => setTemplateId(null)}>
          <form className="space-y-3" onSubmit={(event) => {
            event.preventDefault();
            const message = launchTemplate(template.id, accountId, name);
            if (message) setError(message);
            else navigate("/ads");
          }}>
            <Field label="Campaign name"><TextInput value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Ad account"><SelectInput value={accountId} onChange={(e) => setAccountId(e.target.value)}>{ready.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</SelectInput></Field>
            {error ? <p className="text-sm text-brand">{error}</p> : null}
            <Button type="submit" className="w-full">Launch to ad account</Button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
