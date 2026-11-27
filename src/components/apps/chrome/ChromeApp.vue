<script setup>
import { computed, ref } from 'vue'
import LIcon from '../../ui/LIcon.vue'
import { useAiCompanionStore } from '../../../stores/aiCompanionStore'
import { useSystemStore } from '../../../stores/systemStore'

defineProps({
  app: { type: Object, default: null }
})

const aiCompanion = useAiCompanionStore()
const system = useSystemStore()

const starred = ref(false)
const isNarrow = computed(() => aiCompanion.isOpen)
const isSlimCompanion = computed(() => aiCompanion.isOpen && aiCompanion.layoutStyle === 'narrow')

function goBack() {
  system.goHome()
}
</script>

<template>
  <div class="safari-root" :class="{ 'is-narrow': isNarrow, 'is-slim-companion': isSlimCompanion }">
    <header class="safari-nav">
      <button type="button" class="safari-nav-btn" aria-label="返回" @click="goBack">
        <LIcon name="chevronLeft" :size="20" />
      </button>
      <div class="safari-url-pill">
        <LIcon name="globe" :size="13" />
        <span>transsion.com/news/visa-mou</span>
      </div>
      <button type="button" class="safari-nav-btn" aria-label="更多">
        <LIcon name="moreHorizontal" :size="19" />
      </button>
    </header>

    <article class="article-scroll" aria-label="Transsion 与 Visa 合作文章">
      <div class="article-content">
        <h1>Transsion has reached a strategic partnership with Visa to jointly promote innovation in digital payments and agentic commerce in emerging markets.</h1>
        <div class="article-meta">
          <span>Transsion Holdings</span>
          <time>November 19, 2026, 10:00 AM, Guangdong</time>
        </div>
        <button
          type="button"
          class="article-star"
          :class="{ 'is-starred': starred }"
          @click="starred = !starred"
        >
          <LIcon name="star" :size="14" :filled="starred" />
          <span>{{ starred ? 'Star Marked' : 'Star Mark' }}</span>
        </button>

        <p>
          Shenzhen, November 19, 2026 — Transsion and Visa have officially signed a strategic cooperation memorandum (MOU) today. The two parties will leverage Visa's global payment network, digital payment technology, and innovative capabilities, along with Transsion's extensive ecosystem of smart devices and strong localized operational capabilities in emerging markets, to deepen cooperation in areas such as agentic commerce, Visa's Tap to Pay (contactless payments via mobile phones or wearable devices), and Visa Tap to Phone (turning compatible smartphones into contactless acceptance terminals).
        </p>

        <div class="article-banner" aria-label="Visa 与 Transsion 合作概览">
          <div class="banner-badge">PARTNERSHIP · 2026</div>
          <div class="banner-logos">
            <span>TRANSSION</span>
            <span class="banner-x">×</span>
            <span>VISA</span>
          </div>
          <div class="banner-sub">Tap to Pay · Tap to Phone · Agentic Commerce</div>
        </div>

        <p>
          Transsion has been deeply engaged in global emerging markets for many years, with products and services covering over 100 countries and regions worldwide. This collaboration establishes a strategic partnership between Transsion and the global payment network across multiple business areas — the two parties will explore connecting Visa's global payment capabilities with Transsion's smart device ecosystem in areas such as agentic commerce, consumer payments, and merchant acceptance, accelerating the commercialization and scaling of cutting-edge payment innovations in global emerging markets.
        </p>
      </div>
    </article>
  </div>
</template>

<style scoped>
.safari-root {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f4f5f7;
  color: #111418;
  font-family: var(--font-stack);
  overflow: hidden;
}

.safari-nav {
  flex: none;
  padding: calc(var(--safe-top, 44px) + 4px) 12px 10px;
  background: #f4f5f7;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: padding-right 0.58s cubic-bezier(0.22, 0.88, 0.28, 1);
}
.is-narrow .safari-nav {
  padding-right: calc(35.5% + 10px);
}
.is-slim-companion .safari-nav {
  padding-right: calc(21.48% + 10px);
}

.safari-nav-btn {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.75);
  color: #111418;
  display: grid;
  place-items: center;
  flex: none;
  cursor: pointer;
}
.safari-nav-btn:active {
  transform: scale(0.92);
}

.safari-url-pill {
  flex: 1;
  min-width: 0;
  height: 32px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.85);
  border: 0.5px solid rgba(0, 0, 0, 0.06);
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #5c6670;
}
.safari-url-pill span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.article-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  overscroll-behavior: contain;
}
.article-scroll::-webkit-scrollbar {
  display: none;
}

.article-content {
  padding: 6px 20px calc(var(--safe-bottom, 34px) + 24px);
  display: flex;
  flex-direction: column;
  gap: 11px;
  transition: padding-right 0.58s cubic-bezier(0.22, 0.88, 0.28, 1);
}
.is-narrow .article-content {
  padding-left: 16px;
  padding-right: calc(35.5% + 12px);
}
.is-slim-companion .article-content {
  padding-left: 18px;
  padding-right: calc(21.48% + 12px);
}

.article-content h1 {
  margin: 0;
  font-size: 18.5px;
  font-weight: 600;
  line-height: 1.42;
  letter-spacing: -0.25px;
  color: #111418;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  font-size: 12.5px;
  line-height: 1.45;
  color: #60718e;
}
.article-meta time {
  color: #9ca3af;
}

.article-star {
  align-self: flex-start;
  border: 0;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  color: #60718e;
  cursor: pointer;
}
.article-star.is-starred {
  color: #f59e0b;
}

.article-content p {
  margin: 0;
  font-size: 14px;
  line-height: 1.68;
  color: #2f3338;
}

.article-banner {
  border-radius: 16px;
  padding: 18px 16px;
  background: linear-gradient(135deg, #102a4e 0%, #1a4d8f 55%, #0070d1 100%);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.banner-badge {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.4px;
  opacity: 0.75;
}
.banner-logos {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.banner-x {
  opacity: 0.7;
  font-weight: 400;
}
.banner-sub {
  font-size: 12px;
  opacity: 0.86;
}
</style>
