import { useState } from "react";
import { Button, Card, PageHeader } from "../components/ui";
import { useStore } from "../lib/store";

const PROMPTS = [
  "How is spend looking?",
  "Which creative is working?",
  "Any restricted accounts?",
  "Pause Prospecting · Broad US",
  "Top up US Prospecting",
];

export function AiPage() {
  const { state, sendAi, resolveApproval } = useStore();
  const [text, setText] = useState("");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col">
      <PageHeader title="Admexo AI" subtitle="Ask in plain language. Pauses and top-ups stay as drafts until you approve them." />
      <div className="mt-4 flex flex-wrap gap-2">
        {PROMPTS.map((prompt) => (
          <button key={prompt} className="rounded-full border border-line bg-white px-3 py-1 text-xs" onClick={() => sendAi(prompt)}>{prompt}</button>
        ))}
      </div>
      <div className="mt-4 flex-1 space-y-3">
        {state.ai.map((message) => (
          <div key={message.id} className={message.role === "user" ? "ml-auto max-w-[80%] rounded-2xl bg-ink px-4 py-3 text-sm text-white" : "max-w-[80%]"}>
            {message.role === "assistant" ? (
              <Card>
                <p className="text-sm">{message.text}</p>
                {message.approval && message.approval.status === "pending" ? (
                  <div className="mt-3 flex gap-2">
                    <Button onClick={() => resolveApproval(message.id, true)}>Approve</Button>
                    <Button variant="secondary" onClick={() => resolveApproval(message.id, false)}>Dismiss</Button>
                  </div>
                ) : null}
                {message.approval && message.approval.status !== "pending" ? <p className="mt-2 text-xs uppercase text-muted">{message.approval.status}</p> : null}
              </Card>
            ) : message.text}
          </div>
        ))}
      </div>
      <form className="sticky bottom-0 mt-4 flex gap-2 bg-canvas py-3" onSubmit={(event) => { event.preventDefault(); sendAi(text); setText(""); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about an account, campaign, or the wallet" className="h-12 flex-1 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-brand" />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}
