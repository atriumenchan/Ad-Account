import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Field, TextInput } from "../components/ui";
import { HARDCODED_LOGINS } from "../lib/hardcoded";
import { useStore } from "../lib/store";

const admin = HARDCODED_LOGINS[0];

export function LoginPage() {
  const { login } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>(admin.email);
  const [password, setPassword] = useState<string>(admin.password);
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(nextEmail = email, nextPassword = password) {
    setEmail(nextEmail);
    setPassword(nextPassword);
    setBusy(true);
    setError(null);
    const message = await login(nextEmail, nextPassword);
    setBusy(false);
    if (message) setError(message);
    else navigate("/");
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <h1 className="text-center text-3xl font-semibold tracking-tight">Log in to your account</h1>
      <div className="grid grid-cols-2 gap-2">
        {HARDCODED_LOGINS.map((account) => (
          <button
            key={account.email}
            type="button"
            className="rounded-xl border border-line px-3 py-2 text-left hover:border-ink"
            onClick={() => void submit(account.email, account.password)}
            disabled={busy}
          >
            <span className="block text-sm font-semibold">{account.label}</span>
            <span className="block truncate text-xs text-muted">{account.email}</span>
            <span className="block text-xs text-muted">{account.password}</span>
          </button>
        ))}
      </div>
      <Field label="Email">
        <TextInput type="email" required placeholder="name@company.com" value={email} onChange={(event) => setEmail(event.target.value)} />
      </Field>
      <Field label="Password">
        <div className="relative">
          <TextInput type={show ? "text" : "password"} required placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted" onClick={() => setShow((value) => !value)}>{show ? "Hide" : "Show"}</button>
        </div>
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="accent-brand" />
        Remember me on this device
      </label>
      {error ? <p className="text-sm text-brand">{error}</p> : null}
      <Button type="submit" className="h-12 w-full" disabled={busy}>{busy ? "Signing in…" : "Log in"}</Button>
      <Button variant="secondary" className="h-12 w-full" onClick={() => navigate("/magic")}>
        <Sparkles size={16} /> Password free login
      </Button>
      <p className="text-center text-sm"><Link to="/forgot" className="text-muted hover:text-ink">Forgot password</Link></p>
      <p className="text-center text-sm text-muted">No account yet? <Link to="/signup" className="font-semibold text-brand">Sign up</Link></p>
      <p className="text-center text-xs leading-5 text-muted">
        By continuing, you agree to the <Link to="/terms" className="underline">Terms and Conditions</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </form>
  );
}
