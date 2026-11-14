import React from 'react';
import { ArticleDocument, StyleTemplate } from '../types';
import { INSPIRATION_TOPICS } from '../data/defaultData';
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  Feather,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';

interface ArticleGeneratorPanelProps {
  templates: StyleTemplate[];
  selectedTemplateId: string;
  onSelectTemplate: (id: string) => void;
  topic: string;
  onTopicChange: (topic: string) => void;
  article: ArticleDocument;
  onUpdateArticleMeta: (patch: Partial<ArticleDocument>) => void;
  onGenerateArticleAndImages: () => void;
  isGeneratingArticle: boolean;
  imageProgress: { current: number; total: number; active: boolean } | null;
}

export const ArticleGeneratorPanel: React.FC<ArticleGeneratorPanelProps> = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  topic,
  onTopicChange,
  article,
  onUpdateArticleMeta,
  onGenerateArticleAndImages,
  isGeneratingArticle,
  imageProgress,
}) => {
  const activeTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const isBusy = isGeneratingArticle || Boolean(imageProgress?.active);

  return (
    <div className="space-y-6">
      {/* 1. Active Style & Topic Input */}
      <div className="p-4 bg-white border border-[#E5E0D5] rounded-xl space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="gen-style-select"
            className="block text-xs font-semibold text-[#5C584F]"
          >
            01. 选用写作风格模板
          </label>
          <select
            id="gen-style-select"
            value={selectedTemplateId}
            onChange={(e) => onSelectTemplate(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#FAF8F5] border border-[#DED9CE] rounded-lg text-[#1C1B18] focus:outline-none focus:border-[#2C3E35]"
          >
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-[#8C887F] leading-relaxed pt-1">
            风格要点：{activeTemplate.sop.summary}
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="new-topic-input"
            className="block text-xs font-semibold text-[#5C584F]"
          >
            02. 输入新选题 / 创作灵感
          </label>
          <textarea
            id="new-topic-input"
            rows={3}
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="例如：立冬晴窗下的煎茶与独处：在寻常器物里养一团清气..."
            className="w-full p-3 text-sm leading-relaxed bg-[#FAF8F5] border border-[#DED9CE] rounded-lg text-[#1C1B18] focus:outline-none focus:border-[#2C3E35]"
          />

          {/* Quick Inspiration Topics */}
          <div className="space-y-1.5 pt-1">
            <span className="block text-xs text-[#8C887F]">
              推荐选题灵感（点击直接填入）：
            </span>
            <div className="flex flex-col gap-1.5">
              {INSPIRATION_TOPICS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onTopicChange(item)}
                  className="text-left px-2.5 py-1.5 text-xs text-[#4A473F] bg-[#F7F5F0] hover:bg-[#ECE7DC] rounded-md transition-colors truncate cursor-pointer"
                >
                  0{idx + 1}. {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Primary Action: One-Click Generate Article + 5 Oriental Images */}
        <button
          type="button"
          onClick={onGenerateArticleAndImages}
          disabled={isBusy}
          className="w-full py-3 px-4 bg-[#2C3E35] hover:bg-[#1F2D26] disabled:opacity-60 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
        >
          {isBusy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {isGeneratingArticle
                  ? '正在调用 Gemini 结构化生成正文与 5 组配图规划...'
                  : `正在生成第 ${imageProgress?.current}/${imageProgress?.total} 张 16:9 东方美学配图...`}
              </span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>一键生成图文（含 3 组标题 + 5 张 16:9 配图）</span>
            </>
          )}
        </button>

        {/* Live Progress Indicator for 5 Sequential Images */}
        {imageProgress && (
          <div className="p-3 bg-[#FAF8F5] border border-[#E5E0D5] rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#2C3E35] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                {imageProgress.active
                  ? `正在生成第 ${imageProgress.current}/${imageProgress.total} 张配图并执行 Canvas 压缩...`
                  : `已完成全部 ${imageProgress.total}/${imageProgress.total} 张 16:9 配图生成与 JPEG 压缩`}
              </span>
              <span className="font-mono tabular-nums text-[#8C887F]">
                {Math.round((imageProgress.current / imageProgress.total) * 100)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#E6E1D6] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2C3E35] transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((imageProgress.current / imageProgress.total) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Switchable Candidate Titles (3 Titles) */}
      <div className="p-4 bg-white border border-[#E5E0D5] rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#2C3E35]" />
            <h3 className="text-xs font-semibold text-[#1C1B18]">
              03. 备选文章标题（点击切换选用 · 共 3 个）
            </h3>
          </div>
          <span className="text-xs text-[#8C887F] font-mono tabular-nums">
            当前选用 #{article.selectedTitleIndex + 1}
          </span>
        </div>

        <div className="space-y-2">
          {article.titles.map((t, idx) => {
            const isSelected = article.selectedTitleIndex === idx;
            return (
              <div
                key={idx}
                onClick={() => onUpdateArticleMeta({ selectedTitleIndex: idx })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onUpdateArticleMeta({ selectedTitleIndex: idx });
                  }
                }}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#F4F7F5] border-[#2C3E35] text-[#1C1B18]'
                    : 'bg-[#FAF8F5] border-[#E5E0D5] text-[#5C584F] hover:border-[#C5BFB2]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-mono tabular-nums text-[#8C887F] shrink-0 mt-0.5">
                    备选 0{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={t}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const nextTitles = [...article.titles];
                      nextTitles[idx] = e.target.value;
                      onUpdateArticleMeta({ titles: nextTitles });
                    }}
                    aria-label={`编辑备选标题 ${idx + 1}`}
                    className="w-full text-xs font-medium bg-transparent border-b border-transparent focus:border-[#2C3E35] focus:outline-none text-[#1C1B18]"
                  />
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-[#2C3E35] shrink-0 mt-0.5" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Custom Brand Signature Block Editor */}
      <div className="p-4 bg-white border border-[#E5E0D5] rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Feather className="w-4 h-4 text-[#2C3E35]" />
            <h3 className="text-xs font-semibold text-[#1C1B18]">
              04. 文末品牌签名块与作者信息
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="article-author-input"
              className="block text-xs text-[#5C584F] mb-1"
            >
              公众号作者 / 栏目名
            </label>
            <input
              id="article-author-input"
              type="text"
              value={article.author}
              onChange={(e) => onUpdateArticleMeta({ author: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E5E0D5] rounded-lg text-[#1C1B18] focus:outline-none focus:border-[#2C3E35]"
            />
          </div>
          <div>
            <label
              htmlFor="article-date-input"
              className="block text-xs text-[#5C584F] mb-1"
            >
              发布日期
            </label>
            <input
              id="article-date-input"
              type="text"
              value={article.publishDate}
              onChange={(e) =>
                onUpdateArticleMeta({ publishDate: e.target.value })
              }
              className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-[#FAF8F5] border border-[#E5E0D5] rounded-lg text-[#1C1B18] focus:outline-none focus:border-[#2C3E35]"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="article-signature-textarea"
            className="block text-xs text-[#5C584F] mb-1"
          >
            文末品牌签名块（实时同步至预览区底部）
          </label>
          <textarea
            id="article-signature-textarea"
            rows={3}
            value={article.signature}
            onChange={(e) => onUpdateArticleMeta({ signature: e.target.value })}
            className="w-full p-2.5 text-xs leading-relaxed bg-[#FAF8F5] border border-[#E5E0D5] rounded-lg text-[#262522] focus:outline-none focus:border-[#2C3E35]"
          />
        </div>
      </div>
    </div>
  );
};
