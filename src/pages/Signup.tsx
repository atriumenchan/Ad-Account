import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Field, TextInput } from "../components/ui";
import { useStore } from "../lib/store";

export function SignupPage() {
  const { signup } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const strong = useMemo(() => /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && password.length >= 10, [password]);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void signup({ email, name, phone, password }).then((message) => {
          if (message) setError(message);
          else navigate("/");
        });
      }}
    >
      <h1 className="text-center text-3xl font-semibold tracking-tight">Create your account</h1>
      <Field label="Email"><TextInput type="email" required placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Field label="Full Name"><TextInput required placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Phone Number"><TextInput required placeholder="(201) 555-0123" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
      <Field label="Password" hint="Use at least 10 characters, including a lowercase letter, an uppercase letter, and a number.">
        <div className="relative">
          <TextInput type={show ? "text" : "password"} required placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted" onClick={() => setShow((v) => !v)}>{show ? "Hide" : "Show"}</button>
        </div>
      </Field>
      {error ? <p className="text-sm text-brand">{error}</p> : null}
      <Button type="submit" className="h-12 w-full" disabled={!strong || !email || !name || !phone}>Sign up</Button>
      <p className="text-center text-sm text-muted">Already have an account? <Link to="/login" className="font-semibold text-brand">Log in</Link></p>
    </form>
  );
}
