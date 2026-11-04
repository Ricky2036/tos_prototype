/**
 * Infinix AI 三级页配置（对齐真机 Infinix X6878 / XOS 17）。
 *
 * 骨架统一，差异只在：标题、头图插画、说明文案、卡片行、底部按钮。
 * 新增/修改页面只动这里，不要另写组件，否则一组的视觉会漂。
 */
export const AI_SUB_PAGES = {
  folaxVoice: {
    title: 'Folax 语音',
    hero: { variant: 'voice', caption: '多种唤醒方式，随时随地唤醒我。', dots: 4 },
    cards: [
      {
        rows: [
          { title: '默认语音助手', value: 'Folax', chevron: true },
          { title: '电源键唤醒', subtitle: '长按电源键 0.5 秒唤醒语音助手。', chevron: true },
          { title: '手势唤醒', subtitle: '从底部边缘向内滑动唤醒语音助手。', toggle: 'folaxGestureWake' },
          { title: '导航条唤醒', subtitle: '双击底部导航条打开 Folax 的键盘模式。', toggle: 'folaxNavBarWake' },
          { title: 'One-Tap Button 唤醒', subtitle: '长按 One-Tap Button 0.5 秒唤醒 Folax。', value: '已关闭', chevron: true },
          { title: '语音唤醒', subtitle: '默认语音助手为 Folax 时，你可以通过说“Hi Folax”唤醒 Folax。', chevron: true }
        ]
      },
      {
        rows: [
          { title: '语音实时转写', subtitle: '将与 Folax 的对话内容实时转写为文字显示。', toggle: 'folaxRealtimeTranscribe' },
          { title: '默认音乐播放器', subtitle: '智能推荐', chevron: true }
        ]
      },
      {
        rows: [
          { title: '通知推送', subtitle: '开启后，Folax 会向你推送通知。', toggle: 'folaxNotifPush' },
          { title: '个性化推荐', subtitle: '唤醒后，推荐个性化语音技能和使用建议。', toggle: 'folaxPersonalizedRec' },
          { title: '语音指令校验', subtitle: '根据您的常用语音指令、应用等信息，提升语音识别的准确性。', toggle: 'folaxVoiceCmdCheck' }
        ]
      }
    ]
  },

  folaScreen: {
    title: 'Fola 识屏',
    hero: {
      variant: 'screen',
      captionTitle: '快速进入屏幕识别',
      caption: '双指长按或从图库、截屏等场景进入屏幕识别。',
      dots: 4,
      activeDot: 1
    },
    cards: [
      { rows: [{ title: '手势触发', subtitle: '双指长按，触发识屏功能。', toggle: 'folaScreenGesture' }] },
      { rows: [{ title: '支持的应用', subtitle: '44 个已开启，75 个未开启', chevron: true }] },
      { rows: [{ title: '识屏建议', subtitle: '在图库、文件管理、记事本及截屏场景中主动显示识屏入口。', toggle: 'folaScreenSuggest' }] },
      { rows: [{ title: '文字识别管理', chevron: true }] }
    ]
  },

  smartSuggestion: {
    title: '智慧建议',
    hero: { variant: 'suggest', captionTitle: '猜你想要，一步直达', caption: '快速获取常用应用。', dots: 3 },
    cards: [
      { rows: [{ title: '添加“智慧建议”至桌面', chevron: true }] },
      { rows: [{ title: '自定义', chevron: true }] }
    ]
  },

  circleSearch: {
    title: '圈定即搜',
    hero: { variant: 'circle' },
    notes: [
      '长按HOME按键/导航触钮后，在屏幕中通过画圈、点击、涂抹等操作，迅速搜索所选内容。',
      '设置>系统>系统导航>圈定即搜'
    ]
  },

  aiCall: {
    title: 'AI 通话助手',
    hero: {
      variant: 'call',
      caption: '通话结束后自动生成对通话内容的简洁总结，帮助用户快速回顾通话重点。',
      dots: 2
    },
    cards: [
      {
        rows: [
          { title: '通话摘要', chevron: true },
          { title: 'AI 通话翻译', chevron: true, dot: true }
        ]
      }
    ]
  },

  aiSubtitle: {
    title: 'AI 字幕',
    hero: {
      variant: 'subtitle',
      caption: '为视频、直播和语音内容提供实时字幕与翻译，帮助您随时随地轻松理解内容。',
      dots: 2
    },
    cta: '去体验'
  },

  recordSummary: {
    title: '录音摘要',
    hero: {
      variant: 'record',
      caption: '在录音列表点击摘要按钮，将录音转写为文本，提炼关键信息生成摘要，结果在记事本中查看。'
    },
    cta: '去体验'
  },

  aiRecord: {
    title: 'AI 录',
    hero: {
      variant: 'aikey',
      captionTitle: '多场景录音快启',
      caption: '双击AI键、智能侧边栏、通话主动提醒，一键快启录音。',
      dots: 3
    },
    cards: [
      {
        rows: [
          {
            title: '自动推荐',
            subtitle: '系统将在第三方应用通话时推荐使用 AI 录。',
            toggle: 'aiRecordAutoRecommend',
            toggleColor: 'red'
          },
          { title: '支持的应用', chevron: true }
        ]
      },
      {
        rows: [
          {
            title: '自动录音',
            subtitle: '系统将在第三方应用通话时自动开启 AI 录 并开始录音。',
            toggle: 'aiRecordAutoRecord'
          },
          { title: '支持的应用', chevron: true }
        ]
      }
    ]
  },

  translate: {
    title: '翻译助手',
    hero: {
      variant: 'translate',
      caption: '聊天时，点击翻译按钮，将输入框中的文字翻译为对方的语言。',
      dots: 2
    },
    cards: [
      {
        rows: [
          { title: '智慧翻译', toggle: 'translateSmart' },
          { title: '相关翻译工具', chevron: true }
        ]
      }
    ]
  },

  social: {
    title: '社交助手',
    hero: {
      variant: 'social',
      caption: '使用社交应用时，提供通话摘要、双向翻译等AI功能，让交流变得轻松高效，不错过任何重要信息。',
      dots: 3
    },
    cards: [
      {
        rows: [
          { title: '通话摘要', chevron: true },
          { title: '双向翻译', chevron: true }
        ]
      }
    ]
  },

  aiWriting: {
    title: 'AI写作助手',
    hero: { variant: 'write' },
    notes: [
      '1.长按文字可对文字进行扩写、重写、校对拼写和语法、生成摘要，高效提升书写效率。',
      '2.浏览文本时可选择文本，生成摘要总结，查询。'
    ]
  },

  aiTheme: {
    title: 'AI随心主题',
    hero: { variant: 'theme' },
    notes: [
      '1.图生图：输入文字或上传照片，轻松打造独特风格。',
      '2.图生主题：上传照片，一键生成专属主题。'
    ],
    cta: '去体验'
  },

  smartNote: {
    title: '智慧笔记',
    hero: { variant: 'note', caption: '绘制简单的几笔，即可生成风格化图片。', dots: 2 },
    cta: '去体验'
  },

  docAssistant: {
    title: '文档助手',
    hero: { variant: 'doc' },
    notes: [
      '选择上传文件或输入链接，享受便捷的语音助手服务。',
      '1.一键总结：轻松点击，即刻获取内容重点。',
      '2.智能问答：有网状态下，支持进一步互动问答，提高阅读体验。',
      '无论是文档还是网页链接，我们都能提供全面的支持。快来体验更高效、更智能的阅读方式吧！'
    ],
    cta: '去体验'
  }
}
