import React, { useRef } from 'react';
import { ArticleBlock } from '../types';
import { RefreshCw, FolderOpen, Sparkles, Check } from 'lucide-react';

interface ImageFineTunePanelProps {
  imageBlocks: ArticleBlock[];
  onUpdateBlock: (blockId: string, patch: Partial<ArticleBlock>) => void;
  onRegenerateSingleImage: (blockId: string, customPrompt?: string) => void;
  onReplaceLocalImage: (blockId: string, file: File) => void;
  onRegenerateAllImages: () => void;
  isBatchGenerating: boolean;
}

export const ImageFineTunePanel: React.FC<ImageFineTunePanelProps> = ({
  imageBlocks,
  onUpdateBlock,
  onRegenerateSingleImage,
  onReplaceLocalImage,
  onRegenerateAllImages,
  isBatchGenerating,
}) => {
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  return (
    <div className="space-y-5">
      {/* Oriental Aesthetic Mandate Header */}
      <div className="p-4 bg-white border border-[#E5E0D5] rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-[#1C1B18]">
            东方「清、敬、雅、和」视觉规范（已强制锁定）
          </h3>
          <button
            type="button"
            onClick={onRegenerateAllImages}
            disabled={isBatchGenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#2C3E35] hover:bg-[#1F2D26] disabled:opacity-50 rounded-md transition-colors cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>一键重绘全部 5 张配图</span>
          </button>
        </div>
        <p className="text-xs text-[#5C584F] leading-relaxed">
          固定 16:9 横版真实摄影构图 · 明亮温润自然光 · 浅色原木 / 宋代瓷器 / 米白亚麻质感 · 严禁任何文字、水印、Logo，拒绝暗黑破旧元素。所有图片均经浏览器 Canvas 自动压缩为高质量 JPEG。
        </p>
      </div>

      {/* 5 Image Slots List */}
      <div className="space-y-4">
        {imageBlocks.map((block, idx) => {
          const isGenerating = block.status === 'generating';
          return (
            <div
              key={block.id}
              className="p-4 bg-white border border-[#E5E0D5] rounded-xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1C1B18] font-mono tabular-nums">
                  配图位 0{idx + 1} / 05
                </span>
                <div className="flex items-center gap-2 text-xs text-[#8C887F] font-mono tabular-nums">
                  <span>16:9 JPEG</span>
                  <span>·</span>
                  <span>
                    {block.compressedSizeKb
                      ? `已压缩 ${block.compressedSizeKb} KB`
                      : '已就绪'}
                  </span>
                  <Check className="w-3.5 h-3.5 text-[#2C3E35]" />
                </div>
              </div>

              {/* Thumbnail Preview */}
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-[#EFECE4] border border-[#E5E0D5]">
                {block.imageUrl ? (
                  <img
                    src={block.imageUrl}
                    alt={block.caption || `配图 ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[#8C887F]">
                    等待生成 16:9 配图...
                  </div>
                )}
                {isGenerating && (
                  <div className="absolute inset-0 bg-[#1C1B18]/50 flex items-center justify-center text-white text-xs font-medium">
                    正在调用生图模型并执行 16:9 Canvas 压缩...
                  </div>
                )}
              </div>

              {/* Editable Caption */}
              <div>
                <label
                  htmlFor={`img-caption-${block.id}`}
                  className="block text-xs text-[#5C584F] mb-1"
                >
                  专属时间戳 / 意境图注
                </label>
                <input
                  id={`img-caption-${block.id}`}
                  type="text"
                  value={block.caption || ''}
                  onChange={(e) =>
                    onUpdateBlock(block.id, { caption: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E5E0D5] rounded-lg text-[#1C1B18] focus:outline-none focus:border-[#2C3E35]"
                />
              </div>

              {/* Editable Photography Prompt */}
              <div>
                <label
                  htmlFor={`img-prompt-${block.id}`}
                  className="block text-xs text-[#5C584F] mb-1"
                >
                  16:9 摄影生图 Prompt（可微调后单独重绘）
                </label>
                <textarea
                  id={`img-prompt-${block.id}`}
                  rows={3}
                  value={block.prompt || ''}
                  onChange={(e) =>
                    onUpdateBlock(block.id, { prompt: e.target.value })
                  }
                  className="w-full p-2.5 text-xs leading-relaxed bg-[#FAF8F5] border border-[#E5E0D5] rounded-lg text-[#262522] focus:outline-none focus:border-[#2C3E35]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => onRegenerateSingleImage(block.id, block.prompt)}
                  className="flex-1 py-2 px-3 bg-[#F2EFE9] hover:bg-[#E5E0D5] disabled:opacity-50 text-[#1C1B18] text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`}
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
                  onClick={() => fileInputsRef.current[block.id]?.click()}
                  className="flex-1 py-2 px-3 bg-[#FAF8F5] hover:bg-[#EFECE4] border border-[#DED9CE] text-[#1C1B18] text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>📁 本地替换</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
