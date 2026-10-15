export type Platform = "Meta" | "Google" | "TikTok" | "Snapchat" | "Taboola" | "Bing";

export type AccountStatus = "active" | "paused" | "restricted" | "disabled" | "pending" | "in_review";

export type CampaignStatus = "active" | "paused" | "draft" | "in_review" | "rejected";

export type Objective = "Sales" | "Leads" | "Traffic" | "Awareness";

export type Currency = "USD" | "EUR" | "GBP";

export type Role = "Owner" | "Admin" | "Buyer" | "Finance" | "Viewer";

export type PlanId = "starter" | "growth" | "scale";

export interface User {
  name: string;
  email: string;
  phone: string;
  company: string;
  role: Role;
}

export interface Workspace {
  id: string;
  name: string;
  region: string;
  currency: Currency;
}

export interface AdAccount {
  id: string;
  workspaceId: string;
  name: string;
  platform: Platform;
  status: AccountStatus;
  currency: Currency;
  balance: number;
  spend7d: number;
  spend30d: number;
  revenue30d: number;
  businessManager: string;
  page: string;
  timezone: string;
  createdAt: string;
  appeal: string | null;
}

export interface Campaign {
  id: string;
  accountId: string;
  name: string;
  objective: Objective;
  status: CampaignStatus;
  dailyBudget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  countries: string[];
  startDate: string;
  endDate: string | null;
}

export interface Lead {
  id: string;
  campaignId: string;
  name: string;
  email: string;
  at: string;
  status: "new" | "contacted";
}

export interface Transaction {
  id: string;
  type: "deposit" | "topup" | "withdrawal" | "cashback" | "fee" | "refund";
  amount: number;
  status: "completed" | "pending" | "failed";
  method: string;
  description: string;
  createdAt: string;
  accountId?: string;
}

export interface Card {
  id: string;
  brand: string;
  last4: string;
  exp: string;
}

export interface Wallet {
  available: number;
  pending: number;
  cashback: number;
  currency: "USD";
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "invited";
}

export interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  connected: boolean;
  lastSync: string | null;
}

export interface CreativeAsset {
  id: string;
  name: string;
  kind: "image" | "video" | "carousel";
  status: "ready" | "draft" | "archived" | "retired";
  project: string;
  tags: string[];
  spend: number;
  roas: number;
  origin: "uploaded" | "generated" | "imported";
}

export interface Board {
  id: string;
  name: string;
  description: string;
  assetIds: string[];
}

export interface Benchmark {
  id: string;
  advertiser: string;
  platform: Platform;
  headline: string;
  hook: string;
  daysRunning: number;
  saved: boolean;
}

export interface PixelDestination {
  id: string;
  name: string;
  connected: boolean;
  successRate: number;
}

export interface PixelEvent {
  id: string;
  name: string;
  count24h: number;
  lastSeen: string;
  healthy: boolean;
}

export interface PixelState {
  id: string;
  domain: string;
  verified: boolean;
  events: PixelEvent[];
  destinations: PixelDestination[];
}

export interface LaunchTemplate {
  id: string;
  name: string;
  platform: Platform;
  objective: Objective;
  dailyBudget: number;
  notes: string;
}

export interface Invoice {
  id: string;
  plan: string;
  amount: number;
  status: "paid" | "open";
  issuedAt: string;
}

export interface BudgetMove {
  id: string;
  fromId: string;
  toId: string;
  amount: number;
  reason: string;
  applied: boolean;
}

export interface SavedReport {
  id: string;
  name: string;
  range: string;
  summary: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  text: string;
  at: string;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  at: string;
}

export interface AiApproval {
  id: string;
  label: string;
  kind: "pause" | "topup";
  campaignId?: string;
  accountId?: string;
  amount?: number;
  status: "pending" | "approved" | "dismissed";
}

export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  at: string;
  approval?: AiApproval;
}

export interface SupportMessage {
  id: string;
  from: "you" | "agent";
  text: string;
  at: string;
}

export interface ChangelogEntry {
  id: string;
  date: string;
  title: string;
  body: string;
  tag: string;
}

export interface AffiliateState {
  code: string;
  clicks: number;
  signups: number;
  spendReferred: number;
  rate: number;
  payouts: { id: string; amount: number; at: string; status: "paid" | "scheduled" }[];
}

export interface NotifPrefs {
  spend: boolean;
  restrictions: boolean;
  launches: boolean;
  product: boolean;
}

export interface AppState {
  authed: boolean;
  locale: string;
  user: User;
  company: { name: string; website: string; country: string };
  plan: PlanId;
  workspaceId: string;
  workspaces: Workspace[];
  wallet: Wallet;
  cards: Card[];
  transactions: Transaction[];
  accounts: AdAccount[];
  campaigns: Campaign[];
  leads: Lead[];
  members: Member[];
  integrations: Integration[];
  creatives: CreativeAsset[];
  boards: Board[];
  projects: string[];
  benchmarks: Benchmark[];
  pixel: PixelState;
  templates: LaunchTemplate[];
  invoices: Invoice[];
  budgetMoves: BudgetMove[];
  reports: SavedReport[];
  activity: ActivityItem[];
  notices: Notice[];
  ai: AiMessage[];
  support: SupportMessage[];
  changelog: ChangelogEntry[];
  affiliate: AffiliateState;
  prefs: NotifPrefs;
  toasts: { id: string; message: string }[];
  syncError: string | null;
}
