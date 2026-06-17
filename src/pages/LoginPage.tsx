import { ArrowRight, LockKeyhole, UserRound } from "lucide-react";
import { useState } from "react";
import type { User } from "../types";
import { cx } from "../utils";

type LoginRole = User["role"];

interface LoginPageProps {
  role: LoginRole;
  onRoleChange: (role: LoginRole) => void;
  onLogin: () => void;
  onToast: (message: string) => void;
}

const roleOptions: Array<{ role: LoginRole; title: string; account: string }> = [
  { role: "管理员", title: "管理员", account: "AnsayeY" },
  { role: "普通账号", title: "普通账号", account: "Mia" },
];

export function LoginPage({ role, onRoleChange, onLogin, onToast }: LoginPageProps) {
  const current = roleOptions.find((item) => item.role === role) ?? roleOptions[0];
  const [account, setAccount] = useState(current.account);
  const [password, setPassword] = useState("demo123456");

  function switchRole(nextRole: LoginRole) {
    const next = roleOptions.find((item) => item.role === nextRole) ?? roleOptions[0];
    onRoleChange(nextRole);
    setAccount(next.account);
  }

  function submit() {
    if (!account.trim() || !password.trim()) {
      onToast("请填写账号和密码");
      return;
    }
    onLogin();
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="grid min-h-screen grid-cols-[1fr_440px]">
        <section className="flex flex-col justify-between border-r border-line bg-white p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden border border-line bg-white">
              <img src="./zhiboxing-logo.png" alt="智播星 logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="text-base font-medium text-ink">智播星</div>
              <div className="text-xs tracking-[0.18em] text-muted">ZHI BO XING</div>
            </div>
          </div>

          <div className="flex justify-center">
            <img
              src="./login-visual.svg"
              alt="AI 视频创作工作台"
              className="h-auto w-full max-w-[820px] object-contain"
            />
          </div>

          <div className="text-xs text-muted">AI 视频创作，让商品内容更快上线</div>
        </section>

        <section className="flex items-center justify-center bg-canvas p-8">
          <div className="w-full border border-line bg-white p-6 shadow-panel">
            <div className="mb-6">
              <div className="text-lg font-medium text-ink">账号登录</div>
              <div className="mt-1 text-sm text-muted">登录智播星商家端，开始生成和管理视频内容。</div>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-2">
              {roleOptions.map((item) => (
                <button
                  key={item.role}
                  onClick={() => switchRole(item.role)}
                  className={cx(
                    "border px-3 py-3 text-left transition",
                    role === item.role ? "border-brand bg-blue-50 text-brand" : "border-line bg-white text-muted hover:border-brand hover:text-brand",
                  )}
                >
                  <div className="text-sm font-medium">{item.title}</div>
                </button>
              ))}
            </div>

            <label className="mb-4 block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
                <UserRound size={15} />
                账号
              </span>
              <input
                value={account}
                onChange={(event) => setAccount(event.target.value)}
                className="h-10 w-full border border-line bg-white px-3 text-sm text-ink outline-none focus:border-brand"
                placeholder="请输入账号"
              />
            </label>

            <label className="mb-5 block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
                <LockKeyhole size={15} />
                密码
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-10 w-full border border-line bg-white px-3 text-sm text-ink outline-none focus:border-brand"
                placeholder="请输入密码"
              />
            </label>

            <button onClick={submit} className="flex h-10 w-full items-center justify-center gap-2 bg-brand px-4 text-sm font-medium text-white">
              登录
              <ArrowRight size={15} />
            </button>

            <div className="mt-4 flex items-center justify-between text-xs text-muted">
              <button onClick={() => onToast("请联系管理员重置密码")} className="hover:text-brand">忘记密码</button>
              <button onClick={() => onToast("请联系企业管理员开通账号")} className="hover:text-brand">申请开通账号</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
