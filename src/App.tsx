import { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { currentUser, memberUser, merchant, teamMembers } from "./data/mock";
import { AssetPage } from "./pages/AssetPage";
import { GeneratePage } from "./pages/GeneratePage";
import { LoginPage } from "./pages/LoginPage";
import { PlatformAdminPage } from "./pages/PlatformAdminPage";
import { TeamPage } from "./pages/TeamPage";
import { UsageDetailsPage } from "./pages/UsageDetailsPage";
import type { PageKey } from "./types";

const pageFromHash = (): PageKey => {
  const value = window.location.hash.replace("#", "");
  if (value === "assets") return "assets";
  if (value.startsWith("team")) return "team";
  if (value === "usage") return "usage";
  return "generate";
};

export default function App() {
  const isPlatformAdmin = new URLSearchParams(window.location.search).get("app") === "admin" || window.location.hash === "#admin";
  const initialRole = new URLSearchParams(window.location.search).get("account") === "member" ? "普通账号" : "管理员";
  const [loginRole, setLoginRole] = useState<"管理员" | "普通账号">(initialRole);
  const [authenticated, setAuthenticated] = useState(false);
  const user = loginRole === "普通账号" ? memberUser : currentUser;
  const currentMember = teamMembers.find((member) => member.name === user.name);
  const accountCreditLimit = currentMember?.quotaLimit ?? merchant.remainingCredits;
  const accountUsedCredits = currentMember?.monthlyCredits ?? merchant.usedCredits;
  const accountRemainingCredits =
    user.role === "管理员" ? merchant.remainingCredits : Math.max(accountCreditLimit - accountUsedCredits, 0);
  const visibleMerchant =
    user.role === "管理员"
      ? merchant
      : {
          ...merchant,
          remainingCredits: accountRemainingCredits,
          usedCredits: accountUsedCredits,
        };
  const [activePage, setActivePage] = useState<PageKey>(pageFromHash);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const onHashChange = () => setActivePage(pageFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (user.role !== "管理员" && ["team", "usage"].includes(activePage)) {
      setActivePage("generate");
      window.location.hash = "";
    }
  }, [activePage, user.role]);

  function changePage(page: PageKey) {
    if (["team", "usage"].includes(page) && user.role !== "管理员") {
      setToast("普通账号无管理权限");
      return;
    }
    setActivePage(page);
    window.location.hash = page === "generate" ? "" : page;
  }

  function openUsageDetails() {
    if (user.role !== "管理员") {
      setToast("普通账号仅可查看自己的生成记录");
      return;
    }
    window.location.hash = "usage";
    setActivePage("usage");
  }

  function login() {
    setAuthenticated(true);
    setToast(`${user.name} 已登录`);
  }

  function logout() {
    setAuthenticated(false);
    setActivePage("generate");
    window.location.hash = "";
    setToast("已退出登录");
  }

  if (isPlatformAdmin) {
    return (
      <>
        <PlatformAdminPage onToast={setToast} />
        {toast && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-soft">
            {toast}
          </div>
        )}
      </>
    );
  }

  if (!authenticated) {
    return (
      <>
        <LoginPage role={loginRole} onRoleChange={setLoginRole} onLogin={login} onToast={setToast} />
        {toast && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-soft">
            {toast}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <Sidebar
        activePage={activePage}
        onPageChange={changePage}
        onUsageDetails={openUsageDetails}
        merchant={visibleMerchant}
        user={user}
        quotaLimit={user.role === "管理员" ? undefined : accountCreditLimit}
        onLogout={logout}
        onToast={setToast}
      />
      {activePage === "generate" && <GeneratePage user={user} merchant={visibleMerchant} onToast={setToast} />}
      {activePage === "assets" && <AssetPage user={user} onToast={setToast} />}
      {activePage === "team" && user.role === "管理员" && <TeamPage onToast={setToast} />}
      {activePage === "usage" && user.role === "管理员" && <UsageDetailsPage onToast={setToast} />}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-soft">
          {toast}
        </div>
      )}
    </>
  );
}
