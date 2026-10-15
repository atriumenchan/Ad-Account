import { useState } from "react";
import { Button, Card, Field, PageHeader, SelectInput, Tabs, TextInput } from "../components/ui";
import { useStore } from "../lib/store";
import type { Role } from "../types";

export function SettingsPage() {
  const { state, updateProfile, updateCompany, inviteMember, removeMember, setPref, setLocale, resetDemo } = useStore();
  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState(state.user);
  const [company, setCompany] = useState(state.company);
  const [invite, setInvite] = useState({ name: "", email: "", role: "Buyer" as Role });
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Profile, company, team, and the alerts this preview can toggle." />
      <Tabs tabs={["profile", "company", "team", "alerts"]} value={tab} onChange={setTab} />
      {tab === "profile" ? (
        <Card>
          <form className="grid max-w-xl gap-3" onSubmit={(event) => { event.preventDefault(); updateProfile(profile); }}>
            <Field label="Name"><TextInput value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Field>
            <Field label="Email"><TextInput value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></Field>
            <Field label="Phone"><TextInput value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Field>
            <Field label="Language">
              <SelectInput value={state.locale} onChange={(e) => setLocale(e.target.value)}>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="pt">Português</option>
              </SelectInput>
            </Field>
            <Button type="submit">Save profile</Button>
          </form>
        </Card>
      ) : null}
      {tab === "company" ? (
        <Card>
          <form className="grid max-w-xl gap-3" onSubmit={(event) => { event.preventDefault(); updateCompany(company); }}>
            <Field label="Company"><TextInput value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} /></Field>
            <Field label="Website"><TextInput value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })} /></Field>
            <Field label="Country"><TextInput value={company.country} onChange={(e) => setCompany({ ...company, country: e.target.value })} /></Field>
            <Button type="submit">Save company</Button>
          </form>
        </Card>
      ) : null}
      {tab === "team" ? (
        <div className="space-y-4">
          <Card>
            <div className="divide-y divide-line">
              {state.members.map((member) => (
                <div key={member.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <div><p className="font-medium">{member.name}</p><p className="text-xs text-muted">{member.email}</p></div>
                  <span className="text-xs uppercase text-muted">{member.role} · {member.status}</span>
                  {member.role === "Owner" ? null : <button className="text-xs text-brand" onClick={() => setError(removeMember(member.id))}>Remove</button>}
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <form className="grid gap-3 md:grid-cols-4" onSubmit={(event) => {
              event.preventDefault();
              const message = inviteMember(invite.name, invite.email, invite.role);
              setError(message);
              if (!message) setInvite({ name: "", email: "", role: "Buyer" });
            }}>
              <Field label="Name"><TextInput value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} /></Field>
              <Field label="Email"><TextInput value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} /></Field>
              <Field label="Role">
                <SelectInput value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value as Role })}>
                  {["Admin", "Buyer", "Finance", "Viewer"].map((role) => <option key={role}>{role}</option>)}
                </SelectInput>
              </Field>
              <div className="self-end"><Button type="submit">Invite</Button></div>
            </form>
            {error ? <p className="mt-2 text-sm text-brand">{error}</p> : null}
          </Card>
        </div>
      ) : null}
      {tab === "alerts" ? (
        <Card className="max-w-xl space-y-3">
          {([
            ["spend", "Low balance and spend alerts"],
            ["restrictions", "Account restrictions"],
            ["launches", "Campaign launches"],
            ["product", "Product updates"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between text-sm">
              {label}
              <input type="checkbox" checked={state.prefs[key]} onChange={(event) => setPref(key, event.target.checked)} className="accent-brand" />
            </label>
          ))}
          <Button variant="secondary" onClick={resetDemo}>Reload from Supabase</Button>
        </Card>
      ) : null}
    </div>
  );
}
