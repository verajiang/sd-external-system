import { Grid2X2, MessageSquareText, Play, Download, RefreshCw, Heart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { assets as mockAssets, generationHistory } from "../data/mock";
import type { GenerationItem, GenerationParams, Merchant, User } from "../types";
import { cx, estimateCredits, makeGeneration } from "../utils";
import { ComposerBox } from "../components/ComposerBox";
import { GenerationCard } from "../components/GenerationCard";

interface GeneratePageProps {
  user: User;
  merchant: Merchant;
  onToast: (message: string) => void;
}

const initialParams: GenerationParams = {
  mode: "全能参考",
  ratio: "智能比例",
  resolution: "720p",
  duration: "10s",
  count: 1,
  sound: true,
};

export function GeneratePage({ user, merchant, onToast }: GeneratePageProps) {
  const [view, setView] = useState<"chat" | "works">("chat");
  const [prompt, setPrompt] = useState("");
  const [params, setParams] = useState<GenerationParams>(initialParams);
  const [batchCount, setBatchCount] = useState(8);
  const [items, setItems] = useState<GenerationItem[]>(generationHistory);

  useEffect(() => {
    const timers = items
      .filter((item) => item.status === "生成中")
      .map((item) =>
        window.setTimeout(() => {
          setItems((current) => current.map((next) => (next.id === item.id ? { ...next, status: "生成成功" } : next)));
        }, 3200),
      );
    return () => timers.forEach(window.clearTimeout);
  }, [items]);

  const visibleItems = useMemo(() => {
    return user.role === "管理员" ? items : items.filter((item) => item.creator === user.name);
  }, [items, user.name, user.role]);

  const works = useMemo(
    () =>
      visibleItems
        .filter((item) => item.status !== "生成失败")
        .flatMap((item) =>
          item.results.map((result) => ({
            task: item,
            result,
          })),
        ),
    [visibleItems],
  );

  function submitGeneration() {
    const credits = estimateCredits(params, batchCount);
    if (credits > merchant.remainingCredits) {
      onToast("额度不足，请减少生成数量或升级套餐");
      return;
    }
    const item = makeGeneration(params, prompt, credits, user.name);
    setItems((current) => [item, ...current]);
    setPrompt("");
  }

  function editItem(item: GenerationItem) {
    setPrompt(item.prompt);
    setParams(item.params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function regenerateItem(item: GenerationItem) {
    const credits = estimateCredits(item.params, batchCount);
    const next = makeGeneration(item.params, item.prompt, credits, user.name);
    setItems((current) => [next, ...current]);
    onToast("已复制参数并开始再次生成");
  }

  return (
    <main className="min-h-screen pl-[248px]">
      <div className="mx-auto max-w-[1180px] px-8 py-7">
        <div className="mb-5 flex items-center justify-between">
          <div className="text-sm text-muted">输入想法，上传素材，开始生成视频</div>
          <div className="flex rounded-2xl border border-line bg-white p-1 shadow-sm">
            <ViewButton active={view === "chat"} icon={MessageSquareText} label="对话视图" onClick={() => setView("chat")} />
            <ViewButton active={view === "works"} icon={Grid2X2} label="作品视图" onClick={() => setView("works")} />
          </div>
        </div>

        <ComposerBox
          prompt={prompt}
          params={params}
          batchCount={batchCount}
          assets={mockAssets}
          merchant={merchant}
          onPromptChange={setPrompt}
          onParamsChange={setParams}
          onBatchCountChange={setBatchCount}
          onSubmit={submitGeneration}
          onToast={onToast}
        />

        {view === "chat" ? (
          <section className="mx-auto mt-7 flex w-full max-w-4xl flex-col gap-4 pb-12">
            {visibleItems.map((item) => (
              <GenerationCard key={item.id} item={item} onEdit={editItem} onRegenerate={regenerateItem} onDownload={() => onToast("下载任务已开始")} />
            ))}
          </section>
        ) : (
          <section className="mt-7 grid grid-cols-3 gap-4 pb-12">
            {works.map(({ task, result }) => (
              <article key={result.id} className="overflow-hidden rounded-[28px] border border-line bg-white shadow-panel">
                <div className={cx("relative h-44 bg-gradient-to-br", result.cover)}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_22%,rgba(255,255,255,.9),transparent_34%),radial-gradient(circle_at_70%_75%,rgba(99,91,255,.2),transparent_38%)]" />
                  <span className="absolute right-3 top-3 rounded-full bg-white/80 px-2.5 py-1 text-xs text-ink backdrop-blur">{task.params.mode}</span>
                </div>
                <div className="p-4">
                  <div className="mb-2 font-semibold text-ink">{result.title}</div>
                  <div className="space-y-1 text-xs text-muted">
                    <div>创建账号：{task.creator}</div>
                    <div>使用真人：{task.person ?? "无"}</div>
                    <div>所属任务：{task.videoName}</div>
                    <div>消耗额度：{task.credits} · {result.downloaded ? "已下载" : "未下载"}</div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <IconButton icon={Play} label="播放" onClick={() => onToast("播放预览")} />
                    <IconButton icon={Download} label="下载" onClick={() => onToast("下载任务已开始")} />
                    <IconButton icon={RefreshCw} label="再次生成" onClick={() => regenerateItem(task)} />
                    <IconButton icon={Heart} label="收藏" onClick={() => onToast("已收藏")} />
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function ViewButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cx("flex h-9 items-center gap-2 rounded-xl px-3 text-sm transition", active ? "bg-ink text-white" : "text-muted hover:text-ink")}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function IconButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={label} className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted hover:border-brand hover:text-brand">
      <Icon size={15} />
    </button>
  );
}
