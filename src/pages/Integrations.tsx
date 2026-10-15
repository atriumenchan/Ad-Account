import { Button, Card, PageHeader } from "../components/ui";
import { formatWhen } from "../lib/format";
import { useStore } from "../lib/store";

export function IntegrationsPage() {
  const { state, toggleIntegration } = useStore();
  return (
    <div className="space-y-5">
      <PageHeader title="Integrations" subtitle="Connect the tools this workspace reads. Connections here are switches in local data, not live OAuth." />
      <div className="grid gap-3 md:grid-cols-2">
        {state.integrations.map((item) => (
          <Card key={item.id} className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase text-muted">{item.category}</p>
              <h2 className="font-semibold">{item.name}</h2>
              <p className="mt-1 text-sm text-muted">{item.description}</p>
              <p className="mt-2 text-xs text-muted">{item.lastSync ? `Last sync ${formatWhen(item.lastSync, state.locale)}` : "Not synced"}</p>
            </div>
            <Button variant={item.connected ? "secondary" : "primary"} onClick={() => toggleIntegration(item.id)}>{item.connected ? "Disconnect" : "Connect"}</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
