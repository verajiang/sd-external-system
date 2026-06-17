import { Eye, PencilLine, Trash2 } from "lucide-react";
import type { Asset } from "../types";
import { cx } from "../utils";

interface AssetCardProps {
  asset: Asset;
  canManage?: boolean;
  onPreview: (asset: Asset) => void;
  onRename: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}

const statusClass: Record<Asset["status"], string> = {
  可用: "bg-emerald-50 text-emerald-700",
  处理中: "bg-blue-50 text-blue-700",
  失败: "bg-rose-50 text-rose-700",
  未认证: "bg-slate-100 text-slate-500",
};

export function AssetCard({ asset, canManage = true, onPreview, onRename, onDelete }: AssetCardProps) {
  return (
    <article className="overflow-hidden rounded-[26px] border border-line bg-white shadow-panel">
      <div className={cx("relative h-36 bg-gradient-to-br", asset.thumb ?? "from-slate-100 to-white")}>
        <span className={cx("absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium", statusClass[asset.status])}>
          {asset.status}
        </span>
        <span className="absolute left-3 top-3 rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-ink backdrop-blur">
          {asset.type}
        </span>
      </div>
      <div className="p-4">
        <div className="mb-2 truncate text-sm font-semibold text-ink">{asset.name}</div>
        <div className="grid grid-cols-2 gap-y-1 text-xs text-muted">
          <span>上传人：{asset.uploader}</span>
          <span>使用：{asset.usageCount ?? 0} 次</span>
          <span className="col-span-2">创建：{asset.createdAt}</span>
        </div>
        {asset.reason && <div className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{asset.reason}</div>}
        <div className="mt-4 flex flex-wrap gap-2">
          <Action icon={Eye} label="预览" onClick={() => onPreview(asset)} />
          <Action icon={PencilLine} label="改名" disabled={!canManage} onClick={() => onRename(asset)} />
          <Action icon={Trash2} label="删除" disabled={!canManage} onClick={() => onDelete(asset)} />
        </div>
      </div>
    </article>
  );
}

function Action({
  icon: Icon,
  label,
  disabled,
  onClick,
}: {
  icon: typeof Eye;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 items-center gap-1.5 rounded-full border border-line px-2.5 text-xs font-medium text-muted hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon size={13} />
      {label}
    </button>
  );
}
