import { Badge, PageHeader } from "../components/ui";
import { formatDate } from "../lib/format";
import { useStore } from "../lib/store";

export function ChangelogPage() {
  const { state } = useStore();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Changelog" subtitle="What changed in the product structure this preview is modeled on." />
      <ol className="space-y-3">
        {state.changelog.map((entry) => (
          <li key={entry.id} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{entry.tag}</Badge>
              <span className="text-xs text-muted">{formatDate(entry.date, state.locale)}</span>
            </div>
            <h2 className="mt-2 font-semibold">{entry.title}</h2>
            <p className="mt-1 text-sm text-muted">{entry.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
