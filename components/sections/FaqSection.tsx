import { Accordion } from '@/ui'
import './sections.css'

export function FaqSection({
  items,
  title = 'Frequently asked questions',
}: {
  items: { question: string; answer: string }[]
  title?: string
}) {
  if (!items.length) return null
  return (
    <section className="sf-section sf-container sf-faq">
      <div className="sf-faq__head">
        <p className="sf-eyebrow">Help</p>
        <h2 className="sf-heading">{title}</h2>
      </div>
      <Accordion
        items={items.map((f, i) => ({
          id: String(i),
          title: f.question,
          content: <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{f.answer}</p>,
        }))}
      />
    </section>
  )
}
