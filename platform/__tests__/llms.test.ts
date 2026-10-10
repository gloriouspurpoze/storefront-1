import { describe, expect, it } from 'vitest'
import { htmlToText } from '../llms'

describe('htmlToText', () => {
  it('keeps headings, lists and paragraphs as readable text', () => {
    const html = '<h2>Why switch</h2><p>Save &amp; grow.</p><ul><li>One CRM</li><li>No&nbsp;commission</li></ul><script>x()</script>'
    expect(htmlToText(html)).toBe('#### Why switch\n\nSave & grow.\n\n- One CRM\n- No commission')
  })

  it('drops unknown tags but leaves unknown entities untouched', () => {
    expect(htmlToText('<p><strong>Bold</strong> &copy;</p>')).toBe('Bold &copy;')
  })
})
