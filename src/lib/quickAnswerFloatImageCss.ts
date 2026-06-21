/** Shared CSS for quick-answer floated images (admin preview + editor). */
export function quickAnswerFloatImageCss(scopeClass = 'quick-answer-rich'): string {
  const s = scopeClass.startsWith('.') ? scopeClass : `.${scopeClass}`
  return `
    ${s} img {
      border-radius: 0.5rem;
      max-width: 100%;
      border: 1px solid hsl(var(--border) / 0.5);
      box-shadow: 0 1px 2px rgb(0 0 0 / 0.04);
    }
    ${s} img[data-layout="float-left"],
    ${s} img[data-layout="float-right"] {
      display: block !important;
      width: min(240px, 42vw) !important;
      max-width: 240px !important;
      height: auto !important;
      max-height: 180px !important;
      object-fit: cover !important;
      object-position: center center !important;
    }
    ${s} img[data-layout="float-left"] {
      float: left !important;
      margin: 0.125rem 1rem 0.5rem 0 !important;
    }
    ${s} img[data-layout="float-right"] {
      float: right !important;
      margin: 0.125rem 0 0.5rem 1rem !important;
    }
    ${s} img[data-layout="center"] {
      float: none !important;
      display: block !important;
      margin: 0.75rem auto !important;
      max-width: 100% !important;
      max-height: none !important;
      object-fit: unset !important;
    }
    ${s} img[data-layout="block"] {
      float: none !important;
      display: block !important;
      margin: 0.75rem 0 !important;
      max-width: 100% !important;
      max-height: none !important;
      object-fit: unset !important;
    }
    ${s} p {
      margin-top: 0 !important;
      margin-bottom: 0 !important;
    }
    ${s} p + p {
      margin-top: 0.75rem !important;
    }
    ${s}::after {
      content: "";
      display: table;
      clear: both;
    }
    @media (max-width: 639px) {
      ${s} img[data-layout="float-left"],
      ${s} img[data-layout="float-right"] {
        float: none !important;
        display: block !important;
        width: min(280px, 100%) !important;
        max-width: 280px !important;
        max-height: 200px !important;
        margin: 0.75rem auto !important;
      }
    }
  `
}
