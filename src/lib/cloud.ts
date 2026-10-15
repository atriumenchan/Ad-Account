import type { User as AuthUser } from "@supabase/supabase-js";
import type {
  AccountStatus,
  AdAccount,
  AppState,
  Campaign,
  CampaignStatus,
  Currency,
  Member,
  Objective,
  Platform,
  Role,
  Transaction,
  Wallet,
  Workspace,
} from "../types";
import { supabase } from "./supabase";

export interface RemoteSlice {
  user: AppState["user"];
  workspaces: Workspace[];
  accounts: AdAccount[];
  campaigns: Campaign[];
  transactions: Transaction[];
  wallet: Wallet;
  members: Member[];
}

function num(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function appRole(role: string): Role {
  return role === "admin" ? "Admin" : "Viewer";
}

function dbRole(role: Role) {
  return role === "Admin" || role === "Owner" ? "admin" : "member";
}

export function applyRemote(prev: AppState, remote: RemoteSlice): AppState {
  return {
    ...prev,
    authed: true,
    syncError: null,
    user: remote.user,
    company: { ...prev.company, name: remote.user.company || "Admexo" },
    workspaces: remote.workspaces,
    accounts: remote.accounts,
    campaigns: remote.campaigns,
    transactions: remote.transactions,
    wallet: remote.wallet,
    members: remote.members,
  };
}

export async function fetchWorkspace(authUser: AuthUser): Promise<{ data: RemoteSlice | null; error: string | null }> {
  const [profileRes, workspaceRes, accountRes, campaignRes, txRes, walletRes, inviteRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle(),
    supabase.from("workspaces").select("*").order("name"),
    supabase.from("ad_accounts").select("*").order("created_at", { ascending: false }),
    supabase.from("campaigns").select("*"),
    supabase.from("transactions").select("*").order("created_at", { ascending: false }),
    supabase.from("wallet").select("*").eq("id", 1).maybeSingle(),
    supabase.from("invites").select("*"),
  ]);

  const failed = [profileRes, workspaceRes, accountRes, campaignRes, txRes, walletRes, inviteRes].find((result) => result.error);
  if (failed?.error) {
    return { data: null, error: "Supabase is connected, but the tables are not ready yet. Run supabase/schema.sql once in the SQL editor." };
  }
  if (!profileRes.data) {
    return { data: null, error: "This login has no profile yet. Confirm the email, then sign in again." };
  }

  const profile = profileRes.data;
  const people = await supabase.from("profiles").select("*").order("full_name");
  if (people.error) return { data: null, error: people.error.message };

  const members: Member[] = (people.data ?? []).map((row) => ({
    id: row.id,
    name: row.full_name || row.email,
    email: row.email,
    role: appRole(row.role),
    status: "active" as const,
  }));
  for (const invite of inviteRes.data ?? []) {
    if (members.some((member) => member.email.toLowerCase() === String(invite.email).toLowerCase())) continue;
    members.push({
      id: `invite_${invite.email}`,
      name: invite.full_name || invite.email,
      email: invite.email,
      role: appRole(invite.role),
      status: "invited",
    });
  }

  const workspaces: Workspace[] = (workspaceRes.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    region: row.region,
    currency: row.currency as Currency,
  }));

  return {
    error: null,
    data: {
      user: {
        name: profile.full_name || authUser.email || "Admin",
        email: profile.email || authUser.email || "",
        phone: profile.phone || "",
        company: profile.company || "Admexo",
        role: appRole(profile.role),
      },
      workspaces: workspaces.length ? workspaces : [{ id: "ws_main", name: "Admexo", region: "Global", currency: "USD" }],
      accounts: (accountRes.data ?? []).map((row) => ({
        id: row.id,
        workspaceId: row.workspace_id,
        name: row.name,
        platform: row.platform as Platform,
        status: row.status as AccountStatus,
        currency: row.currency as Currency,
        balance: num(row.balance),
        spend7d: num(row.spend_7d),
        spend30d: num(row.spend_30d),
        revenue30d: num(row.revenue_30d),
        businessManager: row.business_manager,
        page: row.page,
        timezone: row.timezone,
        createdAt: row.created_at,
        appeal: row.appeal,
      })),
      campaigns: (campaignRes.data ?? []).map((row) => ({
        id: row.id,
        accountId: row.account_id,
        name: row.name,
        objective: row.objective as Objective,
        status: row.status as CampaignStatus,
        dailyBudget: num(row.daily_budget),
        spend: num(row.spend),
        impressions: num(row.impressions),
        clicks: num(row.clicks),
        conversions: num(row.conversions),
        revenue: num(row.revenue),
        countries: row.countries ?? [],
        startDate: row.start_date ?? new Date().toISOString().slice(0, 10),
        endDate: row.end_date,
      })),
      transactions: (txRes.data ?? []).map((row) => ({
        id: row.id,
        type: row.type as Transaction["type"],
        amount: num(row.amount),
        status: row.status as Transaction["status"],
        method: row.method,
        description: row.description,
        createdAt: row.created_at,
        accountId: row.account_id ?? undefined,
      })),
      wallet: {
        available: num(walletRes.data?.available),
        pending: num(walletRes.data?.pending),
        cashback: num(walletRes.data?.cashback),
        currency: "USD",
      },
      members,
    },
  };
}

export async function pushOperational(state: AppState) {
  const workspaceRows = state.workspaces.map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    region: workspace.region,
    currency: workspace.currency,
  }));
  const accountRows = state.accounts.map((account) => ({
    id: account.id,
    workspace_id: account.workspaceId,
    name: account.name,
    platform: account.platform,
    status: account.status,
    currency: account.currency,
    balance: account.balance,
    spend_7d: account.spend7d,
    spend_30d: account.spend30d,
    revenue_30d: account.revenue30d,
    business_manager: account.businessManager,
    page: account.page,
    timezone: account.timezone,
    created_at: account.createdAt,
    appeal: account.appeal,
  }));
  const campaignRows = state.campaigns.map((campaign) => ({
    id: campaign.id,
    account_id: campaign.accountId,
    name: campaign.name,
    objective: campaign.objective,
    status: campaign.status,
    daily_budget: campaign.dailyBudget,
    spend: campaign.spend,
    impressions: campaign.impressions,
    clicks: campaign.clicks,
    conversions: campaign.conversions,
    revenue: campaign.revenue,
    countries: campaign.countries,
    start_date: campaign.startDate,
    end_date: campaign.endDate,
  }));
  const transactionRows = state.transactions.map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    status: tx.status,
    method: tx.method,
    description: tx.description,
    created_at: tx.createdAt,
    account_id: tx.accountId ?? null,
  }));
  const inviteRows = state.members
    .filter((member) => member.status === "invited")
    .map((member) => ({ email: member.email, full_name: member.name, role: dbRole(member.role) }));
  const accountKeep = new Set(accountRows.map((row) => row.id));
  const campaignKeep = new Set(campaignRows.map((row) => row.id));
  const [existingAccounts, existingCampaigns] = await Promise.all([
    supabase.from("ad_accounts").select("id"),
    supabase.from("campaigns").select("id"),
  ]);
  if (existingAccounts.error) return existingAccounts.error.message;
  if (existingCampaigns.error) return existingCampaigns.error.message;
  const removedCampaigns = (existingCampaigns.data ?? []).map((row) => String(row.id)).filter((id) => !campaignKeep.has(id));
  const removedAccounts = (existingAccounts.data ?? []).map((row) => String(row.id)).filter((id) => !accountKeep.has(id));
  if (removedCampaigns.length) {
    const removed = await supabase.from("campaigns").delete().in("id", removedCampaigns);
    if (removed.error) return removed.error.message;
  }
  if (removedAccounts.length) {
    const removed = await supabase.from("ad_accounts").delete().in("id", removedAccounts);
    if (removed.error) return removed.error.message;
  }

  const inviteKeep = new Set(inviteRows.map((row) => row.email.toLowerCase()));
  const existingInvites = await supabase.from("invites").select("email");
  if (existingInvites.error) return existingInvites.error.message;
  const removedInvites = (existingInvites.data ?? [])
    .map((row) => String(row.email))
    .filter((email) => !inviteKeep.has(email.toLowerCase()));
  if (removedInvites.length) {
    const removed = await supabase.from("invites").delete().in("email", removedInvites);
    if (removed.error) return removed.error.message;
  }

  const writes = [
    workspaceRows.length ? supabase.from("workspaces").upsert(workspaceRows) : null,
    supabase.from("wallet").upsert({ id: 1, available: state.wallet.available, pending: state.wallet.pending, cashback: state.wallet.cashback }),
    accountRows.length ? supabase.from("ad_accounts").upsert(accountRows) : null,
    campaignRows.length ? supabase.from("campaigns").upsert(campaignRows) : null,
    transactionRows.length ? supabase.from("transactions").upsert(transactionRows) : null,
    inviteRows.length ? supabase.from("invites").upsert(inviteRows) : null,
  ].filter((item) => item !== null);

  const results = await Promise.all(writes);
  const failed = results.find((result) => result.error);
  return failed?.error?.message ?? null;
}

export async function updateOwnProfile(userId: string, patch: { full_name?: string; phone?: string; company?: string }) {
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  return error?.message ?? null;
}

export { dbRole };
