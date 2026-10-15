import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Field, TextInput } from "../components/ui";
import { useStore } from "../lib/store";

export function LoginPage() {
  const { login } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    const message = await login(email, password);
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
