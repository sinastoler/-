/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  ApiConfig,
  ArticleBlock,
  ArticleDocument,
  LeftPanelTab,
  StyleTemplate,
} from './types';
import {
  BUILTIN_ORIENTAL_PHOTOS,
  DEFAULT_ARTICLE_DOCUMENT,
  DEFAULT_STYLE_TEMPLATES,
} from './data/defaultData';
import {
  buildStandaloneHtmlFile,
  buildWeChatInlineHtml,
  enforceOrientalImagePrompt,
  normalizeArticleResponse,
} from './utils/editorialLogic';
import {
  compressImageTo16x9Jpeg,
  compressLocalFileTo16x9Jpeg,
} from './utils/imageCompressor';
import { StyleLibraryPanel } from './components/StyleLibraryPanel';
import { ArticleGeneratorPanel } from './components/ArticleGeneratorPanel';
import { ImageFineTunePanel } from './components/ImageFineTunePanel';
import {
  ApiSettingsPanel,
  DEFAULT_API_CONFIG,
} from './components/ApiSettingsPanel';
import { MacReleaseModal } from './components/MacReleaseModal';
import { WeChatPreviewPane } from './components/WeChatPreviewPane';
import {
  BookOpen,
  Sparkles,
  Image as ImageIcon,
  Sliders,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronRight,
  Laptop,
} from 'lucide-react';

const STORAGE_KEY_TEMPLATES = 'wechat_oriental_style_templates_v1';
const STORAGE_KEY_SELECTED_TPL = 'wechat_oriental_selected_tpl_v1';
const STORAGE_KEY_ARTICLE = 'wechat_oriental_current_article_v1';
const STORAGE_KEY_API_CONFIG = 'wechat_oriental_api_config_v1';

export default function App() {
  // 1. Style Templates State (Persisted in localStorage)
  const [templates, setTemplates] = useState<StyleTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEMPLATES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_STYLE_TEMPLATES;
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_SELECTED_TPL);
      if (savedId) return savedId;
    } catch {
      // ignore
    }
    return DEFAULT_STYLE_TEMPLATES[0].id;
  });

  // 2. Adjustable API Engine Config (Persisted in localStorage)
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_API_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_API_CONFIG, ...parsed };
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_API_CONFIG;
  });

  // 3. Current Article Document State
  const [article, setArticle] = useState<ArticleDocument>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ARTICLE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.blocks)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_ARTICLE_DOCUMENT;
  });

  const [topic, setTopic] = useState<string>(article.topic);
  const [activeTab, setActiveTab] = useState<LeftPanelTab>('generate');
  const [viewAllCollapsible, setViewAllCollapsible] = useState<boolean>(false);
  const [openSections, setOpenSections] = useState<
    Record<LeftPanelTab, boolean>
  >({
    style: true,
    generate: true,
    images: true,
    api: true,
  });

  // 4. Modals & Status States
  const [isMacModalOpen, setIsMacModalOpen] = useState(false);
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);
  const [imageProgress, setImageProgress] = useState<{
    current: number;
    total: number;
    active: boolean;
  } | null>(null);

  const [notice, setNotice] = useState<{
    message: string;
    type: 'success' | 'warning' | 'error';
  } | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const showNotice = useCallback(
    (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
      setNotice({ message, type });
    },
    []
  );

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
    } catch {
      // ignore
    }
  }, [templates]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SELECTED_TPL, selectedTemplateId);
    } catch {
      // ignore
    }
  }, [selectedTemplateId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_API_CONFIG, JSON.stringify(apiConfig));
    } catch {
      // ignore
    }
  }, [apiConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ARTICLE, JSON.stringify(article));
    } catch {
      // ignore if Base64 exceeds localStorage quota
    }
  }, [article]);

  // Compress initial asset URLs into Base64 16:9 JPEG on first mount
  useEffect(() => {
    let cancelled = false;
    async function compressInitialImages() {
      const needsCompression = article.blocks.some(
        (b) =>
          b.type === 'image' &&
          b.imageUrl &&
          !b.imageUrl.startsWith('data:image/jpeg;base64,')
      );
      if (!needsCompression) return;

      for (const block of article.blocks) {
        if (cancelled) break;
        if (
          block.type === 'image' &&
          block.imageUrl &&
          !block.imageUrl.startsWith('data:image/jpeg;base64,')
        ) {
          try {
            const compressed = await compressImageTo16x9Jpeg(block.imageUrl, {
              targetWidth: apiConfig.targetWidth,
              quality: apiConfig.jpegQuality,
            });
            if (!cancelled) {
              setArticle((prev) => ({
                ...prev,
                blocks: prev.blocks.map((item) =>
                  item.id === block.id
                    ? {
                        ...item,
                        imageUrl: compressed.dataUrl,
                        compressedSizeKb: compressed.sizeKb,
                        status: 'ready',
                      }
                    : item
                ),
              }));
            }
          } catch {
            // keep original URL if canvas load fails
          }
        }
      }
    }
    compressInitialImages();
    return () => {
      cancelled = true;
    };
  }, []);

  // Handlers for Style Templates
  const handleSaveTemplate = (saved: StyleTemplate) => {
    setTemplates((prev) => {
      const exists = prev.some((t) => t.id === saved.id);
      if (exists) {
        return prev.map((t) => (t.id === saved.id ? saved : t));
      }
      return [saved, ...prev];
    });
    setSelectedTemplateId(saved.id);
  };

  const handleDeleteTemplate = (id: string) => {
    const remaining = templates.filter((t) => t.id !== id);
    const nextList = remaining.length > 0 ? remaining : DEFAULT_STYLE_TEMPLATES;
    setTemplates(nextList);
    setSelectedTemplateId(nextList[0].id);
    showNotice('已从本地风格库移除该自定义模板', 'success');
  };

  // Article Metadata & Block Updaters
  const handleUpdateArticleMeta = (patch: Partial<ArticleDocument>) => {
    setArticle((prev) => ({ ...prev, ...patch }));
  };

  const handleUpdateBlock = (blockId: string, patch: Partial<ArticleBlock>) => {
    setArticle((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) =>
        b.id === blockId ? { ...b, ...patch } : b
      ),
    }));
  };

  const handleAddTextBlockAfter = (afterBlockId: string) => {
    setArticle((prev) => {
      const idx = prev.blocks.findIndex((b) => b.id === afterBlockId);
      if (idx === -1) return prev;
      const newBlock: ArticleBlock = {
        id: `txt-manual-${Date.now()}`,
        type: 'text',
        content: '在此输入新的段落文字，保持呼吸感留白。',
      };
      const nextBlocks = [...prev.blocks];
      nextBlocks.splice(idx + 1, 0, newBlock);
      return { ...prev, blocks: nextBlocks };
    });
  };

  const handleDeleteTextBlock = (blockId: string) => {
    setArticle((prev) => {
      const textCount = prev.blocks.filter((b) => b.type === 'text').length;
      if (textCount <= 1) {
        showNotice('至少需保留一个正文段落', 'warning');
        return prev;
      }
      return {
        ...prev,
        blocks: prev.blocks.filter((b) => b.id !== blockId),
      };
    });
  };

  // Generate Single 16:9 Image + Canvas JPEG Compression
  const generateAndCompressSingleImage = async (
    blockId: string,
    rawPrompt: string,
    fallbackSlotIndex: number
  ): Promise<{ usedFallback: boolean; warning?: string }> => {
    const cleanPrompt = enforceOrientalImagePrompt(rawPrompt);

    setArticle((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) =>
        b.id === blockId
          ? { ...b, prompt: cleanPrompt, status: 'generating' }
          : b
      ),
    }));

    try {
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: cleanPrompt, apiConfig }),
      });
      const data = await res.json();

      const fallbackPhotoPath =
        BUILTIN_ORIENTAL_PHOTOS[
          Math.abs(fallbackSlotIndex) % BUILTIN_ORIENTAL_PHOTOS.length
        ];

      const sourceImageToCompress =
        !data.fallback && data.imageDataUrl
          ? data.imageDataUrl
          : fallbackPhotoPath;

      const compressed = await compressImageTo16x9Jpeg(sourceImageToCompress, {
        targetWidth: apiConfig.targetWidth,
        quality: apiConfig.jpegQuality,
        warmTintVariant: data.fallback ? (fallbackSlotIndex % 3) + 1 : 0,
      });

      setArticle((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) =>
          b.id === blockId
            ? {
                ...b,
                imageUrl: compressed.dataUrl,
                compressedSizeKb: compressed.sizeKb,
                status: 'ready',
                isFallbackPhoto: Boolean(data.fallback),
              }
            : b
        ),
      }));

      return {
        usedFallback: Boolean(data.fallback),
        warning: data.warning,
      };
    } catch {
      const fallbackPhotoPath =
        BUILTIN_ORIENTAL_PHOTOS[
          Math.abs(fallbackSlotIndex) % BUILTIN_ORIENTAL_PHOTOS.length
        ];
      const compressed = await compressImageTo16x9Jpeg(fallbackPhotoPath, {
        targetWidth: apiConfig.targetWidth,
        quality: apiConfig.jpegQuality,
      });
      setArticle((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) =>
          b.id === blockId
            ? {
                ...b,
                imageUrl: compressed.dataUrl,
                compressedSizeKb: compressed.sizeKb,
                status: 'ready',
                isFallbackPhoto: true,
              }
            : b
        ),
      }));
      return {
        usedFallback: true,
        warning: '网络或接口波动，已使用内置 16:9 东方美学摄影底图并完成压缩。',
      };
    }
  };

  // Handle Single Image Regeneration from Preview or Left Panel
  const handleRegenerateSingleImage = async (
    blockId: string,
    customPrompt?: string
  ) => {
    const target = article.blocks.find((b) => b.id === blockId);
    if (!target) return;
    const slotIdx = (target.imageIndex ?? 1) - 1;
    const result = await generateAndCompressSingleImage(
      blockId,
      customPrompt || target.prompt || '',
      slotIdx + Math.floor(Math.random() * 5)
    );
    if (result.usedFallback && result.warning) {
      showNotice(
        `${result.warning}（已为您重新渲染并压缩第 0${
          target.imageIndex || 1
        } 张 16:9 东方美学配图）`,
        'warning'
      );
    } else {
      showNotice(
        `第 0${target.imageIndex || 1} 张 16:9 配图已重新生成并完成 JPEG 压缩`,
        'success'
      );
    }
  };

  // Handle Local Image Replacement + Canvas 16:9 Compression
  const handleReplaceLocalImage = async (blockId: string, file: File) => {
    try {
      const compressed = await compressLocalFileTo16x9Jpeg(file);
      handleUpdateBlock(blockId, {
        imageUrl: compressed.dataUrl,
        compressedSizeKb: compressed.sizeKb,
        status: 'ready',
      });
      showNotice(
        `已替换本地配图并自动通过 Canvas 压缩为 16:9 JPEG (${compressed.sizeKb} KB)`,
        'success'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : '本地图片替换失败';
      showNotice(msg, 'error');
    }
  };

  // Batch Regenerate All 5 Images
  const handleRegenerateAllImages = async () => {
    const imageBlocks = article.blocks.filter((b) => b.type === 'image');
    if (imageBlocks.length === 0) return;

    setImageProgress({ current: 1, total: imageBlocks.length, active: true });
    let anyFallbackWarning: string | undefined;

    for (let i = 0; i < imageBlocks.length; i++) {
      setImageProgress({
        current: i + 1,
        total: imageBlocks.length,
        active: true,
      });
      const res = await generateAndCompressSingleImage(
        imageBlocks[i].id,
        imageBlocks[i].prompt || '',
        i
      );
      if (res.usedFallback && res.warning) {
        anyFallbackWarning = res.warning;
      }
    }

    setImageProgress({
      current: imageBlocks.length,
      total: imageBlocks.length,
      active: false,
    });

    if (anyFallbackWarning) {
      showNotice(anyFallbackWarning, 'warning');
    } else {
      showNotice(
        '已完成全部 5 张 16:9 东方美学配图的生成与 Canvas 压缩',
        'success'
      );
    }
  };

  // Full Pipeline: One-Click Generate Article JSON + Sequential 5 Images
  const handleGenerateArticleAndImages = async () => {
    if (!topic.trim()) {
      showNotice('请先输入新选题或创作灵感', 'error');
      return;
    }

    const currentTemplate =
      templates.find((t) => t.id === selectedTemplateId) || templates[0];

    setIsGeneratingArticle(true);
    setImageProgress(null);

    try {
      const response = await fetch('/api/gemini/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          styleTemplate: {
            name: currentTemplate.name,
            sop: currentTemplate.sop,
          },
          apiConfig,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || '生成图文内容失败');
      }

      const normalizedDoc = normalizeArticleResponse(data, {
        topic: topic.trim(),
        styleTemplateId: currentTemplate.id,
        styleTemplateName: currentTemplate.name,
        fallbackSignature: currentTemplate.sop.signatureTemplate,
        defaultImages: BUILTIN_ORIENTAL_PHOTOS,
      });

      setArticle(normalizedDoc);
      setIsGeneratingArticle(false);

      // Sequentially generate & compress the 5 16:9 images
      const imgBlocks = normalizedDoc.blocks.filter((b) => b.type === 'image');
      setImageProgress({ current: 1, total: imgBlocks.length, active: true });

      let fallbackWarn: string | undefined;
      for (let i = 0; i < imgBlocks.length; i++) {
        setImageProgress({
          current: i + 1,
          total: imgBlocks.length,
          active: true,
        });
        const imgResult = await generateAndCompressSingleImage(
          imgBlocks[i].id,
          imgBlocks[i].prompt || '',
          i
        );
        if (imgResult.usedFallback && imgResult.warning) {
          fallbackWarn = imgResult.warning;
        }
      }

      setImageProgress({
        current: imgBlocks.length,
        total: imgBlocks.length,
        active: false,
      });

      if (fallbackWarn) {
        showNotice(
          `文章已按「${currentTemplate.name}」生成完毕！提示：${fallbackWarn}`,
          'warning'
        );
      } else {
        showNotice(
          `图文创作完成！已生成 3 个备选标题与 5 张 16:9 东方美学配图。`,
          'success'
        );
      }
    } catch (err) {
      setIsGeneratingArticle(false);
      const msg = err instanceof Error ? err.message : '生成图文失败';
      showNotice(msg, 'error');
    }
  };

  // Export 1: Copy WeChat Rich Text with Inline Styles + Base64 Images via ClipboardItem
  const handleCopyWeChatRichText = async () => {
    try {
      const inlineHtml = buildWeChatInlineHtml(article);
      const plainText = article.blocks
        .map((b) => (b.type === 'text' ? b.content : `[配图：${b.caption}]`))
        .join('\n\n');

      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        const htmlBlob = new Blob([inlineHtml], { type: 'text/html' });
        const textBlob = new Blob([plainText], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob,
          }),
        ]);
      } else {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = inlineHtml;
        tempDiv.style.position = 'fixed';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);
        const range = document.createRange();
        range.selectNodeContents(tempDiv);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        document.execCommand('copy');
        selection?.removeAllRanges();
        document.body.removeChild(tempDiv);
      }

      setCopiedSuccess(true);
      showNotice(
        '已将内联样式富文本与 Base64 压缩配图写入剪贴板！请前往微信公众号后台直接 Cmd+V / Ctrl+V 粘贴。',
        'success'
      );
      setTimeout(() => setCopiedSuccess(false), 3500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '复制富文本失败';
      showNotice(`复制失败：${msg}`, 'error');
    }
  };

  // Export 2: Print / Save as High-Definition PDF
  const handleExportPdf = () => {
    showNotice('正在打开系统打印视图，请在弹窗中选择「存储为 PDF」', 'success');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Export 3: Download Single-File Standalone HTML with Embedded Base64 Images
  const handleDownloadStandaloneHtml = () => {
    const fullHtml = buildStandaloneHtmlFile(article);
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const activeTitle =
      article.titles[article.selectedTitleIndex] || '微信公众号图文';
    const safeFilename = activeTitle
      .replace(/[\\/:*?"<>|]/g, '_')
      .slice(0, 40);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeFilename}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotice(
      `已打包下载独立单文件带图 HTML：「${safeFilename}.html」`,
      'success'
    );
  };

  const imageBlocks = article.blocks.filter((b) => b.type === 'image');

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F5F2] text-[#181816]">
      {/* Top Bar Contract: 3 Zones separated by gap-8 (Hidden in Print) */}
      <header className="no-print flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-[#E6E4DD] shrink-0">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => e.preventDefault()}
          className="text-lg font-bold tracking-tight text-[#181816] font-editorial whitespace-nowrap shrink-0"
        >
          清敬雅和 · 公众号视觉工作台
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#57544E]">
          <button
            type="button"
            onClick={() => {
              setViewAllCollapsible(false);
              setActiveTab('style');
            }}
            className={`hover:text-[#181816] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              !viewAllCollapsible && activeTab === 'style'
                ? 'text-[#181816] underline underline-offset-8 decoration-[#181816] decoration-2'
                : ''
            }`}
          >
            风格库管理
          </button>
          <button
            type="button"
            onClick={() => {
              setViewAllCollapsible(false);
              setActiveTab('generate');
            }}
            className={`hover:text-[#181816] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              !viewAllCollapsible && activeTab === 'generate'
                ? 'text-[#181816] underline underline-offset-8 decoration-[#181816] decoration-2'
                : ''
            }`}
          >
            新选题生成
          </button>
          <button
            type="button"
            onClick={() => {
              setViewAllCollapsible(false);
              setActiveTab('images');
            }}
            className={`hover:text-[#181816] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              !viewAllCollapsible && activeTab === 'images'
                ? 'text-[#181816] underline underline-offset-8 decoration-[#181816] decoration-2'
                : ''
            }`}
          >
            图片微调
          </button>
          <button
            type="button"
            onClick={() => {
              setViewAllCollapsible(false);
              setActiveTab('api');
            }}
            className={`hover:text-[#181816] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              !viewAllCollapsible && activeTab === 'api'
                ? 'text-[#181816] underline underline-offset-8 decoration-[#181816] decoration-2'
                : ''
            }`}
          >
            API 引擎设置
          </button>
          <button
            type="button"
            onClick={() => setIsMacModalOpen(true)}
            className="hover:text-[#181816] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            macOS 快捷安装
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsMacModalOpen(true)}
            className="px-4 py-2 text-xs font-medium text-white bg-[#181816] rounded-lg hover:bg-[#2E2D29] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Mac 安装包与 GitHub 发布
          </button>
        </div>
      </header>

      {/* Notification Banner (Hidden in Print) */}
      {notice && (
        <div
          role="status"
          className={`no-print px-6 py-2.5 border-b flex items-center justify-between gap-4 text-xs ${
            notice.type === 'error'
              ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
              : notice.type === 'warning'
              ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
              : 'bg-[#F0F5F2] border-[#C6D8CE] text-[#1E3A2B]'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="关闭提示"
            className="p-1 hover:opacity-75 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Split Workbench Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* Left Column: Creation & Control Panel (Hidden in Print) */}
        <aside className="no-print lg:col-span-5 xl:col-span-5 border-r border-[#E6E4DD] bg-[#F6F5F2] flex flex-col lg:h-[calc(100vh-57px)] lg:overflow-hidden">
          {/* Segmented Tab Switcher + Accordion Mode Toggle */}
          <div className="p-4 border-b border-[#E6E4DD] bg-white space-y-3 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-[#57544E]">
                <span className="font-semibold text-[#181816]">
                  创作与控制面板
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[11px] text-[#78756E]">
                  {apiConfig.textModel}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMacModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#233129] hover:underline cursor-pointer whitespace-nowrap"
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Mac 快捷交付</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewAllCollapsible((prev) => !prev)}
                  className="text-xs text-[#57544E] hover:text-[#181816] hover:underline cursor-pointer whitespace-nowrap"
                >
                  {viewAllCollapsible ? '分栏标签视图' : '全部展开视图'}
                </button>
              </div>
            </div>

            {!viewAllCollapsible && (
              <div
                role="tablist"
                aria-label="创作与控制面板模块"
                className="grid grid-cols-4 gap-1 p-1 bg-[#F0EEE8] rounded-lg"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'style'}
                  onClick={() => setActiveTab('style')}
                  className={`py-2 px-2 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'style'
                      ? 'bg-white text-[#181816] shadow-2xs'
                      : 'text-[#57544E] hover:text-[#181816]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span>风格库</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'generate'}
                  onClick={() => setActiveTab('generate')}
                  className={`py-2 px-2 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'generate'
                      ? 'bg-white text-[#181816] shadow-2xs'
                      : 'text-[#57544E] hover:text-[#181816]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>选题写稿</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'images'}
                  onClick={() => setActiveTab('images')}
                  className={`py-2 px-2 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'images'
                      ? 'bg-white text-[#181816] shadow-2xs'
                      : 'text-[#57544E] hover:text-[#181816]'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>配图 (5)</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'api'}
                  onClick={() => setActiveTab('api')}
                  className={`py-2 px-2 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'api'
                      ? 'bg-white text-[#181816] shadow-2xs'
                      : 'text-[#57544E] hover:text-[#181816]'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 shrink-0" />
                  <span>API 设置</span>
                </button>
              </div>
            )}
          </div>

          {/* Scrollable Panel Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {viewAllCollapsible ? (
              <div className="space-y-4">
                {/* Collapsible Section 1: 风格库管理 */}
                <section className="border border-[#E6E4DD] rounded-xl bg-[#FAF9F6] overflow-hidden">
                  <button
                    type="button"
                    aria-expanded={openSections.style}
                    onClick={() =>
                      setOpenSections((s) => ({ ...s, style: !s.style }))
                    }
                    className="w-full px-4 py-3 bg-white border-b border-[#EFECE4] flex items-center justify-between text-left text-sm font-semibold text-[#181816] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#233129]" />
                      01. 风格库管理（样本投喂与 SOP 提炼）
                    </span>
                    {openSections.style ? (
                      <ChevronDown className="w-4 h-4 text-[#78756E]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#78756E]" />
                    )}
                  </button>
                  {openSections.style && (
                    <div className="p-4">
                      <StyleLibraryPanel
                        templates={templates}
                        selectedTemplateId={selectedTemplateId}
                        apiConfig={apiConfig}
                        onSelectTemplate={setSelectedTemplateId}
                        onSaveTemplate={handleSaveTemplate}
                        onDeleteTemplate={handleDeleteTemplate}
                        onNotify={showNotice}
                      />
                    </div>
                  )}
                </section>

                {/* Collapsible Section 2: 新选题生成 */}
                <section className="border border-[#E6E4DD] rounded-xl bg-[#FAF9F6] overflow-hidden">
                  <button
                    type="button"
                    aria-expanded={openSections.generate}
                    onClick={() =>
                      setOpenSections((s) => ({ ...s, generate: !s.generate }))
                    }
                    className="w-full px-4 py-3 bg-white border-b border-[#EFECE4] flex items-center justify-between text-left text-sm font-semibold text-[#181816] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#233129]" />
                      02. 新选题生成（结构化写稿与配图规划）
                    </span>
                    {openSections.generate ? (
                      <ChevronDown className="w-4 h-4 text-[#78756E]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#78756E]" />
                    )}
                  </button>
                  {openSections.generate && (
                    <div className="p-4">
                      <ArticleGeneratorPanel
                        templates={templates}
                        selectedTemplateId={selectedTemplateId}
                        onSelectTemplate={setSelectedTemplateId}
                        topic={topic}
                        onTopicChange={setTopic}
                        article={article}
                        onUpdateArticleMeta={handleUpdateArticleMeta}
                        onGenerateArticleAndImages={
                          handleGenerateArticleAndImages
                        }
                        isGeneratingArticle={isGeneratingArticle}
                        imageProgress={imageProgress}
                      />
                    </div>
                  )}
                </section>

                {/* Collapsible Section 3: 图片微调 */}
                <section className="border border-[#E6E4DD] rounded-xl bg-[#FAF9F6] overflow-hidden">
                  <button
                    type="button"
                    aria-expanded={openSections.images}
                    onClick={() =>
                      setOpenSections((s) => ({ ...s, images: !s.images }))
                    }
                    className="w-full px-4 py-3 bg-white border-b border-[#EFECE4] flex items-center justify-between text-left text-sm font-semibold text-[#181816] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#233129]" />
                      03. 图片微调（16:9 东方美学重绘与本地替换）
                    </span>
                    {openSections.images ? (
                      <ChevronDown className="w-4 h-4 text-[#78756E]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#78756E]" />
                    )}
                  </button>
                  {openSections.images && (
                    <div className="p-4">
                      <ImageFineTunePanel
                        imageBlocks={imageBlocks}
                        onUpdateBlock={handleUpdateBlock}
                        onRegenerateSingleImage={handleRegenerateSingleImage}
                        onReplaceLocalImage={handleReplaceLocalImage}
                        onRegenerateAllImages={handleRegenerateAllImages}
                        isBatchGenerating={Boolean(imageProgress?.active)}
                      />
                    </div>
                  )}
                </section>

                {/* Collapsible Section 4: API 引擎设置 */}
                <section className="border border-[#E6E4DD] rounded-xl bg-[#FAF9F6] overflow-hidden">
                  <button
                    type="button"
                    aria-expanded={openSections.api}
                    onClick={() =>
                      setOpenSections((s) => ({ ...s, api: !s.api }))
                    }
                    className="w-full px-4 py-3 bg-white border-b border-[#EFECE4] flex items-center justify-between text-left text-sm font-semibold text-[#181816] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#233129]" />
                      04. API 引擎与模型参数设置
                    </span>
                    {openSections.api ? (
                      <ChevronDown className="w-4 h-4 text-[#78756E]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#78756E]" />
                    )}
                  </button>
                  {openSections.api && (
                    <div className="p-4">
                      <ApiSettingsPanel
                        apiConfig={apiConfig}
                        onChangeApiConfig={setApiConfig}
                        onResetDefault={() => {
                          setApiConfig(DEFAULT_API_CONFIG);
                          showNotice('已恢复为默认 API 引擎配置', 'success');
                        }}
                        onNotify={showNotice}
                      />
                    </div>
                  )}
                </section>
              </div>
            ) : (
              <>
                {activeTab === 'style' && (
                  <StyleLibraryPanel
                    templates={templates}
                    selectedTemplateId={selectedTemplateId}
                    apiConfig={apiConfig}
                    onSelectTemplate={setSelectedTemplateId}
                    onSaveTemplate={handleSaveTemplate}
                    onDeleteTemplate={handleDeleteTemplate}
                    onNotify={showNotice}
                  />
                )}

                {activeTab === 'generate' && (
                  <ArticleGeneratorPanel
                    templates={templates}
                    selectedTemplateId={selectedTemplateId}
                    onSelectTemplate={setSelectedTemplateId}
                    topic={topic}
                    onTopicChange={setTopic}
                    article={article}
                    onUpdateArticleMeta={handleUpdateArticleMeta}
                    onGenerateArticleAndImages={handleGenerateArticleAndImages}
                    isGeneratingArticle={isGeneratingArticle}
                    imageProgress={imageProgress}
                  />
                )}

                {activeTab === 'images' && (
                  <ImageFineTunePanel
                    imageBlocks={imageBlocks}
                    onUpdateBlock={handleUpdateBlock}
                    onRegenerateSingleImage={handleRegenerateSingleImage}
                    onReplaceLocalImage={handleReplaceLocalImage}
                    onRegenerateAllImages={handleRegenerateAllImages}
                    isBatchGenerating={Boolean(imageProgress?.active)}
                  />
                )}

                {activeTab === 'api' && (
                  <ApiSettingsPanel
                    apiConfig={apiConfig}
                    onChangeApiConfig={setApiConfig}
                    onResetDefault={() => {
                      setApiConfig(DEFAULT_API_CONFIG);
                      showNotice('已恢复为默认 API 引擎配置', 'success');
                    }}
                    onNotify={showNotice}
                  />
                )}
              </>
            )}
          </div>
        </aside>

        {/* Right Column: WeChat Real-Time Preview & Export Area */}
        <section className="lg:col-span-7 xl:col-span-7 lg:h-[calc(100vh-57px)] lg:overflow-hidden print-only-container">
          <WeChatPreviewPane
            article={article}
            onUpdateArticleMeta={handleUpdateArticleMeta}
            onUpdateBlock={handleUpdateBlock}
            onAddTextBlockAfter={handleAddTextBlockAfter}
            onDeleteTextBlock={handleDeleteTextBlock}
            onRegenerateSingleImage={handleRegenerateSingleImage}
            onReplaceLocalImage={handleReplaceLocalImage}
            onCopyWeChatRichText={handleCopyWeChatRichText}
            onExportPdf={handleExportPdf}
            onDownloadStandaloneHtml={handleDownloadStandaloneHtml}
            copiedSuccess={copiedSuccess}
          />
        </section>
      </main>

      {/* macOS Quick Installer & GitHub Release Center Modal */}
      <MacReleaseModal
        isOpen={isMacModalOpen}
        onClose={() => setIsMacModalOpen(false)}
        onNotify={showNotice}
      />
    </div>
  );
}
