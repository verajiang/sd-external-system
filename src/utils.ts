import type { GenerationItem, GenerationParams, GenerationResult } from "./types";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function estimateCredits(params: GenerationParams, batchCount: number) {
  void batchCount;
  return params.count;
}

export function makeGeneration(params: GenerationParams, prompt: string, credits: number, creator = "AnsayeY"): GenerationItem {
  const id = `gen-${Date.now()}`;
  const resultCount = params.count;
  const titleBase = makeVideoTitle(prompt, params.mode);
  const results = makeResults(id, titleBase, resultCount);
  return {
    id,
    prompt,
    assets: params.mode === "首尾帧" ? ["@图片1", "@图片2"] : ["@视频1", "@图片1"],
    params: { ...params },
    status: "生成中",
    cover: results[0].cover,
    videoName: titleBase,
    results,
    creator,
    person: undefined,
    credits,
    downloaded: false,
  };
}

export function makeVideoTitle(prompt: string, mode: GenerationParams["mode"]) {
  const normalized = prompt.replace(/@\S+/g, "").replace(/[，。,.！!？?]/g, " ").trim();
  const words = normalized.split(/\s+/).join("");
  const base = words.slice(0, 8) || mode;
  return `${base}短片`;
}

function makeResults(taskId: string, titleBase: string, count: number): GenerationResult[] {
  const covers = [
    "from-blue-100 via-indigo-100 to-white",
    "from-cyan-100 via-blue-100 to-white",
    "from-violet-100 via-fuchsia-100 to-white",
    "from-emerald-100 via-cyan-100 to-white",
  ];
  return Array.from({ length: count }, (_, index) => ({
    id: `${taskId}-r${index + 1}`,
    title: `${titleBase} ${String(index + 1).padStart(2, "0")}`,
    cover: covers[index % covers.length],
    downloaded: false,
  }));
}
