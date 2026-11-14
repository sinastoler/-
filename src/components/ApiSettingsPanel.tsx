import React, { useState } from 'react';
import { ApiConfig } from '../types';
import {
  Sliders,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  Cpu,
} from 'lucide-react';

interface ApiSettingsPanelProps {
  apiConfig: ApiConfig;
  onChangeApiConfig: (next: ApiConfig) => void;
  onResetDefault: () => void;
  onNotify: (message: string, type?: 'success' | 'warning' | 'error') => void;
}

export const DEFAULT_API_CONFIG: ApiConfig = {
  tierPreset: 'free',
  textModel: 'gemini-4-hydrogen',
  imageModel: 'gemini-3.1-flash-lite-image',
  autoFallbackOnQuota: true,
  jpegQuality: 0.84,
  targetWidth: 1280,
};

export const ApiSettingsPanel: React.FC<ApiSettingsPanelProps> = ({
  apiConfig,
  onChangeApiConfig,
  onResetDefault,
  onNotify,
}) => {
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{
    ok: boolean;
    latencyMs?: number;
    model?: string;
    message: string;
  } | null>(null);

  const handleApplyPreset = (preset: 'free' | 'standard' | 'pro') => {
    if (preset === 'free') {
      onChangeApiConfig({
        ...apiConfig,
        tierPreset: 'free',
        textModel: 'gemini-4-hydrogen',
        imageModel: 'builtin-oriental-gallery',
        autoFallbackOnQuota: true,
      });
      onNotify(
        '已切换至「免费层极速试用档」：使用 gemini-4-hydrogen 写稿，配图采用免配额实景摄影库与 Canvas 压缩',
        'success'
      );
    } else if (preset === 'standard') {
      onChangeApiConfig({
        ...apiConfig,
        tierPreset: 'standard',
        textModel: 'gemini-4-hydrogen',
        imageModel: 'gemini-3.1-flash-lite-image',
        autoFallbackOnQuota: true,
      });
      onNotify(
        '已切换至「标准 AI 实景生图档」：gemini-4-hydrogen + gemini-3.1-flash-lite-image',
        'success'
      );
    } else {
      onChangeApiConfig({
        ...apiConfig,
        tierPreset: 'pro',
        textModel: 'gemini-4-argon',
        imageModel: 'gemini-nano-banana-2.1',
        autoFallbackOnQuota: true,
      });
      onNotify(
        '已切换至「付费旗舰精修档」：gemini-4-argon + gemini-nano-banana-2.1',
        'success'
      );
    }
  };

  const handlePingApi = async () => {
    setIsPinging(true);
    setPingResult(null);
    try {
      const response = await fetch('/api/gemini/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiConfig }),
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        setPingResult({
          ok: true,
          latencyMs: data.latencyMs,
          model: data.model,
          message: `连接正常 · 当前文本模型 ${data.model} 响应耗时 ${data.latencyMs} ms`,
        });
        onNotify(`API 连通性测试通过 (${data.latencyMs} ms)`, 'success');
      } else {
        setPingResult({
          ok: false,
          message: data.error || 'API 连接测试未通过',
        });
      }
    } catch (err) {
      setPingResult({
        ok: false,
        message: err instanceof Error ? err.message : '网络请求异常',
      });
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. One-Click Tier Presets (Free vs Paid) */}
      <div className="p-4 bg-white border border-[#E6E4DD] rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#181816]" />
            <h3 className="text-xs font-semibold text-[#181816]">
              01. 算力档位预设（一键切换免费试用 / 付费生图档）
            </h3>
          </div>
          <span className="text-[11px] text-[#78756E]">自动持久化保存</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          <button
            type="button"
            onClick={() => handleApplyPreset('free')}
            className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
              apiConfig.tierPreset === 'free'
                ? 'bg-[#F4F6F4] border-[#233129] text-[#181816]'
                : 'bg-[#FAF9F6] border-[#E6E4DD] text-[#57544E] hover:border-[#C7C3B8]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#181816]">
                方案 A · 免费层试用档（推荐先用此档）
              </span>
              <span className="text-[11px] font-mono text-[#233129]">
                免生图配额消耗
              </span>
            </div>
            <p className="text-[11px] text-[#78756E] mt-1 leading-relaxed">
              文本仿写与 JSON 结构化规划调用免费层友好的 gemini-4-hydrogen；5 张配图直接采用内置东方雅致实景摄影图库并执行 Canvas 压缩，零限额报错。
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('standard')}
            className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
              apiConfig.tierPreset === 'standard'
                ? 'bg-[#F4F6F4] border-[#233129] text-[#181816]'
                : 'bg-[#FAF9F6] border-[#E6E4DD] text-[#57544E] hover:border-[#C7C3B8]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#181816]">
                方案 B · 标准全自动生图档（均衡首选）
              </span>
              <span className="text-[11px] font-mono text-[#78756E]">
                自动平滑降级兜底
              </span>
            </div>
            <p className="text-[11px] text-[#78756E] mt-1 leading-relaxed">
              文本使用 gemini-4-hydrogen，配图调用 gemini-3.1-flash-lite-image 实时绘制 16:9 照片；若免费层触发限额将自动平滑切换至东方实景底图。
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('pro')}
            className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
              apiConfig.tierPreset === 'pro'
                ? 'bg-[#F4F6F4] border-[#233129] text-[#181816]'
                : 'bg-[#FAF9F6] border-[#E6E4DD] text-[#57544E] hover:border-[#C7C3B8]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#181816]">
                方案 C · 旗舰大师精修档（付费层专属）
              </span>
              <span className="text-[11px] font-mono text-[#78756E]">
                Argon + Nano Banana 2.1
              </span>
            </div>
            <p className="text-[11px] text-[#78756E] mt-1 leading-relaxed">
              文本采用深度文学推理模型 gemini-4-argon，配图采用高画质 gemini-nano-banana-2.1。
            </p>
          </button>
        </div>
      </div>

      {/* 2. Fine-Grained Model & Compression Controls */}
      <div className="p-4 bg-white border border-[#E6E4DD] rounded-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-[#F0EEE8] pb-2.5">
          <Cpu className="w-4 h-4 text-[#181816]" />
          <h3 className="text-xs font-semibold text-[#181816]">
            02. 模型调度与 16:9 图像压缩参数微调
          </h3>
        </div>

        <div className="space-y-3">
          <div>
            <label
              htmlFor="text-model-select"
              className="block text-xs font-medium text-[#57544E] mb-1"
            >
              文本提炼与结构化写稿模型
            </label>
            <select
              id="text-model-select"
              value={apiConfig.textModel}
              onChange={(e) =>
                onChangeApiConfig({ ...apiConfig, textModel: e.target.value })
              }
              className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#DDD9CE] rounded-lg text-[#181816] focus:outline-none focus:border-[#181816]"
            >
              <option value="gemini-4-hydrogen">
                gemini-4-hydrogen（推荐 · 免费/付费通用高速）
              </option>
              <option value="gemini-4-argon">
                gemini-4-argon（深度文学推理 · 建议付费层）
              </option>
              <option value="gemini-3.1-flash-lite">
                gemini-3.1-flash-lite（轻量低延迟）
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="image-model-select"
              className="block text-xs font-medium text-[#57544E] mb-1"
            >
              16:9 东方美学配图生成引擎
            </label>
            <select
              id="image-model-select"
              value={apiConfig.imageModel}
              onChange={(e) =>
                onChangeApiConfig({ ...apiConfig, imageModel: e.target.value })
              }
              className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#DDD9CE] rounded-lg text-[#181816] focus:outline-none focus:border-[#181816]"
            >
              <option value="gemini-3.1-flash-lite-image">
                gemini-3.1-flash-lite-image（标准 16:9 实景生图 · 失败自动兜底）
              </option>
              <option value="builtin-oriental-gallery">
                免生图 API 消耗 · 内置「清敬雅和」实景摄影图库 (纯免费层零报错)
              </option>
              <option value="gemini-nano-banana-2.1">
                gemini-nano-banana-2.1（高画质 16:9 生图 · 付费层）
              </option>
              <option value="gemini-3-pro-image">
                gemini-3-pro-image（专业版生图 · 付费层）
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label
                htmlFor="jpeg-quality-select"
                className="block text-xs font-medium text-[#57544E] mb-1"
              >
                Canvas JPEG 压缩画质
              </label>
              <select
                id="jpeg-quality-select"
                value={String(apiConfig.jpegQuality)}
                onChange={(e) =>
                  onChangeApiConfig({
                    ...apiConfig,
                    jpegQuality: parseFloat(e.target.value),
                  })
                }
                className="w-full px-2.5 py-2 text-xs font-mono tabular-nums bg-[#FAF9F6] border border-[#DDD9CE] rounded-lg text-[#181816]"
              >
                <option value="0.75">75%（轻量富文本）</option>
                <option value="0.84">84%（公众号均衡推荐）</option>
                <option value="0.92">92%（印刷级高画质）</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="target-width-select"
                className="block text-xs font-medium text-[#57544E] mb-1"
              >
                16:9 输出分辨率
              </label>
              <select
                id="target-width-select"
                value={String(apiConfig.targetWidth)}
                onChange={(e) =>
                  onChangeApiConfig({
                    ...apiConfig,
                    targetWidth: parseInt(e.target.value, 10),
                  })
                }
                className="w-full px-2.5 py-2 text-xs font-mono tabular-nums bg-[#FAF9F6] border border-[#DDD9CE] rounded-lg text-[#181816]"
              >
                <option value="1280">1280 × 720 (HD)</option>
                <option value="1920">1920 × 1080 (FHD)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Connectivity Check & Reset Row */}
        <div className="pt-2 space-y-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePingApi}
              disabled={isPinging}
              className="flex-1 py-2.5 px-3 bg-[#181816] hover:bg-[#2E2D29] disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              {isPinging ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>正在检测服务端模型连通性...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>测试当前 API 模型连通性</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onResetDefault();
                setPingResult(null);
              }}
              className="py-2.5 px-3 bg-[#F2F0EA] hover:bg-[#E6E3DA] text-[#57544E] text-xs font-medium rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>恢复默认</span>
            </button>
          </div>

          {pingResult && (
            <div
              className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                pingResult.ok
                  ? 'bg-[#F0F5F2] border-[#C6D8CE] text-[#1E3A2B]'
                  : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
              }`}
            >
              {pingResult.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="leading-relaxed">{pingResult.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
