import {
  Bell,
  Building2,
  ChevronDown,
  CreditCard,
  Crosshair,
  Gift,
  LayoutDashboard,
  LineChart,
  LogOut,
  Megaphone,
  Menu,
  MessageCircle,
  Plug,
  Receipt,
  Rocket,
  ScrollText,
  Search,
  Settings,
  Sparkles,
  Wallet,
  X,
  Images,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { cx, formatWhen } from "../lib/format";
import { useStore } from "../lib/store";
import { Logo } from "./Logo";

const NAV = [
  { to: "/", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/accounts", label: "Ad accounts", icon: CreditCard },
  { to: "/ads", label: "Ads Manager", icon: Megaphone },
  { to: "/launcher", label: "Launcher", icon: Rocket },
  { to: "/pixel", label: "Pixel", icon: Crosshair },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/subscriptions", label: "Subscriptions", icon: Receipt },
  { to: "/creative", label: "Creative", icon: Images },
  { to: "/research", label: "Research", icon: Search },
  { to: "/intelligence", label: "Intelligence", icon: LineChart },
  { to: "/ai", label: "Admexo AI", icon: Sparkles },
  { to: "/integrations", label: "Integrations", icon: Plug },
  { to: "/workspaces", label: "Workspaces", icon: Building2 },
  { to: "/affiliate", label: "Affiliate", icon: Gift },
  { to: "/changelog", label: "Changelog", icon: ScrollText },
];

export function Shell() {
  const { state, setWorkspace, logout, markNotice, markAllNotices, dismissToast, sendSupport } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [noticesOpen, setNoticesOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportText, setSupportText] = useState("");
  const unread = state.notices.filter((notice) => !notice.read).length;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const pages = NAV.filter((item) => item.label.toLowerCase().includes(q)).map((item) => ({
      label: item.label,
      href: item.to,
      kind: "Page",
    }));
    const accounts = state.accounts
      .filter((account) => account.name.toLowerCase().includes(q) || account.platform.toLowerCase().includes(q))
      .map((account) => ({ label: account.name, href: `/accounts/${account.id}`, kind: account.platform }));
    const campaigns = state.campaigns
      .filter((campaign) => campaign.name.toLowerCase().includes(q))
      .map((campaign) => ({ label: campaign.name, href: `/ads/${campaign.id}`, kind: "Campaign" }));
    return [...pages, ...accounts, ...campaigns].slice(0, 8);
  }, [query, state.accounts, state.campaigns]);

  useEffect(() => {
    if (state.toasts.length === 0) return;
    const timer = window.setTimeout(() => {
      const oldest = state.toasts[0];
      if (oldest) dismissToast(oldest.id);
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [state.toasts, dismissToast]);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <aside className={cx("fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-line bg-white transition lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-16 items-center justify-between px-5">
          <Logo />
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cx(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium",
                  isActive ? "bg-brand-soft text-brand" : "text-slate-600 hover:bg-canvas",
                )
              }
            >
              <item.icon size={16} />
              <span className="flex-1">{item.label}</span>
              {item.to === "/affiliate" ? <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand">Earn</span> : null}
              {item.to === "/ai" ? <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">Beta</span> : null}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line p-4 text-xs text-muted">
          {state.user.role === "Admin" || state.user.role === "Owner" ? "Admin" : "Member"} · {state.company.name}
        </div>
      </aside>
      {open ? <button className="fixed inset-0 z-30 bg-ink/30 lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)} /> : null}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={18} /></button>
          <label className="relative hidden min-w-44 items-center sm:flex">
            <span className="sr-only">Workspace</span>
            <Building2 size={15} className="pointer-events-none absolute left-3 text-muted" />
            <select
              value={state.workspaceId}
              onChange={(event) => setWorkspace(event.target.value)}
              className="h-10 w-full appearance-none rounded-xl border border-line bg-white pl-9 pr-8 text-sm font-medium outline-none focus:border-brand"
            >
              <option value="all">All workspaces</option>
              {state.workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 text-muted" />
          </label>
          <div className="relative min-w-0 flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pages, accounts, campaigns"
              className="h-10 w-full rounded-xl border border-line bg-canvas pl-9 pr-3 text-sm outline-none focus:border-brand focus:bg-white"
            />
            {results.length > 0 ? (
              <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-xl border border-line bg-white shadow-lg">
                {results.map((result) => (
                  <button
                    key={result.href + result.label}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-canvas"
                    onClick={() => {
                      navigate(result.href);
                      setQuery("");
                    }}
                  >
                    <span>{result.label}</span>
                    <span className="text-xs text-muted">{result.kind}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="relative">
            <button className="relative rounded-xl border border-line p-2" onClick={() => { setNoticesOpen((v) => !v); setUserOpen(false); }} aria-label="Notifications">
              <Bell size={16} />
              {unread > 0 ? <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] text-white">{unread}</span> : null}
            </button>
            {noticesOpen ? (
              <div className="absolute right-0 top-12 z-30 w-80 rounded-2xl border border-line bg-white p-2 shadow-xl">
                <div className="flex items-center justify-between px-2 py-1">
                  <p className="text-sm font-semibold">Notifications</p>
                  <button className="text-xs text-brand" onClick={markAllNotices}>Mark all read</button>
                </div>
                {state.notices.map((notice) => (
                  <button
                    key={notice.id}
                    className={cx("block w-full rounded-xl px-2 py-2 text-left", notice.read ? "opacity-60" : "bg-canvas")}
                    onClick={() => {
                      markNotice(notice.id);
                      setNoticesOpen(false);
                      navigate(notice.href);
                    }}
                  >
                    <p className="text-sm font-medium">{notice.title}</p>
                    <p className="text-xs text-muted">{notice.body}</p>
                    <p className="mt-1 text-[11px] text-muted">{formatWhen(notice.at, state.locale)}</p>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="relative">
            <button className="flex items-center gap-2 rounded-xl border border-line py-1 pl-1 pr-2" onClick={() => { setUserOpen((v) => !v); setNoticesOpen(false); }}>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-xs font-semibold text-white">{state.user.name.slice(0, 1)}</span>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-semibold leading-4">{state.user.name}</span>
                <span className="block text-[11px] text-muted">{state.user.role}</span>
              </span>
            </button>
            {userOpen ? (
              <div className="absolute right-0 top-12 z-30 w-52 rounded-xl border border-line bg-white p-1 shadow-xl">
                <p className="px-2 py-2 text-xs text-muted">{state.user.email}</p>
                <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-canvas" onClick={() => { setUserOpen(false); navigate("/settings"); }}><Settings size={14} /> Settings</button>
                <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-canvas" onClick={() => { setUserOpen(false); logout(); navigate("/login"); }}><LogOut size={14} /> Log out</button>
              </div>
            ) : null}
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8 lg:py-7">
          {state.syncError ? <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{state.syncError}</div> : null}
          {state.user.role !== "Admin" && state.user.role !== "Owner" ? <div className="mb-4 rounded-xl border border-line bg-white px-4 py-3 text-sm text-muted">You can view entries. Only an admin can add or change them.</div> : null}
          <Outlet />
        </main>
      </div>

      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
        {supportOpen ? (
          <div className="flex h-[420px] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-brand px-4 py-3 text-white">
              <p className="text-sm font-semibold">Admexo support</p>
              <button onClick={() => setSupportOpen(false)} aria-label="Close support"><X size={16} /></button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {state.support.map((message) => (
                <div key={message.id} className={cx("max-w-[90%] rounded-2xl px-3 py-2 text-sm", message.from === "you" ? "ml-auto bg-ink text-white" : "bg-canvas")}>
                  {message.text}
                </div>
              ))}
            </div>
            <form
              className="flex gap-2 border-t border-line p-3"
              onSubmit={(event) => {
                event.preventDefault();
                sendSupport(supportText);
                setSupportText("");
              }}
            >
              <input value={supportText} onChange={(event) => setSupportText(event.target.value)} placeholder="How can we help?" className="h-10 flex-1 rounded-xl border border-line px-3 text-sm outline-none" />
              <button className="rounded-xl bg-brand px-3 text-sm font-semibold text-white">Send</button>
            </form>
          </div>
        ) : null}
        <button className="grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-lg" onClick={() => setSupportOpen((v) => !v)} aria-label="Open support">
          <MessageCircle size={22} />
        </button>
      </div>

      <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 flex-col gap-2">
        {state.toasts.map((item) => (
          <div key={item.id} className="rounded-full bg-ink px-4 py-2 text-sm text-white shadow-lg">{item.message}</div>
        ))}
      </div>
    </div>
  );
}
