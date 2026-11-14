import test from 'node:test';
import assert from 'node:assert/strict';
import {
  enforceOrientalImagePrompt,
  normalizeArticleResponse,
  buildWeChatInlineHtml,
  buildStandaloneHtmlFile,
} from './editorialLogic';

test('enforceOrientalImagePrompt removes dark/cluttered terms and appends 16:9 Oriental rules', () => {
  const raw = '一张破旧沧桑的木桌，带有水印和Logo，阴暗角落';
  const result = enforceOrientalImagePrompt(raw);

  assert.equal(result.includes('破旧'), false);
  assert.equal(result.includes('沧桑'), false);
  assert.equal(result.includes('阴暗'), false);
  assert.equal(result.includes('16:9'), true);
  assert.equal(result.includes('严禁出现任何文字'), true);
});

test('normalizeArticleResponse guarantees 3 titles and exactly 5 image blocks', () => {
  const raw = {
    titles: ['第一标题'],
    blocks: [
      { type: 'text', content: '第一段文字，呼吸感留白。' },
      { type: 'image', prompt: '宋代汝窑茶盏', caption: '01 ｜ 晨光茶事' },
    ],
    signature: '撰文 ｜ 闲事记',
  };

  const doc = normalizeArticleResponse(raw, {
    topic: '秋日煎茶',
    styleTemplateId: 'tpl-1',
    styleTemplateName: '东方雅致闲事风',
    fallbackSignature: '默认签名',
    defaultImages: ['data:image/jpeg;base64,AAA', 'data:image/jpeg;base64,BBB'],
  });

  assert.equal(doc.titles.length, 3);
  assert.equal(doc.titles[0], '第一标题');
  const imageBlocks = doc.blocks.filter((b) => b.type === 'image');
  assert.equal(imageBlocks.length, 5);
  assert.equal(imageBlocks[0].imageUrl, 'data:image/jpeg;base64,AAA');
  assert.equal(imageBlocks[0].caption, '01 ｜ 晨光茶事');
});

test('buildWeChatInlineHtml and buildStandaloneHtmlFile output inline styles and Base64 images', () => {
  const doc = normalizeArticleResponse(
    {
      titles: ['宋代器物里的清欢'],
      blocks: [
        { type: 'text', content: '不是器物选择了人，而是人在器物中照见了自己。' },
        { type: 'image', prompt: '汝窑白瓷', caption: '01 ｜ 素瓷清影' },
      ],
      signature: '撰文 ｜ 闲事记',
    },
    {
      topic: '宋代器物',
      styleTemplateId: 'tpl-1',
      styleTemplateName: '东方雅致闲事风',
      fallbackSignature: '默认签名',
      defaultImages: [
        'data:image/jpeg;base64,TEST1',
        'data:image/jpeg;base64,TEST2',
        'data:image/jpeg;base64,TEST3',
        'data:image/jpeg;base64,TEST4',
        'data:image/jpeg;base64,TEST5',
      ],
    }
  );

  const wechatHtml = buildWeChatInlineHtml(doc);
  assert.equal(wechatHtml.includes('style="'), true);
  assert.equal(wechatHtml.includes('data:image/jpeg;base64,TEST1'), true);
  assert.equal(wechatHtml.includes('宋代器物里的清欢'), true);

  const standalone = buildStandaloneHtmlFile(doc);
  assert.equal(standalone.startsWith('<!DOCTYPE html>'), true);
  assert.equal(standalone.includes('@media print'), true);
});
