import { useState } from "react";
import { Badge, Button, Card, Field, PageHeader, TextInput, toneFor } from "../components/ui";
import { compact, formatWhen } from "../lib/format";
import { useStore } from "../lib/store";

export function PixelPage() {
  const { state, setPixelDomain, verifyPixel, sendTestEvent, toggleDestination } = useStore();
  const [domain, setDomain] = useState(state.pixel.domain);
  const snippet = `<script src="https://px.admexo.local/p.js" data-id="${state.pixel.id}"></script>`;

  return (
    <div className="space-y-6">
      <PageHeader title="Pixel" subtitle="Install the snippet, confirm the domain, and see which destinations accepted events." action={<Button onClick={sendTestEvent}>Send test event</Button>} />
      <div className="grid gap-4 lg:grid-cols-3">
        {["Install the snippet", "Add the domain", "Check it is working"].map((step, index) => (
          <Card key={step}><p className="text-xs text-muted">Step {index + 1}</p><p className="mt-1 font-medium">{step}</p></Card>
        ))}
      </div>
      <Card>
        <h2 className="font-semibold">Snippet</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-ink p-3 text-xs text-white">{snippet}</pre>
        <Button variant="secondary" className="mt-3" onClick={() => navigator.clipboard.writeText(snippet)}>Copy snippet</Button>
      </Card>
      <Card>
        <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); setPixelDomain(domain); }}>
          <Field label="Domain"><TextInput value={domain} onChange={(e) => setDomain(e.target.value)} /></Field>
          <Button type="submit" variant="secondary">Save domain</Button>
          <Button type="button" onClick={verifyPixel} disabled={state.pixel.verified}> {state.pixel.verified ? "Verified" : "Mark verified"}</Button>
        </form>
        <p className="mt-2 text-xs text-muted">{state.pixel.verified ? `${state.pixel.domain} is receiving events.` : "Saving a new domain clears verification until you check it again."}</p>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Events</h2>
          <div className="mt-3 divide-y divide-line">
            {state.pixel.events.map((event) => (
              <div key={event.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{event.name}</p>
                  <p className="text-xs text-muted">Last seen {formatWhen(event.lastSeen, state.locale)}</p>
                </div>
                <div className="text-right">
                  <p>{compact(event.count24h, state.locale)}</p>
                  <Badge tone={event.healthy ? "good" : "warn"}>{event.healthy ? "healthy" : "quiet"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Destinations</h2>
          <div className="mt-3 space-y-3">
            {state.pixel.destinations.map((dest) => (
              <div key={dest.id} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3">
                <div>
                  <p className="text-sm font-medium">{dest.name}</p>
                  <p className="text-xs text-muted">{dest.connected ? `${Math.round(dest.successRate * 100)}% accepted` : "Not connected"}</p>
                </div>
                <Button variant={dest.connected ? "secondary" : "primary"} onClick={() => toggleDestination(dest.id)}>{dest.connected ? "Disconnect" : "Connect"}</Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <p className="text-xs text-muted">Status chip: <Badge tone={toneFor(state.pixel.verified ? "completed" : "pending")}>{state.pixel.verified ? "live" : "setup"}</Badge></p>
    </div>
  );
}
