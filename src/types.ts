export interface StyleSOP {
  rhythm: string;
  sentencePatterns: string;
  rhetoricAndSymbols: string;
  captionFormat: string;
  signatureTemplate: string;
  summary: string;
}

export interface StyleTemplate {
  id: string;
  name: string;
  createdAt: string;
  sampleCount: number;
  samples: string[];
  sop: StyleSOP;
  isBuiltin?: boolean;
}

export type ArticleBlockType = 'text' | 'image';

export interface ArticleBlock {
  id: string;
  type: ArticleBlockType;
  /** Used when type === 'text' */
  content?: string;
  /** Used when type === 'image' */
  prompt?: string;
  caption?: string;
  imageUrl?: string;
  imageIndex?: number; // 1 to 5
  status?: 'idle' | 'generating' | 'ready' | 'error';
  compressedSizeKb?: number;
  isFallbackPhoto?: boolean;
}

export interface ArticleDocument {
  id: string;
  topic: string;
  styleTemplateId: string;
  styleTemplateName: string;
  titles: string[];
  selectedTitleIndex: number;
  author: string;
  publishDate: string;
  blocks: ArticleBlock[];
  signature: string;
}

export interface ApiConfig {
  /** 'free' | 'standard' | 'pro' | 'custom' */
  tierPreset: 'free' | 'standard' | 'pro';
  /** Text model ID: 'gemini-4-hydrogen' | 'gemini-4-argon' | 'gemini-3.1-flash-lite' */
  textModel: string;
  /** Image model ID or 'builtin-oriental-gallery' for zero-API-cost local mode */
  imageModel: string;
  /** Auto-fallback to builtin Oriental gallery when free tier hits quota */
  autoFallbackOnQuota: boolean;
  /** JPEG compression quality (0.70 to 0.95) */
  jpegQuality: number;
  /** Target 16:9 width in pixels (1280 or 1920) */
  targetWidth: number;
}

export type LeftPanelTab = 'style' | 'generate' | 'images' | 'api';
