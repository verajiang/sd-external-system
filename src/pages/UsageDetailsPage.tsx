import { Download } from "lucide-react";
import { teamUsageRecords } from "../data/mock";
import { cx } from "../utils";

interface UsageDetailsPageProps {
  onToast: (message: string) => void;
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

export function UsageDetailsPage({ onToast }: UsageDetailsPageProps) {
  function exportUsageRecords() {
    exportCsv(
      "zhiboxing-usage-records.csv",
      ["时间", "账号", "模式", "视频名称", "真人形象", "消耗额度", "状态", "下载状态"],
      teamUsageRecords.map((record) => [record.time, record.account, record.mode, record.videoName, record.humanName, record.credits, record.status, record.downloaded ? "已下载" : "未下载"]),
    );
    onToast("消耗明细已导出");
  }

  return (
    <main className="min-h-screen pl-[248px]">
      <div className="mx-auto max-w-[1180px] px-8 py-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-ink">消耗明细</h1>
            <p className="mt-1 text-sm text-muted">按生成任务查看全员额度消耗，并导出原始流水。</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button onClick={exportUsageRecords} className="flex h-10 items-center gap-2 rounded-2xl border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-brand hover:text-brand">
              <Download size={16} />
              导出明细
            </button>
          </div>
        </div>

        <section className="rounded-[28px] border border-line bg-white p-5 shadow-panel">
          <div className="mb-2 grid grid-cols-[1.3fr_.8fr_.9fr_1.4fr_.8fr_.7fr_.7fr_.7fr] px-4 text-xs font-semibold text-muted">
            <span>时间</span><span>账号</span><span>模式</span><span>视频名称</span><span>真人形象</span><span>消耗额度</span><span>状态</span><span>下载状态</span>
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
    </main>
  );
}

function UsageStatus({ status }: { status: "成功" | "失败" | "生成中" }) {
  const color = status === "成功" ? "bg-emerald-50 text-emerald-700" : status === "失败" ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700";
  return <span className={cx("w-fit rounded-full px-2.5 py-1 text-xs font-semibold", color)}>{status}</span>;
}
