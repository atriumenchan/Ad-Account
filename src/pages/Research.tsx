import { useMemo, useState } from "react";
import { Button, Card, PageHeader, SelectInput, TextInput } from "../components/ui";
import { useStore } from "../lib/store";
import type { Platform } from "../types";

export function ResearchPage() {
  const { state, toggleBenchmark } = useStore();
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [active, setActive] = useState<string | null>(state.benchmarks[0]?.id ?? null);
  const rows = useMemo(() => state.benchmarks.filter((item) => {
    const q = query.trim().toLowerCase();
    return (platform === "all" || item.platform === platform) && (!savedOnly || item.saved) && (!q || `${item.advertiser} ${item.headline} ${item.hook}`.toLowerCase().includes(q));
  }), [state.benchmarks, query, platform, savedOnly]);
  const current = state.benchmarks.find((item) => item.id === active) ?? rows[0];

  return (
    <div className="space-y-5">
      <PageHeader title="Research" subtitle="Search a sample ad library, save the ones worth building from, and read a short read of the hook." />
      <div className="flex flex-wrap gap-2">
        <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ads" className="h-10 max-w-64" />
        <SelectInput value={platform} onChange={(e) => setPlatform(e.target.value)} className="h-10 max-w-40">
          <option value="all">All platforms</option>
          {["Meta", "Google", "TikTok", "Snapchat", "Taboola", "Bing"].map((item) => <option key={item}>{item}</option>)}
        </SelectInput>
        <Button variant={savedOnly ? "primary" : "secondary"} onClick={() => setSavedOnly((value) => !value)}>Saved only</Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-2">
          {rows.length === 0 ? <p className="text-sm text-muted">No ads found.</p> : rows.map((item) => (
            <button key={item.id} onClick={() => setActive(item.id)} className={`w-full rounded-2xl border p-4 text-left ${current?.id === item.id ? "border-ink bg-white" : "border-line bg-white"}`}>
              <p className="text-xs uppercase text-muted">{item.platform} · {item.advertiser} · {item.daysRunning} days</p>
              <p className="mt-1 font-medium">{item.headline}</p>
            </button>
          ))}
        </div>
        {current ? (
          <Card>
            <p className="text-xs uppercase text-muted">{current.platform as Platform}</p>
            <h2 className="mt-1 text-lg font-semibold">{current.headline}</h2>
            <p className="mt-2 text-sm text-muted">{current.hook}</p>
            <div className="mt-4 rounded-xl bg-canvas p-3 text-sm">
              <p className="font-medium">Analysis</p>
              <p className="mt-1 text-muted">The opening states the job to be done before the product name. It has run {current.daysRunning} days, which is long enough to treat the structure as a reference, not a one-off. Rebuild the first two seconds with your own product in hand.</p>
            </div>
            <Button className="mt-4" variant={current.saved ? "secondary" : "primary"} onClick={() => toggleBenchmark(current.id)}>{current.saved ? "Remove benchmark" : "Save benchmark"}</Button>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
