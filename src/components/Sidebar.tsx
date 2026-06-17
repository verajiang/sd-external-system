import { CreditCard, Sparkles, Users, FolderOpen, Crown, KeyRound, LogOut, X } from "lucide-react";
import { useState } from "react";
import type { Merchant, PageKey, User } from "../types";
import { cx } from "../utils";

interface SidebarProps {
  activePage: PageKey;
  onPageChange: (page: PageKey) => void;
  onUsageDetails: () => void;
  merchant: Merchant;
  user: User;
  quotaLimit?: number;
  onLogout: () => void;
  onToast: (message: string) => void;
}

const items: Array<{ key: PageKey; label: string; icon: typeof Sparkles }> = [
  { key: "generate", label: "生成", icon: Sparkles },
  { key: "assets", label: "资产", icon: FolderOpen },
  { key: "team", label: "团队", icon: Users },
];

export function Sidebar({ activePage, onPageChange, onUsageDetails, merchant, user, quotaLimit, onLogout, onToast }: SidebarProps) {
  const [showPlan, setShowPlan] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const visibleItems = items.filter((item) => item.key !== "team" || user.role === "管理员");
  const avatarText = user.name.slice(0, 2).toUpperCase();
  const isAdmin = user.role === "管理员";

  function handleUsageDetails() {
    setShowPlan(false);
    if (user.role !== "管理员") {
      onToast("普通账号仅可查看自己的生成记录");
      return;
    }
    onUsageDetails();
  }

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-[248px] flex-col border-r border-line bg-white/90 px-4 py-5 backdrop-blur">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-panel">
          <img src="./zhiboxing-logo.png" alt="智播星 logo" className="h-full w-full object-cover" />
        </div>
        <div>
          <div className="text-base font-semibold text-ink">智播星</div>
          <div className="text-xs tracking-[0.18em] text-muted">ZHI BO XING</div>
        </div>
      </div>

      <nav className="space-y-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onPageChange(item.key)}
              className={cx(
                "flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm transition",
                active ? "bg-ink text-white shadow-panel" : "text-muted hover:bg-canvas hover:text-ink",
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="relative rounded-3xl border border-line bg-canvas p-3">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <CreditCard size={14} />
              {isAdmin ? "剩余额度" : "我的剩余额度"}
            </span>
            <span className="font-semibold text-ink">{merchant.remainingCredits}</span>
          </div>
          {isAdmin ? (
            <button
              onClick={() => setShowPlan((value) => !value)}
              className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-medium text-ink shadow-sm hover:text-brand"
            >
              <Crown size={15} />
              升级套餐
            </button>
          ) : (
            <div className="mt-3 space-y-2 rounded-2xl bg-white px-3 py-2 text-xs shadow-sm">
              <Info label="本月分配" value={`${quotaLimit ?? merchant.remainingCredits}`} />
              <Info label="本月已用" value={`${merchant.usedCredits}`} />
            </div>
          )}

          {isAdmin && showPlan && (
            <div className="absolute bottom-[104px] left-2 w-[260px] rounded-3xl border border-line bg-white p-4 shadow-soft">
              <div className="mb-3 text-sm font-semibold text-ink">套餐与额度</div>
              <div className="space-y-2 text-sm">
                <Info label="当前套餐" value={merchant.plan} />
                <Info label="本月剩余额度" value={`${merchant.remainingCredits}`} />
                <Info label="已用额度" value={`${merchant.usedCredits}`} />
                <Info label="席位" value={`${merchant.seatsUsed}/${merchant.seatsTotal}`} />
                <Info label="到期时间" value={merchant.expiresAt} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={handleUsageDetails} className="rounded-2xl border border-line px-3 py-2 text-xs text-muted hover:text-ink">查看用量明细</button>
                <button className="rounded-2xl bg-brand px-3 py-2 text-xs font-medium text-white">升级套餐</button>
              </div>
            </div>
          )}
        </div>

        <div className="group relative">
          <div className="pointer-events-none absolute bottom-[74px] left-0 hidden w-full rounded-3xl border border-line bg-white p-2 shadow-soft group-hover:pointer-events-auto group-hover:block">
            <button
              onClick={() => setShowPassword(true)}
              className="flex h-10 w-full items-center gap-2 rounded-2xl px-3 text-sm font-medium text-muted hover:bg-canvas hover:text-ink"
            >
              <KeyRound size={16} />
              修改密码
            </button>
            <button
              onClick={onLogout}
              className="mt-1 flex h-10 w-full items-center gap-2 rounded-2xl px-3 text-sm font-medium text-muted hover:bg-canvas hover:text-ink"
            >
              <LogOut size={16} />
              退出登录
            </button>
          </div>
          <div className="flex items-center gap-3 rounded-3xl border border-line bg-white p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-cyan text-sm font-semibold text-white">
              {avatarText}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-ink">{user.name}</div>
              <div className="truncate text-xs text-muted">
                {user.role} · {merchant.companyName}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showPassword && <PasswordModal onClose={() => setShowPassword(false)} onToast={onToast} />}
    </aside>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

function PasswordModal({ onClose, onToast }: { onClose: () => void; onToast: (message: string) => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  function save() {
    if (!password || !confirm) {
      onToast("请填写新密码");
      return;
    }
    if (password !== confirm) {
      onToast("两次密码不一致");
      return;
    }
    onToast("密码已修改");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/24 px-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-line bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-semibold text-ink">修改密码</div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted hover:text-ink">
            <X size={17} />
          </button>
        </div>
        <div className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-2xl border border-line px-4 text-sm outline-none focus:border-brand"
            placeholder="新密码"
          />
          <input
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className="h-11 w-full rounded-2xl border border-line px-4 text-sm outline-none focus:border-brand"
            placeholder="确认新密码"
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-2xl border border-line px-4 py-2 text-sm text-muted">取消</button>
          <button onClick={save} className="rounded-2xl bg-ink px-4 py-2 text-sm font-semibold text-white">保存</button>
        </div>
      </div>
    </div>
  );
}
