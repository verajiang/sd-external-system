import { FileCheck2, Link2, QrCode, Search, Upload, UserCheck, UserPlus, Ban, Clock3, X, Copy, CheckCircle2, AlertTriangle, Eye, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AssetCard } from "../components/AssetCard";
import { assets, authorizationRecords, humanProfiles } from "../data/mock";
import type { Asset, AuthorizationRecord, HumanProfile, User } from "../types";
import { cx } from "../utils";

type AssetTab = "全部资产" | "真人形象" | "图片" | "视频" | "音频" | "授权记录";

interface AssetPageProps {
  user: User;
  onToast: (message: string) => void;
}

const tabs: AssetTab[] = ["全部资产", "真人形象", "图片", "视频", "音频", "授权记录"];

export function AssetPage({ user, onToast }: AssetPageProps) {
  const [activeTab, setActiveTab] = useState<AssetTab>("全部资产");
  const [statusFilter, setStatusFilter] = useState<"全部" | Asset["status"]>("全部");
  const [query, setQuery] = useState("");
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [renameAsset, setRenameAsset] = useState<Asset | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [assetTitles, setAssetTitles] = useState<Record<string, string>>({});

  const isAdmin = user.role === "管理员";
  const visibleTabs = useMemo(() => tabs.filter((tab) => isAdmin || tab !== "授权记录"), [isAdmin]);

  const pageAssets = useMemo(() => {
    return assets
      .filter((asset) => isAdmin || asset.status === "可用" || asset.uploader === user.name)
      .map((asset) => ({ ...asset, name: assetTitles[asset.id] ?? asset.name }));
  }, [assetTitles, isAdmin, user.name]);

  const filteredAssets = useMemo(() => {
    return pageAssets.filter((asset) => {
      const tabMatched = activeTab === "全部资产" || asset.type === activeTab;
      const statusMatched = statusFilter === "全部" || asset.status === statusFilter;
      const queryMatched = !query || asset.name.toLowerCase().includes(query.toLowerCase());
      return tabMatched && statusMatched && queryMatched;
    });
  }, [activeTab, pageAssets, statusFilter, query]);

  return (
    <main className="min-h-screen pl-[248px]">
      <div className="mx-auto max-w-[1180px] px-8 py-7">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ink">资产</h1>
            <p className="mt-1 text-sm text-muted">统一管理真人形象、普通素材和授权记录。</p>
          </div>
          <button onClick={() => setUploadOpen(true)} className="flex h-10 items-center gap-2 rounded-2xl bg-ink px-4 text-sm font-semibold text-white shadow-panel">
            <Upload size={16} />
            上传资产
          </button>
        </div>

        <div className="mb-5 flex flex-wrap gap-2 rounded-[24px] border border-line bg-white p-2 shadow-sm">
          {visibleTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cx("h-10 rounded-2xl px-4 text-sm font-medium transition", activeTab === tab ? "bg-ink text-white" : "text-muted hover:bg-canvas hover:text-ink")}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "真人形象" ? (
          <HumanProfiles isAdmin={isAdmin} onToast={onToast} />
        ) : activeTab === "授权记录" ? (
          <AuthorizationTable records={authorizationRecords} onToast={onToast} />
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索资产名称"
                  className="h-11 w-full rounded-2xl border border-line bg-white pl-10 pr-4 text-sm outline-none focus:border-brand"
                />
              </div>
              <div className="flex gap-2">
                {(["全部", "可用", "处理中", "失败", "未认证"] as Array<"全部" | Asset["status"]>).filter((status) => isAdmin || status !== "未认证").map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cx("h-10 rounded-2xl px-3 text-sm font-medium", statusFilter === status ? "bg-blue-50 text-brand" : "border border-line bg-white text-muted")}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <section className="grid grid-cols-3 gap-4 pb-12">
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  canManage={isAdmin || asset.uploader === user.name}
                  onPreview={setPreviewAsset}
                  onRename={setRenameAsset}
                  onDelete={setDeleteAsset}
                />
              ))}
            </section>
          </>
        )}
      </div>

      {uploadOpen && <UploadAssetModal onClose={() => setUploadOpen(false)} onToast={onToast} />}
      {previewAsset && <AssetPreviewModal asset={previewAsset} onClose={() => setPreviewAsset(null)} />}
      {renameAsset && (
        <RenameAssetModal
          asset={renameAsset}
          onClose={() => setRenameAsset(null)}
          onSave={(name) => {
            setAssetTitles((current) => ({ ...current, [renameAsset.id]: name }));
            onToast(`已修改标题为：${name}`);
          }}
        />
      )}
      {deleteAsset && <DeleteConfirm asset={deleteAsset} onClose={() => setDeleteAsset(null)} onToast={onToast} />}
    </main>
  );
}

function HumanProfiles({ isAdmin, onToast }: { isAdmin: boolean; onToast: (message: string) => void }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadProfile, setUploadProfile] = useState<HumanProfile | null>(null);
  const [detailProfile, setDetailProfile] = useState<HumanProfile | null>(null);
  const [authProfile, setAuthProfile] = useState<HumanProfile | null>(null);
  const [disableProfile, setDisableProfile] = useState<HumanProfile | null>(null);

  return (
    <div className="space-y-5 pb-12">
      {isAdmin && (
      <section className="rounded-[28px] border border-line bg-white p-5 shadow-panel">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-ink">真人形象流程</div>
            <div className="mt-1 text-sm text-muted">认证完成且素材状态为可用后，才能在生成页被 @ 引用。</div>
          </div>
          <button onClick={() => setCreateOpen(true)} className="flex h-10 items-center gap-2 rounded-2xl bg-brand px-4 text-sm font-semibold text-white">
            <UserPlus size={16} />
            创建真人形象
          </button>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {[
            ["创建真人形象", UserPlus],
            ["生成认证链接/二维码", QrCode],
            ["完成真人认证", UserCheck],
            ["上传同人素材", Upload],
            ["审核通过后可生成", FileCheck2],
          ].map(([label, Icon], index) => (
            <div key={String(label)} className="rounded-3xl bg-canvas p-4">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-brand shadow-sm">
                {/* TypeScript keeps Icon as a runtime component through this tuple usage. */}
                {typeof Icon !== "string" && <Icon size={17} />}
              </div>
              <div className="text-sm font-semibold text-ink">{index + 1}. {String(label)}</div>
            </div>
          ))}
        </div>
      </section>
      )}

      <section className="grid grid-cols-3 gap-4">
        {humanProfiles.filter((profile) => isAdmin || profile.status === "已认证").map((profile) => (
          <HumanProfileCard
            key={profile.id}
            profile={profile}
            isAdmin={isAdmin}
            onUpload={setUploadProfile}
            onDetail={setDetailProfile}
            onAuth={setAuthProfile}
            onDisable={setDisableProfile}
          />
        ))}
      </section>

      {isAdmin && createOpen && <CreateHumanModal onClose={() => setCreateOpen(false)} onToast={onToast} />}
      {isAdmin && uploadProfile && <UploadHumanMaterialModal profile={uploadProfile} onClose={() => setUploadProfile(null)} onToast={onToast} />}
      {detailProfile && <HumanDetailDrawer profile={detailProfile} isAdmin={isAdmin} onClose={() => setDetailProfile(null)} onToast={onToast} />}
      {isAdmin && authProfile && <AuthLinkModal profile={authProfile} onClose={() => setAuthProfile(null)} onToast={onToast} />}
      {isAdmin && disableProfile && <DisableHumanConfirm profile={disableProfile} onClose={() => setDisableProfile(null)} onToast={onToast} />}
    </div>
  );
}

function HumanProfileCard({
  profile,
  isAdmin,
  onUpload,
  onDetail,
  onAuth,
  onDisable,
}: {
  profile: HumanProfile;
  isAdmin: boolean;
  onUpload: (profile: HumanProfile) => void;
  onDetail: (profile: HumanProfile) => void;
  onAuth: (profile: HumanProfile) => void;
  onDisable: (profile: HumanProfile) => void;
}) {
  const statusStyle =
    profile.status === "已认证"
      ? "bg-emerald-50 text-emerald-700"
      : profile.status === "认证失败"
        ? "bg-rose-50 text-rose-700"
        : "bg-blue-50 text-blue-700";
  const usable = profile.status === "已认证" && profile.activeMaterials > 0;

  return (
    <article className="overflow-hidden rounded-[28px] border border-line bg-white shadow-panel">
      <div className={cx("relative h-40 bg-gradient-to-br", profile.thumb)}>
        <span className={cx("absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold", statusStyle)}>{profile.status}</span>
      </div>
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-base font-semibold text-ink">{profile.name}</div>
          {!usable && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-muted">不可引用</span>}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Metric label="可用素材" value={profile.activeMaterials} />
          <Metric label="处理中" value={profile.processingMaterials} />
          <Metric label="失败" value={profile.failedMaterials} />
        </div>
        <div className="mt-3 text-xs text-muted">创建时间：{profile.createdAt}</div>
        {profile.failReason && <div className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{profile.failReason}</div>}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {isAdmin && <button onClick={() => onUpload(profile)} className="rounded-2xl border border-line px-3 py-2 text-xs font-medium text-muted hover:text-brand">上传素材</button>}
          <button onClick={() => onDetail(profile)} className="rounded-2xl border border-line px-3 py-2 text-xs font-medium text-muted hover:text-brand">详情</button>
          {isAdmin && <button onClick={() => onAuth(profile)} className="rounded-2xl border border-line px-3 py-2 text-xs font-medium text-muted hover:text-brand">认证链接</button>}
          {isAdmin && <button onClick={() => onDisable(profile)} className="rounded-2xl border border-line px-3 py-2 text-xs font-medium text-muted hover:text-rose-600">停用</button>}
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-canvas px-2 py-3">
      <div className="text-base font-semibold text-ink">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function AuthorizationTable({ records, onToast }: { records: AuthorizationRecord[]; onToast: (message: string) => void }) {
  const [viewRecord, setViewRecord] = useState<AuthorizationRecord | null>(null);
  const [supplementRecord, setSupplementRecord] = useState<AuthorizationRecord | null>(null);

  return (
    <section className="rounded-[28px] border border-line bg-white p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-ink">授权记录</div>
          <div className="mt-1 text-sm text-muted">用于追踪真人形象的授权对象、期限和文件。</div>
        </div>
        <button onClick={() => setSupplementRecord(records[0])} className="flex h-10 items-center gap-2 rounded-2xl border border-line px-4 text-sm font-semibold text-ink">
          <Upload size={16} />
          上传补充文件
        </button>
      </div>
      <div className="space-y-3">
        {records.map((record) => (
          <div key={record.id} className="grid grid-cols-[1.1fr_1fr_1fr_1.5fr_1.4fr_auto] items-center gap-3 rounded-3xl bg-canvas px-4 py-3 text-sm">
            <span className="font-medium text-ink">{record.target}</span>
            <span className="text-muted">{record.humanName}</span>
            <AuthStatus status={record.status} />
            <span className="text-muted">{record.period}</span>
            <span className="truncate text-muted">{record.fileName}</span>
            <div className="flex gap-2">
              <button onClick={() => setViewRecord(record)} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs text-muted hover:text-brand">查看</button>
              <button onClick={() => setSupplementRecord(record)} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs text-muted hover:text-brand">补充</button>
            </div>
          </div>
        ))}
      </div>
      {viewRecord && <AuthorizationDetailModal record={viewRecord} onClose={() => setViewRecord(null)} />}
      {supplementRecord && <SupplementAuthorizationModal record={supplementRecord} onClose={() => setSupplementRecord(null)} onToast={onToast} />}
    </section>
  );
}

function AuthStatus({ status }: { status: AuthorizationRecord["status"] }) {
  const Icon = status === "有效" ? Link2 : status === "即将到期" ? Clock3 : Ban;
  const color = status === "有效" ? "text-emerald-700 bg-emerald-50" : status === "即将到期" ? "text-amber-700 bg-amber-50" : "text-rose-700 bg-rose-50";
  return (
    <span className={cx("inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", color)}>
      <Icon size={13} />
      {status}
    </span>
  );
}

function DialogShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/24 px-6 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[28px] border border-line bg-white p-5 shadow-soft">
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

function UploadAssetModal({ onClose, onToast }: { onClose: () => void; onToast: (message: string) => void }) {
  return (
    <DialogShell title="上传资产" onClose={onClose}>
      <div className="rounded-3xl border border-dashed border-slate-300 bg-canvas px-4 py-10 text-center hover:border-brand">
        <Upload className="mx-auto mb-3 text-brand" size={24} />
        <div className="text-sm font-semibold text-ink">上传图片、视频或音频</div>
        <div className="mt-1 text-xs text-muted">真人素材请进入对应真人形象后上传。</div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-2xl border border-line px-4 py-2 text-sm text-muted">取消</button>
        <button
          onClick={() => {
            onToast("已模拟上传 3 个素材，标题默认使用文件名");
            onClose();
          }}
          className="rounded-2xl bg-ink px-4 py-2 text-sm font-semibold text-white"
        >
          提交上传
        </button>
      </div>
    </DialogShell>
  );
}

function AssetPreviewModal({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  return (
    <DialogShell title={`预览 ${asset.name}`} onClose={onClose}>
      <div className={cx("relative h-80 overflow-hidden rounded-3xl bg-gradient-to-br", asset.thumb ?? "from-slate-100 to-white")}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,.65),transparent_34%),radial-gradient(circle_at_75%_72%,rgba(31,41,55,.12),transparent_38%)]" />
        <div className="absolute bottom-4 left-4 rounded-2xl bg-white/85 px-4 py-2 text-sm font-semibold text-ink backdrop-blur">{asset.type} · {asset.status}</div>
      </div>
      {asset.reason && <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{asset.reason}</div>}
    </DialogShell>
  );
}

function RenameAssetModal({ asset, onClose, onSave }: { asset: Asset; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState(asset.name);

  return (
    <DialogShell title="修改素材标题" onClose={onClose}>
      <div className="flex gap-3 rounded-3xl bg-canvas p-3">
        <div className={cx("h-16 w-16 shrink-0 rounded-2xl bg-gradient-to-br", asset.thumb ?? "from-slate-100 to-white")} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-ink">当前文件名</div>
          <div className="mt-1 truncate text-sm text-muted">{asset.name}</div>
        </div>
      </div>
      <label className="mt-4 block text-sm font-medium text-ink">展示标题</label>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="mt-2 h-11 w-full rounded-2xl border border-line px-4 text-sm outline-none focus:border-brand"
      />
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-2xl border border-line px-4 py-2 text-sm text-muted">取消</button>
        <button onClick={() => { onSave(name); onClose(); }} className="rounded-2xl bg-ink px-4 py-2 text-sm font-semibold text-white">保存</button>
      </div>
    </DialogShell>
  );
}

function DeleteConfirm({ asset, onClose, onToast }: { asset: Asset; onClose: () => void; onToast: (message: string) => void }) {
  return (
    <DialogShell title="删除资产" onClose={onClose}>
      <div className="flex gap-3 rounded-3xl bg-rose-50 p-4 text-rose-700">
        <AlertTriangle size={20} />
        <div>
          <div className="font-semibold">确认删除 {asset.name}？</div>
          <div className="mt-1 text-sm">删除后该素材不能再被新的生成任务引用，历史生成记录不受影响。</div>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-2xl border border-line px-4 py-2 text-sm text-muted">取消</button>
        <button
          onClick={() => {
            onToast(`已模拟删除 ${asset.name}`);
            onClose();
          }}
          className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
        >
          删除
        </button>
      </div>
    </DialogShell>
  );
}

function CreateHumanModal({ onClose, onToast }: { onClose: () => void; onToast: (message: string) => void }) {
  const [step, setStep] = useState(0);
  const steps = ["填写信息", "发送认证", "上传素材", "等待审核"];

  return (
    <DialogShell title="创建真人形象" onClose={onClose}>
      <div className="mb-5 grid grid-cols-4 gap-2">
        {steps.map((label, index) => (
          <div key={label} className={cx("rounded-2xl px-3 py-2 text-center text-xs font-semibold", index <= step ? "bg-blue-50 text-brand" : "bg-canvas text-muted")}>
            {index + 1}. {label}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-3">
          <input className="h-11 w-full rounded-2xl border border-line px-4 text-sm outline-none focus:border-brand" placeholder="形象名称，例如：模特D" />
          <input className="h-11 w-full rounded-2xl border border-line px-4 text-sm outline-none focus:border-brand" placeholder="授权时间，例如：2026-06-01 至 2027-06-01" />
          <div className="rounded-2xl bg-canvas px-4 py-3 text-sm text-muted">下一步会生成认证链接，真人完成认证后再上传同人素材。</div>
        </div>
      )}

      {step === 1 && (
        <div className="grid grid-cols-[160px_1fr] gap-4">
          <div className="flex h-40 items-center justify-center rounded-3xl bg-canvas">
            <QrCode size={88} className="text-ink" />
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl bg-canvas px-4 py-3 text-sm text-muted">https://zhiboxing.example/auth/new-human</div>
            <button onClick={() => onToast("认证链接已复制")} className="flex h-10 items-center gap-2 rounded-2xl bg-ink px-4 text-sm font-semibold text-white">
              <Copy size={15} />
              复制认证链接
            </button>
            <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">对方完成实名与肖像授权后，认证状态会变为已认证。</div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 size={18} />
            真人认证已完成，可以上传同人素材。
          </div>
          <div className="rounded-3xl border border-dashed border-slate-300 bg-canvas px-4 py-10 text-center">
            <Upload className="mx-auto mb-3 text-brand" size={24} />
            <div className="text-sm font-semibold text-ink">上传该真人的视频或图片素材</div>
            <div className="mt-1 text-xs text-muted">一个真人形象可以有多个同人素材，审核通过后才可用于生成。</div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div className="rounded-3xl bg-blue-50 p-5 text-blue-700">
            <div className="font-semibold">素材已提交审核</div>
            <div className="mt-1 text-sm">当前状态：处理中。审核通过后会进入可用素材数，并可在生成页被 @ 引用。</div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric label="可用素材" value={0} />
            <Metric label="处理中" value={1} />
            <Metric label="失败" value={0} />
          </div>
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-2xl border border-line px-4 py-2 text-sm text-muted">取消</button>
        {step > 0 && <button onClick={() => setStep((value) => value - 1)} className="rounded-2xl border border-line px-4 py-2 text-sm text-muted">上一步</button>}
        <button
          onClick={() => {
            if (step < 3) {
              setStep((value) => value + 1);
              return;
            }
            onToast("真人形象已创建，素材进入处理中");
            onClose();
          }}
          className="rounded-2xl bg-ink px-4 py-2 text-sm font-semibold text-white"
        >
          {step === 3 ? "完成" : "下一步"}
        </button>
      </div>
    </DialogShell>
  );
}

function UploadHumanMaterialModal({ profile, onClose, onToast }: { profile: HumanProfile; onClose: () => void; onToast: (message: string) => void }) {
  return (
    <DialogShell title={`上传 ${profile.name} 素材`} onClose={onClose}>
      <div className="rounded-3xl border border-dashed border-slate-300 bg-canvas px-4 py-10 text-center">
        <Upload className="mx-auto mb-3 text-brand" size={24} />
        <div className="text-sm font-semibold text-ink">上传同一真人的视频或图片</div>
        <div className="mt-1 text-xs text-muted">多人脸、非同一人物或低质量素材会审核失败。</div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-2xl border border-line px-4 py-2 text-sm text-muted">取消</button>
        <button onClick={() => { onToast(`${profile.name} 素材已提交，状态为处理中`); onClose(); }} className="rounded-2xl bg-ink px-4 py-2 text-sm font-semibold text-white">提交审核</button>
      </div>
    </DialogShell>
  );
}

function HumanDetailDrawer({ profile, isAdmin, onClose, onToast }: { profile: HumanProfile; isAdmin: boolean; onClose: () => void; onToast: (message: string) => void }) {
  const relatedAssets = assets.filter((asset) => asset.name.includes(profile.name) && (isAdmin || asset.status === "可用"));
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null);

  return (
    <div className="fixed inset-0 z-50 bg-ink/20 backdrop-blur-sm">
      <aside className="absolute right-0 top-0 h-full w-[460px] overflow-y-auto border-l border-line bg-white p-5 shadow-soft soft-scrollbar">
        <div className="mb-5 flex items-center justify-between">
          <div className="text-lg font-semibold text-ink">真人形象详情</div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted hover:text-ink">
            <X size={17} />
          </button>
        </div>
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <Metric label="可用素材" value={profile.activeMaterials} />
          <Metric label="处理中" value={profile.processingMaterials} />
          <Metric label="失败" value={profile.failedMaterials} />
        </div>

        <div className="mb-3 text-sm font-semibold text-ink">
          同人素材
        </div>
        <div className="space-y-3">
          {relatedAssets.map((asset) => (
            <div key={asset.id} className="flex gap-3 rounded-3xl bg-canvas p-3">
              <div className={cx("h-16 w-16 shrink-0 rounded-2xl bg-gradient-to-br", asset.thumb ?? "from-slate-100 to-white")} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-ink">{asset.name}</div>
                <div className="mt-1 text-xs text-muted">{asset.status === "可用" ? "可在生成页被 @ 引用" : "不可在生成页引用"}</div>
                {asset.reason && <div className="mt-1 text-xs text-rose-700">{asset.reason}</div>}
              </div>
              <span className={cx("h-fit rounded-full px-2.5 py-1 text-xs font-semibold", asset.status === "可用" ? "bg-emerald-50 text-emerald-700" : asset.status === "失败" ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700")}>{asset.status}</span>
              <div className="flex shrink-0 flex-col gap-2">
                <button onClick={() => setPreviewAsset(asset)} className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-muted hover:text-brand" title="预览">
                  <Eye size={14} />
                </button>
                {isAdmin && asset.status === "失败" && (
                  <button onClick={() => setDeleteAsset(asset)} className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-muted hover:text-rose-600" title="删除失败素材">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {isAdmin && <div className="mt-5 grid grid-cols-2 gap-2">
          <button onClick={() => onToast(`上传 ${profile.name} 新素材`)} className="rounded-2xl border border-line px-4 py-2 text-sm font-medium text-muted hover:text-brand">上传素材</button>
          <button onClick={() => onToast(`生成 ${profile.name} 认证链接`)} className="rounded-2xl border border-line px-4 py-2 text-sm font-medium text-muted hover:text-brand">认证链接</button>
        </div>}
      </aside>
      {previewAsset && <AssetPreviewModal asset={previewAsset} onClose={() => setPreviewAsset(null)} />}
      {deleteAsset && <DeleteConfirm asset={deleteAsset} onClose={() => setDeleteAsset(null)} onToast={onToast} />}
    </div>
  );
}

function AuthLinkModal({ profile, onClose, onToast }: { profile: HumanProfile; onClose: () => void; onToast: (message: string) => void }) {
  return (
    <DialogShell title={`${profile.name} 认证链接`} onClose={onClose}>
      <div className="grid grid-cols-[160px_1fr] gap-4">
        <div className="flex h-40 items-center justify-center rounded-3xl bg-canvas">
          <QrCode size={88} className="text-ink" />
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl bg-canvas px-4 py-3 text-sm text-muted">https://zhiboxing.example/auth/{profile.id}</div>
          <button onClick={() => onToast("认证链接已复制")} className="flex h-10 items-center gap-2 rounded-2xl bg-ink px-4 text-sm font-semibold text-white">
            <Copy size={15} />
            复制链接
          </button>
          <div className="text-xs text-muted">链接用于真人本人完成授权与身份确认。</div>
        </div>
      </div>
    </DialogShell>
  );
}

function DisableHumanConfirm({ profile, onClose, onToast }: { profile: HumanProfile; onClose: () => void; onToast: (message: string) => void }) {
  return (
    <DialogShell title="停用真人形象" onClose={onClose}>
      <div className="rounded-3xl bg-rose-50 p-4 text-sm text-rose-700">停用 {profile.name} 后，该真人形象及其可用素材将不能在生成页被引用。</div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-2xl border border-line px-4 py-2 text-sm text-muted">取消</button>
        <button onClick={() => { onToast(`${profile.name} 已模拟停用`); onClose(); }} className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white">停用</button>
      </div>
    </DialogShell>
  );
}

function AuthorizationDetailModal({ record, onClose }: { record: AuthorizationRecord; onClose: () => void }) {
  return (
    <DialogShell title="授权文件详情" onClose={onClose}>
      <div className="space-y-3 text-sm">
        <Detail label="授权对象" value={record.target} />
        <Detail label="关联真人" value={record.humanName} />
        <Detail label="授权状态" value={record.status} />
        <Detail label="授权期限" value={record.period} />
        <Detail label="授权文件" value={record.fileName} />
      </div>
      <div className="mt-5 rounded-3xl bg-canvas p-6 text-center text-sm text-muted">授权文件预览占位</div>
    </DialogShell>
  );
}

function SupplementAuthorizationModal({ record, onClose, onToast }: { record: AuthorizationRecord; onClose: () => void; onToast: (message: string) => void }) {
  return (
    <DialogShell title={`补充 ${record.humanName} 授权文件`} onClose={onClose}>
      <div className="rounded-3xl border border-dashed border-slate-300 bg-canvas px-4 py-10 text-center">
        <Upload className="mx-auto mb-3 text-brand" size={24} />
        <div className="text-sm font-semibold text-ink">上传补充授权文件</div>
        <div className="mt-1 text-xs text-muted">支持 PDF、图片或文档占位。</div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-2xl border border-line px-4 py-2 text-sm text-muted">取消</button>
        <button onClick={() => { onToast(`${record.humanName} 授权补充文件已提交`); onClose(); }} className="rounded-2xl bg-ink px-4 py-2 text-sm font-semibold text-white">提交</button>
      </div>
    </DialogShell>
  );
}

function Detail({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex justify-between gap-4 rounded-2xl bg-canvas px-4 py-3">
      <span className="text-muted">{label}</span>
      <span className={cx("text-right font-medium", danger ? "text-rose-700" : "text-ink")}>{value}</span>
    </div>
  );
}
