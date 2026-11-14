import { ArticleBlock, ArticleDocument } from '../types';

const FORBIDDEN_DARK_TERMS = [
  '破旧',
  '沧桑',
  '阴暗',
  '脏乱',
  '废墟',
  '腐朽',
  '斑驳剥落',
  '恐怖',
  '幽暗',
  '水印',
  'Logo',
  'logo',
  '文字',
  '字幕',
];

const MANDATORY_AESTHETIC_SUFFIX =
  '真实摄影风格，横版 16:9 构图，明亮温润的自然光，干净浅色原木、宋代瓷器或米白亚麻质感，体现东方“清、敬、雅、和”的美学意境，画面纯净通透，严禁出现任何文字、水印、Logo (Authentic 16:9 photography, bright warm natural light, clean light wood, Song dynasty porcelain, cream linen, serene Oriental aesthetics, no text, no watermark, no logo)';

/**
 * Enforces the mandatory Oriental photography aesthetic rules on any image prompt:
 * - Strips dark/dirty/cluttered terms
 * - Guarantees 16:9 authentic photography, bright warm natural light, Song porcelain/linen/wood, and zero text/logo/watermark.
 */
export function enforceOrientalImagePrompt(rawPrompt: string): string {
  let cleaned = (rawPrompt || '').trim();
  for (const term of FORBIDDEN_DARK_TERMS) {
    cleaned = cleaned.replaceAll(term, '温润雅致');
  }
  if (!cleaned) {
    cleaned = '晨光透过木格窗洒在浅色原木茶案上，一只天青色汝窑茶盏静置在米白亚麻茶席之上，光影柔和清透';
  }
  if (!cleaned.includes('严禁出现任何文字') && !cleaned.includes('no text, no watermark')) {
    return `${cleaned}。${MANDATORY_AESTHETIC_SUFFIX}`;
  }
  return cleaned;
}

/**
 * Validates and normalizes raw JSON output from Gemini into a well-formed ArticleDocument
 * containing 3 candidate titles, text paragraphs, and exactly 5 image blocks.
 */
export function normalizeArticleResponse(
  raw: Record<string, unknown>,
  options: {
    topic: string;
    styleTemplateId: string;
    styleTemplateName: string;
    fallbackSignature: string;
    defaultImages?: string[];
  }
): ArticleDocument {
  const rawTitles = Array.isArray(raw.titles)
    ? raw.titles.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    : [];

  const titles: string[] = [
    rawTitles[0] || `闲事记 ｜ ${options.topic}：在寻常器物里，见天地清朗`,
    rawTitles[1] || `不是万物皆需繁复，而是清简之中自有回响`,
    rawTitles[2] || `留白、温润与日常：关于「${options.topic}」的五帧慢镜头`,
  ];

  const rawBlocks = Array.isArray(raw.blocks) ? raw.blocks : [];
  const normalizedBlocks: ArticleBlock[] = [];
  let imageCounter = 0;

  for (let i = 0; i < rawBlocks.length; i++) {
    const item = rawBlocks[i] as Record<string, unknown>;
    if (!item || typeof item !== 'object') continue;

    if (item.type === 'image' && imageCounter < 5) {
      imageCounter++;
      const fallbackImg = options.defaultImages?.[imageCounter - 1] || '';
      normalizedBlocks.push({
        id: `block-img-${imageCounter}-${Date.now()}-${i}`,
        type: 'image',
        imageIndex: imageCounter,
        prompt: enforceOrientalImagePrompt(typeof item.prompt === 'string' ? item.prompt : ''),
        caption:
          typeof item.caption === 'string' && item.caption.trim()
            ? item.caption.trim()
            : `0${imageCounter} ｜ 晨光清供 · 器物与光影的呼吸`,
        imageUrl: fallbackImg,
        status: fallbackImg ? 'ready' : 'idle',
      });
    } else if (item.type === 'text' && typeof item.content === 'string' && item.content.trim()) {
      normalizedBlocks.push({
        id: `block-txt-${Date.now()}-${i}`,
        type: 'text',
        content: item.content.trim(),
      });
    }
  }

  // Ensure at least some text blocks exist if rawBlocks was sparse
  if (normalizedBlocks.filter((b) => b.type === 'text').length === 0) {
    normalizedBlocks.unshift({
      id: `block-txt-fallback-1`,
      type: 'text',
      content: `真正让人心安的日常，不是向外追逐喧嚣的丰盛，而是向内守住一隅清简的秩序。`,
    });
  }

  // Ensure strictly 5 image blocks interspersed if the model returned fewer than 5
  const defaultPrompts = [
    '温暖晨光洒在干净浅色原木长桌上，一只宋代天青色汝窑茶盏与折叠整齐的米白亚麻茶巾，光影柔和通透',
    '浅色白蜡木书案上摆放素雅白瓷花器，斜插一枝翠绿橄榄枝，背后是温润米白灰泥墙面与柔和自然窗光',
    '铺着米白原色亚麻桌布的案几上，摊开一册线装空白宣纸手账，旁置小巧陶瓷香插与清茶，午后暖光',
    '从干净浅色木质廊下望向洒满晨光的静谧庭院，修竹疏影与浅灰鹅卵石，空间充满呼吸感与东方雅致',
    '傍晚柔和余晖中的书斋茶席，粉青釉公道杯、手工宣纸卷轴与浅木托盘置于米白亚麻茶旗之上，静谧清和',
  ];

  while (imageCounter < 5) {
    imageCounter++;
    const fallbackImg = options.defaultImages?.[imageCounter - 1] || '';
    normalizedBlocks.push({
      id: `block-img-pad-${imageCounter}-${Date.now()}`,
      type: 'image',
      imageIndex: imageCounter,
      prompt: enforceOrientalImagePrompt(defaultPrompts[imageCounter - 1]),
      caption: `0${imageCounter} ｜ 时光注脚 · 清敬雅和之境`,
      imageUrl: fallbackImg,
      status: fallbackImg ? 'ready' : 'idle',
    });
  }

  const signature =
    typeof raw.signature === 'string' && raw.signature.trim()
      ? raw.signature.trim()
      : options.fallbackSignature;

  return {
    id: `article-${Date.now()}`,
    topic: options.topic,
    styleTemplateId: options.styleTemplateId,
    styleTemplateName: options.styleTemplateName,
    titles,
    selectedTitleIndex: 0,
    author: '闲事记工作室',
    publishDate: new Date().toISOString().slice(0, 10),
    blocks: normalizedBlocks,
    signature,
  };
}

/**
 * Escapes HTML special characters safely.
 */
export function escapeHtml(str: string): string {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Builds 100% inline-styled HTML specifically compatible with WeChat Official Account (mp.weixin.qq.com) editor.
 * Every tag uses inline `style="..."` and Base64 data URLs for images.
 */
export function buildWeChatInlineHtml(article: ArticleDocument): string {
  const activeTitle = article.titles[article.selectedTitleIndex] || article.titles[0] || '';
  const bodyHtml = article.blocks
    .map((block) => {
      if (block.type === 'text') {
        const text = (block.content || '').trim();
        // Check if it looks like a short section divider or quote with ｜
        const isSectionHeader = text.length <= 26 && (text.includes('｜') || text.startsWith('0'));
        if (isSectionHeader) {
          return `<p style="margin: 32px 0 18px 0; padding: 0; font-family: 'Optima', 'Noto Serif SC', 'Songti SC', serif; font-size: 16px; font-weight: 600; line-height: 1.75; letter-spacing: 1.5px; color: #2C3E35; text-align: center;">${escapeHtml(
            text
          )}</p>`;
        }
        const lines = text.split('\n').map((l) => escapeHtml(l.trim())).join('<br/>');
        return `<p style="margin: 0 0 22px 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; font-size: 15px; line-height: 2.0; letter-spacing: 0.8px; color: #262522; text-align: justify;">${lines}</p>`;
      }

      if (block.type === 'image') {
        const imgSrc = block.imageUrl || '';
        const caption = block.caption ? escapeHtml(block.caption) : '';
        return `<section style="margin: 30px 0 32px 0; padding: 0; text-align: center; break-inside: avoid;">
  ${
    imgSrc
      ? `<img src="${imgSrc}" alt="${caption}" style="display: block; width: 100%; max-width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 4px; margin: 0 auto; box-shadow: 0 2px 10px rgba(28, 27, 24, 0.06);" />`
      : ''
  }
  ${
    caption
      ? `<p style="margin: 10px 0 0 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif; font-size: 12px; line-height: 1.6; letter-spacing: 1px; color: #8C887F; text-align: center;">${caption}</p>`
      : ''
  }
</section>`;
      }
      return '';
    })
    .join('\n');

  const signatureLines = (article.signature || '')
    .split('\n')
    .map((line) => escapeHtml(line.trim()))
    .filter(Boolean)
    .map(
      (line, idx) =>
        `<p style="margin: ${idx === 0 ? '0 0 6px 0' : '0 0 4px 0'}; padding: 0; font-size: 12px; line-height: 1.8; letter-spacing: 1.2px; color: ${
          idx === 0 ? '#2C3E35' : '#8C887F'
        }; font-weight: ${idx === 0 ? '600' : '400'}; text-align: center;">${line}</p>`
    )
    .join('\n');

  return `<section style="max-width: 677px; margin: 0 auto; padding: 28px 20px 40px 20px; background-color: #FAF8F5; color: #262522; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; box-sizing: border-box;">
  <section style="margin: 0 0 28px 0; padding: 0 0 20px 0; border-bottom: 1px solid #E6E2D8;">
    <h1 style="margin: 0 0 12px 0; padding: 0; font-family: 'Noto Serif SC', 'Songti SC', serif; font-size: 21px; font-weight: 600; line-height: 1.5; letter-spacing: 0.8px; color: #1C1B18;">${escapeHtml(
      activeTitle
    )}</h1>
    <p style="margin: 0; padding: 0; font-size: 12px; color: #8C887F; letter-spacing: 0.6px;">
      <span>${escapeHtml(article.author)}</span>
      <span style="margin: 0 6px;">·</span>
      <span>${escapeHtml(article.styleTemplateName)}</span>
      <span style="margin: 0 6px;">·</span>
      <span>${escapeHtml(article.publishDate)}</span>
    </p>
  </section>
  <section style="margin: 0; padding: 0;">
    ${bodyHtml}
  </section>
  <section style="margin: 44px 0 0 0; padding: 24px 16px 8px 16px; border-top: 1px solid #E6E2D8; text-align: center; break-inside: avoid;">
    <p style="margin: 0 0 14px 0; font-size: 12px; letter-spacing: 4px; color: #B5B0A4;">. . . . . .</p>
    ${signatureLines}
  </section>
</section>`;
}

/**
 * Builds a complete, standalone single-file HTML document containing embedded Base64 images and print styles.
 */
export function buildStandaloneHtmlFile(article: ArticleDocument): string {
  const activeTitle = article.titles[article.selectedTitleIndex] || article.titles[0] || '公众号图文';
  const inlineContent = buildWeChatInlineHtml(article);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(activeTitle)}</title>
  <style>
    body {
      margin: 0;
      padding: 40px 16px;
      background-color: #F2EFE9;
      color: #1C1B18;
      -webkit-font-smoothing: antialiased;
    }
    .article-shell {
      max-width: 677px;
      margin: 0 auto;
      background-color: #FAF8F5;
      border: 1px solid #E5E0D5;
      border-radius: 8px;
      overflow: hidden;
    }
    @media print {
      body {
        background: #FFFFFF;
        padding: 0;
      }
      .article-shell {
        border: none;
        max-width: 100%;
      }
      p, section, img {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <main class="article-shell">
    ${inlineContent}
  </main>
</body>
</html>`;
}
