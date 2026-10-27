/**
 * OS16 灵动岛控制台统一矢量图标 (全部统一白色，杜绝任何奇异颜色)
 */
export const OS16_ICONS = {
  // 1. 外卖履约 (原版矢量 SVG，统一白色)
  delivery: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><path d="M16 16h6v-6.5a1.5 1.5 0 0 0-1.5-1.5H16"></path><path d="M2 17h14V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10z"></path><circle cx="6" cy="18" r="2"></circle><circle cx="18" cy="18" r="2"></circle></svg>`,

  // 2. 网约接驾 (原版矢量 SVG，统一白色)
  car: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>`,

  // 3. 路线导航 (原版矢量 SVG，统一白色)
  navigation: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>`,

  // 4. 音乐大卡 (原版矢量 SVG，统一白色)
  music: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`,

  // 5. 实时翻译 (原版矢量 SVG，统一白色)
  translation: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><path d="m5 8 6 6"></path><path d="m4 14 6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="m22 22-5-10-5 10"></path><path d="M14 18h6"></path></svg>`,

  // 6. 系统引导 (原版矢量 SVG，统一白色)
  tip: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><path d="M12 18h.01"></path></svg>`,

  // 7. 倒计时 (原版矢量 SVG，统一白色)
  timer: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><path d="M5 22h14"></path><path d="M5 2h14"></path><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"></path><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path></svg>`,

  // 8. 录音跳动波形 (统一白色)
  voiceRecording: `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="pointer-events:none;"><rect x="2" y="10" width="2.4" height="4" rx="1.2"/><rect x="6" y="6" width="2.4" height="12" rx="1.2"/><rect x="10" y="3" width="2.4" height="18" rx="1.2"/><rect x="14" y="7" width="2.4" height="10" rx="1.2"/><rect x="18" y="10" width="2.4" height="4" rx="1.2"/></svg>`,

  // 9. 屏幕录制 (原版矢量 SVG，统一白色)
  screenRecording: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect width="14" height="14" x="1" y="5" rx="2" ry="2"></rect></svg>`,

  // 10. 快充：Figma 原厂双闪电图层矢量 (298:18670)
  batteryCharging: `<svg viewBox="480 564 22 20" width="14" height="14" fill="currentColor" style="pointer-events:none;"><path d="M498.976 571.674C499.248 571.674 499.399 571.989 499.229 572.201L491.413 581.909C491.201 582.172 490.778 581.975 490.843 581.644L491.695 577.285L496.214 571.674H498.976ZM489.092 574.643C489.296 574.643 489.448 574.829 489.409 575.029L489.257 575.81H488.023C487.75 575.809 487.6 575.491 487.773 575.279L488.297 574.643H489.092ZM495.574 565.787C495.789 565.527 496.209 565.727 496.142 566.058L495.241 570.508H491.694L495.574 565.787Z"/><path d="M491.142 566.058C491.209 565.727 490.788 565.527 490.574 565.788L482.774 575.28C482.6 575.491 482.75 575.809 483.024 575.809H486.592C486.796 575.809 486.949 575.996 486.91 576.196L485.843 581.644C485.778 581.976 486.201 582.173 486.414 581.909L494.228 572.202C494.399 571.99 494.248 571.674 493.976 571.674H490.402C490.197 571.674 490.044 571.487 490.084 571.286L491.142 566.058Z"/></svg>`,

  // 11. 电话通话 (原版矢量 SVG，统一白色)
  phoneCall: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,

  // 12. 麦克拾音 (原版麦克风矢量 SVG，统一白色)
  microphone: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>`,

  // 13. 个人热点：中心实心圆点与双侧实心同心弧线 (统一白色)
  hotspot: `<svg viewBox="0 0 32 28" width="14" height="14" fill="none" style="pointer-events:none;"><circle cx="16" cy="14" r="3.2" fill="currentColor"/><path d="M 10.7 8.7 A 7.5 7.5 0 0 0 10.7 19.3" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M 6.8 4.8 A 13 13 0 0 0 6.8 23.2" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M 21.3 8.7 A 7.5 7.5 0 0 1 21.3 19.3" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M 25.2 4.8 A 13 13 0 0 1 25.2 23.2" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>`,

  // 14. 手电筒 (原版矢量 SVG，统一白色)
  flashlight: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><path d="M18 6 15 2H9L6 6v3h12V6Z"></path><path d="M6 9v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9"></path><circle cx="12" cy="14" r="1.5"></circle></svg>`
}
