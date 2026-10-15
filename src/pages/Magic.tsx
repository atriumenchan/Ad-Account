import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Field, TextInput } from "../components/ui";
import { useStore } from "../lib/store";

export function MagicPage() {
  const { sendMagicLink } = useStore();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void sendMagicLink(email).then((message) => {
          if (message) setError(message);
          else setSent(true);
        });
      }}
    >
      <h1 className="text-center text-3xl font-semibold tracking-tight">Password free login</h1>
      <p className="text-center text-sm text-muted">We email you a sign-in link. Open it on this device to enter the workspace.</p>
      <Field label="Email"><TextInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" /></Field>
      {error ? <p className="text-sm text-brand">{error}</p> : null}
      {sent ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Sign-in link sent to {email}.</p> : <Button type="submit" className="h-12 w-full">Email me a link</Button>}
      <p className="text-center text-sm"><Link to="/login" className="text-muted">Use a password instead</Link></p>
    </form>
  );
}
