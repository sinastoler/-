import { ArticleDocument, StyleTemplate } from '../types';

export const BUILTIN_ORIENTAL_PHOTOS = [
  '/src/assets/images/oriental_tea_sunlight_1794635355692.jpg',
  '/src/assets/images/oriental_porcelain_branch_1794635355810.jpg',
  '/src/assets/images/oriental_linen_book_1794635356980.jpg',
  '/src/assets/images/oriental_courtyard_bamboo_1794635358584.jpg',
  '/src/assets/images/oriental_desk_dusk_1794635359170.jpg',
];

export const DEFAULT_STYLE_TEMPLATES: StyleTemplate[] = [
  {
    id: 'builtin-oriental-elegance',
    name: '东方雅致闲事风（默认示例）',
    createdAt: '2026-11-13',
    sampleCount: 2,
    isBuiltin: true,
    samples: [
      `立冬过后的第七个晴日，把茶案移到了靠南的木格窗下。

人到了一定年纪，便不再贪恋满屋的繁盛。
不是器物不够丰饶，而是心境更需要留白。

一只天青色的宋式茶盏，一方洗得发软的米白亚麻茶巾，便足以盛放一整个上午的晨光。

01 ｜ 晨光初照 · 素瓷与木纹的呼吸

我们常常以为，所谓雅事，必须得有幽深的庭院与名贵的旧物。
其实不然。
真正的清欢，往往藏在最寻常的尺度里——桌面擦拭得毫无尘埃，热水注下时白雾缓缓升腾，光线在木纹间一寸寸挪移。

. . . . . .

撰文 ｜ 闲事记
器物与光影，皆是日常的注脚`,
      `午后三点，风从竹影间穿堂而过。

在这个讲求效率的时代，慢下来似乎成了一种需要解释的奢侈。
但草木从不解释自己的生长，瓷器也不曾炫耀炉火的温润。

不是时间变快了，而是我们忘了如何凝视一件事物。

02 ｜ 午后三刻 · 书页间的风声

翻开线装的空白纸页，不必急于落笔。
看一缕香烟直直地升起，又在半空轻轻散开。所谓“清、敬、雅、和”，并不是挂在墙上的训诫，而是指尖触碰温热茶汤时的那一份笃定。`,
    ],
    sop: {
      rhythm:
        '短句独立成段，每段控制在 1～3 句之间；长短句错落交替，关键哲思句单独成行，营造如东方庭院般的呼吸感留白。',
      sentencePatterns:
        '高频使用“不是……而是……”、“所谓……不过是……”、“真正的……往往藏在……”等对比与收束句式，语调温和笃定、不疾不徐。',
      rhetoricAndSymbols:
        '善用全角竖线「｜」分隔章节序号与小标题；使用破折号「——」做具象细节延展；文末转场统一使用间隔省略号「. . . . . .」；克制使用感叹号。',
      captionFormat:
        '0X ｜ 时辰/节气意象 · 器物或光影细节（例如：01 ｜ 晨光初照 · 汝窑茶盏与浅木长桌）',
      signatureTemplate:
        '撰文 ｜ 闲事记工作室\n摄影与视觉 ｜ 清敬雅和美学部\n器物与光影，皆是日常的注脚',
      summary:
        '以东方“清、敬、雅、和”为审美内核，通过节气、自然光线、浅色原木、宋瓷与亚麻等温润意象，将日常闲事升华为宁静通透的生活哲思。',
    },
  },
  {
    id: 'builtin-song-aesthetics',
    name: '宋韵器物志 · 极简生活专栏',
    createdAt: '2026-11-13',
    sampleCount: 1,
    isBuiltin: true,
    samples: [
      `宋人爱极简，却从不流于寡淡。
在汝窑天青与定窑甜白之间，藏着中国人对光线最敏锐的体察。

不是色彩退却了，而是分寸感浮现了。

01 ｜ 极简之度 · 一器一物皆有归处

把多余的装饰拿走，剩下的便是材质本身的诚实。浅色白蜡木的温润纹理，加上一枝斜逸的翠绿橄榄叶，让书房瞬间安静下来。`,
    ],
    sop: {
      rhythm:
        '开篇直入器物或季节切面，两句一停顿，三段一留白，行文克制冷静而富有温度。',
      sentencePatterns:
        '常以“在……与……之间，藏着……”、“不是……而是……”、“把……拿走，剩下的便是……”构建审美张力。',
      rhetoricAndSymbols:
        '章节小标题采用「0X ｜ 四字主旨 · 意境短句」；引用概念使用直角引号「」；段落收尾使用间隔省略号「. . . . . .」。',
      captionFormat: '图 0X ｜ 器物材质 — 光影时刻记录',
      signatureTemplate:
        '出品 ｜ 宋韵器物志\n编辑 ｜ 素心\n于寻常日用中，见天地清朗',
      summary:
        '聚焦东方器物美学与空间秩序，强调材质肌理与自然光影的对话，文字干净洗练，极具杂志专栏质感。',
    },
  },
];

export const DEFAULT_ARTICLE_DOCUMENT: ArticleDocument = {
  id: 'default-oriental-article',
  topic: '冬日晴窗下的煎茶与独处：在寻常器物里养一团清气',
  styleTemplateId: 'builtin-oriental-elegance',
  styleTemplateName: '东方雅致闲事风（默认示例）',
  titles: [
    '冬日晴窗下，宜煎茶，宜静坐，宜无事',
    '不是日子缺少诗意，而是我们走得太急｜闲事五记',
    '一盏宋瓷，半窗暖阳：在寻常器物里养一团清气',
  ],
  selectedTitleIndex: 0,
  author: '闲事记工作室',
  publishDate: '2026-11-13',
  blocks: [
    {
      id: 'init-txt-1',
      type: 'text',
      content:
        '立冬过后的晴日，光线总带着一种难得的清透与温厚。\n把茶案移到靠南的木格窗下，看阳光一寸寸爬过浅色原木的纹理，心里那些悬而未决的杂音，便在这方寸之间慢慢落了地。',
    },
    {
      id: 'init-txt-2',
      type: 'text',
      content:
        '不是生活原本就如此匆忙，而是我们常常忘了给自己留出一盏茶的空隙。',
    },
    {
      id: 'init-img-1',
      type: 'image',
      imageIndex: 1,
      prompt:
        '真实摄影风格，横版 16:9 构图，温暖明亮的晨光透过木格窗洒在干净的浅色原木茶桌上，一只天青色宋代汝窑茶盏静置中央，旁侧叠放着米白色纯亚麻茶巾，柔和自然光影，体现东方“清、敬、雅、和”质感，严禁出现任何文字、水印、Logo。',
      caption: '01 ｜ 辰时暖光 · 天青汝窑茶盏与米白亚麻席',
      imageUrl: BUILTIN_ORIENTAL_PHOTOS[0],
      status: 'ready',
      compressedSizeKb: 142,
    },
    {
      id: 'init-txt-3',
      type: 'text',
      content: '01 ｜ 器物之清：少即是多，简即是丰',
    },
    {
      id: 'init-txt-4',
      type: 'text',
      content:
        '案头不需要堆满繁复的陈设。一只釉色温润的素白瓷瓶，斜插一枝新剪的翠绿枝叶，便能让整间屋子生出清朗的秩序。\n所谓“清”，不是冷清，而是拂去浮尘之后的明净与专注。',
    },
    {
      id: 'init-img-2',
      type: 'image',
      imageIndex: 2,
      prompt:
        '真实摄影风格，横版 16:9 构图，浅色天然白蜡木书桌上摆放一只极简宋代白瓷花瓶，瓶中插着一枝翠绿清新的橄榄枝，温暖明亮的窗户自然侧光，温润米白灰泥背景，体现东方“清、敬、雅、和”质感，严禁出现任何文字、水印、Logo。',
      caption: '02 ｜ 巳时清供 · 素白瓷瓶与窗畔新枝',
      imageUrl: BUILTIN_ORIENTAL_PHOTOS[1],
      status: 'ready',
      compressedSizeKb: 128,
    },
    {
      id: 'init-txt-5',
      type: 'text',
      content: '02 ｜ 行止之敬：认真对待每一个当下',
    },
    {
      id: 'init-txt-6',
      type: 'text',
      content:
        '温杯、投茶、注水、出汤——这些看似重复的动作，一旦放慢速度，便成了一种温和的修行。\n不是我们在侍弄器物，而是器物以其恒常的安静，教会我们如何安顿身心。',
    },
    {
      id: 'init-img-3',
      type: 'image',
      imageIndex: 3,
      prompt:
        '真实摄影风格，横版 16:9 构图，铺着米白原色亚麻桌布的木桌上，摊开一册空白线装宣纸笔记本，旁侧有一只小巧陶瓷香插与一杯澄澈温茶，午后温暖明亮的自然日光，质感干净温润，严禁出现任何文字、水印、Logo。',
      caption: '03 ｜ 午后三刻 · 亚麻席上的线装手账与清茶',
      imageUrl: BUILTIN_ORIENTAL_PHOTOS[2],
      status: 'ready',
      compressedSizeKb: 156,
    },
    {
      id: 'init-txt-7',
      type: 'text',
      content: '03 ｜ 草木之雅：借一窗竹影，纳四时微风',
    },
    {
      id: 'init-txt-8',
      type: 'text',
      content:
        '倦了的时候，便推开木门向廊外望去。庭前的翠竹在风里轻轻晃动，细碎的光斑落在浅灰色的鹅卵石上。\n真正高级的审美，从来不靠浓墨重彩去哗众取宠，而是如这一院竹影般，疏朗、通透、自有风骨。',
    },
    {
      id: 'init-img-4',
      type: 'image',
      imageIndex: 4,
      prompt:
        '真实摄影风格，横版 16:9 构图，从干净的浅色原木回廊望向洒满明亮暖阳的静谧庭院，纤细翠绿的竹叶与干净的浅灰鹅卵石，东方极简建筑线条，空间通透充满呼吸感，严禁出现任何文字、水印、Logo。',
      caption: '04 ｜ 申时廊下 · 翠竹疏影与庭院晴光',
      imageUrl: BUILTIN_ORIENTAL_PHOTOS[3],
      status: 'ready',
      compressedSizeKb: 184,
    },
    {
      id: 'init-txt-9',
      type: 'text',
      content: '04 ｜ 心境之和：日暮时分的温柔收束',
    },
    {
      id: 'init-txt-10',
      type: 'text',
      content:
        '待到斜阳渐沉，屋内染上一层浅浅的琥珀色。收起茶具，卷好手边的宣纸册页，一日的闲事便算圆满。\n愿你我都能在奔忙的旅途里，保有一方属于自己的晴窗——外有草木清辉，内有茶汤温热。',
    },
    {
      id: 'init-img-5',
      type: 'image',
      imageIndex: 5,
      prompt:
        '真实摄影风格，横版 16:9 构图，傍晚柔和温暖自然光下的书斋木桌，粉青釉宋瓷茶海、手工宣纸卷轴与浅色桦木托盘置于米白亚麻桌旗上，光影温润宁静，体现东方“清、敬、雅、和”质感，严禁出现任何文字、水印、Logo。',
      caption: '05 ｜ 酉时日暮 · 书斋茶席与宣纸卷轴',
      imageUrl: BUILTIN_ORIENTAL_PHOTOS[4],
      status: 'ready',
      compressedSizeKb: 149,
    },
  ],
  signature:
    '撰文 ｜ 闲事记工作室\n摄影与视觉 ｜ 清敬雅和美学部\n器物与光影，皆是日常的注脚',
};

export const INSPIRATION_TOPICS = [
  '冬日晴窗下的煎茶与独处：在寻常器物里养一团清气',
  '宋代汝窑与极简书房：把生活过成一首留白的诗',
  '雨后庭院的竹影与线香：给焦虑时代的一剂慢处方',
  '亚麻、原木与手写信：那些被算法遗忘的温润触感',
];
