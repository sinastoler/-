import React, { useRef, useState } from 'react';
import { ApiConfig, StyleSOP, StyleTemplate } from '../types';
import {
  BookOpen,
  Upload,
  Sparkles,
  Plus,
  Trash2,
  FileText,
  Save,
  RotateCcw,
} from 'lucide-react';

interface StyleLibraryPanelProps {
  templates: StyleTemplate[];
  selectedTemplateId: string;
  apiConfig: ApiConfig;
  onSelectTemplate: (id: string) => void;
  onSaveTemplate: (template: StyleTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onNotify: (message: string, type?: 'success' | 'warning' | 'error') => void;
}

const EMPTY_SOP: StyleSOP = {
  rhythm:
    '短句独立成段，每段控制在 1～3 句之间；长短句错落交替，关键哲思句单独成行，营造呼吸感留白。',
  sentencePatterns:
    '高频使用“不是……而是……”、“所谓……不过是……”等对比与收束句式，语调温和笃定。',
  rhetoricAndSymbols:
    '使用全角竖线「｜」分隔章节序号与小标题；使用破折号「——」延展细节；文末使用间隔省略号「. . . . . .」。',
  captionFormat: '0X ｜ 时辰/节气意象 · 器物与光影细节',
  signatureTemplate: '撰文 ｜ 闲事记\n器物与光影，皆是日常的注脚',
  summary: '温润克制的东方生活美学文风，注重留白与器物细节。',
};

export const StyleLibraryPanel: React.FC<StyleLibraryPanelProps> = ({
  templates,
  selectedTemplateId,
  apiConfig,
  onSelectTemplate,
  onSaveTemplate,
  onDeleteTemplate,
  onNotify,
}) => {
  const activeTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [templateName, setTemplateName] = useState(activeTemplate.name);
  const [samples, setSamples] = useState<string[]>(
    activeTemplate.samples.length > 0 ? activeTemplate.samples : ['']
  );
  const [sop, setSop] = useState<StyleSOP>(activeTemplate.sop);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync local editor when user switches template in dropdown
  const handleSwitchTemplate = (id: string) => {
    setIsCreatingNew(false);
    onSelectTemplate(id);
    const found = templates.find((t) => t.id === id);
    if (found) {
      setTemplateName(found.name);
      setSamples(found.samples.length > 0 ? found.samples : ['']);
      setSop(found.sop);
    }
  };

  const handleStartNewTemplate = () => {
    setIsCreatingNew(true);
    setTemplateName('东方雅致风 · 自定义模板');
    setSamples([
      `清晨六点半，窗外的雾气还未散尽。\n\n不是我们拥有得太少，而是我们需要的本就不多。\n\n01 ｜ 晨起煎茶 · 一器一物的秩序\n\n温热的茶汤注入素白瓷盏，水汽氤氲间，新的一天便有了笃定的开端。\n\n. . . . . .\n\n撰文 ｜ 清欢记`,
    ]);
    setSop({ ...EMPTY_SOP });
  };

  const handleSampleChange = (idx: number, val: string) => {
    setSamples((prev) => prev.map((s, i) => (i === idx ? val : s)));
  };

  const handleAddSampleSlot = () => {
    if (samples.length >= 5) {
      onNotify('最多支持提供 5 篇样本文章', 'warning');
      return;
    }
    setSamples((prev) => [...prev, '']);
  };

  const handleRemoveSampleSlot = (idx: number) => {
    if (samples.length <= 1) {
      setSamples(['']);
      return;
    }
    setSamples((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList).slice(0, 5);
    const readContents: string[] = [];

    for (const file of files) {
      if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
        onNotify(`文件 ${file.name} 不是 .md 或 .txt 格式，已跳过`, 'warning');
        continue;
      }
      const text = await file.text();
      if (text.trim()) {
        readContents.push(text.trim());
      }
    }

    if (readContents.length > 0) {
      const merged = [...samples.filter((s) => s.trim().length > 0), ...readContents].slice(0, 5);
      setSamples(merged);
      onNotify(`已成功导入 ${readContents.length} 篇样本文件（共 ${merged.length}/5 篇）`, 'success');
    }
    e.target.value = '';
  };

  const handleExtractSOP = async () => {
    const validSamples = samples.map((s) => s.trim()).filter(Boolean);
    if (validSamples.length === 0) {
      onNotify('请先粘贴至少 1 篇样本文章全文，或上传 .md / .txt 文件', 'error');
      return;
    }

    setIsExtracting(true);
    try {
      const response = await fetch('/api/gemini/extract-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName: templateName.trim() || '东方雅致风',
          samples: validSamples,
          apiConfig,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || '提炼风格失败');
      }
      if (data.sop) {
        setSop(data.sop);
        const savedTemplate: StyleTemplate = {
          id: isCreatingNew ? `custom-tpl-${Date.now()}` : activeTemplate.id,
          name: templateName.trim() || '自定义东方雅致风',
          createdAt: new Date().toISOString().slice(0, 10),
          sampleCount: validSamples.length,
          samples: validSamples,
          sop: data.sop,
          isBuiltin: isCreatingNew ? false : activeTemplate.isBuiltin,
        };
        onSaveTemplate(savedTemplate);
        setIsCreatingNew(false);
        onNotify('AI 已完成样本分析并提炼风格 SOP，已自动保存至本地风格库', 'success');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '提炼风格 SOP 失败';
      onNotify(msg, 'error');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveManualSOP = () => {
    if (!templateName.trim()) {
      onNotify('请输入风格模板名称', 'error');
      return;
    }
    const validSamples = samples.map((s) => s.trim()).filter(Boolean);
    const savedTemplate: StyleTemplate = {
      id: isCreatingNew ? `custom-tpl-${Date.now()}` : activeTemplate.id,
      name: templateName.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
      sampleCount: Math.max(1, validSamples.length),
      samples: validSamples.length > 0 ? validSamples : ['默认样本'],
      sop,
      isBuiltin: isCreatingNew ? false : activeTemplate.isBuiltin,
    };
    onSaveTemplate(savedTemplate);
    setIsCreatingNew(false);
    onNotify(`风格模板「${savedTemplate.name}」已保存至 localStorage`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* 1. Template Selector Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label
            htmlFor="style-template-select"
            className="text-xs font-semibold text-[#5C584F] tracking-wide"
          >
            01. 当前选用风格模板（localStorage 持久化）
          </label>
          <button
            type="button"
            onClick={handleStartNewTemplate}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2C3E35] hover:text-[#1C2822] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新建风格模板</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            id="style-template-select"
            value={isCreatingNew ? '__new__' : selectedTemplateId}
            onChange={(e) => {
              if (e.target.value === '__new__') {
                handleStartNewTemplate();
              } else {
                handleSwitchTemplate(e.target.value);
              }
            }}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DED9CE] rounded-lg text-[#1C1B18] focus:outline-none focus:border-[#2C3E35] transition-colors"
          >
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name} · {tpl.sampleCount} 篇样本
              </option>
            ))}
            {isCreatingNew && (
              <option value="__new__">+ 正在新建：{templateName}</option>
            )}
          </select>

          {!isCreatingNew && !activeTemplate.isBuiltin && (
            <button
              type="button"
              onClick={() => onDeleteTemplate(activeTemplate.id)}
              aria-label={`删除风格模板 ${activeTemplate.name}`}
              className="p-2.5 text-[#8C887F] hover:text-[#B91C1C] bg-white border border-[#DED9CE] rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Template Name & Sample Articles Input (1~5 articles) */}
      <div className="p-4 bg-white border border-[#E5E0D5] rounded-xl space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="template-name-input"
            className="block text-xs font-medium text-[#5C584F]"
          >
            风格模板名称
          </label>
          <input
            id="template-name-input"
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="例如：东方雅致风 / 宋韵器物专栏"
            className="w-full px-3 py-2 text-sm bg-[#FAF8F5] border border-[#DED9CE] rounded-lg text-[#1C1B18] focus:outline-none focus:border-[#2C3E35]"
          />
        </div>

        {/* Sample Articles Header + Upload .md / .txt */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-[#5C584F]">
              样本文章投喂（{samples.length}/5 篇 · 支持粘贴或上传）
            </span>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt,text/markdown,text/plain"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#2C3E35] bg-[#F2EFE9] hover:bg-[#E6E1D6] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>上传 .md / .txt</span>
              </button>
              {samples.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddSampleSlot}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#5C584F] bg-[#F7F5F0] hover:bg-[#EAE5DA] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>添加样本位</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {samples.map((sample, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-[#8C887F]">
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                    <FileText className="w-3 h-3" />
                    样本 0{idx + 1}（{sample.length} 字）
                  </span>
                  {samples.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSampleSlot(idx)}
                      className="text-[#8C887F] hover:text-[#B91C1C] transition-colors cursor-pointer"
                    >
                      移除此篇
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={sample}
                  onChange={(e) => handleSampleChange(idx, e.target.value)}
                  placeholder={`在此粘贴第 ${idx + 1} 篇微信公众号样本文章全文...`}
                  aria-label={`样本文章 ${idx + 1}`}
                  className="w-full p-2.5 text-xs leading-relaxed bg-[#FAF8F5] border border-[#E5E0D5] rounded-lg text-[#262522] focus:outline-none focus:border-[#2C3E35] resize-y"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Extract SOP CTA Button */}
        <button
          type="button"
          onClick={handleExtractSOP}
          disabled={isExtracting}
          className="w-full py-2.5 px-4 bg-[#2C3E35] hover:bg-[#213028] disabled:opacity-60 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {isExtracting
              ? '正在调用 Gemini 分析样本提炼风格 SOP...'
              : 'AI 提炼风格 SOP'}
          </span>
        </button>
      </div>

      {/* 3. Editable Style SOP Rules */}
      <div className="p-4 bg-white border border-[#E5E0D5] rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#EFECE4] pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#2C3E35]" />
            <h3 className="text-sm font-semibold text-[#1C1B18]">
              02. 可编辑风格 SOP 规则
            </h3>
          </div>
          <span className="text-xs text-[#8C887F]">支持微调后保存复用</span>
        </div>

        <div className="space-y-3.5">
          <div>
            <label
              htmlFor="sop-rhythm"
              className="block text-xs font-medium text-[#5C584F] mb-1"
            >
              1. 段落节奏（单句成段 / 呼吸感留白）
            </label>
            <textarea
              id="sop-rhythm"
              rows={2}
              value={sop.rhythm}
              onChange={(e) => setSop({ ...sop, rhythm: e.target.value })}
              className="w-full p-2.5 text-xs leading-relaxed bg-[#FAF8F5] border border-[#E5E0D5] rounded-lg text-[#262522] focus:outline-none focus:border-[#2C3E35]"
            />
          </div>

          <div>
            <label
              htmlFor="sop-patterns"
              className="block text-xs font-medium text-[#5C584F] mb-1"
            >
              2. 标志性句式（如高频使用“不是……而是……”）
            </label>
            <textarea
              id="sop-patterns"
              rows={2}
              value={sop.sentencePatterns}
              onChange={(e) =>
                setSop({ ...sop, sentencePatterns: e.target.value })
              }
              className="w-full p-2.5 text-xs leading-relaxed bg-[#FAF8F5] border border-[#E5E0D5] rounded-lg text-[#262522] focus:outline-none focus:border-[#2C3E35]"
            />
          </div>

          <div>
            <label
              htmlFor="sop-rhetoric"
              className="block text-xs font-medium text-[#5C584F] mb-1"
            >
              3. 修辞与符号习惯（全角竖线 ｜、破折号 ——、间隔省略号 . . . . . .）
            </label>
            <textarea
              id="sop-rhetoric"
              rows={2}
              value={sop.rhetoricAndSymbols}
              onChange={(e) =>
                setSop({ ...sop, rhetoricAndSymbols: e.target.value })
              }
              className="w-full p-2.5 text-xs leading-relaxed bg-[#FAF8F5] border border-[#E5E0D5] rounded-lg text-[#262522] focus:outline-none focus:border-[#2C3E35]"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label
                htmlFor="sop-caption"
                className="block text-xs font-medium text-[#5C584F] mb-1"
              >
                4. 专属图注格式（时间戳 / 意境注脚）
              </label>
              <input
                id="sop-caption"
                type="text"
                value={sop.captionFormat}
                onChange={(e) =>
                  setSop({ ...sop, captionFormat: e.target.value })
                }
                className="w-full px-2.5 py-2 text-xs bg-[#FAF8F5] border border-[#E5E0D5] rounded-lg text-[#262522] focus:outline-none focus:border-[#2C3E35]"
              />
            </div>

            <div>
              <label
                htmlFor="sop-signature"
                className="block text-xs font-medium text-[#5C584F] mb-1"
              >
                5. 文末品牌签名块默认模板
              </label>
              <textarea
                id="sop-signature"
                rows={2}
                value={sop.signatureTemplate}
                onChange={(e) =>
                  setSop({ ...sop, signatureTemplate: e.target.value })
                }
                className="w-full p-2.5 text-xs leading-relaxed bg-[#FAF8F5] border border-[#E5E0D5] rounded-lg text-[#262522] focus:outline-none focus:border-[#2C3E35]"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setTemplateName(activeTemplate.name);
              setSamples(activeTemplate.samples);
              setSop(activeTemplate.sop);
              setIsCreatingNew(false);
              onNotify('已还原为当前模板已保存的 SOP 配置', 'success');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#5C584F] hover:text-[#1C1B18] bg-[#F7F5F0] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重置修改</span>
          </button>

          <button
            type="button"
            onClick={handleSaveManualSOP}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#1C1B18] hover:bg-[#33312B] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>保存风格 SOP 至本地库</span>
          </button>
        </div>
      </div>
    </div>
  );
};
