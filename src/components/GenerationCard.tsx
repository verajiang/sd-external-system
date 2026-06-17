import { Download, Heart, MoreHorizontal, PencilLine, RefreshCw, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { GenerationItem } from "../types";
import { cx } from "../utils";

interface GenerationCardProps {
  item: GenerationItem;
  onEdit: (item: GenerationItem) => void;
  onRegenerate: (item: GenerationItem) => void;
  onDownload: (item: GenerationItem) => void;
}

export function GenerationCard({ item, onEdit, onRegenerate, onDownload }: GenerationCardProps) {
  const statusClass =
    item.status === "生成成功"
      ? "bg-emerald-50 text-emerald-700"
      : item.status === "生成失败"
        ? "bg-rose-50 text-rose-700"
        : "bg-blue-50 text-blue-700";

  return (
    <article className="rounded-[28px] border border-line bg-white p-5 shadow-panel">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted">引用素材</span>
            {item.assets.map((asset) => (
              <ReferenceChip key={asset} asset={asset} />
            ))}
          </div>
          <p className="text-sm leading-6 text-ink">{item.prompt}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[item.params.mode, item.params.ratio, item.params.resolution, item.params.duration, `${item.params.count}条`].map((tag) => (
              <span key={tag} className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">
                {tag}
              </span>
            ))}
            {item.params.sound && <span className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">输出声音</span>}
          </div>
        </div>
        <span className={cx("shrink-0 rounded-full px-3 py-1 text-xs font-medium", statusClass)}>{item.status}</span>
      </div>

      <div className="grid grid-cols-[minmax(220px,320px)_1fr] gap-4">
        <div className={cx("grid gap-2", item.results.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {item.results.map((result) => (
            <div key={result.id} className={cx("relative overflow-hidden rounded-3xl bg-gradient-to-br", result.cover, item.results.length > 1 ? "h-[118px]" : "h-[148px]")}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_24%,rgba(255,255,255,.9),transparent_32%),radial-gradient(circle_at_72%_68%,rgba(99,91,255,.18),transparent_36%)]" />
              <div className="absolute bottom-2 left-2 max-w-[88%] truncate rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-ink backdrop-blur">
                {result.title}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-between">
          {item.status === "生成失败" && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <AlertCircle size={16} />
              {item.error}
            </div>
          )}
          {item.status === "生成中" && (
            <div className="rounded-2xl bg-blue-50 px-3 py-2 text-sm text-blue-700">
              正在生成 {item.results.length} 条结果，完成后会同步出现在作品视图。
            </div>
          )}
          {item.status === "生成成功" && (
            <div className="rounded-2xl bg-canvas px-3 py-2 text-sm text-muted">
              创建账号 {item.creator} · 产出 {item.results.length} 条 · 消耗 {item.credits} 次额度 · {item.downloaded ? "已下载" : "未下载"}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Action icon={PencilLine} label="重新编辑" onClick={() => onEdit(item)} />
            <Action icon={RefreshCw} label="再次生成" onClick={() => onRegenerate(item)} />
            <Action icon={Download} label="下载" onClick={() => onDownload(item)} disabled={item.status !== "生成成功"} />
            <Action icon={Heart} label="收藏" onClick={() => undefined} />
            <Action icon={MoreHorizontal} label="更多" onClick={() => undefined} />
          </div>
        </div>
      </div>
    </article>
  );
}

function ReferenceChip({ asset }: { asset: string }) {
  const label = asset.replace("@", "");
  const isVideo = label.includes("视频");
  const isAudio = label.includes("音频") || label.includes("口播") || label.includes("音乐");
  const cover = label.includes("鞋")
    ? "from-orange-200 via-stone-300 to-amber-100"
    : label.includes("女包")
      ? "from-rose-200 via-orange-100 to-white"
      : label.includes("护肤")
        ? "from-pink-100 via-violet-100 to-white"
        : isVideo
          ? "from-slate-900 via-blue-500 to-cyan-200"
          : isAudio
            ? "from-violet-200 via-blue-100 to-white"
            : "from-cyan-100 via-indigo-100 to-white";

  return (
    <span className="group relative inline-flex">
      <span className="inline-flex cursor-default items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-brand">
        <span className={cx("h-4 w-4 rounded-md bg-gradient-to-br", cover)} />
        @{label}
      </span>
      <span className="pointer-events-none absolute bottom-7 left-0 z-30 hidden w-[236px] rounded-2xl border border-line bg-white p-3 shadow-soft group-hover:block">
        <span className={cx("relative block h-56 overflow-hidden rounded-xl bg-gradient-to-br", cover)}>
          <span className="absolute left-2 top-2 rounded-full bg-ink/55 px-2 py-1 text-[10px] text-white">{isVideo ? "视频素材" : isAudio ? "音频素材" : "图片素材"}</span>
          <span className="absolute bottom-2 left-2 rounded-lg bg-ink/55 px-2 py-1 text-xs font-medium text-white">
            {isVideo ? `${label} 12.3s` : label}
          </span>
        </span>
      </span>
    </span>
  );
}

function Action({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-medium text-muted transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
