import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createSeed } from "../data/seed";
import type {
  AccountStatus,
  AdAccount,
  AppState,
  Campaign,
  CampaignStatus,
  Currency,
  Objective,
  PlanId,
  Platform,
  Role,
} from "../types";
import { applyRemote, fetchWorkspace, pushOperational, updateOwnProfile } from "./cloud";
import { PLAN_CASHBACK, PLAN_LIMITS, PLAN_PRICE, fromUsd, toUsd, uid } from "./format";
import { supabase } from "./supabase";

const KEY = "admexo-workspace-v1";

function load(): AppState {
  const seed = createSeed(false);
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed?.user || !Array.isArray(parsed.accounts)) return seed;
    return { ...seed, ...parsed, authed: false, toasts: [], syncError: null };
  } catch {
    return seed;
  }
}

function save(state: AppState) {
  const { toasts: _toasts, ...rest } = state;
  localStorage.setItem(KEY, JSON.stringify(rest));
}

function log(state: AppState, text: string) {
  state.activity.unshift({ id: uid("act"), text, at: new Date().toISOString() });
  state.activity = state.activity.slice(0, 40);
}

function notify(state: AppState, title: string, body: string, href: string) {
  state.notices.unshift({ id: uid("nt"), title, body, href, read: false, at: new Date().toISOString() });
}

function toast(state: AppState, message: string) {
  state.toasts = [...state.toasts, { id: uid("ts"), message }].slice(-4);
}

function activeAccountCount(state: AppState) {
  return state.accounts.filter((account) => account.status !== "disabled").length;
}

interface StoreApi {
  state: AppState;
  booting: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (input: { email: string; name: string; phone: string; password: string }) => Promise<string | null>;
  sendMagicLink: (email: string) => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  logout: () => void;
  setLocale: (locale: string) => void;
  setWorkspace: (id: string) => void;
  dismissToast: (id: string) => void;
  markNotice: (id: string) => void;
  markAllNotices: () => void;
  deposit: (amount: number, method: "card" | "bank" | "crypto") => string | null;
  settleDeposit: (id: string) => void;
  withdraw: (amount: number) => string | null;
  claimCashback: () => string | null;
  addCard: (brand: string, last4: string, exp: string) => string | null;
  removeCard: (id: string) => void;
  topUp: (accountId: string, amount: number) => string | null;
  clearFunds: (accountId: string, amount: number) => string | null;
  renameAccount: (accountId: string, name: string) => string | null;
  deleteAccount: (accountId: string) => string | null;
  saveAccountEntry: (accountId: string, figures: { balance: number; spend7d: number; spend30d: number; revenue30d: number; status: AccountStatus }) => string | null;
  appealAccount: (accountId: string, note: string) => string | null;
  markAccountReady: (accountId: string) => void;
  requestAccount: (input: {
    platform: Platform;
    workspaceId: string;
    name: string;
    page: string;
    currency: Currency;
    topUp: number;
  }) => string | null;
  setCampaignStatus: (id: string, status: CampaignStatus) => void;
  deleteCampaign: (id: string) => string | null;
  createCampaign: (input: Omit<Campaign, "id" | "spend" | "impressions" | "clicks" | "conversions" | "revenue">) => string;
  setLeadStatus: (id: string, status: "new" | "contacted") => void;
  launchTemplate: (templateId: string, accountId: string, name: string) => string | null;
  addCreative: (input: { name: string; kind: "image" | "video" | "carousel"; project: string; origin: "uploaded" | "generated" }) => void;
  setCreativeStatus: (id: string, status: "ready" | "draft" | "archived" | "retired") => void;
  addTag: (id: string, tag: string) => void;
  createBoard: (name: string, description: string) => void;
  toggleBoardAsset: (boardId: string, assetId: string) => void;
  addProject: (name: string) => string | null;
  toggleBenchmark: (id: string) => void;
  setPixelDomain: (domain: string) => void;
  verifyPixel: () => void;
  sendTestEvent: () => void;
  toggleDestination: (id: string) => void;
  toggleIntegration: (id: string) => void;
  createWorkspace: (name: string, region: string, currency: Currency) => string | null;
  inviteMember: (name: string, email: string, role: Role) => string | null;
  removeMember: (id: string) => string | null;
  updateProfile: (patch: Partial<AppState["user"]>) => void;
  updateCompany: (patch: Partial<AppState["company"]>) => void;
  setPref: (key: keyof AppState["prefs"], value: boolean) => void;
  changePlan: (plan: PlanId) => string | null;
  applyMove: (id: string) => string | null;
  saveReport: (name: string, range: string, summary: string) => void;
  deleteReport: (id: string) => void;
  sendAi: (text: string) => void;
  resolveApproval: (messageId: string, approve: boolean) => void;
  sendSupport: (text: string) => void;
  resetDemo: () => void;
  accountsInScope: (accounts?: AdAccount[]) => AdAccount[];
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load);
  const [booting, setBooting] = useState(true);
  const stateRef = useRef(state);
  const hydrated = useRef(false);
  stateRef.current = state;

  useEffect(() => {
    save(state);
  }, [state]);

  useEffect(() => {
    let cancel = false;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancel) return;
      if (data.session?.user) {
        const result = await fetchWorkspace(data.session.user);
        if (cancel) return;
        if (result.error || !result.data) {
          setState((prev) => ({ ...prev, authed: false, syncError: result.error }));
        } else {
          hydrated.current = true;
          setState((prev) => applyRemote(prev, result.data!));
        }
      }
      if (!cancel) setBooting(false);
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated.current || !state.authed) return;
    if (state.user.role !== "Admin" && state.user.role !== "Owner") return;
    const timer = window.setTimeout(() => {
      void pushOperational(stateRef.current).then((error) => {
        if (!error) return;
        setState((prev) => (prev.syncError === error ? prev : { ...prev, syncError: error }));
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [state.accounts, state.campaigns, state.transactions, state.wallet, state.workspaces, state.members, state.authed, state.user.role]);

  const patch = useCallback((mutator: (draft: AppState) => void) => {
    setState((prev) => {
      const next = structuredClone(prev);
      mutator(next);
      return next;
    });
  }, []);

  const writeDenied = useCallback(() => {
    const role = stateRef.current.user.role;
    if (role === "Admin" || role === "Owner") return null;
    return "Only admins can add or edit entries.";
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!email.includes("@")) return "Enter a work email.";
    if (password.length < 8) return "Use at least 8 characters.";
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return error.message;
    if (!data.user) return "Sign-in did not return an account.";
    const result = await fetchWorkspace(data.user);
    if (result.error || !result.data) return result.error ?? "Could not load the workspace.";
    hydrated.current = true;
    setState((prev) => {
      const next = applyRemote(prev, result.data!);
      next.toasts = [...next.toasts, { id: uid("ts"), message: next.user.role === "Admin" ? "Signed in as admin" : "Signed in" }].slice(-4);
      return next;
    });
    return null;
  }, []);

  const signup = useCallback(async (input: { email: string; name: string; phone: string; password: string }) => {
    if (!input.email.includes("@")) return "Enter a work email.";
    if (input.name.trim().length < 2) return "Enter your full name.";
    if (input.phone.trim().length < 6) return "Enter a phone number.";
    const strong = /[a-z]/.test(input.password) && /[A-Z]/.test(input.password) && /\d/.test(input.password) && input.password.length >= 10;
    if (!strong) return "Use 10+ characters with upper, lower, and a number.";
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: { full_name: input.name.trim(), phone: input.phone.trim() },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return error.message;
    if (!data.session || !data.user) return "Check your email to confirm the account, then log in. The first account becomes the admin.";
    const result = await fetchWorkspace(data.user);
    if (result.error || !result.data) return result.error ?? "Account created, but the workspace is not ready.";
    hydrated.current = true;
    setState((prev) => applyRemote(prev, result.data!));
    return null;
  }, []);

  const sendMagicLink = useCallback(async (email: string) => {
    if (!email.includes("@")) return "Enter a work email.";
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    return error?.message ?? null;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!email.includes("@")) return "Enter a work email.";
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });
    return error?.message ?? null;
  }, []);

  const logout = useCallback(() => {
    hydrated.current = false;
    void supabase.auth.signOut();
    setState((prev) => ({ ...prev, authed: false, toasts: [] }));
  }, []);

  const setLocale = useCallback((locale: string) => patch((d) => { d.locale = locale; }), [patch]);
  const setWorkspace = useCallback((id: string) => patch((d) => { d.workspaceId = id; }), [patch]);
  const dismissToast = useCallback((id: string) => patch((d) => { d.toasts = d.toasts.filter((t) => t.id !== id); }), [patch]);
  const markNotice = useCallback((id: string) => patch((d) => { const n = d.notices.find((item) => item.id === id); if (n) n.read = true; }), [patch]);
  const markAllNotices = useCallback(() => patch((d) => { d.notices.forEach((n) => { n.read = true; }); }), [patch]);

  const deposit = useCallback((amount: number, method: "card" | "bank" | "crypto") => {
    const denied = writeDenied();
    if (denied) return denied;
    if (amount <= 0) return "Enter an amount greater than zero.";
    const current = stateRef.current;
    if (method === "card" && current.cards.length === 0) return "Add a card before paying by card.";
    patch((draft) => {
      const fee = method === "card" ? Math.round(amount * 0.029 * 100) / 100 : 0;
      const status = method === "card" ? "completed" : "pending";
      const label = method === "card" ? `${draft.cards[0]?.brand ?? "Card"} · ${draft.cards[0]?.last4 ?? ""}` : method === "bank" ? "Bank transfer" : "USDT";
      draft.transactions.unshift({
        id: uid("tx"),
        type: "deposit",
        amount,
        status,
        method: label,
        description: method === "crypto" ? "USDT deposit" : "Wallet deposit",
        createdAt: new Date().toISOString(),
      });
      if (fee > 0) {
        draft.transactions.unshift({
          id: uid("tx"),
          type: "fee",
          amount: fee,
          status: "completed",
          method: "Card",
          description: "Card processing fee",
          createdAt: new Date().toISOString(),
        });
      }
      if (status === "completed") draft.wallet.available += amount - fee;
      else draft.wallet.pending += amount;
      const cashback = amount * PLAN_CASHBACK[draft.plan];
      if (cashback > 0 && status === "completed") draft.wallet.cashback += Math.round(cashback * 100) / 100;
      log(draft, status === "completed" ? `Deposited $${amount.toFixed(2)} by card` : `Started a $${amount.toFixed(2)} ${method} deposit`);
      toast(draft, status === "completed" ? "Deposit added to the wallet" : "Deposit is pending clearance");
    });
    return null;
  }, [patch]);

  const settleDeposit = useCallback((id: string) => {
    const denied = writeDenied();
    if (denied) {
      patch((draft) => toast(draft, denied));
      return;
    }
    patch((draft) => {
      const tx = draft.transactions.find((item) => item.id === id && item.type === "deposit" && item.status === "pending");
      if (!tx) return;
      tx.status = "completed";
      draft.wallet.pending = Math.max(0, draft.wallet.pending - tx.amount);
      draft.wallet.available += tx.amount;
      const cashback = tx.amount * PLAN_CASHBACK[draft.plan];
      if (cashback > 0) draft.wallet.cashback += Math.round(cashback * 100) / 100;
      log(draft, `Cleared ${tx.description} of $${tx.amount.toFixed(2)}`);
      toast(draft, "Deposit cleared into the wallet");
    });
  }, [patch]);

  const withdraw = useCallback((amount: number) => {
    const denied = writeDenied();
    if (denied) return denied;
    if (amount <= 0) return "Enter an amount greater than zero.";
    if (stateRef.current.wallet.available < amount) return "That amount is higher than the available balance.";
    patch((draft) => {
      draft.wallet.available -= amount;
      draft.transactions.unshift({
        id: uid("tx"),
        type: "withdrawal",
        amount,
        status: "completed",
        method: "Bank",
        description: "Withdrawal to operating account",
        createdAt: new Date().toISOString(),
      });
      log(draft, `Withdrew $${amount.toFixed(2)}`);
      toast(draft, "Withdrawal sent");
    });
    return null;
  }, [patch]);

  const claimCashback = useCallback(() => {
    const denied = writeDenied();
    if (denied) return denied;
    if (stateRef.current.wallet.cashback <= 0) return "There is no cashback to credit.";
    patch((draft) => {
      const amount = Math.round(draft.wallet.cashback * 100) / 100;
      draft.wallet.cashback = 0;
      draft.wallet.available += amount;
      draft.transactions.unshift({
        id: uid("tx"),
        type: "cashback",
        amount,
        status: "completed",
        method: "Cashback",
        description: "Cashback credited to wallet",
        createdAt: new Date().toISOString(),
      });
      log(draft, `Credited $${amount.toFixed(2)} cashback to the wallet`);
      toast(draft, "Cashback credited");
    });
    return null;
  }, [patch]);

  const addCard = useCallback((brand: string, last4: string, exp: string) => {
    const denied = writeDenied();
    if (denied) return denied;
    if (!/^\d{4}$/.test(last4)) return "Enter the last 4 digits.";
    if (!/^\d{2}\/\d{2}$/.test(exp)) return "Use MM/YY for the expiry.";
    patch((draft) => {
      draft.cards.push({ id: uid("card"), brand: brand || "Card", last4, exp });
      toast(draft, "Card saved");
    });
    return null;
  }, [patch]);

  const removeCard = useCallback((id: string) => {
    const denied = writeDenied();
    if (denied) {
      patch((draft) => toast(draft, denied));
      return;
    }
    patch((draft) => {
      draft.cards = draft.cards.filter((card) => card.id !== id);
      toast(draft, "Card removed");
    });
  }, [patch]);

  const topUp = useCallback((accountId: string, amount: number) => {
    const denied = writeDenied();
    if (denied) return denied;
    const current = stateRef.current;
    const account = current.accounts.find((item) => item.id === accountId);
    if (!account) return "Account not found.";
    if (account.status === "disabled" || account.status === "pending" || account.status === "in_review") return "This account cannot take funds yet.";
    if (amount <= 0) return "Enter an amount greater than zero.";
    const cost = toUsd(amount, account.currency);
    if (current.wallet.available < cost) return "Insufficient wallet balance.";
    patch((draft) => {
      const target = draft.accounts.find((item) => item.id === accountId);
      if (!target) return;
      draft.wallet.available -= cost;
      target.balance += amount;
      draft.transactions.unshift({
        id: uid("tx"),
        type: "topup",
        amount: cost,
        status: "completed",
        method: "Wallet",
        description: `Top-up · ${target.name}`,
        createdAt: new Date().toISOString(),
        accountId,
      });
      log(draft, `Topped up ${target.name}`);
      notify(draft, `${target.name} funded`, "A wallet top-up was applied to this ad account.", `/accounts/${accountId}`);
      toast(draft, "Account topped up");
    });
    return null;
  }, [patch]);

  const clearFunds = useCallback((accountId: string, amount: number) => {
    const denied = writeDenied();
    if (denied) return denied;
    const account = stateRef.current.accounts.find((item) => item.id === accountId);
    if (!account) return "Account not found.";
    if (amount <= 0) return "Enter an amount greater than zero.";
    if (amount > account.balance) return "That is more than the account balance.";
    patch((draft) => {
      const target = draft.accounts.find((item) => item.id === accountId);
      if (!target) return;
      target.balance -= amount;
      const credit = toUsd(amount, target.currency);
      draft.wallet.available += credit;
      draft.transactions.unshift({
        id: uid("tx"),
        type: "refund",
        amount: credit,
        status: "completed",
        method: "Wallet",
        description: `Cleared funds · ${target.name}`,
        createdAt: new Date().toISOString(),
        accountId,
      });
      log(draft, `Cleared funds from ${target.name}`);
      toast(draft, "Funds returned to the wallet");
    });
    return null;
  }, [patch]);

  const renameAccount = useCallback((accountId: string, name: string) => {
    const denied = writeDenied();
    if (denied) return denied;
    if (name.trim().length < 2) return "Enter an account name.";
    patch((draft) => {
      const target = draft.accounts.find((item) => item.id === accountId);
      if (!target) return;
      target.name = name.trim();
      log(draft, `Renamed an ad account to ${name.trim()}`);
      toast(draft, "Account renamed");
    });
    return null;
  }, [patch]);

  const appealAccount = useCallback((accountId: string, note: string) => {
    const denied = writeDenied();
    if (denied) return denied;
    if (note.trim().length < 8) return "Add a short note for the appeal.";
    patch((draft) => {
      const target = draft.accounts.find((item) => item.id === accountId);
      if (!target) return;
      target.appeal = note.trim();
      log(draft, `Filed an appeal for ${target.name}`);
      notify(draft, "Appeal filed", target.name, `/accounts/${accountId}`);
      toast(draft, "Appeal filed");
    });
    return null;
  }, [patch]);

  const saveAccountEntry = useCallback((accountId: string, figures: { balance: number; spend7d: number; spend30d: number; revenue30d: number; status: AccountStatus }) => {
    const denied = writeDenied();
    if (denied) return denied;
    if ([figures.balance, figures.spend7d, figures.spend30d, figures.revenue30d].some((value) => Number.isNaN(value) || value < 0)) {
      return "Enter zero or a positive number for each figure.";
    }
    patch((draft) => {
      const target = draft.accounts.find((item) => item.id === accountId);
      if (!target) return;
      target.balance = figures.balance;
      target.spend7d = figures.spend7d;
      target.spend30d = figures.spend30d;
      target.revenue30d = figures.revenue30d;
      target.status = figures.status;
      log(draft, `Updated figures for ${target.name}`);
      toast(draft, "Account entry saved");
    });
    return null;
  }, [patch, writeDenied]);

  const markAccountReady = useCallback((accountId: string) => {
    const denied = writeDenied();
    if (denied) {
      patch((draft) => toast(draft, denied));
      return;
    }
    patch((draft) => {
      const target = draft.accounts.find((item) => item.id === accountId);
      if (!target) return;
      target.status = "active";
      draft.transactions.forEach((tx) => {
        if (tx.accountId === accountId && tx.type === "topup" && tx.status === "pending") {
          tx.status = "completed";
          draft.wallet.pending = Math.max(0, draft.wallet.pending - tx.amount);
          target.balance += fromUsd(tx.amount, target.currency);
        }
      });
      log(draft, `${target.name} is ready`);
      toast(draft, "Account marked ready");
    });
  }, [patch]);

  const requestAccount = useCallback((input: { platform: Platform; workspaceId: string; name: string; page: string; currency: Currency; topUp: number }) => {
    const denied = writeDenied();
    if (denied) return denied;
    if (input.name.trim().length < 2) return "Name the ad account.";
    if (!input.page.trim()) return "Add a page or site.";
    const current = stateRef.current;
    if (activeAccountCount(current) >= PLAN_LIMITS[current.plan]) return "This plan has no room for another account.";
    if (input.topUp < 0) return "Top-up cannot be negative.";
    const cost = toUsd(input.topUp, input.currency);
    if (input.topUp > 0 && current.wallet.available < cost) return "Insufficient wallet balance for that top-up.";
    patch((draft) => {
      const account: AdAccount = {
        id: uid("acc"),
        workspaceId: input.workspaceId,
        name: input.name.trim(),
        platform: input.platform,
        status: "pending",
        currency: input.currency,
        balance: 0,
        spend7d: 0,
        spend30d: 0,
        revenue30d: 0,
        businessManager: "Requested",
        page: input.page.trim(),
        timezone: "America/Los_Angeles",
        createdAt: new Date().toISOString(),
        appeal: null,
      };
      draft.accounts.unshift(account);
      if (input.topUp > 0) {
        draft.wallet.available -= cost;
        draft.wallet.pending += cost;
        draft.transactions.unshift({
          id: uid("tx"),
          type: "topup",
          amount: cost,
          status: "pending",
          method: "Wallet",
          description: `Reserved top-up · ${account.name}`,
          createdAt: new Date().toISOString(),
          accountId: account.id,
        });
      }
      log(draft, `Requested ${account.platform} account ${account.name}`);
      notify(draft, "Account requested", account.name, `/accounts/${account.id}`);
      toast(draft, "Request sent");
    });
    return null;
  }, [patch]);

  const deleteAccount = useCallback((id: string) => {
    const denied = writeDenied();
    if (denied) return denied;
    const account = stateRef.current.accounts.find((item) => item.id === id);
    if (!account) return "Account not found.";
    patch((draft) => {
      draft.accounts = draft.accounts.filter((item) => item.id !== id);
      draft.campaigns = draft.campaigns.filter((item) => item.accountId !== id);
      log(draft, `Deleted account ${account.name}`);
      toast(draft, "Account deleted");
    });
    return null;
  }, [patch, writeDenied]);

  const setCampaignStatus = useCallback((id: string, status: CampaignStatus) => {
    const denied = writeDenied();
    if (denied) {
      patch((draft) => toast(draft, denied));
      return;
    }
    patch((draft) => {
      const campaign = draft.campaigns.find((item) => item.id === id);
      if (!campaign) return;
      campaign.status = status;
      log(draft, `${status === "paused" ? "Paused" : status === "active" ? "Launched" : "Updated"} ${campaign.name}`);
      toast(draft, `Campaign ${status.replace("_", " ")}`);
    });
  }, [patch]);

  const deleteCampaign = useCallback((id: string) => {
    const denied = writeDenied();
    if (denied) return denied;
    const campaign = stateRef.current.campaigns.find((item) => item.id === id);
    if (!campaign) return "Campaign not found.";
    patch((draft) => {
      draft.campaigns = draft.campaigns.filter((item) => item.id !== id);
      log(draft, `Deleted campaign ${campaign.name}`);
      toast(draft, "Campaign deleted");
    });
    return null;
  }, [patch, writeDenied]);

  const createCampaign = useCallback((input: Omit<Campaign, "id" | "spend" | "impressions" | "clicks" | "conversions" | "revenue">) => {
    const denied = writeDenied();
    if (denied) {
      patch((draft) => toast(draft, denied));
      return "";
    }
    const id = uid("cmp");
    patch((draft) => {
      draft.campaigns.unshift({ ...input, id, spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 });
      log(draft, `${input.status === "active" ? "Launched" : "Drafted"} ${input.name}`);
      toast(draft, input.status === "active" ? "Campaign launched" : "Draft saved");
    });
    return id;
  }, [patch]);

  const setLeadStatus = useCallback((id: string, status: "new" | "contacted") => {
    patch((draft) => {
      const lead = draft.leads.find((item) => item.id === id);
      if (lead) lead.status = status;
    });
  }, [patch]);

  const launchTemplate = useCallback((templateId: string, accountId: string, name: string) => {
    const denied = writeDenied();
    if (denied) return denied;
    const template = stateRef.current.templates.find((item) => item.id === templateId);
    const account = stateRef.current.accounts.find((item) => item.id === accountId);
    if (!template || !account) return "Pick a template and an account.";
    if (account.status !== "active" && account.status !== "paused") return "That account is not ready to launch.";
    if (name.trim().length < 2) return "Name the campaign.";
    const id = uid("cmp");
    patch((draft) => {
      draft.campaigns.unshift({
        id,
        accountId,
        name: name.trim(),
        objective: template.objective,
        status: "active",
        dailyBudget: template.dailyBudget,
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        countries: ["United States"],
        startDate: new Date().toISOString().slice(0, 10),
        endDate: null,
      });
      log(draft, `Launched ${name.trim()} from a template`);
      toast(draft, "Campaign launched from template");
    });
    return null;
  }, [patch]);

  const addCreative = useCallback((input: { name: string; kind: "image" | "video" | "carousel"; project: string; origin: "uploaded" | "generated" }) => {
    patch((draft) => {
      draft.creatives.unshift({
        id: uid("cr"),
        name: input.name,
        kind: input.kind,
        status: input.origin === "generated" ? "draft" : "ready",
        project: input.project || draft.projects[0] || "General",
        tags: input.origin === "generated" ? ["ai"] : ["upload"],
        spend: 0,
        roas: 0,
        origin: input.origin,
      });
      toast(draft, input.origin === "generated" ? "Draft creative added" : "Creative uploaded");
    });
  }, [patch]);

  const setCreativeStatus = useCallback((id: string, status: "ready" | "draft" | "archived" | "retired") => {
    patch((draft) => {
      const asset = draft.creatives.find((item) => item.id === id);
      if (asset) asset.status = status;
    });
  }, [patch]);

  const addTag = useCallback((id: string, tag: string) => {
    const clean = tag.trim().toLowerCase();
    if (!clean) return;
    patch((draft) => {
      const asset = draft.creatives.find((item) => item.id === id);
      if (asset && !asset.tags.includes(clean)) asset.tags.push(clean);
    });
  }, [patch]);

  const createBoard = useCallback((name: string, description: string) => {
    if (name.trim().length < 2) return;
    patch((draft) => {
      draft.boards.unshift({ id: uid("bd"), name: name.trim(), description: description.trim(), assetIds: [] });
      toast(draft, "Board created");
    });
  }, [patch]);

  const toggleBoardAsset = useCallback((boardId: string, assetId: string) => {
    patch((draft) => {
      const board = draft.boards.find((item) => item.id === boardId);
      if (!board) return;
      board.assetIds = board.assetIds.includes(assetId)
        ? board.assetIds.filter((id) => id !== assetId)
        : [...board.assetIds, assetId];
    });
  }, [patch]);

  const addProject = useCallback((name: string) => {
    if (name.trim().length < 2) return "Name the project.";
    patch((draft) => {
      if (!draft.projects.includes(name.trim())) draft.projects.push(name.trim());
      toast(draft, "Project added");
    });
    return null;
  }, [patch]);

  const toggleBenchmark = useCallback((id: string) => {
    patch((draft) => {
      const item = draft.benchmarks.find((benchmark) => benchmark.id === id);
      if (!item) return;
      item.saved = !item.saved;
      toast(draft, item.saved ? "Benchmark saved" : "Benchmark removed");
    });
  }, [patch]);

  const setPixelDomain = useCallback((domain: string) => patch((d) => { d.pixel.domain = domain.trim() || d.pixel.domain; d.pixel.verified = false; }), [patch]);

  const verifyPixel = useCallback(() => {
    patch((draft) => {
      draft.pixel.verified = true;
      toast(draft, "Pixel verified on this domain");
    });
  }, [patch]);

  const sendTestEvent = useCallback(() => {
    patch((draft) => {
      const page = draft.pixel.events.find((event) => event.name === "PageView");
      if (page) {
        page.count24h += 1;
        page.lastSeen = new Date().toISOString();
        page.healthy = true;
      }
      toast(draft, "Test PageView received");
    });
  }, [patch]);

  const toggleDestination = useCallback((id: string) => {
    patch((draft) => {
      const dest = draft.pixel.destinations.find((item) => item.id === id);
      if (!dest) return;
      dest.connected = !dest.connected;
      dest.successRate = dest.connected ? 0.96 : 0;
      toast(draft, dest.connected ? `${dest.name} connected` : `${dest.name} disconnected`);
    });
  }, [patch]);

  const toggleIntegration = useCallback((id: string) => {
    patch((draft) => {
      const item = draft.integrations.find((integration) => integration.id === id);
      if (!item) return;
      item.connected = !item.connected;
      item.lastSync = item.connected ? new Date().toISOString() : null;
      log(draft, `${item.connected ? "Connected" : "Disconnected"} ${item.name}`);
      toast(draft, item.connected ? `${item.name} connected` : `${item.name} disconnected`);
    });
  }, [patch]);

  const createWorkspace = useCallback((name: string, region: string, currency: Currency) => {
    const denied = writeDenied();
    if (denied) return denied;
    if (name.trim().length < 2) return "Name the workspace.";
    patch((draft) => {
      draft.workspaces.push({ id: uid("ws"), name: name.trim(), region: region.trim() || "Global", currency });
      toast(draft, "Workspace created");
    });
    return null;
  }, [patch]);

  const inviteMember = useCallback((name: string, email: string, role: Role) => {
    const denied = writeDenied();
    if (denied) return denied;
    if (!email.includes("@")) return "Enter an email.";
    if (stateRef.current.members.some((member) => member.email.toLowerCase() === email.toLowerCase())) return "That person is already on the team.";
    patch((draft) => {
      draft.members.push({ id: uid("mb"), name: name.trim() || email.split("@")[0] || "Invite", email: email.trim(), role, status: "invited" });
      log(draft, `Invited ${email.trim()} as ${role}`);
      toast(draft, "Invite sent");
    });
    return null;
  }, [patch]);

  const removeMember = useCallback((id: string) => {
    const denied = writeDenied();
    if (denied) return denied;
    const member = stateRef.current.members.find((item) => item.id === id);
    if (!member) return "Member not found.";
    if (member.role === "Owner") return "The owner cannot be removed.";
    patch((draft) => {
      draft.members = draft.members.filter((item) => item.id !== id);
      toast(draft, "Member removed");
    });
    return null;
  }, [patch]);

  const updateProfile = useCallback((next: Partial<AppState["user"]>) => {
    patch((draft) => {
      draft.user = { ...draft.user, ...next };
      toast(draft, "Profile saved");
    });
    void supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      void updateOwnProfile(data.user.id, { full_name: next.name, phone: next.phone });
    });
  }, [patch]);

  const updateCompany = useCallback((next: Partial<AppState["company"]>) => {
    patch((draft) => {
      draft.company = { ...draft.company, ...next };
      toast(draft, "Company saved");
    });
  }, [patch]);

  const setPref = useCallback((key: keyof AppState["prefs"], value: boolean) => {
    patch((draft) => { draft.prefs[key] = value; });
  }, [patch]);

  const changePlan = useCallback((plan: PlanId) => {
    const denied = writeDenied();
    if (denied) return denied;
    const current = stateRef.current;
    if (plan === current.plan) return "You are already on this plan.";
    if (activeAccountCount(current) > PLAN_LIMITS[plan]) return "Remove accounts before moving to a smaller plan.";
    patch((draft) => {
      draft.plan = plan;
      const price = PLAN_PRICE[plan];
      if (price > 0) {
        draft.invoices.unshift({
          id: uid("inv"),
          plan: plan[0].toUpperCase() + plan.slice(1),
          amount: price,
          status: "paid",
          issuedAt: new Date().toISOString(),
        });
      }
      log(draft, `Switched plan to ${plan}`);
      toast(draft, "Plan updated");
    });
    return null;
  }, [patch]);

  const applyMove = useCallback((id: string) => {
    const denied = writeDenied();
    if (denied) return denied;
    const move = stateRef.current.budgetMoves.find((item) => item.id === id);
    if (!move || move.applied) return "That move is already applied.";
    patch((draft) => {
      const item = draft.budgetMoves.find((entry) => entry.id === id);
      const from = draft.campaigns.find((campaign) => campaign.id === item?.fromId);
      const to = draft.campaigns.find((campaign) => campaign.id === item?.toId);
      if (!item || !from || !to) return;
      if (from.dailyBudget < item.amount) return;
      from.dailyBudget -= item.amount;
      to.dailyBudget += item.amount;
      item.applied = true;
      log(draft, `Moved $${item.amount}/day from ${from.name} to ${to.name}`);
      toast(draft, "Budget move applied");
    });
    return null;
  }, [patch]);

  const saveReport = useCallback((name: string, range: string, summary: string) => {
    patch((draft) => {
      draft.reports.unshift({ id: uid("rp"), name: name.trim() || "Untitled report", range, summary, createdAt: new Date().toISOString() });
      toast(draft, "Report saved");
    });
  }, [patch]);

  const deleteReport = useCallback((id: string) => patch((d) => { d.reports = d.reports.filter((r) => r.id !== id); }), [patch]);

  const sendAi = useCallback((text: string) => {
    const clean = text.trim();
    if (!clean) return;
    const current = stateRef.current;
    const lower = clean.toLowerCase();
    let reply = "I can help with spend, a campaign pause, a top-up, or creative notes. Tell me which account or campaign you mean.";
    let approval: AppState["ai"][number]["approval"];
    const campaign = current.campaigns.find((item) => lower.includes(item.name.toLowerCase()));
    const account = current.accounts.find((item) => lower.includes(item.name.toLowerCase()));

    if (lower.includes("pause") && campaign) {
      reply = `${campaign.name} is ${campaign.status}. I can pause it. Nothing changes until you approve.`;
      approval = { id: uid("ap"), label: `Pause ${campaign.name}`, kind: "pause", campaignId: campaign.id, status: "pending" };
    } else if ((lower.includes("top") || lower.includes("fund")) && account) {
      reply = `${account.name} has ${account.balance.toFixed(0)} ${account.currency} left. I can prepare a 500 ${account.currency} top-up from the wallet.`;
      approval = { id: uid("ap"), label: `Top up ${account.name} by 500 ${account.currency}`, kind: "topup", accountId: account.id, amount: 500, status: "pending" };
    } else if (lower.includes("spend") || lower.includes("wallet")) {
      const spend = current.accounts.reduce((sum, item) => sum + item.spend7d, 0);
      reply = `Wallet available is $${current.wallet.available.toFixed(2)}, with $${current.wallet.pending.toFixed(2)} pending. Ad accounts spent about $${spend.toFixed(0)} in the last 7 days.`;
    } else if (lower.includes("creative") || lower.includes("hook")) {
      const ready = current.creatives.filter((item) => item.status === "ready");
      const best = [...ready].sort((a, b) => b.roas - a.roas)[0];
      reply = best
        ? `${best.name} is the strongest ready asset at ${best.roas.toFixed(1)} ROAS. I would refresh the catalog static before adding budget there.`
        : "The library has no ready creatives yet. Generate or upload one in Creative.";
    } else if (lower.includes("account") || lower.includes("restrict")) {
      const flagged = current.accounts.filter((item) => item.status === "restricted" || item.status === "disabled");
      reply = flagged.length
        ? `${flagged.map((item) => item.name).join(", ")} need attention. Open the account to appeal or request a replacement.`
        : "No accounts are restricted right now.";
    } else if (campaign) {
      const value = campaign.spend > 0 ? campaign.revenue / campaign.spend : 0;
      reply = `${campaign.name} is ${campaign.status} on a $${campaign.dailyBudget}/day budget. Reported ROAS is ${value.toFixed(2)}.`;
    }

    patch((draft) => {
      const at = new Date().toISOString();
      draft.ai.push({ id: uid("ai"), role: "user", text: clean, at });
      draft.ai.push({ id: uid("ai"), role: "assistant", text: reply, at, approval });
    });
  }, [patch]);

  const resolveApproval = useCallback((messageId: string, approve: boolean) => {
    const message = stateRef.current.ai.find((item) => item.id === messageId);
    const approval = message?.approval;
    if (!approval || approval.status !== "pending") return;
    if (!approve) {
      patch((draft) => {
        const item = draft.ai.find((entry) => entry.id === messageId);
        if (item?.approval) item.approval.status = "dismissed";
        toast(draft, "Request dismissed");
      });
      return;
    }
    if (approval.kind === "pause" && approval.campaignId) {
      const id = approval.campaignId;
      patch((draft) => {
        const campaign = draft.campaigns.find((item) => item.id === id);
        if (campaign) campaign.status = "paused";
        const item = draft.ai.find((entry) => entry.id === messageId);
        if (item?.approval) item.approval.status = "approved";
        log(draft, `Approved an AI pause for ${campaign?.name ?? "a campaign"}`);
        toast(draft, "Pause approved");
      });
    }
    if (approval.kind === "topup" && approval.accountId && approval.amount) {
      const account = stateRef.current.accounts.find((item) => item.id === approval.accountId);
      if (!account) return;
      const cost = toUsd(approval.amount, account.currency);
      if (stateRef.current.wallet.available < cost) {
        patch((draft) => toast(draft, "Not enough wallet balance to approve that top-up"));
        return;
      }
      const accountId = approval.accountId;
      const amount = approval.amount;
      patch((draft) => {
        const target = draft.accounts.find((item) => item.id === accountId);
        if (!target) return;
        draft.wallet.available -= toUsd(amount, target.currency);
        target.balance += amount;
        draft.transactions.unshift({
          id: uid("tx"),
          type: "topup",
          amount: toUsd(amount, target.currency),
          status: "completed",
          method: "Wallet",
          description: `AI top-up · ${target.name}`,
          createdAt: new Date().toISOString(),
          accountId,
        });
        const item = draft.ai.find((entry) => entry.id === messageId);
        if (item?.approval) item.approval.status = "approved";
        log(draft, `Approved an AI top-up for ${target.name}`);
        toast(draft, "Top-up approved");
      });
    }
  }, [patch]);

  const sendSupport = useCallback((text: string) => {
    const clean = text.trim();
    if (!clean) return;
    const lower = clean.toLowerCase();
    let reply = "A specialist would pick this up on a live account. Here, I can point you to Wallet, Ad accounts, or the appeal form.";
    if (lower.includes("top") || lower.includes("fund") || lower.includes("wallet")) reply = "Open Wallet to deposit, then top up an active account from Ad accounts. Card deposits land immediately in this preview.";
    else if (lower.includes("restrict") || lower.includes("appeal") || lower.includes("ban")) reply = "Open the restricted account and file an appeal with a short note. Status stays on the account until it is reviewed.";
    else if (lower.includes("account")) reply = "Request a new account from Ad accounts. Pending requests can be marked ready so you can see the rest of the flow.";
    patch((draft) => {
      const at = new Date().toISOString();
      draft.support.push({ id: uid("sp"), from: "you", text: clean, at });
      draft.support.push({ id: uid("sp"), from: "agent", text: reply, at });
    });
  }, [patch]);

  const resetDemo = useCallback(() => {
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const result = await fetchWorkspace(data.user);
      if (result.error || !result.data) {
        setState((prev) => ({ ...prev, syncError: result.error }));
        return;
      }
      setState((prev) => {
        const next = applyRemote(prev, result.data!);
        next.toasts = [...next.toasts, { id: uid("ts"), message: "Reloaded from Supabase" }].slice(-4);
        return next;
      });
    });
  }, []);

  const accountsInScope = useCallback((accounts?: AdAccount[]) => {
    const list = accounts ?? state.accounts;
    if (state.workspaceId === "all") return list;
    return list.filter((account) => account.workspaceId === state.workspaceId);
  }, [state.accounts, state.workspaceId]);

  const api = useMemo<StoreApi>(() => ({
    state,
    booting,
    login,
    signup,
    sendMagicLink,
    resetPassword,
    logout,
    setLocale,
    setWorkspace,
    dismissToast,
    markNotice,
    markAllNotices,
    deposit,
    settleDeposit,
    withdraw,
    claimCashback,
    addCard,
    removeCard,
    topUp,
    clearFunds,
    renameAccount,
    deleteAccount,
    saveAccountEntry,
    appealAccount,
    markAccountReady,
    requestAccount,
    setCampaignStatus,
    deleteCampaign,
    createCampaign,
    setLeadStatus,
    launchTemplate,
    addCreative,
    setCreativeStatus,
    addTag,
    createBoard,
    toggleBoardAsset,
    addProject,
    toggleBenchmark,
    setPixelDomain,
    verifyPixel,
    sendTestEvent,
    toggleDestination,
    toggleIntegration,
    createWorkspace,
    inviteMember,
    removeMember,
    updateProfile,
    updateCompany,
    setPref,
    changePlan,
    applyMove,
    saveReport,
    deleteReport,
    sendAi,
    resolveApproval,
    sendSupport,
    resetDemo,
    accountsInScope,
  }), [
    state, booting, login, signup, sendMagicLink, resetPassword, logout, setLocale, setWorkspace, dismissToast, markNotice, markAllNotices,
    deposit, settleDeposit, withdraw, claimCashback, addCard, removeCard, topUp, clearFunds, renameAccount, deleteAccount, saveAccountEntry,
    appealAccount, markAccountReady, requestAccount, setCampaignStatus, deleteCampaign, createCampaign, setLeadStatus,
    launchTemplate, addCreative, setCreativeStatus, addTag, createBoard, toggleBoardAsset, addProject,
    toggleBenchmark, setPixelDomain, verifyPixel, sendTestEvent, toggleDestination, toggleIntegration,
    createWorkspace, inviteMember, removeMember, updateProfile, updateCompany, setPref, changePlan, applyMove,
    saveReport, deleteReport, sendAi, resolveApproval, sendSupport, resetDemo, accountsInScope,
  ]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("Store missing");
  return ctx;
}

export function statusLabel(status: AccountStatus | CampaignStatus) {
  return status.replaceAll("_", " ");
}

export type { Objective };
