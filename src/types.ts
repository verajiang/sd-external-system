export type PageKey = "generate" | "assets" | "team" | "usage";

export type PlatformPageKey = "merchants" | "operations";

export type GenerationMode =
  | "全能参考"
  | "首尾帧";

export type GenerationStatus = "生成中" | "生成成功" | "生成失败";

export type AssetStatus = "可用" | "处理中" | "失败" | "未认证";

export interface Merchant {
  companyName: string;
  plan: string;
  remainingCredits: number;
  usedCredits: number;
  seatsUsed: number;
  seatsTotal: number;
  expiresAt: string;
}

export interface User {
  name: string;
  role: "管理员" | "普通账号";
}

export interface Asset {
  id: string;
  name: string;
  type: "真人" | "图片" | "视频" | "音频";
  status: AssetStatus;
  reason?: string;
  thumb?: string;
  uploader?: string;
  usageCount?: number;
  createdAt?: string;
}

export interface HumanProfile {
  id: string;
  name: string;
  status: "未认证" | "认证中" | "已认证" | "认证失败";
  thumb: string;
  activeMaterials: number;
  processingMaterials: number;
  failedMaterials: number;
  createdAt: string;
  failReason?: string;
}

export interface AuthorizationRecord {
  id: string;
  target: string;
  humanName: string;
  status: "有效" | "即将到期" | "已过期";
  period: string;
  fileName: string;
}

export interface TeamMember {
  id: string;
  name: string;
  contact: string;
  role: "管理员" | "普通账号";
  status: "启用" | "停用";
  monthlyGenerations: number;
  monthlyCredits: number;
  downloads: number;
  lastLoginAt: string;
  avatar: string;
  quotaLimit?: number;
  allowBatch: boolean;
  maxPerGeneration: number;
}

export interface TeamUsageRecord {
  id: string;
  time: string;
  account: string;
  mode: GenerationMode;
  videoName: string;
  humanName: string;
  credits: number;
  status: "成功" | "失败" | "生成中";
  downloaded: boolean;
}

export interface GenerationParams {
  mode: GenerationMode;
  ratio: string;
  resolution: string;
  duration: string;
  count: number;
  sound: boolean;
}

export interface GenerationItem {
  id: string;
  prompt: string;
  assets: string[];
  params: GenerationParams;
  status: GenerationStatus;
  cover: string;
  videoName: string;
  results: GenerationResult[];
  creator: string;
  person?: string;
  credits: number;
  downloaded: boolean;
  error?: string;
}

export interface GenerationResult {
  id: string;
  title: string;
  cover: string;
  downloaded: boolean;
}

export interface PlatformOperator {
  name: string;
  role: "平台运营" | "客服实施";
}

export interface MerchantPrimaryAccount {
  name: string;
  contact: string;
  status: "待首次登录" | "启用" | "停用";
  lastLoginAt: string;
}

export interface CreditGrant {
  id: string;
  source: "套餐额度" | "赠送额度" | "手工调整额度";
  amount: number;
  remaining: number;
  expiresAt: string;
  createdAt: string;
  note: string;
}

export interface ManagedMerchant {
  id: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  status: "启用" | "已停用";
  plan: string;
  seatsUsed: number;
  seatsTotal: number;
  creditGrants: CreditGrant[];
  remainingCredits: number;
  usedCredits: number;
  expiresAt: string;
  createdAt: string;
  primaryAccount: MerchantPrimaryAccount;
  monthlyGenerations: number;
  successRate: number;
}

export interface PlatformAuditLog {
  id: string;
  time: string;
  operator: string;
  merchantName: string;
  action: "开通商家" | "停用商家" | "启用商家" | "调整套餐席位" | "新增额度批次" | "重置首账号密码";
  detail: string;
}
