import test from 'node:test'
import assert from 'node:assert/strict'
import { formatTitleWithTranslation, isLikelyChineseText } from './titleTranslator.js'

test('title should be formatted as original plus translated title', () => {
  const formatted = formatTitleWithTranslation('OpenAI launches new model', 'OpenAI 发布新模型')
  assert.equal(formatted, 'OpenAI launches new model（OpenAI 发布新模型）')
})

test('same translated text should keep original title', () => {
  const formatted = formatTitleWithTranslation('这是中文标题', '这是中文标题')
  assert.equal(formatted, '这是中文标题')
})

test('chinese title should be detected as likely chinese', () => {
  assert.equal(isLikelyChineseText('这是一个中文标题'), true)
})

test('english title should not be detected as chinese', () => {
  assert.equal(isLikelyChineseText('Open-source AI models are improving rapidly'), false)
})
