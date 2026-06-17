import { AtSign, ChevronDown, FolderOpen, ImagePlus, RotateCcw, Send, SlidersHorizontal, Upload, Volume2, VolumeX, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Asset, GenerationMode, GenerationParams, Merchant } from "../types";
import { estimateCredits } from "../utils";
import { cx } from "../utils";

interface ComposerBoxProps {
  prompt: string;
  params: GenerationParams;
  batchCount: number;
  assets: Asset[];
  merchant: Merchant;
  onPromptChange: (prompt: string) => void;
  onParamsChange: (params: GenerationParams) => void;
  onBatchCountChange: (count: number) => void;
  onSubmit: () => void;
  onToast: (message: string) => void;
}

const modes: Array<{ value: GenerationMode; title: string; desc: string }> = [
  { value: "全能参考", title: "全能参考", desc: "参考素材的主体、动作、风格或运镜" },
  { value: "首尾帧", title: "首尾帧", desc: "用首帧和尾帧控制画面变化" },
];
const ratios = ["智能比例", "9:16", "16:9", "1:1", "21:9"];
const resolutions = ["720p", "1080p"];
const durations = ["5s", "10s", "15s"];
const counts = [1, 2, 4];

const uploadedSeeds = [
  { name: "图片1", type: "图片", thumb: "from-rose-300 via-orange-200 to-stone-200" },
  { name: "图片2", type: "图片", thumb: "from-cyan-200 via-blue-200 to-slate-300" },
  { name: "视频1", type: "视频", thumb: "from-slate-900 via-blue-500 to-cyan-200" },
  { name: "音频1", type: "音频", thumb: "from-violet-200 via-blue-100 to-white" },
];

export function ComposerBox({
  prompt,
  params,
  batchCount,
  assets,
  merchant,
  onPromptChange,
  onParamsChange,
  onBatchCountChange,
  onSubmit,
  onToast,
}: ComposerBoxProps) {
  const [uploadedAssets, setUploadedAssets] = useState(uploadedSeeds.slice(0, 2));
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);
  const [assetFilter, setAssetFilter] = useState<"全部" | Asset["type"]>("全部");
  const estimatedCredits = estimateCredits(params, batchCount);
  const quotaInsufficient = estimatedCredits > merchant.remainingCredits;
  const canSubmit = prompt.trim().length > 0 && !quotaInsufficient;
  const mentionOptions = useMemo(() => {
    return uploadedAssets.map((asset) => ({ ...asset, id: asset.name, status: "可用" as const }));
  }, [uploadedAssets]);
  const availableLibraryAssets = assets.filter((asset) => asset.status === "可用");
  const libraryOptions = assetFilter === "全部" ? availableLibraryAssets : availableLibraryAssets.filter((asset) => asset.type === assetFilter);

  function changePrompt(value: string) {
    onPromptChange(value);
    setShowMentionMenu(value.endsWith("@") || /(^|\s)@[\u4e00-\u9fa5\w-]*$/.test(value));
  }

  function referenceAsset(assetName: string, disabled?: boolean) {
    if (disabled) {
      onToast(`${assetName} 当前不可引用`);
      return;
    }
    const nextPrompt = prompt.replace(/@[\u4e00-\u9fa5\w-]*$/, "").trimEnd();
    onPromptChange(`${nextPrompt}${nextPrompt ? " " : ""}@${assetName} `);
    setShowMentionMenu(false);
  }

  function addUploadedAsset(type: "图片" | "视频" | "音频") {
    const sameTypeCount = uploadedAssets.filter((asset) => asset.type === type).length + 1;
    const seed = uploadedSeeds.find((asset) => asset.type === type) ?? uploadedSeeds[0];
    setUploadedAssets((current) => [...current, { ...seed, name: `${type}${sameTypeCount}` }]);
    setShowUploadMenu(false);
  }

  function selectLibraryAsset(asset: Asset) {
    if (asset.status !== "可用") {
      onToast(`${asset.name} 当前${asset.status}，不可选择`);
      return;
    }
    setUploadedAssets((current) => {
      if (current.some((item) => item.name === asset.name)) return current;
      return [...current, { name: asset.name, type: asset.type, thumb: asset.thumb ?? "from-slate-100 to-white" }];
    });
    setShowUploadMenu(false);
    setShowAssetPicker(false);
  }

  return (
    <section className="mx-auto w-full max-w-4xl rounded-[32px] border border-line bg-white p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {uploadedAssets.map((asset) => (
          <button
            key={asset.name}
            onClick={() => referenceAsset(asset.name)}
            className="group relative h-20 w-20 overflow-hidden rounded-2xl bg-slate-100 shadow-sm"
          >
            <div className={cx("h-full w-full bg-gradient-to-br", asset.thumb)} />
            <div className="absolute inset-x-0 bottom-0 bg-ink/60 px-2 py-1 text-center text-xs font-medium text-white backdrop-blur-sm">{asset.name}</div>
            <span className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-white/85 text-slate-500 group-hover:flex">
              <X size={12} />
            </span>
          </button>
        ))}
        <div className="relative">
          <button
            onClick={() => setShowUploadMenu((value) => !value)}
            className="flex h-20 w-[132px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-brand hover:text-brand"
          >
            <Upload size={22} />
            <span className="mt-1 text-sm font-medium">图片/视频/音频</span>
          </button>
          {showUploadMenu && (
            <div className="absolute left-0 top-[88px] z-20 w-80 rounded-2xl border border-line bg-white p-2 shadow-soft">
              <button
                onClick={() => addUploadedAsset("图片")}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-canvas"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-brand">
                  <ImagePlus size={17} />
                </span>
                <span>
                  <span className="block text-sm font-medium text-ink">上传本地素材</span>
                  <span className="text-xs text-muted">模拟添加图片、视频或音频缩略图</span>
                </span>
              </button>
              <div className="my-2 h-px bg-line" />
              <button
                onClick={() => {
                  setShowUploadMenu(false);
                  setShowAssetPicker(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-canvas"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan">
                  <FolderOpen size={17} />
                </span>
                <span>
                  <span className="block text-sm font-medium text-ink">选择资产素材库</span>
                  <span className="text-xs text-muted">打开弹窗浏览更多素材</span>
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showAssetPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/24 px-6 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[28px] border border-line bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-ink">选择资产素材库</div>
                <div className="mt-1 text-sm text-muted">选中的素材会加入当前输入框，并进入 @ 可引用范围。</div>
              </div>
              <button
                onClick={() => setShowAssetPicker(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted hover:text-ink"
                title="关闭"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mb-4 flex gap-2">
              {(["全部", "真人", "图片", "视频", "音频"] as Array<"全部" | Asset["type"]>).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setAssetFilter(filter)}
                  className={cx(
                    "h-9 rounded-full px-4 text-sm font-medium transition",
                    assetFilter === filter ? "bg-ink text-white" : "border border-line text-muted hover:text-ink",
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="grid max-h-[420px] grid-cols-4 gap-3 overflow-y-auto pr-1 soft-scrollbar">
              {libraryOptions.map((asset) => {
                const selected = uploadedAssets.some((item) => item.name === asset.name);
                return (
                  <button
                    key={asset.id}
                    onClick={() => selectLibraryAsset(asset)}
                    className={cx(
                      "group overflow-hidden rounded-2xl border bg-white text-left transition",
                      selected ? "border-brand ring-2 ring-brand/15" : "border-line",
                      "hover:border-brand hover:shadow-panel",
                    )}
                  >
                    <div className={cx("h-24 bg-gradient-to-br", asset.thumb ?? "from-slate-100 to-white")} />
                    <div className="p-3">
                      <div className="truncate text-sm font-semibold text-ink">{asset.name}</div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                        <span className="text-muted">{asset.type}</span>
                        <span className="text-emerald-600">{asset.status}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        {showMentionMenu && (
          <div className="absolute left-0 top-2 z-10 w-72 rounded-2xl border border-line bg-white p-2 shadow-soft">
            {mentionOptions.length === 0 && (
              <div className="px-3 py-4 text-sm text-muted">当前还没有上传或选择素材</div>
            )}
            {mentionOptions.map((asset) => {
              const disabled = asset.status !== "可用";
              return (
                <button
                  key={asset.id}
                  onClick={() => referenceAsset(asset.name, disabled)}
                  className={cx(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition",
                    disabled ? "cursor-not-allowed opacity-45" : "hover:bg-canvas",
                  )}
                >
                  <span className={cx("h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br", asset.thumb ?? "from-slate-100 to-white")} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{asset.name}</span>
                    <span className="text-xs text-muted">{asset.type} · {asset.status}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <textarea
          value={prompt}
          onFocus={() => prompt.endsWith("@") && setShowMentionMenu(true)}
          onChange={(event) => changePrompt(event.target.value)}
          placeholder="使用@可快速引用上传的文件，如：参考@视频1中的动作，生成@图片1和@图片2中的角色打斗的视频。"
          className="min-h-[146px] w-full resize-none rounded-3xl border border-transparent bg-canvas px-4 py-4 text-base leading-8 text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white"
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowModePicker((value) => !value)}
              className="flex h-9 items-center gap-2 rounded-full border border-line bg-white px-4 text-xs font-semibold text-ink hover:border-brand"
            >
              {params.mode}
              <ChevronDown size={14} className="text-muted" />
            </button>
            {showModePicker && (
              <div className="absolute bottom-11 left-0 z-20 w-72 rounded-2xl border border-line bg-white p-2 shadow-soft">
                {modes.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => {
                      onParamsChange({ ...params, mode: mode.value });
                      setShowModePicker(false);
                    }}
                    className={cx(
                      "w-full rounded-xl px-3 py-2 text-left transition hover:bg-canvas",
                      params.mode === mode.value && "bg-blue-50",
                    )}
                  >
                    <span className="block text-sm font-semibold text-ink">{mode.title}</span>
                    <span className="mt-0.5 block text-xs text-muted">{mode.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex h-9 items-center rounded-full border border-line bg-white px-3 text-xs font-medium text-ink">
            <SlidersHorizontal size={14} className="mr-2 text-muted" />
            <SelectBare value={params.ratio} options={ratios} onChange={(ratio) => onParamsChange({ ...params, ratio })} />
            <span className="mx-2 h-4 w-px bg-line" />
            <SelectBare value={params.resolution} options={resolutions} onChange={(resolution) => onParamsChange({ ...params, resolution })} />
            <span className="mx-2 h-4 w-px bg-line" />
            <SelectBare value={params.duration} options={durations} onChange={(duration) => onParamsChange({ ...params, duration })} />
            <span className="mx-2 h-4 w-px bg-line" />
            <SelectBare value={`${params.count}条`} options={counts.map((count) => `${count}条`)} onChange={(value) => onParamsChange({ ...params, count: Number(value.replace("条", "")) })} />
          </div>
          <button
            onClick={() => onParamsChange({ ...params, sound: !params.sound })}
            className={cx(
              "flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium",
              params.sound ? "border-brand bg-blue-50 text-brand" : "border-line text-muted",
            )}
          >
            {params.sound ? <Volume2 size={14} /> : <VolumeX size={14} />}
            输出声音
          </button>
          <button
            onClick={() => setShowMentionMenu((value) => !value)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted hover:border-brand hover:text-brand"
            title="@ 引用资产"
          >
            <AtSign size={16} />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={() => {
              onPromptChange("");
              setUploadedAssets([]);
            }}
            className="flex h-9 items-center gap-1.5 rounded-full px-2 text-xs font-medium text-muted hover:text-ink"
          >
            <RotateCcw size={15} />
            全部清空
          </button>
          <span className={cx("text-xs", quotaInsufficient ? "text-rose-600" : "text-muted")}>
            预计消耗 {estimatedCredits} 次额度
          </span>
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="flex h-11 items-center gap-2 rounded-2xl bg-ink px-5 text-sm font-semibold text-white shadow-panel transition hover:bg-brand disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Send size={16} />
            生成
          </button>
        </div>
      </div>
    </section>
  );
}

function SelectBare({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="bg-transparent text-xs font-medium text-ink outline-none">
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 rounded-full border border-line bg-white px-3 text-xs font-medium text-ink outline-none hover:border-brand"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
