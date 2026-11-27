import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useAiCompanionStore, buildReplyParagraphs } from '../src/stores/aiCompanionStore.js'
import { getApp } from '../src/config/apps.js'

test('WhatsApp is registered as a core app', () => {
  const wa = getApp('whatsapp')
  assert.ok(wa)
  assert.equal(wa.id, 'whatsapp')
  assert.equal(wa.depth, 'core')
})

test('aiCompanionStore state transitions: side key, scan, expand, collapse', () => {
  setActivePinia(createPinia())
  const ai = useAiCompanionStore()
  ai.setLayoutStyle('original')

  assert.equal(ai.mode, 'closed')
  assert.equal(ai.isOpen, false)

  // Double-tap side key opens compact mode
  ai.toggleBySideKey()
  assert.equal(ai.mode, 'compact')
  assert.equal(ai.isOpen, true)
  assert.equal(ai.isCompact, true)

  // Scan screen transitions compact -> recognized
  const started = ai.startScan('whatsapp')
  assert.equal(started, true)
  assert.equal(ai.scanning, true)
  ai.finishScan()
  assert.equal(ai.scanning, false)
  assert.equal(ai.recognized, true)
  assert.equal(ai.mode, 'recognized')

  // Open recommendation expands panel and populates messages
  ai.openExpandedWithQuery('Please help me draft a response in business English.', 'whatsapp')
  assert.equal(ai.mode, 'expanded')
  assert.equal(ai.isExpanded, true)
  assert.equal(ai.messages.length, 2)
  assert.equal(ai.messages[0].role, 'user')
  assert.equal(ai.messages[1].role, 'assistant')
  assert.ok(ai.messages[1].paragraphs.length >= 2)

  // Collapse from expanded returns to recognized
  ai.collapse()
  assert.equal(ai.mode, 'recognized')

  // Collapse again closes panel and resets to default state on reopen
  ai.collapse()
  assert.equal(ai.mode, 'closed')
  assert.equal(ai.isOpen, false)
  assert.equal(ai.recognized, false)

  ai.toggleBySideKey()
  assert.equal(ai.mode, 'compact')
  assert.equal(ai.recognized, false)
  assert.equal(ai.messages.length, 0)
})

test('aiCompanionStore model toggle, collect, and contact save', () => {
  setActivePinia(createPinia())
  const ai = useAiCompanionStore()

  assert.equal(ai.assistantModel, 'floa')
  assert.equal(ai.assistantName, 'Fola')
  ai.toggleModel()
  assert.equal(ai.assistantModel, 'gemini')
  assert.equal(ai.assistantName, 'Gemini')

  ai.toggleCollect()
  assert.equal(ai.collected, true)
  assert.equal(ai.toastVisible, true)

  ai.saveContactCard()
  assert.equal(ai.contactSaved, true)
  assert.equal(ai.toastVisible, true)
})

test('Gemini mode enters drafting state before submitting', () => {
  setActivePinia(createPinia())
  const ai = useAiCompanionStore()

  ai.setModel('gemini')
  ai.openExpandedWithQuery('How to activate Visa One-Tap Payment', 'chrome')
  assert.equal(ai.mode, 'expanded')
  assert.equal(ai.geminiPhase, 'drafting')
  assert.equal(ai.draftQuery, 'How to activate Visa One-Tap Payment')
  assert.equal(ai.messages.length, 0)

  ai.submitGeminiDraft('chrome')
  assert.equal(ai.geminiPhase, 'answering')
  assert.equal(ai.messages.length, 2)
  assert.equal(ai.messages[0].text, 'How to activate Visa One-Tap Payment')
})

test('buildReplyParagraphs returns context-aware replies', () => {
  const summary = buildReplyParagraphs('Summary', 'whatsapp')
  assert.ok(summary.some((p) => p.includes('Rahul Sharma')))
  const draft = buildReplyParagraphs('Please help me draft a response in business English.', 'whatsapp')
  assert.ok(draft.some((p) => p.includes('CyberHub Gurugram')))
})

test('narrow mode is default and returns from recognized state back to compact state', () => {
  setActivePinia(createPinia())
  const ai = useAiCompanionStore()

  assert.equal(ai.layoutStyle, 'narrow')
  ai.openCompact()
  assert.equal(ai.mode, 'compact')

  ai.startScan('whatsapp')
  ai.finishScan()
  assert.equal(ai.mode, 'recognized')
  assert.equal(ai.recognized, true)

  ai.collapse()
  assert.equal(ai.mode, 'compact')
  assert.equal(ai.recognized, false)

  ai.collapse()
  assert.equal(ai.mode, 'closed')
})
