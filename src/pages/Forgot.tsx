import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Field, TextInput } from "../components/ui";
import { useStore } from "../lib/store";

export function ForgotPage() {
  const { resetPassword } = useStore();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form className="space-y-5" onSubmit={(event) => {
      event.preventDefault();
      void resetPassword(email).then((message) => {
        if (message) setError(message);
        else setSent(true);
      });
    }}>
      <h1 className="text-center text-3xl font-semibold tracking-tight">Reset your password</h1>
      <p className="text-center text-sm text-muted">We will email a reset link for this Admexo Workspace account.</p>
      <Field label="Email"><TextInput type="email" required placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      {error ? <p className="text-sm text-brand">{error}</p> : null}
      {sent ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Reset link sent to {email}.</p> : null}
      <Button type="submit" className="h-12 w-full">Send reset link</Button>
      <p className="text-center text-sm"><Link to="/login" className="text-muted">Back to log in</Link></p>
    </form>
  );
}
