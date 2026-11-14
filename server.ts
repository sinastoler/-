import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ClientApiOverride {
  textModel?: string;
  imageModel?: string;
  autoFallbackOnQuota?: boolean;
}

function getGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function resolveTextModel(override?: ClientApiOverride): string {
  const allowed = [
    'gemini-4-hydrogen',
    'gemini-4-argon',
    'gemini-3.1-flash-lite',
    'gemini-4-carbon',
  ];
  const candidate = override?.textModel?.trim();
  if (candidate && allowed.includes(candidate)) {
    return candidate;
  }
  return 'gemini-4-hydrogen';
}

function resolveImageModel(override?: ClientApiOverride): string {
  const allowed = [
    'gemini-3.1-flash-lite-image',
    'gemini-nano-banana-2.1',
    'gemini-3-pro-image',
    'builtin-oriental-gallery',
  ];
  const candidate = override?.imageModel?.trim();
  if (candidate && allowed.includes(candidate)) {
    return candidate;
  }
  return 'gemini-3.1-flash-lite-image';
}

function formatApiError(err: unknown): {
  status: number;
  message: string;
  isQuotaOrAuth: boolean;
} {
  const rawMsg = err instanceof Error ? err.message : String(err);
  if (
    rawMsg.includes('429') ||
    rawMsg.includes('RESOURCE_EXHAUSTED') ||
    rawMsg.includes('quota')
  ) {
    return {
      status: 429,
      message:
        'API 调用触发配额限制 (429 RESOURCE_EXHAUSTED)。免费层存在调用频率或生图模型限制，您可以在左侧「API 引擎」中切换为「免费层试用档」，或在 Settings > Secrets 中升级付费层。',
      isQuotaOrAuth: true,
    };
  }
  if (
    rawMsg.includes('403') ||
    rawMsg.includes('PERMISSION_DENIED') ||
    rawMsg.includes('API_KEY_INVALID') ||
    rawMsg.includes('400')
  ) {
    return {
      status: 403,
      message:
        'API 权限受限 (403/400)。若当前正在使用免费层测试，可在左侧「API 引擎」切换至「免费层试用档」，或在 Settings > Secrets 面板检查配置。',
      isQuotaOrAuth: true,
    };
  }
  if (rawMsg.includes('404') || rawMsg.includes('NOT_FOUND')) {
    return {
      status: 404,
      message:
        '未找到请求的模型 (404 NOT_FOUND)，请在「API 引擎」中切换为 gemini-4-hydrogen 或 gemini-3.1-flash-lite-image。',
      isQuotaOrAuth: false,
    };
  }
  return {
    status: 500,
    message: `服务调用异常：${rawMsg.slice(0, 180)}`,
    isQuotaOrAuth: false,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // 0. Ping / Connectivity Check Endpoint for Adjustable API Engine
  app.post('/api/gemini/ping', async (req, res) => {
    const startMs = Date.now();
    try {
      const { apiConfig } = req.body as { apiConfig?: ClientApiOverride };
      const ai = getGenAIClient();
      const model = resolveTextModel(apiConfig);

      const response = await ai.models.generateContent({
        model,
        contents: '请回复“连接正常”四个字。',
      });

      const latencyMs = Date.now() - startMs;
      res.json({
        ok: true,
        model,
        imageModel: resolveImageModel(apiConfig),
        latencyMs,
        reply: (response.text ?? '连接正常').trim().slice(0, 40),
      });
    } catch (err) {
      const formatted = formatApiError(err);
      res.status(formatted.status).json({
        ok: false,
        error: formatted.message,
      });
    }
  });

  // 1. Extract Style SOP from 1~5 sample articles
  app.post('/api/gemini/extract-style', async (req, res) => {
    try {
      const { templateName, samples, apiConfig } = req.body as {
        templateName?: string;
        samples?: string[];
        apiConfig?: ClientApiOverride;
      };

      const validSamples = Array.isArray(samples)
        ? samples.map((s) => s.trim()).filter(Boolean).slice(0, 5)
        : [];

      if (validSamples.length === 0) {
        res.status(400).json({
          error:
            '请至少提供 1 篇样本文章内容（支持粘贴全文或上传 .md / .txt 文件）。',
        });
        return;
      }

      const ai = getGenAIClient();
      const textModel = resolveTextModel(apiConfig);
      const combinedSamples = validSamples
        .map((s, idx) => `【样本文章 ${idx + 1}】\n${s.slice(0, 6000)}`)
        .join('\n\n---\n\n');

      const response = await ai.models.generateContent({
        model: textModel,
        contents: `请深度分析以下 ${validSamples.length} 篇微信公众号样本文章（风格名称：「${
          templateName || '自定义东方美学风'
        }」），提炼出可直接指导 AI 仿写的可编辑风格 SOP 规则。\n\n${combinedSamples}`,
        config: {
          systemInstruction:
            '你是一位资深的微信公众号主编与修辞学专家。请仔细拆解用户提供的样本文章，精准提炼其：1. 段落节奏（如单句成段、呼吸感留白、长短句交替）；2. 标志性句式（如高频使用“不是……而是……”等句型）；3. 修辞与符号习惯（如全角竖线｜、破折号——、间隔省略号 . . . . . .）；4. 图注格式；5. 文末品牌签名块格式；6. 整体风格气韵总结。严格按照 JSON Schema 输出。',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rhythm: {
                type: Type.STRING,
                description:
                  '段落节奏规则，例如单句成段、呼吸感留白、段落长度控制等。',
              },
              sentencePatterns: {
                type: Type.STRING,
                description:
                  '标志性句式规则，例如高频使用的排比、转折句式“不是……而是……”等。',
              },
              rhetoricAndSymbols: {
                type: Type.STRING,
                description:
                  '修辞与标点符号习惯，如全角竖线｜、短横线—、间隔省略号 . . . . . . 等。',
              },
              captionFormat: {
                type: Type.STRING,
                description: '图片下方的图注与时间戳格式规范。',
              },
              signatureTemplate: {
                type: Type.STRING,
                description: '文末品牌签名块多行文本模板。',
              },
              summary: {
                type: Type.STRING,
                description: '50字以内的整体文风气韵总结。',
              },
            },
            required: [
              'rhythm',
              'sentencePatterns',
              'rhetoricAndSymbols',
              'captionFormat',
              'signatureTemplate',
              'summary',
            ],
          },
        },
      });

      const jsonText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(jsonText);
      res.json({ sop: parsed });
    } catch (err) {
      const formatted = formatApiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 2. Generate Article + 5 Image Prompts with Structured Output (JSON)
  app.post('/api/gemini/generate-article', async (req, res) => {
    try {
      const { topic, styleTemplate, apiConfig } = req.body as {
        topic?: string;
        styleTemplate?: {
          name: string;
          sop: {
            rhythm: string;
            sentencePatterns: string;
            rhetoricAndSymbols: string;
            captionFormat: string;
            signatureTemplate: string;
            summary: string;
          };
        };
        apiConfig?: ClientApiOverride;
      };

      if (!topic || !topic.trim()) {
        res.status(400).json({ error: '请输入新选题或创作灵感。' });
        return;
      }

      const ai = getGenAIClient();
      const textModel = resolveTextModel(apiConfig);
      const sop = styleTemplate?.sop;

      const systemPrompt = `你是一位顶尖的微信公众号美学专栏主笔与视觉导演。
请严格遵循以下「风格 SOP」为用户撰写一篇深度图文并规划 5 个配图位：
- 风格名称：${styleTemplate?.name || '东方雅致闲事风'}
- 段落节奏：${sop?.rhythm || '单句成段，呼吸感留白，长短句错落'}
- 标志性句式：${sop?.sentencePatterns || '高频使用“不是……而是……”等哲思句式'}
- 修辞与符号习惯：${sop?.rhetoricAndSymbols || '使用全角竖线｜、破折号——、间隔省略号 . . . . . .'}
- 图注格式：${sop?.captionFormat || '0X ｜ 时辰意象 · 器物细节'}
- 文末签名模板：${sop?.signatureTemplate || '撰文 ｜ 闲事记\n器物与光影，皆是日常的注脚'}

【极其重要的配图规划规范】：
1. blocks 数组中必须包含丰富的正文段落（type: "text"）以及 **严格 5 个** 穿插在文章不同章节中的配图块（type: "image"）。
2. 每个 image 块的 prompt 字段必须强制遵守以下东方美学摄影规范：
   - 固定以真实摄影风格描述，画面比例为横版 16:9；
   - **严禁出现任何文字、水印、Logo**；
   - **拒绝任何暗黑、脏乱、破旧、沧桑描述**；
   - 统一采用“明亮温润的自然光、干净浅色原木、宋代瓷器、米白亚麻等东方‘清、敬、雅、和’质感”的摄影级具象描述（请结合具体段落意境描述不同器物、茶席、花器、竹影、书案等）。
3. 每个 image 块的 caption 字段必须提供符合图注格式的专属图片时间戳/意境图注（依次编号 01 到 05）。`;

      const response = await ai.models.generateContent({
        model: textModel,
        contents: `请围绕选题「${topic.trim()}」创作一篇微信公众号深度美文，包含 3 个备选标题、穿插 5 张东方美学摄影配图的正文块数组（约 8~12 个 text 块与 5 个 image 块交替穿插），以及文末签名块。`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              titles: {
                type: Type.ARRAY,
                description: '3 个极具公众号打开率与美学质感的备选文章标题',
                items: { type: Type.STRING },
              },
              blocks: {
                type: Type.ARRAY,
                description:
                  '文章内容块数组，包含正文段落(text)和严格 5 个穿插其中的配图位(image)',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: {
                      type: Type.STRING,
                      description: '块类型，只能是 "text" 或 "image"',
                    },
                    content: {
                      type: Type.STRING,
                      description:
                        '当 type 为 "text" 时的段落正文内容（可包含小标题或呼吸感短句）',
                    },
                    prompt: {
                      type: Type.STRING,
                      description:
                        '当 type 为 "image" 时的 16:9 真实摄影生图提示词，必须符合明亮温润自然光、浅色原木、宋代瓷器、米白亚麻等“清、敬、雅、和”质感，严禁文字水印Logo',
                    },
                    caption: {
                      type: Type.STRING,
                      description: '当 type 为 "image" 时的专属时间戳/意境图注',
                    },
                  },
                  required: ['type'],
                },
              },
              signature: {
                type: Type.STRING,
                description: '文末品牌签名块内容',
              },
            },
            required: ['titles', 'blocks', 'signature'],
          },
        },
      });

      const jsonText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(jsonText);
      res.json(parsed);
    } catch (err) {
      const formatted = formatApiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 3. Generate 16:9 High-Resolution Oriental Image
  app.post('/api/gemini/generate-image', async (req, res) => {
    try {
      const { prompt, apiConfig } = req.body as {
        prompt?: string;
        apiConfig?: ClientApiOverride;
      };
      if (!prompt || !prompt.trim()) {
        res.status(400).json({ error: '生图 Prompt 不能为空。' });
        return;
      }

      const imageModel = resolveImageModel(apiConfig);
      if (imageModel === 'builtin-oriental-gallery') {
        res.json({
          fallback: true,
          warning:
            '当前处于「免费层免生图消耗模式」，已自动匹配「清、敬、雅、和」16:9 东方美学实景摄影底图并完成前端 Canvas 压缩。',
        });
        return;
      }

      const ai = getGenAIClient();
      const enforcedPrompt = `${prompt.trim()}. Authentic editorial photography, 16:9 widescreen aspect ratio, bright warm natural daylight, clean light-toned natural oak wood, Song dynasty celadon or white porcelain, cream raw linen texture, Oriental aesthetics of clarity, reverence, elegance, and harmony (清、敬、雅、和). Absolutely NO text, NO watermark, NO logo, NO dark or dirty clutter.`;

      const response = await ai.models.generateContent({
        model: imageModel,
        contents: {
          parts: [{ text: enforcedPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: '16:9',
          },
        },
      });

      let imageDataUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType ?? 'image/png';
          imageDataUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!imageDataUrl) {
        res.json({
          fallback: true,
          warning:
            '模型未返回有效图像数据，已自动启用内置「清、敬、雅、和」16:9 实景摄影底图并执行前端 Canvas 压缩。',
        });
        return;
      }

      res.json({ imageDataUrl, fallback: false });
    } catch (err) {
      const formatted = formatApiError(err);
      res.status(200).json({
        fallback: true,
        warning: formatted.message,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
