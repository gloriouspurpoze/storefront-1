export default function Loading() {
  return (
    <main className="sf-container" aria-busy="true" aria-label="Loading product" style={{ paddingBlock: '1.5rem 4rem' }}>
      <span className="sf-skeleton" style={{ height: 14, width: 220 }} />
      <div className="sf-pdp-skeleton">
        <span className="sf-skeleton" style={{ aspectRatio: '4 / 5', borderRadius: 'var(--sf-radius-lg)' }} />
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <span className="sf-skeleton" style={{ height: 12, width: 90 }} />
          <span className="sf-skeleton" style={{ height: 38, width: '80%' }} />
          <span className="sf-skeleton" style={{ height: 24, width: 120 }} />
          <span className="sf-skeleton" style={{ height: 52, width: '100%', marginTop: 16 }} />
          <span className="sf-skeleton" style={{ height: 90, width: '100%' }} />
        </div>
      </div>
    </main>
  )
}
