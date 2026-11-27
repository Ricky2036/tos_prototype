import { defineStore } from 'pinia'

/**
 * 阔折叠 AI 伴随（AI Companion）系统状态机。
 *
 * 形态与状态流转：
 * - 'closed'     : 全屏应用，伴随面板收起
 * - 'compact'    : 小屏伴随态（右侧 35.5% 面板展开，左侧应用收窄为 64.5%）
 * - 'recognized' : 识屏后小屏伴随态（新增屏幕上下文推荐问题与联系人/内容卡片）
 * - 'expanded'   : 大屏伴随态（面板扩展至 77.2%，展示完整 AI 对话流与输入框）
 */
export const useAiCompanionStore = defineStore('aiCompanion', {
  state: () => ({
    /** 当前面板状态：'closed' | 'compact' | 'recognized' | 'expanded' */
    mode: 'closed',
    /** 伴随助手品牌/模型：'floa' | 'gemini' */
    assistantModel: 'floa',
    /** 伴随面板显示样式：'narrow'（窄版通用伴随，默认） | 'original'（原版） */
    layoutStyle: 'narrow',
    /** 是否已完成当前屏幕识别 */
    recognized: false,
    /** 是否正在执行识屏扫描动画 */
    scanning: false,
    /** 识别时的来源应用 ID */
    recognizedAppId: null,
    /** 卡片是否已收藏 */
    collected: false,
    /** 联系人卡片是否已保存 */
    contactSaved: false,
    /** 语音播报静音状态 */
    muted: false,
    /** 是否正在生成回复 */
    generating: false,
    /** 对话区是否附带当前屏幕截图上下文 */
    hasAttachment: true,
    /** Gemini 专属阶段：'idle' | 'drafting' | 'answering' */
    geminiPhase: 'idle',
    /** Gemini 草稿输入框内容 */
    draftQuery: '',
    /** Gemini 虚拟键盘是否展开 */
    keyboardOpen: true,
    /** 当前对话消息列表：{ id, role: 'user' | 'assistant', text, paragraphs?, withAttachment? } */
    messages: [],
    /** 轻提示文案 */
    toastText: '',
    /** 轻提示是否显示 */
    toastVisible: false
  }),

  getters: {
    isOpen: (s) => s.mode !== 'closed',
    isCompact: (s) => s.mode === 'compact' || s.mode === 'recognized',
    isExpanded: (s) => s.mode === 'expanded',
    assistantName: (s) => (s.assistantModel === 'gemini' ? 'Gemini' : 'Fola')
  },

  actions: {
    setModel(model) {
      if (model === 'floa' || model === 'gemini') {
        this.assistantModel = model
      }
    },

    setLayoutStyle(style) {
      if (style === 'original' || style === 'narrow') {
        this.layoutStyle = style
      }
    },

    toggleModel() {
      this.assistantModel = this.assistantModel === 'floa' ? 'gemini' : 'floa'
    },

    /** 双击侧边 AI 键：closed -> compact；expanded -> recognized/compact；compact -> closed（重置默认态） */
    toggleBySideKey() {
      if (this.mode === 'closed') {
        this.resetSession()
        this.mode = 'compact'
      } else {
        this.collapse()
      }
    },

    openCompact() {
      this.resetSession()
      this.mode = 'compact'
    },

    returnToNarrowCompact() {
      this.scanning = false
      this.generating = false
      this.recognized = false
      this.mode = 'compact'
    },

    collapse() {
      this.scanning = false
      this.generating = false
      if (this.mode === 'expanded') {
        this.mode = this.recognized ? 'recognized' : 'compact'
      } else if (this.layoutStyle === 'narrow' && this.mode === 'recognized') {
        this.returnToNarrowCompact()
      } else {
        this.close()
      }
    },

    close() {
      this.mode = 'closed'
      this.resetSession()
    },

    /** 重置当前会话与识屏态（例如收起重唤、切换应用或手动重置演示时） */
    resetSession() {
      this.scanning = false
      this.generating = false
      this.recognized = false
      this.recognizedAppId = null
      this.collected = false
      this.contactSaved = false
      this.hasAttachment = true
      this.geminiPhase = 'idle'
      this.draftQuery = ''
      this.keyboardOpen = true
      this.messages = []
      if (this.mode !== 'closed') {
        this.mode = 'compact'
      }
    },

    /** 触发识屏扫描（真实定时由组件调度，store 保持纯状态可测） */
    startScan(appId = null) {
      if (this.scanning) return false
      if (this.mode === 'closed') {
        this.mode = 'compact'
      }
      this.scanning = true
      this.recognizedAppId = appId
      return true
    },

    finishScan() {
      if (!this.scanning) return
      this.scanning = false
      this.recognized = true
      if (this.mode === 'compact') {
        this.mode = 'recognized'
      }
    },

    toggleCollect() {
      this.collected = !this.collected
      this.showToast(this.collected ? '已收藏' : '已取消收藏')
    },

    saveContactCard() {
      this.contactSaved = true
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('tos-ai-companion-contact-saved', 'true')
        }
      } catch {}
      this.showToast('联系人卡片已保存')
    },

    toggleMute() {
      this.muted = !this.muted
    },

    removeAttachment() {
      this.hasAttachment = false
    },

    restoreAttachment() {
      this.hasAttachment = true
    },

    /** 从推荐问题或直接提问进入大屏伴随态 */
    openExpandedWithQuery(query, appId = null) {
      const q = (query || '').trim()
      this.mode = 'expanded'
      this.hasAttachment = true
      if (this.assistantModel === 'gemini') {
        this.geminiPhase = 'drafting'
        this.draftQuery = q
        this.keyboardOpen = true
        this.messages = []
        return
      }
      if (!q) {
        this.messages = []
        return
      }
      this.sendQuery(q, appId, { resetConversation: true })
    },

    submitGeminiDraft(appId = null) {
      const q = (this.draftQuery || '').trim()
      if (!q) {
        this.showToast('请输入问题')
        return null
      }
      this.geminiPhase = 'answering'
      const res = this.sendQuery(q, appId, { resetConversation: this.messages.length === 0 })
      this.draftQuery = ''
      return res
    },

    /** 发送问题并生成上下文回复 */
    sendQuery(query, appId = null, { resetConversation = false } = {}) {
      const q = (query || '').trim()
      if (!q) {
        this.showToast('请输入问题')
        return null
      }
      if (resetConversation) {
        this.messages = []
      }
      const userMsg = {
        id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'user',
        text: q,
        withAttachment: this.hasAttachment
      }
      const paragraphs = buildReplyParagraphs(q, appId || this.recognizedAppId)
      const assistantMsg = {
        id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'assistant',
        paragraphs,
        text: paragraphs.join('\n\n')
      }
      this.messages.push(userMsg, assistantMsg)
      this.hasAttachment = false
      return assistantMsg
    },

    showToast(text) {
      this.toastText = text
      this.toastVisible = true
    },

    hideToast() {
      this.toastVisible = false
    }
  }
})

/**
 * 根据问题与当前应用上下文生成结构化回复段落。
 */
export function buildReplyParagraphs(query, appId) {
  const q = String(query || '').toLowerCase()
  if (q.includes('summary') || q.includes('summarize') || q.includes('总结') || q.includes('摘要')) {
    if (appId === 'chrome' || appId === 'safari') {
      return [
        '传音与 Visa 签署战略合作备忘录，共同推动新兴市场数字支付与智能体商务（Agentic Commerce）创新。',
        '双方将结合 Visa 全球支付网络与传音智能终端生态，重点探索 Visa Tap to Pay 与 Visa Tap to Phone 移动收单方案。'
      ]
    }
    if (appId === 'whatsapp') {
      return [
        'Rahul Sharma 分享了他的直拨手机号 +91 98765 43210，用于紧急货运沟通。',
        '约定明天（周四）下午 3:00 在 CyberHub Gurugram 见面签署 Q4 区域分销方案；需在今晚前发送修订后的 Q4 报价单 PDF 供财务审批。'
      ]
    }
    return [
      '已为您提炼当前屏幕核心信息：包含关键上下文摘要、重点内容及可执行操作建议。',
      '如需进一步整理重点或生成回复，可直接告诉我。'
    ]
  }
  if (q.includes('activate') || q.includes('one-tap')) {
    return [
      '打开支持 Visa 一碰付的钱包或银行应用，完成账户验证并绑定符合条件的 Visa 卡片，按提示开启设备的 NFC 权限即可激活。',
      '具体开通流程与适用卡片类型会因所在市场及发卡机构而有所不同。'
    ]
  }
  if (q.includes('business english') || q.includes('draft') || q.includes('回复')) {
    return [
      '为您生成一段得体、专业的商务英文回复：',
      'Hi Rahul, noted with thanks. I will share the revised Q4 quotation PDF by tonight for finance review. Confirmed for our meeting tomorrow (Thursday) at 3:00 PM at CyberHub Gurugram to sign off on the plan. I’ve also saved your mobile number for any urgent shipment updates. Best regards.',
      '您希望语气更正式一些，还是保持即时通讯的简洁风格？'
    ]
  }
  if (q.includes('contact') || q.includes('rahul')) {
    return [
      '已识别联系人信息：Rahul Sharma（+91 98765 43210），来源为 WhatsApp 对话。',
      '您可以点击“Save”将其添加到系统通讯录，或直接发起语音/视频通话。'
    ]
  }
  if (q.includes('explain') || q.includes('key points') || q.includes('action items')) {
    return [
      '已为您识别当前屏幕界面内容，并提取出核心信息与可执行的快捷操作建议。',
      '您可以继续追问界面细节、翻译文案或整理为待办清单。'
    ]
  }
  if (q.includes('visa') || q.includes('tap to phone')) {
    return [
      'Visa Tap to Phone（常称为 SoftPOS）可将支持 NFC 的普通智能手机变为非接触式收单终端，无需外接读卡器或专用 POS 硬件。',
      '其底层结合了 NFC 读写模式、EMV 非接内核、动态加密与 PCI MPoC 移动安全标准，确保消费级设备也能安全完成面对面刷卡交易。'
    ]
  }
  if (appId === 'whatsapp') {
    return [
      '已结合当前对话为您分析：',
      'Hi Rahul, noted with thanks. I will share the revised Q4 quotation PDF by tonight for finance review, and see you tomorrow at 3:00 PM at CyberHub Gurugram.'
    ]
  }
  return [
    '已结合当前屏幕内容为您完成分析，您可以继续输入追问或让我整理重点摘要。'
  ]
}
