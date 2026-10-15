import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout } from "./components/AuthLayout";
import { Shell } from "./components/Shell";
import { useStore } from "./lib/store";
import { AccountDetailPage } from "./pages/AccountDetail";
import { AccountRequestPage } from "./pages/AccountRequest";
import { AccountsPage } from "./pages/Accounts";
import { AdsPage } from "./pages/Ads";
import { AffiliatePage } from "./pages/Affiliate";
import { AiPage } from "./pages/Ai";
import { CampaignDetailPage } from "./pages/CampaignDetail";
import { CampaignFormPage } from "./pages/CampaignForm";
import { ChangelogPage } from "./pages/Changelog";
import { CreativePage } from "./pages/Creative";
import { ForgotPage } from "./pages/Forgot";
import { HomePage } from "./pages/Home";
import { IntegrationsPage } from "./pages/Integrations";
import { IntelligencePage } from "./pages/Intelligence";
import { LauncherPage } from "./pages/Launcher";
import { LegalPage } from "./pages/Legal";
import { LoginPage } from "./pages/Login";
import { MagicPage } from "./pages/Magic";
import { PixelPage } from "./pages/Pixel";
import { ResearchPage } from "./pages/Research";
import { SettingsPage } from "./pages/Settings";
import { SignupPage } from "./pages/Signup";
import { SubscriptionsPage } from "./pages/Subscriptions";
import { WalletPage } from "./pages/Wallet";
import { WorkspacesPage } from "./pages/Workspaces";

function Loading() {
  return <div className="grid min-h-screen place-items-center bg-white text-sm text-muted">Loading Admexo Workspace…</div>;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { state, booting } = useStore();
  if (booting) return <Loading />;
  if (!state.authed) return <Navigate to="/login" replace />;
  return children;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { state, booting } = useStore();
  if (booting) return <Loading />;
  if (state.authed) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/terms" element={<LegalPage kind="terms" />} />
      <Route path="/privacy" element={<LegalPage kind="privacy" />} />
      <Route element={<GuestOnly><AuthLayout /></GuestOnly>}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot" element={<ForgotPage />} />
        <Route path="/magic" element={<MagicPage />} />
      </Route>
      <Route element={<RequireAuth><Shell /></RequireAuth>}>
        <Route path="/" element={<HomePage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/accounts/new" element={<AccountRequestPage />} />
        <Route path="/accounts/:id" element={<AccountDetailPage />} />
        <Route path="/ads" element={<AdsPage />} />
        <Route path="/ads/new" element={<CampaignFormPage />} />
        <Route path="/ads/:id" element={<CampaignDetailPage />} />
        <Route path="/launcher" element={<LauncherPage />} />
        <Route path="/pixel" element={<PixelPage />} />
        <Route path="/creative" element={<CreativePage />} />
        <Route path="/research" element={<ResearchPage />} />
        <Route path="/intelligence" element={<IntelligencePage />} />
        <Route path="/ai" element={<AiPage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
        <Route path="/workspaces" element={<WorkspacesPage />} />
        <Route path="/affiliate" element={<AffiliatePage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
