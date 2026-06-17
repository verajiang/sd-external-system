import { AlertTriangle, Copy, Crown, Download, FileCheck2, KeyRound, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { merchant, teamMembers as initialMembers, teamUsageRecords } from "../data/mock";
import type { TeamMember } from "../types";
import { cx } from "../utils";

type TeamTab = "成员管理" | "席位管理" | "子账号消耗" | "成员额度";

interface TeamPageProps {
  onToast: (message: string) => void;
}

const tabs: TeamTab[] = ["成员管理", "席位管理", "子账号消耗", "成员额度"];

const teamTabFromHash = (): TeamTab => (window.location.hash === "#team:usage" ? "子账号消耗" : "成员管理");

export function TeamPage({ onToast }: TeamPageProps) {
  const [activeTab, setActiveTab] = useState<TeamTab>(teamTabFromHash);
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [query, setQuery] = useState("");
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [seatOpen, setSeatOpen] = useState(false);
  const [resetMember, setResetMember] = useState<TeamMember | null>(null);
  const [disableMember, setDisableMember] = useState<TeamMember | null>(null);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => !query || member.name.toLowerCase().includes(query.toLowerCase()) || member.contact.toLowerCase().includes(query.toLowerCase()));
  }, [members, query]);

  useEffect(() => {
    const onHashChange = () => setActiveTab(teamTabFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function promote(member: TeamMember) {
    setMembers((current) => current.map((item) => (item.id === member.id ? { ...item, role: "管理员" } : item)));
    onToast(`${member.name} 已设为管理员`);
  }

  function confirmDisable(member: TeamMember) {
    setMembers((current) => current.map((item) => (item.id === member.id ? { ...item, status: item.status === "启用" ? "停用" : "启用" } : item)));
    onToast(`${member.name} 已${member.status === "启用" ? "停用" : "启用"}`);
    setDisableMember(null);
  }

  return (
    <main className="min-h-screen pl-[248px]">
      <div className="mx-auto max-w-[1180px] px-8 py-7">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ink">团队</h1>
            <p className="mt-1 text-sm text-muted">管理成员、席位、子账号消耗和成员额度。</p>
          </div>
          <button onClick={() => setAddMemberOpen(true)} className="flex h-10 items-center gap-2 rounded-2xl bg-ink px-4 text-sm font-semibold text-white shadow-panel">
            <Plus size={16} />
            添加成员
          </button>
        </div>

        <div className="mb-5 flex flex-wrap gap-2 rounded-[24px] border border-line bg-white p-2 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === "子账号消耗") {
                  window.location.hash = "team:usage";
                } else if (window.location.hash.startsWith("#team:")) {
                  window.location.hash = "team";
                }
              }}
              className={cx("h-10 rounded-2xl px-4 text-sm font-medium transition", activeTab === tab ? "bg-ink text-white" : "text-muted hover:bg-canvas hover:text-ink")}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "成员管理" && (
          <MembersPanel
            members={filteredMembers}
            query={query}
            onQueryChange={setQuery}
            onPromote={promote}
            onDisable={setDisableMember}
            onReset={setResetMember}
          />
        )}
        {activeTab === "席位管理" && <SeatsPanel onBuySeats={() => setSeatOpen(true)} />}
        {activeTab === "子账号消耗" && <UsagePanel members={members} onToast={onToast} />}
        {activeTab === "成员额度" && <QuotaPanel members={members} setMembers={setMembers} onToast={onToast} />}
      </div>

      {addMemberOpen && <AddMemberModal onClose={() => setAddMemberOpen(false)} onToast={onToast} />}
      {seatOpen && <BuySeatsModal onClose={() => setSeatOpen(false)} onToast={onToast} />}
      {resetMember && <ResetPasswordModal member={resetMember} onClose={() => setResetMember(null)} onToast={onToast} />}
      {disableMember && <DisableMemberModal member={disableMember} onClose={() => setDisableMember(null)} onConfirm={() => confirmDisable(disableMember)} />}
    </main>
  );
}

function MembersPanel({
  members,
  query,
  onQueryChange,
  onPromote,
  onDisable,
  onReset,
}: {
  members: TeamMember[];
  query: string;
  onQueryChange: (value: string) => void;
  onPromote: (member: TeamMember) => void;
  onDisable: (member: TeamMember) => void;
  onReset: (member: TeamMember) => void;
}) {
  return (
    <section className="rounded-[28px] border border-line bg-white p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="搜索姓名、手机号或邮箱"
            className="h-11 w-full rounded-2xl border border-line bg-white pl-10 pr-4 text-sm outline-none focus:border-brand"
          />
        </div>
        <span className="rounded-full bg-canvas px-3 py-1 text-xs text-muted">角色仅管理员 / 普通账号</span>
      </div>
      <div className="mb-2 grid grid-cols-[1.5fr_1.5fr_.9fr_.8fr_.8fr_.9fr_1.8fr] gap-3 px-4 text-xs font-semibold text-muted">
        <span>成员</span>
        <span>角色</span>
        <span>状态</span>
        <span>本月生成</span>
        <span>消耗额度</span>
        <span>最近登录</span>
        <span className="text-right">操作</span>
      </div>
      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.id} className="grid grid-cols-[1.5fr_1.5fr_.9fr_.8fr_.8fr_.9fr_1.8fr] items-center gap-3 rounded-3xl bg-canvas px-4 py-3 text-sm">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-cyan text-sm font-semibold text-white">{member.avatar}</div>
              <div className="min-w-0">
                <div className="truncate font-semibold text-ink">{member.name}</div>
                <div className="truncate text-xs text-muted">{member.contact}</div>
              </div>
            </div>
            <span className="text-muted">{member.role}</span>
            <StatusBadge status={member.status} />
            <span className="text-muted">{member.monthlyGenerations} 次</span>
            <span className="text-muted">{member.monthlyCredits}</span>
            <span className="text-muted">{member.lastLoginAt}</span>
            <div className="flex flex-wrap justify-end gap-2">
              <button disabled={member.role === "管理员"} onClick={() => onPromote(member)} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs text-muted hover:text-brand disabled:opacity-40">设为管理员</button>
              <button onClick={() => onDisable(member)} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs text-muted hover:text-rose-600">{member.status === "启用" ? "停用" : "启用"}</button>
              <button onClick={() => onReset(member)} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs text-muted hover:text-brand">重置密码</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SeatsPanel({ onBuySeats }: { onBuySeats: () => void }) {
  const remainingSeats = merchant.seatsTotal - merchant.seatsUsed;

  return (
    <section className="pb-12">
      <div className="rounded-[28px] border border-line bg-white p-6 shadow-panel">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold text-ink">当前套餐</div>
            <div className="mt-1 text-2xl font-semibold text-ink">{merchant.plan}</div>
            <div className="mt-2 text-sm text-muted">到期时间：{merchant.expiresAt}</div>
          </div>
          <Crown className="text-brand" size={28} />
        </div>

        <div className="mb-5 grid grid-cols-4 gap-3">
          <Metric label="总席位" value={merchant.seatsTotal} />
          <Metric label="已用席位" value={merchant.seatsUsed} />
          <Metric label="剩余席位" value={remainingSeats} />
          <Metric label="剩余额度" value={merchant.remainingCredits} />
        </div>

        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-ink">席位使用</div>
          <div className="text-sm text-muted">已使用 {merchant.seatsUsed}/{merchant.seatsTotal}</div>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-canvas">
          <div className="h-full rounded-full bg-brand" style={{ width: `${(merchant.seatsUsed / merchant.seatsTotal) * 100}%` }} />
        </div>
        <div className="mt-3 text-sm text-muted">添加成员会占用可用席位；停用账号可释放席位。</div>

        <div className="mt-6 flex gap-3">
          <button onClick={onBuySeats} className="h-11 rounded-2xl bg-ink px-6 text-sm font-semibold text-white">加购席位</button>
        </div>
      </div>
    </section>
  );
}

function exportCsv(fileName: string, headers: string[], rows: Array<Array<string | number | boolean>>) {
  const escapeCell = (value: string | number | boolean) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [headers.map(escapeCell).join(","), ...rows.map((row) => row.map(escapeCell).join(","))].join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function UsagePanel({ members, onToast }: { members: TeamMember[]; onToast: (message: string) => void }) {
  const totals = {
    generations: members.reduce((sum, member) => sum + member.monthlyGenerations, 0),
    credits: members.reduce((sum, member) => sum + member.monthlyCredits, 0),
    downloads: members.reduce((sum, member) => sum + member.downloads, 0),
  };
  const success = teamUsageRecords.filter((record) => record.status === "成功").length;
  const failed = teamUsageRecords.filter((record) => record.status === "失败").length;
  const ranking = [...members].sort((a, b) => b.monthlyCredits - a.monthlyCredits);

  function exportUsageRecords() {
    exportCsv(
      "zhiboxing-usage-records.csv",
      ["时间", "账号", "模式", "视频名称", "真人形象", "消耗额度", "状态", "下载状态"],
      teamUsageRecords.map((record) => [record.time, record.account, record.mode, record.videoName, record.humanName, record.credits, record.status, record.downloaded ? "已下载" : "未下载"]),
    );
    onToast("消耗明细已导出");
  }

  function reconcileUsage() {
    const recordCredits = teamUsageRecords.reduce((sum, record) => sum + record.credits, 0);
    onToast(recordCredits === totals.credits ? "对账通过：明细消耗与成员汇总一致" : `已生成对账结果：明细样例 ${recordCredits} / 成员汇总 ${totals.credits}`);
  }

  return (
    <div className="space-y-4 pb-12">
      <section className="grid grid-cols-6 gap-3">
        <Metric label="本月总生成" value={totals.generations} />
        <Metric label="总消耗额度" value={totals.credits} />
        <Metric label="成功生成" value={success} />
        <Metric label="失败生成" value={failed} />
        <Metric label="已下载作品" value={totals.downloads} />
        <Metric label="人均消耗" value={Math.round(totals.credits / members.length)} />
      </section>

      <section className="rounded-[28px] border border-line bg-white p-5 shadow-panel">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-ink">全部子账号消耗排行</div>
            <div className="mt-1 text-xs text-muted">共 {ranking.length} 个子账号，按本月消耗额度排序。</div>
          </div>
        </div>
        <div className="mb-2 grid grid-cols-[.4fr_1.4fr_1fr_1fr_1fr_1fr_1fr] px-4 text-xs font-semibold text-muted">
          <span>排名</span>
          <span>成员</span>
          <span>本月生成</span>
          <span>消耗额度</span>
          <span>成功生成</span>
          <span>失败生成</span>
          <span>下载/额度</span>
        </div>
        <div className="space-y-2">
          {ranking.map((member, index) => (
            <div key={member.id} className="grid grid-cols-[.4fr_1.4fr_1fr_1fr_1fr_1fr_1fr] items-center rounded-2xl bg-canvas px-4 py-3 text-sm">
              <span className="font-semibold text-ink">#{index + 1}</span>
              <span className="font-medium text-ink">{member.name}</span>
              <span className="text-muted">{member.monthlyGenerations} 次</span>
              <span className="text-muted">{member.monthlyCredits}</span>
              <span className="text-muted">{Math.max(member.monthlyGenerations - 2, 0)}</span>
              <span className="text-muted">2</span>
              <span className="text-muted">{(member.downloads / Math.max(member.monthlyCredits, 1)).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-line bg-white p-5 shadow-panel">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-ink">消耗明细与对账</div>
            <div className="mt-1 text-xs text-muted">按任务记录核对额度消耗，支持导出对账底表。</div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button onClick={exportUsageRecords} className="flex h-9 items-center gap-2 rounded-2xl border border-line bg-white px-3 text-xs font-semibold text-ink hover:border-brand hover:text-brand">
              <Download size={14} />
              导出明细
            </button>
            <button onClick={reconcileUsage} className="flex h-9 items-center gap-2 rounded-2xl bg-ink px-3 text-xs font-semibold text-white">
              <FileCheck2 size={14} />
              生成对账
            </button>
          </div>
        </div>
        <div className="mb-2 grid grid-cols-[1.3fr_.8fr_.9fr_1.4fr_.8fr_.7fr_.7fr_.7fr] px-4 text-xs font-semibold text-muted">
          <span>时间</span>
          <span>账号</span>
          <span>模式</span>
          <span>视频名称</span>
          <span>真人形象</span>
          <span>消耗额度</span>
          <span>状态</span>
          <span>下载状态</span>
        </div>
        <div className="space-y-2">
          {teamUsageRecords.map((record) => (
            <div key={record.id} className="grid grid-cols-[1.3fr_.8fr_.9fr_1.4fr_.8fr_.7fr_.7fr_.7fr] items-center rounded-2xl bg-canvas px-4 py-3 text-sm">
              <span className="text-muted">{record.time}</span>
              <span className="font-medium text-ink">{record.account}</span>
              <span className="text-muted">{record.mode}</span>
              <span className="truncate text-muted">{record.videoName}</span>
              <span className="text-muted">{record.humanName}</span>
              <span className="text-muted">{record.credits}</span>
              <UsageStatus status={record.status} />
              <span className="text-muted">{record.downloaded ? "已下载" : "未下载"}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function QuotaPanel({
  members,
  setMembers,
  onToast,
}: {
  members: TeamMember[];
  setMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  onToast: (message: string) => void;
}) {
  const [mode, setMode] = useState<"不限制" | "按成员限制">("按成员限制");

  function updateMember(id: string, patch: Partial<TeamMember>) {
    setMembers((current) => current.map((member) => (member.id === id ? { ...member, ...patch } : member)));
  }

  return (
    <section className="rounded-[28px] border border-line bg-white p-5 shadow-panel">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-ink">成员额度</div>
          <div className="mt-1 text-sm text-muted">管理员可以控制普通账号的月度额度和单次生成能力。</div>
        </div>
        <div className="flex rounded-2xl border border-line p-1">
          {(["按成员限制", "不限制"] as const).map((item) => (
            <button key={item} onClick={() => setMode(item)} className={cx("h-9 rounded-xl px-3 text-sm", mode === item ? "bg-ink text-white" : "text-muted")}>{item}</button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.id} className="grid grid-cols-[1.4fr_1fr_1fr_1fr_auto] items-center gap-3 rounded-3xl bg-canvas px-4 py-3 text-sm">
            <div className="font-medium text-ink">{member.name}</div>
            <input
              type="number"
              disabled={mode === "不限制"}
              value={member.quotaLimit ?? 0}
              onChange={(event) => updateMember(member.id, { quotaLimit: Number(event.target.value) })}
              className="h-10 rounded-2xl border border-line bg-white px-3 text-sm outline-none disabled:opacity-45"
            />
            <label className="flex items-center gap-2 text-muted">
              <input
                type="checkbox"
                checked={member.allowBatch}
                onChange={(event) => updateMember(member.id, { allowBatch: event.target.checked })}
              />
              允许批量
            </label>
            <select
              value={member.maxPerGeneration}
              onChange={(event) => updateMember(member.id, { maxPerGeneration: Number(event.target.value) })}
              className="h-10 rounded-2xl border border-line bg-white px-3 text-sm outline-none"
            >
              {[1, 2, 4].map((count) => (
                <option key={count} value={count}>单次最多 {count} 条</option>
              ))}
            </select>
            <button onClick={() => onToast(`${member.name} 额度设置已保存`)} className="rounded-2xl bg-white px-4 py-2 text-xs font-medium text-muted hover:text-brand">保存</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function DialogShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/24 px-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] border border-line bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-semibold text-ink">{title}</div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted hover:text-ink">
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AddMemberModal({ onClose, onToast }: { onClose: () => void; onToast: (message: string) => void }) {
  const [role, setRole] = useState<TeamMember["role"]>("普通账号");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  return (
    <DialogShell title="添加成员" onClose={onClose}>
      {!password ? (
        <div className="space-y-3">
          <input value={phone} onChange={(event) => setPhone(event.target.value)} className="h-11 w-full rounded-2xl border border-line px-4 text-sm outline-none focus:border-brand" placeholder="成员手机号" />
          <select value={role} onChange={(event) => setRole(event.target.value as TeamMember["role"])} className="h-11 w-full rounded-2xl border border-line px-4 text-sm outline-none focus:border-brand">
            <option value="普通账号">普通账号</option>
            <option value="管理员">管理员</option>
          </select>
          <div className="rounded-2xl bg-canvas px-4 py-3 text-sm text-muted">添加成功后会生成初始密码。管理员复制给成员后，成员首次登录可修改密码。</div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-3xl bg-emerald-50 p-4 text-emerald-700">
            <div className="font-semibold">成员已添加</div>
            <div className="mt-1 text-sm">{phone || "新成员"} · {role}</div>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-canvas px-4 py-3">
            <span className="font-mono text-sm font-semibold text-ink">{password}</span>
            <button onClick={() => onToast("初始密码已复制")} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs text-muted hover:text-brand">
              <Copy size={13} />
              复制
            </button>
          </div>
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-2xl border border-line px-4 py-2 text-sm text-muted">取消</button>
        {!password ? (
          <button
            onClick={() => {
              setPassword(`ZBX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
              onToast("成员已添加，请复制初始密码");
            }}
            className="rounded-2xl bg-ink px-4 py-2 text-sm font-semibold text-white"
          >
            添加并生成密码
          </button>
        ) : (
          <button onClick={onClose} className="rounded-2xl bg-ink px-4 py-2 text-sm font-semibold text-white">完成</button>
        )}
      </div>
    </DialogShell>
  );
}

function BuySeatsModal({ onClose, onToast }: { onClose: () => void; onToast: (message: string) => void }) {
  const [count, setCount] = useState(2);

  return (
    <DialogShell title="加购席位" onClose={onClose}>
      <div className="rounded-3xl bg-canvas p-4">
        <div className="text-sm text-muted">当前席位</div>
        <div className="mt-1 text-xl font-semibold text-ink">{merchant.seatsUsed}/{merchant.seatsTotal}</div>
      </div>
      <label className="mt-4 block text-sm font-medium text-ink">加购数量</label>
      <input type="number" min={1} value={count} onChange={(event) => setCount(Number(event.target.value))} className="mt-2 h-11 w-full rounded-2xl border border-line px-4 text-sm outline-none focus:border-brand" />
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-2xl border border-line px-4 py-2 text-sm text-muted">取消</button>
        <button onClick={() => { onToast(`已提交加购 ${count} 个席位`); onClose(); }} className="rounded-2xl bg-ink px-4 py-2 text-sm font-semibold text-white">提交</button>
      </div>
    </DialogShell>
  );
}

function ResetPasswordModal({ member, onClose, onToast }: { member: TeamMember; onClose: () => void; onToast: (message: string) => void }) {
  return (
    <DialogShell title="重置密码" onClose={onClose}>
      <div className="flex gap-3 rounded-3xl bg-blue-50 p-4 text-blue-700">
        <KeyRound size={20} />
        <div>
          <div className="font-semibold">重置 {member.name} 的登录密码？</div>
          <div className="mt-1 text-sm">系统会生成临时密码，并要求成员下次登录时修改。</div>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-2xl border border-line px-4 py-2 text-sm text-muted">取消</button>
        <button onClick={() => { onToast(`${member.name} 的临时密码已生成`); onClose(); }} className="rounded-2xl bg-ink px-4 py-2 text-sm font-semibold text-white">确认重置</button>
      </div>
    </DialogShell>
  );
}

function DisableMemberModal({ member, onClose, onConfirm }: { member: TeamMember; onClose: () => void; onConfirm: () => void }) {
  const disabling = member.status === "启用";

  return (
    <DialogShell title={disabling ? "停用成员" : "启用成员"} onClose={onClose}>
      <div className={cx("flex gap-3 rounded-3xl p-4", disabling ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700")}>
        <AlertTriangle size={20} />
        <div>
          <div className="font-semibold">{disabling ? "确认停用" : "确认启用"} {member.name}？</div>
          <div className="mt-1 text-sm">{disabling ? "停用后该成员不能登录，席位会释放。" : "启用后该成员可重新登录并使用生成能力。"}</div>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-2xl border border-line px-4 py-2 text-sm text-muted">取消</button>
        <button onClick={onConfirm} className={cx("rounded-2xl px-4 py-2 text-sm font-semibold text-white", disabling ? "bg-rose-600" : "bg-emerald-600")}>{disabling ? "停用" : "启用"}</button>
      </div>
    </DialogShell>
  );
}

function StatusBadge({ status }: { status: TeamMember["status"] }) {
  return <span className={cx("w-fit rounded-full px-2.5 py-1 text-xs font-semibold", status === "启用" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>{status}</span>;
}

function UsageStatus({ status }: { status: "成功" | "失败" | "生成中" }) {
  const color = status === "成功" ? "bg-emerald-50 text-emerald-700" : status === "失败" ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700";
  return <span className={cx("w-fit rounded-full px-2.5 py-1 text-xs font-semibold", color)}>{status}</span>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] border border-line bg-white p-4 shadow-sm">
      <div className="text-xl font-semibold text-ink">{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}
