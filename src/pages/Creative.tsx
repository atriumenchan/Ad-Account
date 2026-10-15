import { useMemo, useState } from "react";
import { Badge, Button, Card, Empty, Field, Modal, PageHeader, SelectInput, Tabs, TextInput, toneFor } from "../components/ui";
import { useStore } from "../lib/store";

export function CreativePage() {
  const { state, addCreative, setCreativeStatus, addTag, createBoard, toggleBoardAsset, addProject } = useStore();
  const [tab, setTab] = useState("library");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [tag, setTag] = useState("");
  const [projectName, setProjectName] = useState("");
  const [boardOpen, setBoardOpen] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [boardNote, setBoardNote] = useState("");
  const [brief, setBrief] = useState({ product: "Everyday tote", angle: "Packs flat", kind: "video" as "image" | "video" | "carousel", project: state.projects[0] ?? "General" });
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  const assets = useMemo(() => state.creatives.filter((asset) => {
    const q = query.trim().toLowerCase();
    return (kind === "all" || asset.kind === kind) && (status === "all" || asset.status === status) && (!q || asset.name.toLowerCase().includes(q) || asset.tags.some((item) => item.includes(q)));
  }), [state.creatives, kind, status, query]);
  const current = state.creatives.find((asset) => asset.id === selected);

  return (
    <div className="space-y-5">
      <PageHeader title="Creative" subtitle="Library, boards, a studio brief, and a swipe file of references." />
      <Tabs tabs={["library", "boards", "studio", "discover"]} value={tab} onChange={setTab} />
      {tab === "library" ? (
        <>
          <div className="flex flex-wrap gap-2">
            <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search creatives" className="h-10 max-w-64" />
            <SelectInput value={kind} onChange={(e) => setKind(e.target.value)} className="h-10 max-w-36"><option value="all">all kinds</option><option>image</option><option>video</option><option>carousel</option></SelectInput>
            <SelectInput value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 max-w-36"><option value="all">all statuses</option><option>ready</option><option>draft</option><option>archived</option><option>retired</option></SelectInput>
            <label className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-line bg-white px-4 text-sm font-semibold">
              Upload
              <input type="file" className="hidden" onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const kindGuess = file.type.startsWith("video") ? "video" : "image";
                addCreative({ name: file.name, kind: kindGuess, project: state.projects[0] ?? "General", origin: "uploaded" });
                event.target.value = "";
              }} />
            </label>
          </div>
          {assets.length === 0 ? <Empty title="No creatives match" body="Upload a file or generate one in Studio." /> : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {assets.map((asset) => (
                <button key={asset.id} onClick={() => setSelected(asset.id)} className="rounded-2xl border border-line bg-white p-4 text-left">
                  <div className={`mb-3 h-24 rounded-xl ${asset.kind === "video" ? "bg-ink" : asset.kind === "carousel" ? "bg-slate-200" : "bg-rose-100"}`} />
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{asset.name}</p>
                    <Badge tone={toneFor(asset.status)}>{asset.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">{asset.kind} · {asset.project} · {asset.roas ? `${asset.roas.toFixed(1)} ROAS` : "No delivery yet"}</p>
                </button>
              ))}
            </div>
          )}
        </>
      ) : null}
      {tab === "boards" ? (
        <div className="space-y-3">
          <Button onClick={() => setBoardOpen(true)}>New board</Button>
          {state.boards.map((board) => (
            <Card key={board.id}>
              <h2 className="font-semibold">{board.name}</h2>
              <p className="text-sm text-muted">{board.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {state.creatives.map((asset) => {
                  const on = board.assetIds.includes(asset.id);
                  return <button key={asset.id} onClick={() => toggleBoardAsset(board.id, asset.id)} className={`rounded-full px-3 py-1 text-xs ${on ? "bg-ink text-white" : "bg-canvas"}`}>{asset.name}</button>;
                })}
              </div>
            </Card>
          ))}
        </div>
      ) : null}
      {tab === "studio" ? (
        <Card>
          <h2 className="font-semibold">Generate a draft</h2>
          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(event) => {
            event.preventDefault();
            setBusy(true);
            window.setTimeout(() => {
              addCreative({ name: `${brief.product} · ${brief.angle}`, kind: brief.kind, project: brief.project, origin: "generated" });
              setBusy(false);
              setTab("library");
            }, 700);
          }}>
            <Field label="Product"><TextInput value={brief.product} onChange={(e) => setBrief({ ...brief, product: e.target.value })} /></Field>
            <Field label="Angle"><TextInput value={brief.angle} onChange={(e) => setBrief({ ...brief, angle: e.target.value })} /></Field>
            <Field label="Format"><SelectInput value={brief.kind} onChange={(e) => setBrief({ ...brief, kind: e.target.value as "image" | "video" | "carousel" })}><option value="image">image</option><option value="video">video</option><option value="carousel">carousel</option></SelectInput></Field>
            <Field label="Project"><SelectInput value={brief.project} onChange={(e) => setBrief({ ...brief, project: e.target.value })}>{state.projects.map((project) => <option key={project}>{project}</option>)}</SelectInput></Field>
            <div className="md:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Generating…" : "Generate draft"}</Button></div>
          </form>
          <form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); addProject(projectName); setProjectName(""); }}>
            <TextInput value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="New project name" />
            <Button type="submit" variant="secondary">Add project</Button>
          </form>
        </Card>
      ) : null}
      {tab === "discover" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {state.benchmarks.map((item) => (
            <Card key={item.id}>
              <p className="text-xs uppercase text-muted">{item.platform} · {item.daysRunning} days</p>
              <h2 className="mt-1 font-semibold">{item.advertiser}</h2>
              <p className="mt-2 text-sm">{item.headline}</p>
              <p className="mt-1 text-sm text-muted">{item.hook}</p>
            </Card>
          ))}
        </div>
      ) : null}
      {current ? (
        <Modal title={current.name} onClose={() => setSelected(null)}>
          <div className="space-y-3 text-sm">
            <p className="text-muted">{current.origin} · {current.project}</p>
            <div className="flex flex-wrap gap-1">{current.tags.map((item) => <Badge key={item}>{item}</Badge>)}</div>
            <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); addTag(current.id, tag); setTag(""); }}>
              <TextInput value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Add a tag" />
              <Button type="submit" variant="secondary">Add</Button>
            </form>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setCreativeStatus(current.id, "ready")}>Mark ready</Button>
              <Button variant="secondary" onClick={() => setCreativeStatus(current.id, "archived")}>Archive</Button>
              <Button variant="danger" onClick={() => setCreativeStatus(current.id, "retired")}>Retire</Button>
            </div>
          </div>
        </Modal>
      ) : null}
      {boardOpen ? (
        <Modal title="New board" onClose={() => setBoardOpen(false)}>
          <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); createBoard(boardName, boardNote); setBoardOpen(false); setBoardName(""); setBoardNote(""); }}>
            <Field label="Name"><TextInput value={boardName} onChange={(e) => setBoardName(e.target.value)} /></Field>
            <Field label="Description"><TextInput value={boardNote} onChange={(e) => setBoardNote(e.target.value)} /></Field>
            <Button type="submit" className="w-full">Create board</Button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
