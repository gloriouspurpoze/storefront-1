import './sections.css'

export function AboutSection({ title, body }: { title?: string; body?: string }) {
  if (!title && !body) return null
  return (
    <section className="sf-section sf-container sf-container--narrow sf-about">
      <p className="sf-eyebrow">Our story</p>
      {title && <h2 className="sf-heading">{title}</h2>}
      {body && <p className="sf-about__body">{body}</p>}
    </section>
  )
}
