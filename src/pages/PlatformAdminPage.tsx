import {
  Building2,
  ChevronRight,
  Copy,
  CreditCard,
  Download,
  History,
  KeyRound,
  LayoutDashboard,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { managedMerchants, platformAuditLogs, platformOperator } from "../data/mock";
import type { CreditGrant, ManagedMerchant, PlatformAuditLog, PlatformPageKey } from "../types";
import { cx } from "../utils";

interface PlatformAdminPageProps {
  onToast: (message: string) => void;
}

type MerchantStatusFilter = "全部" | ManagedMerchant["status"];

const statusFilters: MerchantStatusFilter[] = ["全部", "启用", "已停用"];

const nowText = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const generatePassword = () => `ZBX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const activeRemainingCredits = (grants: CreditGrant[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return grants
    .filter((grant) => new Date(grant.expiresAt).getTime() >= today.getTime())
    .reduce((sum, grant) => sum + grant.remaining, 0);
};

const creditSourceTotal = (grants: CreditGrant[], source: CreditGrant["source"]) => grants.filter((grant) => grant.source === source).reduce((sum, grant) => sum + grant.remaining, 0);

const expiringSoon = (expiresAt: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(today);
  deadline.setDate(deadline.getDate() + 15);
  return new Date(expiresAt).getTime() <= deadline.getTime();
};

const exportCsv = (fileName: string, header: string[], rows: Array<Array<string | number>>) => {
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, "\"\"")}"`).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export function PlatformAdminPage({ onToast }: PlatformAdminPageProps) {
  const [activePage, setActivePage] = useState<PlatformPageKey>("merchants");
  const [merchants, setMerchants] = useState<ManagedMerchant[]>(managedMerchants);
  const [logs, setLogs] = useState<PlatformAuditLog[]>(platformAuditLogs);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MerchantStatusFilter>("全部");
  const [selectedId, setSelectedId] = useState(managedMerchants[0]?.id ?? "");
  const [createOpen, setCreateOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [creditOpen, setCreditOpen] = useState(false);
  const [passwordResult, setPasswordResult] = useState<{ merchantName: string; account: string; password: string } | null>(null);

  const selectedMerchant = merchants.find((item) => item.id === selectedId) ?? merchants[0];

  const filteredMerchants = useMemo(() => {
    return merchants.filter((item) => {
      const matchesQuery =
        !query ||
        item.companyName.toLowerCase().includes(query.toLowerCase()) ||
        item.contactName.toLowerCase().includes(query.toLowerCase()) ||
        item.contactPhone.includes(query) ||
        item.primaryAccount.contact.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "全部" || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [merchants, query, statusFilter]);

  const metrics = useMemo(() => {
    const enabled = merchants.filter((item) => item.status === "启用").length;
    const expiring = merchants.filter((item) => item.status !== "已停用" && expiringSoon(item.expiresAt)).length;
    const lowCredits = merchants.filter((item) => item.status !== "已停用" && activeRemainingCredits(item.creditGrants) <= 20).length;
    return { total: merchants.length, enabled, expiring, lowCredits };
  }, [merchants]);

  function appendLog(merchantName: string, action: PlatformAuditLog["action"], detail: string) {
    setLogs((current) => [
      {
        id: `log-${Date.now()}`,
        time: nowText(),
        operator: platformOperator.name,
        merchantName,
        action,
        detail,
      },
      ...current,
    ]);
  }

  function createMerchant(form: CreateMerchantForm) {
    const password = generatePassword();
    const nextMerchant: ManagedMerchant = {
      id: `merchant-${Date.now()}`,
      companyName: form.companyName,
      contactName: form.contactName,
      contactPhone: form.contactPhone,
      status: "启用",
      plan: form.plan,
      seatsUsed: 1,
      seatsTotal: Number(form.seatsTotal),
      creditGrants: [
        {
          id: `grant-${Date.now()}`,
          source: "套餐额度",
          amount: Number(form.packageCredits),
          remaining: Number(form.packageCredits),
          expiresAt: form.packageExpiresAt,
          createdAt: nowText().slice(0, 10),
          note: `${form.plan}开通`,
        },
      ],
      remainingCredits: Number(form.packageCredits),
      usedCredits: 0,
      expiresAt: form.packageExpiresAt,
      createdAt: nowText().slice(0, 10),
      primaryAccount: {
        name: form.accountName,
        contact: form.accountPhone,
        status: "待首次登录",
        lastLoginAt: "未登录",
      },
      monthlyGenerations: 0,
      successRate: 0,
    };
    setMerchants((current) => [nextMerchant, ...current]);
    setSelectedId(nextMerchant.id);
    appendLog(nextMerchant.companyName, "开通商家", `创建${form.plan}商家，首笔套餐额度 ${form.packageCredits}，有效期至 ${form.packageExpiresAt}`);
    setPasswordResult({ merchantName: nextMerchant.companyName, account: form.accountPhone, password });
    setCreateOpen(false);
    onToast("商家已开通，请复制首账号初始密码");
  }

  function toggleMerchantStatus(merchant: ManagedMerchant) {
    const enabling = merchant.status === "已停用";
    setMerchants((current) =>
      current.map((item) =>
        item.id === merchant.id
          ? {
              ...item,
              status: enabling ? "启用" : "已停用",
              primaryAccount: { ...item.primaryAccount, status: enabling ? "启用" : "停用" },
            }
          : item,
      ),
    );
    appendLog(merchant.companyName, enabling ? "启用商家" : "停用商家", enabling ? "恢复商家和全部成员登录能力" : "立即中断商家全部成员登录");
    onToast(`${merchant.companyName} 已${enabling ? "启用" : "停用"}`);
  }

  function resetPassword(merchant: ManagedMerchant) {
    const password = generatePassword();
    setPasswordResult({ merchantName: merchant.companyName, account: merchant.primaryAccount.contact, password });
    appendLog(merchant.companyName, "重置首账号密码", `为首管理员账号 ${merchant.primaryAccount.contact} 生成临时密码`);
    onToast("临时密码已生成");
  }

  function updatePlanAndSeats(patch: { plan: string; seatsTotal: number }) {
    if (!selectedMerchant) return;
    setMerchants((current) => current.map((item) => (item.id === selectedMerchant.id ? { ...item, plan: patch.plan, seatsTotal: patch.seatsTotal } : item)));
    appendLog(selectedMerchant.companyName, "调整套餐席位", `套餐调整为 ${patch.plan}，总席位调整为 ${patch.seatsTotal}`);
    setPlanOpen(false);
    onToast("套餐与席位已更新");
  }

  function addCreditGrant(patch: { grant: CreditGrant }) {
    if (!selectedMerchant) return;
    setMerchants((current) =>
      current.map((item) => {
        if (item.id !== selectedMerchant.id) return item;
        const creditGrants = [...item.creditGrants, patch.grant];
        return { ...item, creditGrants, remainingCredits: activeRemainingCredits(creditGrants) };
      }),
    );
    appendLog(
      selectedMerchant.companyName,
      "新增额度批次",
      `新增${patch.grant.source} ${patch.grant.amount}，有效期至 ${patch.grant.expiresAt}`,
    );
    setCreditOpen(false);
    onToast("额度批次已新增");
  }

  function exportMerchants() {
    exportCsv(
      "zhiboxing-platform-merchants.csv",
      ["商家名称", "联系人", "联系手机号", "状态", "套餐", "已用席位", "总席位", "当前可用额度", "到期时间", "首账号手机号", "首账号状态", "本月生成", "本月消耗", "生成成功率"],
      filteredMerchants.map((merchant) => [
        merchant.companyName,
        merchant.contactName,
        merchant.contactPhone,
        merchant.status,
        merchant.plan,
        merchant.seatsUsed,
        merchant.seatsTotal,
        activeRemainingCredits(merchant.creditGrants),
        merchant.expiresAt,
        merchant.primaryAccount.contact,
        merchant.primaryAccount.status,
        merchant.monthlyGenerations,
        merchant.usedCredits,
        `${merchant.successRate}%`,
      ]),
    );
    onToast("商家列表已导出");
  }

  return (
    <>
      <aside className="fixed left-0 top-0 z-20 flex h-screen w-[248px] flex-col border-r border-line bg-white px-4 py-5">
        <div className="mb-7 flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center border border-line bg-white">
            <ShieldCheck className="text-brand" size={22} />
          </div>
          <div>
            <div className="text-base font-medium text-ink">智播星后台</div>
            <div className="text-xs tracking-[0.16em] text-muted">PLATFORM OPS</div>
          </div>
        </div>

        <nav className="space-y-2">
          <PlatformNavButton active={activePage === "merchants"} icon={Building2} label="商家管理" onClick={() => setActivePage("merchants")} />
          <PlatformNavButton active={activePage === "operations"} icon={History} label="操作日志" onClick={() => setActivePage("operations")} />
        </nav>

        <div className="mt-auto border border-line bg-canvas p-3">
          <div className="mb-3 text-xs text-muted">当前后台账号</div>
          <div className="flex items-center gap-3 bg-white p-3">
            <div className="flex h-9 w-9 items-center justify-center bg-brand text-sm font-semibold text-white">{platformOperator.name}</div>
            <div>
              <div className="text-sm font-medium text-ink">{platformOperator.name}</div>
              <div className="text-xs text-muted">{platformOperator.role}</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-h-screen pl-[248px]">
        <div className="mx-auto max-w-[1280px] px-8 py-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-ink">平台管理后台</h1>
              <p className="mt-1 text-sm text-muted">管理商家组织、套餐额度和商家第一个管理员账号。</p>
            </div>
            <button onClick={() => setCreateOpen(true)} className="flex h-10 items-center gap-2 bg-brand px-4 text-sm font-semibold text-white">
              <Plus size={16} />
              新增商家
            </button>
          </div>

          {activePage === "merchants" ? (
            <div className="space-y-4">
              <section className="grid grid-cols-4 gap-3">
                <AdminMetric icon={LayoutDashboard} label="商家总数" value={metrics.total} />
                <AdminMetric icon={Building2} label="启用商家" value={metrics.enabled} />
                <AdminMetric icon={CreditCard} label="15天内到期" value={metrics.expiring} />
                <AdminMetric icon={SlidersHorizontal} label="额度不足" value={metrics.lowCredits} />
              </section>

              <section className="grid grid-cols-[minmax(0,1.4fr)_420px] gap-4">
                <div className="border border-line bg-white p-5 shadow-panel">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="relative max-w-sm flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="搜索商家、联系人、手机号或首账号"
                        className="h-10 w-full border border-line bg-white pl-10 pr-3 text-sm outline-none focus:border-brand"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex border border-line p-1">
                        {statusFilters.map((item) => (
                          <button
                            key={item}
                            onClick={() => setStatusFilter(item)}
                            className={cx("h-8 px-3 text-xs font-medium", statusFilter === item ? "bg-brand text-white" : "text-muted hover:bg-canvas hover:text-ink")}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                      <button onClick={exportMerchants} className="flex h-10 items-center gap-2 border border-line bg-white px-3 text-sm text-muted hover:text-brand">
                        <Download size={15} />
                        导出商家
                      </button>
                    </div>
                  </div>

                  <div className="mb-2 grid grid-cols-[1.45fr_.65fr_.7fr_.7fr_.75fr_.9fr_.9fr_32px] gap-3 px-3 text-xs font-semibold text-muted">
                    <span>商家</span>
                    <span>状态</span>
                    <span>套餐</span>
                    <span>席位</span>
                    <span>额度</span>
                    <span>到期时间</span>
                    <span>首账号</span>
                    <span />
                  </div>
                  <div className="space-y-2">
                    {filteredMerchants.map((merchant) => (
                      <button
                        key={merchant.id}
                        onClick={() => setSelectedId(merchant.id)}
                        className={cx(
                          "grid w-full grid-cols-[1.45fr_.65fr_.7fr_.7fr_.75fr_.9fr_.9fr_32px] items-center gap-3 border px-3 py-3 text-left text-sm transition",
                          selectedMerchant?.id === merchant.id ? "border-brand bg-blue-50" : "border-line bg-canvas hover:border-brand",
                        )}
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium text-ink">{merchant.companyName}</div>
                          <div className="truncate text-xs text-muted">{merchant.contactName} · {merchant.contactPhone}</div>
                        </div>
                        <MerchantStatus status={merchant.status} />
                        <span className="text-muted">{merchant.plan}</span>
                        <span className="text-muted">{merchant.seatsUsed}/{merchant.seatsTotal}</span>
                        <span className={cx("font-medium", activeRemainingCredits(merchant.creditGrants) <= 20 ? "text-rose-600" : "text-muted")}>{activeRemainingCredits(merchant.creditGrants)}</span>
                        <span className="text-muted">{merchant.expiresAt}</span>
                        <AccountStatus status={merchant.primaryAccount.status} />
                        <ChevronRight className="text-muted" size={16} />
                      </button>
                    ))}
                  </div>
                </div>

                {selectedMerchant && (
                  <MerchantDetail
                    merchant={selectedMerchant}
                    onAdjustPlan={() => setPlanOpen(true)}
                    onAddCredit={() => setCreditOpen(true)}
                    onResetPassword={() => resetPassword(selectedMerchant)}
                    onToggleStatus={() => toggleMerchantStatus(selectedMerchant)}
                  />
                )}
              </section>
            </div>
          ) : (
            <AuditLogPanel logs={logs} onToast={onToast} />
          )}
        </div>
      </main>

      {createOpen && <CreateMerchantModal onClose={() => setCreateOpen(false)} onSubmit={createMerchant} />}
      {planOpen && selectedMerchant && <PlanSeatsModal merchant={selectedMerchant} onClose={() => setPlanOpen(false)} onSubmit={updatePlanAndSeats} />}
      {creditOpen && selectedMerchant && <CreditGrantModal merchant={selectedMerchant} onClose={() => setCreditOpen(false)} onSubmit={addCreditGrant} />}
      {passwordResult && <PasswordResultModal result={passwordResult} onClose={() => setPasswordResult(null)} onToast={onToast} />}
    </>
  );
}

function PlatformNavButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Building2; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cx("flex h-10 w-full items-center gap-3 px-3 text-sm transition", active ? "bg-brand text-white" : "text-muted hover:bg-canvas hover:text-ink")}>
      <Icon size={17} />
      {label}
    </button>
  );
}

function AdminMetric({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: number }) {
  return (
    <div className="border border-line bg-white p-4 shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-muted">{label}</span>
        <Icon className="text-brand" size={17} />
      </div>
      <div className="text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function MerchantDetail({
  merchant,
  onAdjustPlan,
  onAddCredit,
  onResetPassword,
  onToggleStatus,
}: {
  merchant: ManagedMerchant;
  onAdjustPlan: () => void;
  onAddCredit: () => void;
  onResetPassword: () => void;
  onToggleStatus: () => void;
}) {
  const disabled = merchant.status === "已停用";

  return (
    <aside className="border border-line bg-white p-5 shadow-panel">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-ink">{merchant.companyName}</div>
          <div className="mt-1 text-sm text-muted">创建于 {merchant.createdAt}</div>
        </div>
        <MerchantStatus status={merchant.status} />
      </div>

      <div className={cx("mb-5 border p-3 text-sm", disabled ? "border-rose-100 bg-rose-50 text-rose-700" : "border-line bg-canvas text-muted")}>
        {disabled ? "商家已停用，商家端全部成员不可登录。启用后可恢复商家登录能力。" : "平台后台用于商家组织开通和运营管理，商家内部成员仍在商家端团队页维护。"}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <DetailMetric label="本月生成" value={`${merchant.monthlyGenerations} 次`} />
        <DetailMetric label="生成成功率" value={`${merchant.successRate}%`} />
        <DetailMetric label="已用席位" value={`${merchant.seatsUsed}/${merchant.seatsTotal}`} />
        <DetailMetric label="本月消耗" value={`${merchant.usedCredits}`} />
      </div>

      <div className="mb-5 space-y-2 text-sm">
        <DetailRow label="联系人" value={`${merchant.contactName} · ${merchant.contactPhone}`} />
        <DetailRow label="套餐" value={merchant.plan} />
        <DetailRow label="当前可用额度" value={`${activeRemainingCredits(merchant.creditGrants)}`} />
        <DetailRow
          label="额度来源"
          value={`套餐 ${creditSourceTotal(merchant.creditGrants, "套餐额度")} / 赠送 ${creditSourceTotal(merchant.creditGrants, "赠送额度")} / 手工 ${creditSourceTotal(merchant.creditGrants, "手工调整额度")}`}
        />
        <DetailRow label="到期时间" value={merchant.expiresAt} />
      </div>

      <div className="mb-5 border border-line bg-white p-4">
        <div className="mb-3 text-sm font-semibold text-ink">额度批次</div>
        <div className="space-y-2">
          {merchant.creditGrants.map((grant) => (
            <div key={grant.id} className="grid grid-cols-[.9fr_.6fr_.6fr_.8fr] gap-2 bg-canvas px-3 py-2 text-xs">
              <span className="font-medium text-ink">{grant.source}</span>
              <span className="text-muted">剩 {grant.remaining}/{grant.amount}</span>
              <span className="text-muted">{grant.expiresAt}</span>
              <span className="truncate text-muted">{grant.note}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5 border border-line bg-canvas p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <UserRound size={16} />
          首个管理员账号
        </div>
        <DetailRow label="姓名" value={merchant.primaryAccount.name} />
        <DetailRow label="手机号" value={merchant.primaryAccount.contact} />
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted">状态</span>
          <AccountStatus status={merchant.primaryAccount.status} />
        </div>
        <DetailRow label="最近登录" value={merchant.primaryAccount.lastLoginAt} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onAdjustPlan} className="h-10 border border-line bg-white text-sm font-medium text-muted hover:text-brand">调整套餐/席位</button>
        <button onClick={onAddCredit} className="h-10 border border-line bg-white text-sm font-medium text-muted hover:text-brand">新增额度批次</button>
        <button onClick={onResetPassword} className="flex h-10 items-center justify-center gap-2 border border-line bg-white text-sm font-medium text-muted hover:text-brand">
          <KeyRound size={15} />
          重置密码
        </button>
        <button onClick={onToggleStatus} className={cx("h-10 text-sm font-semibold text-white", disabled ? "bg-emerald-600" : "bg-rose-600")}>
          {disabled ? "启用商家" : "停用商家"}
        </button>
      </div>
    </aside>
  );
}

function AuditLogPanel({ logs, onToast }: { logs: PlatformAuditLog[]; onToast: (message: string) => void }) {
  function exportLogs() {
    exportCsv("zhiboxing-platform-audit-logs.csv", ["时间", "操作人", "商家", "动作", "详情"], logs.map((log) => [log.time, log.operator, log.merchantName, log.action, log.detail]));
    onToast("操作日志已导出");
  }

  return (
    <section className="border border-line bg-white p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-semibold text-ink">操作日志</div>
        <button onClick={exportLogs} className="flex h-9 items-center gap-2 border border-line bg-white px-3 text-sm text-muted hover:text-brand">
          <Download size={15} />
          导出日志
        </button>
      </div>
      <div className="mb-2 grid grid-cols-[1fr_.75fr_1.1fr_.8fr_1.8fr] gap-3 px-3 text-xs font-semibold text-muted">
        <span>时间</span>
        <span>操作人</span>
        <span>商家</span>
        <span>动作</span>
        <span>详情</span>
      </div>
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="grid grid-cols-[1fr_.75fr_1.1fr_.8fr_1.8fr] gap-3 bg-canvas px-3 py-3 text-sm">
            <span className="text-muted">{log.time}</span>
            <span className="font-medium text-ink">{log.operator}</span>
            <span className="truncate text-muted">{log.merchantName}</span>
            <span className="text-brand">{log.action}</span>
            <span className="truncate text-muted">{log.detail}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

type CreateMerchantForm = {
  companyName: string;
  contactName: string;
  contactPhone: string;
  plan: string;
  seatsTotal: string;
  packageCredits: string;
  packageExpiresAt: string;
  accountName: string;
  accountPhone: string;
};

function CreateMerchantModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (form: CreateMerchantForm) => void }) {
  const [form, setForm] = useState<CreateMerchantForm>({
    companyName: "",
    contactName: "",
    contactPhone: "",
    plan: "专业版",
    seatsTotal: "5",
    packageCredits: "100",
    packageExpiresAt: "2026-07-31",
    accountName: "",
    accountPhone: "",
  });

  function update<K extends keyof CreateMerchantForm>(key: K, value: CreateMerchantForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    if (!form.companyName || !form.contactName || !form.contactPhone || !form.accountName || !form.accountPhone) return;
    onSubmit(form);
  }

  return (
    <DialogShell title="新增商家" onClose={onClose} width="max-w-3xl">
      <div className="grid grid-cols-2 gap-5">
        <div>
          <div className="mb-3 text-sm font-semibold text-ink">商家信息</div>
          <Field label="商家名称" value={form.companyName} onChange={(value) => update("companyName", value)} />
          <Field label="联系人" value={form.contactName} onChange={(value) => update("contactName", value)} />
          <Field label="联系手机号" value={form.contactPhone} onChange={(value) => update("contactPhone", value)} />
          <SelectField label="套餐" value={form.plan} options={["试用版", "基础版", "专业版", "旗舰版"]} onChange={(value) => update("plan", value)} />
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold text-ink">开通配置</div>
          <Field label="席位数" value={form.seatsTotal} type="number" onChange={(value) => update("seatsTotal", value)} />
          <Field label="套餐额度" value={form.packageCredits} type="number" onChange={(value) => update("packageCredits", value)} />
          <Field label="套餐额度有效期" value={form.packageExpiresAt} type="date" onChange={(value) => update("packageExpiresAt", value)} />
          <div className="border border-line bg-canvas p-3 text-sm text-muted">开通时只生成首笔套餐额度。后续赠送、补偿或手工调整通过“新增额度批次”追加，每笔额度有自己的有效期。</div>
          <div className="border border-line bg-canvas p-3 text-sm text-muted">首账号固定创建为商家管理员，普通账号后续由商家端团队页添加。</div>
        </div>
      </div>
      <div className="mt-5 border-t border-line pt-5">
        <div className="mb-3 text-sm font-semibold text-ink">首个管理员账号</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="账号姓名" value={form.accountName} onChange={(value) => update("accountName", value)} />
          <Field label="登录手机号" value={form.accountPhone} type="tel" onChange={(value) => update("accountPhone", value)} />
        </div>
      </div>
      <div className="sticky bottom-0 -mx-5 -mb-5 mt-5 flex justify-end gap-2 border-t border-line bg-white px-5 py-4">
        <button onClick={onClose} className="h-10 border border-line px-4 text-sm text-muted">取消</button>
        <button onClick={submit} className="h-10 bg-brand px-4 text-sm font-semibold text-white">开通并生成初始密码</button>
      </div>
    </DialogShell>
  );
}

function PlanSeatsModal({
  merchant,
  onClose,
  onSubmit,
}: {
  merchant: ManagedMerchant;
  onClose: () => void;
  onSubmit: (patch: { plan: string; seatsTotal: number }) => void;
}) {
  const [plan, setPlan] = useState(merchant.plan);
  const [seatsTotal, setSeatsTotal] = useState(String(merchant.seatsTotal));

  return (
    <DialogShell title="调整套餐/席位" onClose={onClose}>
      <div className="mb-4 border border-line bg-canvas p-3 text-sm text-muted">
        套餐和席位是商家的订阅权益。升降级套餐、增减购席位只更新权益配置；如需补发或扣减额度，请另行新增额度批次。
      </div>
      <SelectField label="套餐" value={plan} options={["试用版", "基础版", "专业版", "旗舰版"]} onChange={setPlan} />
      <Field label="席位数" value={seatsTotal} type="number" onChange={setSeatsTotal} />
      <div className="mb-3 text-xs text-muted">当前已用席位 {merchant.seatsUsed} 个，减购后总席位不能低于已用席位。</div>
      <div className="mt-5 flex justify-end gap-2 border-t border-line pt-4">
        <button onClick={onClose} className="h-10 border border-line px-4 text-sm text-muted">取消</button>
        <button onClick={() => onSubmit({ plan, seatsTotal: Math.max(Number(seatsTotal), merchant.seatsUsed) })} className="h-10 bg-brand px-4 text-sm font-semibold text-white">
          保存套餐/席位
        </button>
      </div>
    </DialogShell>
  );
}

function CreditGrantModal({
  merchant,
  onClose,
  onSubmit,
}: {
  merchant: ManagedMerchant;
  onClose: () => void;
  onSubmit: (patch: { grant: CreditGrant }) => void;
}) {
  const [source, setSource] = useState<CreditGrant["source"]>("赠送额度");
  const [amount, setAmount] = useState("20");
  const [expiresAt, setExpiresAt] = useState(merchant.expiresAt);
  const [note, setNote] = useState("");

  return (
    <DialogShell title="新增额度批次" onClose={onClose}>
      <div className="mb-4 border border-line bg-canvas p-3 text-sm text-muted">
        当前可用额度由未过期额度批次的剩余量汇总得出。此处只新增额度批次，不调整套餐和席位。
      </div>
      <SelectField label="额度来源" value={source} options={["套餐额度", "赠送额度", "手工调整额度"]} onChange={(value) => setSource(value as CreditGrant["source"])} />
      <Field label="新增额度" value={amount} type="number" onChange={setAmount} />
      <Field label="本批次有效期" value={expiresAt} type="date" onChange={setExpiresAt} />
      <Field label="备注" value={note} onChange={setNote} />
      <div className="mt-5 flex justify-end gap-2 border-t border-line pt-4">
        <button onClick={onClose} className="h-10 border border-line px-4 text-sm text-muted">取消</button>
        <button
          onClick={() =>
            onSubmit({
              grant: {
                id: `grant-${Date.now()}`,
                source,
                amount: Number(amount),
                remaining: Number(amount),
                expiresAt,
                createdAt: nowText().slice(0, 10),
                note: note || "后台新增",
              },
            })
          }
          className="h-10 bg-brand px-4 text-sm font-semibold text-white"
        >
          新增批次
        </button>
      </div>
    </DialogShell>
  );
}

function PasswordResultModal({
  result,
  onClose,
  onToast,
}: {
  result: { merchantName: string; account: string; password: string };
  onClose: () => void;
  onToast: (message: string) => void;
}) {
  function copyPassword() {
    void navigator.clipboard?.writeText(result.password);
    onToast("初始密码已复制");
  }

  return (
    <DialogShell title="首账号初始密码" onClose={onClose}>
      <div className="border border-emerald-100 bg-emerald-50 p-4 text-emerald-700">
        <div className="font-semibold">{result.merchantName}</div>
        <div className="mt-1 text-sm">手机号：{result.account}</div>
      </div>
      <div className="mt-4 flex items-center justify-between border border-line bg-canvas px-4 py-3">
        <span className="font-mono text-base font-semibold text-ink">{result.password}</span>
        <button onClick={copyPassword} className="flex h-9 items-center gap-2 border border-line bg-white px-3 text-sm text-muted hover:text-brand">
          <Copy size={15} />
          复制密码
        </button>
      </div>
      <div className="mt-3 text-sm text-muted">密码仅展示一次。关闭后如需再次获取，必须重置首账号密码。</div>
      <div className="mt-5 flex justify-end">
        <button onClick={onClose} className="h-10 bg-brand px-4 text-sm font-semibold text-white">完成</button>
      </div>
    </DialogShell>
  );
}

function DialogShell({ title, children, onClose, width = "max-w-lg" }: { title: string; children: React.ReactNode; onClose: () => void; width?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/24 px-6 py-6 backdrop-blur-sm">
      <div className={cx("flex max-h-[calc(100vh-48px)] w-full flex-col border border-line bg-white shadow-soft", width)}>
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
          <div className="text-lg font-semibold text-ink">{title}</div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center border border-line text-muted hover:text-ink">
            <X size={17} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <input value={value} type={type} onChange={(event) => onChange(event.target.value)} className="h-10 w-full border border-line bg-white px-3 text-sm outline-none focus:border-brand" />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full border border-line bg-white px-3 text-sm outline-none focus:border-brand">
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-canvas p-3">
      <div className="text-lg font-semibold text-ink">{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-1 text-sm">
      <span className="text-muted">{label}</span>
      <span className="truncate font-medium text-ink">{value}</span>
    </div>
  );
}

function MerchantStatus({ status }: { status: ManagedMerchant["status"] }) {
  const color = status === "启用" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500";
  return <span className={cx("w-fit px-2 py-1 text-xs font-semibold", color)}>{status}</span>;
}

function AccountStatus({ status }: { status: ManagedMerchant["primaryAccount"]["status"] }) {
  const color = status === "启用" ? "bg-emerald-50 text-emerald-700" : status === "待首次登录" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500";
  return <span className={cx("w-fit px-2 py-1 text-xs font-semibold", color)}>{status}</span>;
}
