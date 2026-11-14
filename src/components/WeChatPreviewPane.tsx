import React, { useRef, useState } from 'react';
import { ArticleBlock, ArticleDocument } from '../types';
import {
  Copy,
  Check,
  Printer,
  Download,
  RefreshCw,
  FolderOpen,
  Edit3,
  Plus,
  Trash2,
} from 'lucide-react';

interface WeChatPreviewPaneProps {
  article: ArticleDocument;
  onUpdateArticleMeta: (patch: Partial<ArticleDocument>) => void;
  onUpdateBlock: (blockId: string, patch: Partial<ArticleBlock>) => void;
  onAddTextBlockAfter: (afterBlockId: string) => void;
  onDeleteTextBlock: (blockId: string) => void;
  onRegenerateSingleImage: (blockId: string, customPrompt?: string) => void;
  onReplaceLocalImage: (blockId: string, file: File) => void;
  onCopyWeChatRichText: () => Promise<void>;
  onExportPdf: () => void;
  onDownloadStandaloneHtml: () => void;
  copiedSuccess: boolean;
}

export const WeChatPreviewPane: React.FC<WeChatPreviewPaneProps> = ({
  article,
  onUpdateArticleMeta,
  onUpdateBlock,
  onAddTextBlockAfter,
  onDeleteTextBlock,
  onRegenerateSingleImage,
  onReplaceLocalImage,
  onCopyWeChatRichText,
  onExportPdf,
  onDownloadStandaloneHtml,
  copiedSuccess,
}) => {
  const [editingPromptBlockId, setEditingPromptBlockId] = useState<string | null>(
    null
  );
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSignature, setIsEditingSignature] = useState(false);
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const activeTitle =
    article.titles[article.selectedTitleIndex] || article.titles[0] || '';

  const totalChars = article.blocks
    .filter((b) => b.type === 'text')
    .reduce((acc, b) => acc + (b.content?.length || 0), 0);

  return (
    <div className="flex flex-col h-full bg-[#EFECE6] print-only-container">
      {/* Top Sticky Export & Action Bar (Hidden in @media print) */}
      <div className="no-print sticky top-0 z-20 bg-[#F7F5F0]/95 backdrop-blur-xs border-b border-[#DED9CE] px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-[#5C584F]">
          <span className="font-semibold text-[#1C1B18]">
            微信公众号手机端实时预览
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">395px 标准视口</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">正文 {totalChars} 字</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">5 张 16:9 配图</span>
        </div>

        {/* 3 Primary Export Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCopyWeChatRichText}
            className="px-3.5 py-2 bg-[#2C3E35] hover:bg-[#1F2D26] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer whitespace-nowrap shrink-0"
          >
            {copiedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>已复制公众号富文本（可直接粘贴）</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>📋 一键复制公众号富文本</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onExportPdf}
            className="px-3.5 py-2 bg-white hover:bg-[#F2EFE9] text-[#1C1B18] border border-[#D5CFC2] text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>📄 导出高清 PDF</span>
          </button>

          <button
            type="button"
            onClick={onDownloadStandaloneHtml}
            className="px-3.5 py-2 bg-white hover:bg-[#F2EFE9] text-[#1C1B18] border border-[#D5CFC2] text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>🌐 下载单文件带图 HTML</span>
          </button>
        </div>
      </div>

      {/* Scrollable Centered Mobile Preview Canvas */}
      <div className="flex-1 overflow-y-auto py-8 px-4 print-only-container">
        {/* Candidate Title Quick Switcher above Phone Card (Hidden on Print) */}
        <div className="no-print max-w-[408px] mx-auto mb-4 bg-[#F7F5F0] border border-[#DED9CE] rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#5C584F]">
            <span className="font-medium">点击切换备选标题（共 3 组）：</span>
            <span className="text-[#8C887F]">正文与标题均支持点击微调</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {article.titles.map((titleItem, idx) => {
              const active = idx === article.selectedTitleIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    onUpdateArticleMeta({ selectedTitleIndex: idx })
                  }
                  className={`text-left px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                    active
                      ? 'bg-[#2C3E35] text-white font-medium'
                      : 'bg-white text-[#4A473F] hover:bg-[#EAE5DA]'
                  }`}
                >
                  <span className="truncate">
                    0{idx + 1}. {titleItem}
                  </span>
                  {active && (
                    <span className="text-[11px] opacity-90 shrink-0">
                      当前使用
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Simulated WeChat Mobile Reader Card (408px centered) */}
        <article
          data-testid="wechat-preview-card"
          className="w-full max-w-[408px] mx-auto bg-[#FAF8F5] border border-[#DFDBD0] rounded-2xl shadow-sm overflow-hidden print-article-card"
        >
          {/* Phone Top Status Bar Simulation (Hidden in Print) */}
          <div className="no-print px-5 py-2.5 bg-[#F4F1EA] border-b border-[#E6E2D8] flex items-center justify-between text-[11px] text-[#7A756C]">
            <span className="font-mono tabular-nums">09:41</span>
            <span className="font-medium tracking-wider text-[#4A473F]">
              微信公众号 · 预览视图
            </span>
            <span className="font-mono">5G · 100%</span>
          </div>

          {/* Article Body Container */}
          <div className="px-6 pt-7 pb-10 space-y-6">
            {/* Article Title (Click to Edit Inline) */}
            <header className="pb-5 border-b border-[#E6E2D8] space-y-3">
              {isEditingTitle ? (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={activeTitle}
                    onChange={(e) => {
                      const nextTitles = [...article.titles];
                      nextTitles[article.selectedTitleIndex] = e.target.value;
                      onUpdateArticleMeta({ titles: nextTitles });
                    }}
                    onBlur={() => setIsEditingTitle(false)}
                    autoFocus
                    aria-label="编辑当前文章标题"
                    className="w-full p-2 text-lg font-semibold leading-snug bg-white border border-[#2C3E35] rounded-lg text-[#1C1B18] focus:outline-none font-editorial"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditingTitle(false)}
                      className="px-2.5 py-1 text-xs bg-[#2C3E35] text-white rounded-md cursor-pointer"
                    >
                      完成标题微调
                    </button>
                  </div>
                </div>
              ) : (
                <h1
                  onClick={() => setIsEditingTitle(true)}
                  title="点击直接微调标题文字"
                  className="text-[20px] font-semibold leading-[1.52] tracking-[0.02em] text-[#181816] font-editorial cursor-text hover:bg-[#F0ECE1]/70 rounded-md px-1 -mx-1 py-0.5 transition-colors"
                >
                  {activeTitle}
                </h1>
              )}

              {/* Unboxed Clean Metadata Row */}
              <div className="flex items-center flex-wrap gap-1.5 text-xs text-[#8C887F]">
                <span className="text-[#2C3E35] font-medium">
                  {article.author}
                </span>
                <span aria-hidden="true">·</span>
                <span>{article.styleTemplateName.replace('（默认示例）', '')}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {article.publishDate}
                </span>
              </div>
            </header>

            {/* Article Blocks (Text & 5 Interspersed 16:9 Images) */}
            <div className="space-y-5">
              {article.blocks.map((block) => {
                if (block.type === 'text') {
                  const text = block.content || '';
                  const isSectionTitle =
                    text.trim().length <= 28 &&
                    (text.includes('｜') || text.trim().startsWith('0'));
                  const isEditingThis = editingBlockId === block.id;

                  return (
                    <div
                      key={block.id}
                      className="group relative print-avoid-break"
                    >
                      {isEditingThis ? (
                        <div className="space-y-2 bg-white p-2.5 rounded-lg border border-[#2C3E35]">
                          <textarea
                            rows={Math.max(2, Math.ceil(text.length / 24))}
                            value={text}
                            onChange={(e) =>
                              onUpdateBlock(block.id, {
                                content: e.target.value,
                              })
                            }
                            autoFocus
                            aria-label="编辑正文段落"
                            className="w-full text-[15px] leading-[1.9] text-[#262522] bg-transparent focus:outline-none resize-y"
                          />
                          <div className="flex items-center justify-between pt-1 border-t border-[#EFECE4]">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  onAddTextBlockAfter(block.id);
                                  setEditingBlockId(null);
                                }}
                                className="inline-flex items-center gap-1 text-xs text-[#2C3E35] hover:underline cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>在下方插入段落</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteTextBlock(block.id);
                                  setEditingBlockId(null);
                                }}
                                className="inline-flex items-center gap-1 text-xs text-[#B91C1C] hover:underline cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>删除此段</span>
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditingBlockId(null)}
                              className="px-2.5 py-1 text-xs bg-[#2C3E35] text-white rounded-md cursor-pointer"
                            >
                              完成
                            </button>
                          </div>
                        </div>
                      ) : isSectionTitle ? (
                        <p
                          onClick={() => setEditingBlockId(block.id)}
                          title="点击微调小标题"
                          className="pt-3 pb-1 text-center font-editorial text-[16px] font-semibold tracking-[1.5px] text-[#2C3E35] cursor-text hover:bg-[#F0ECE1]/70 rounded-md px-2 py-1 transition-colors"
                        >
                          {text}
                        </p>
                      ) : (
                        <p
                          onClick={() => setEditingBlockId(block.id)}
                          title="点击直接微调此段文字"
                          className="text-[15px] leading-[2.0] tracking-[0.6px] text-[#262522] text-justify whitespace-pre-line cursor-text hover:bg-[#F0ECE1]/60 rounded-md px-1.5 -mx-1.5 py-1 transition-colors"
                        >
                          {text}
                        </p>
                      )}
                    </div>
                  );
                }

                if (block.type === 'image') {
                  const isGenerating = block.status === 'generating';
                  const isPromptOpen = editingPromptBlockId === block.id;

                  return (
                    <figure
                      key={block.id}
                      className="my-7 space-y-2.5 print-avoid-break"
                    >
                      {/* 16:9 Image Container */}
                      <div className="relative aspect-video w-full rounded-md overflow-hidden bg-[#EAE5DA] border border-[#E2DDD2] shadow-2xs">
                        {block.imageUrl ? (
                          <img
                            src={block.imageUrl}
                            alt={block.caption || '东方美学配图'}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover block"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#F2EFE9] to-[#E5E0D5]">
                            <span className="text-xs text-[#5C584F] font-editorial">
                              清 · 敬 · 雅 · 和
                            </span>
                            <span className="text-[11px] text-[#8C887F] mt-1">
                              等待生成 16:9 东方美学配图
                            </span>
                          </div>
                        )}

                        {isGenerating && (
                          <div className="absolute inset-0 bg-[#1C1B18]/55 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-4 text-center">
                            <RefreshCw className="w-5 h-5 animate-spin mb-2" />
                            <span className="text-xs font-medium">
                              正在生成 16:9 实景配图并执行 JPEG 压缩...
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Image Caption (Editable inline) */}
                      <figcaption className="text-center">
                        <input
                          type="text"
                          value={block.caption || ''}
                          onChange={(e) =>
                            onUpdateBlock(block.id, { caption: e.target.value })
                          }
                          aria-label={`编辑图注 ${block.imageIndex || ''}`}
                          className="w-full text-center text-xs text-[#8C887F] tracking-[1px] bg-transparent border-b border-transparent hover:border-[#D5CFC2] focus:border-[#2C3E35] focus:outline-none py-0.5"
                        />
                      </figcaption>

                      {/* Two Required Small Buttons Below Every Image (Hidden in Print) */}
                      <div className="no-print flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingPromptBlockId(
                              isPromptOpen ? null : block.id
                            )
                          }
                          disabled={isGenerating}
                          className="px-2.5 py-1 text-[11px] font-medium text-[#2C3E35] bg-[#F0ECE1] hover:bg-[#E4DEC9] rounded-md inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <RefreshCw
                            className={`w-3 h-3 ${
                              isGenerating ? 'animate-spin' : ''
                            }`}
                          />
                          <span>🔄 重新生成</span>
                        </button>

                        <input
                          ref={(el) => {
                            fileInputsRef.current[block.id] = el;
                          }}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onReplaceLocalImage(block.id, file);
                            }
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            fileInputsRef.current[block.id]?.click()
                          }
                          className="px-2.5 py-1 text-[11px] font-medium text-[#4A473F] bg-[#F0ECE1] hover:bg-[#E4DEC9] rounded-md inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <FolderOpen className="w-3 h-3" />
                          <span>📁 本地替换</span>
                        </button>
                      </div>

                      {/* Inline Prompt Editor Popover when clicking "🔄 重新生成" */}
                      {isPromptOpen && (
                        <div className="no-print p-3 bg-white border border-[#D5CFC2] rounded-xl space-y-2.5 shadow-xs mt-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#1C1B18] flex items-center gap-1">
                              <Edit3 className="w-3 h-3 text-[#2C3E35]" />
                              微调第 0{block.imageIndex || 1} 张配图 Prompt
                            </span>
                            <span className="text-[11px] text-[#8C887F]">
                              16:9 东方「清敬雅和」实景
                            </span>
                          </div>
                          <textarea
                            rows={3}
                            value={block.prompt || ''}
                            onChange={(e) =>
                              onUpdateBlock(block.id, {
                                prompt: e.target.value,
                              })
                            }
                            aria-label="微调此图生图提示词"
                            className="w-full p-2 text-xs leading-relaxed bg-[#FAF8F5] border border-[#E5E0D5] rounded-lg text-[#262522] focus:outline-none focus:border-[#2C3E35]"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingPromptBlockId(null)}
                              className="px-2.5 py-1 text-xs text-[#5C584F] hover:text-[#1C1B18] cursor-pointer"
                            >
                              收起
                            </button>
                            <button
                              type="button"
                              disabled={isGenerating}
                              onClick={() => {
                                onRegenerateSingleImage(block.id, block.prompt);
                                setEditingPromptBlockId(null);
                              }}
                              className="px-3 py-1.5 text-xs font-medium bg-[#2C3E35] hover:bg-[#1F2D26] text-white rounded-md inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>确认重绘此图</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </figure>
                  );
                }

                return null;
              })}
            </div>

            {/* Article Footer Signature Block (Click to Edit Inline) */}
            <footer className="pt-8 mt-8 border-t border-[#E6E2D8] text-center space-y-3 print-avoid-break">
              <p className="text-xs tracking-[4px] text-[#B5B0A4]">
                . . . . . .
              </p>
              {isEditingSignature ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={article.signature}
                    onChange={(e) =>
                      onUpdateArticleMeta({ signature: e.target.value })
                    }
                    onBlur={() => setIsEditingSignature(false)}
                    autoFocus
                    aria-label="编辑文末签名块"
                    className="w-full p-2 text-xs text-center leading-relaxed bg-white border border-[#2C3E35] rounded-lg text-[#262522] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingSignature(false)}
                    className="px-2.5 py-1 text-xs bg-[#2C3E35] text-white rounded-md cursor-pointer"
                  >
                    完成签名微调
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingSignature(true)}
                  title="点击微调文末品牌签名块"
                  className="space-y-1 cursor-text hover:bg-[#F0ECE1]/70 rounded-md py-1.5 px-2 transition-colors"
                >
                  {article.signature
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line, i) => (
                      <p
                        key={i}
                        className={`text-xs leading-relaxed tracking-[1.2px] ${
                          i === 0
                            ? 'font-semibold text-[#2C3E35]'
                            : 'text-[#8C887F]'
                        }`}
                      >
                        {line}
                      </p>
                    ))}
                </div>
              )}
            </footer>
          </div>
        </article>
      </div>
    </div>
  );
};
