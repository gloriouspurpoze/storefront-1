/**
 * Industry-vertical starter copy for category marketing locality keys.
 * Interpolates `{service}`, `{location}`, `{locShort}`, `{metro}`, `{slug}`, `{origin}`, `{catalogUrl}`, `{localUrl}`.
 * Merged after base SEO scaffolding in {@link buildLocalitySeoAutofillPack}.
 */
import type {
  BookingStepBlock,
  CategoryMarketingConfig,
  ComparisonRow,
  LeadMagnetBlock,
  LocalityGuideSectionBlock,
  ServiceCardBlock,
  ServiceTypeBlock,
  SparePartRow,
  TrustBenefitBlock,
} from '../types/categoryMarketing'

export type VerticalPrefillContext = {
  industrySlug: string
  industryLabel: string
  localitySlug: string
  localityLabel: string
  locShort: string
  metro: string
  origin: string
}

type VerticalProfile = {
  /** Optional extra locality guide sections (prepended to base guide sections) */
  extraLocalitySections?: { h2: string; paragraphs: string[] }[]
  serviceCards: Omit<ServiceCardBlock, never>[]
  serviceTypes: { title: string; description: string; bullets: string[] }[]
  trustBenefits: { heading: string; body: string }[]
  waysHeading: string
  waysBullets: string[]
  experienceIncluded: string[]
  areasCopy: string
  areasList: string[]
  areasCta: string
  bookingSteps: { stepNumber: string; title: string; description: string }[]
  pricingIncluded: string[]
  pricingExcluded: string[]
  comparisonRows: { label: string; profixer: string; others: string }[]
  spareParts: { name: string; priceRange: string }[]
  introLeadMagnetLabel: string
  introLeadMagnetUrl: string
  leadMagnet: LeadMagnetBlock
}

function ix(template: string, c: VerticalPrefillContext): string {
  const catalogUrl = `${c.origin}/services/${c.industrySlug.replace(/^\/+|\/+$/g, '')}`
  const localUrl = `${catalogUrl}/${c.localitySlug.replace(/^\/+|\/+$/g, '')}`
  return template
    .replace(/\{service\}/g, c.industryLabel)
    .replace(/\{location\}/g, c.localityLabel)
    .replace(/\{locShort\}/g, c.locShort)
    .replace(/\{metro\}/g, c.metro)
    .replace(/\{slug\}/g, c.industrySlug)
    .replace(/\{origin\}/g, c.origin)
    .replace(/\{catalogUrl\}/g, catalogUrl)
    .replace(/\{localUrl\}/g, localUrl)
}

export function resolveMarketingVerticalKey(industrySlug: string): keyof typeof VERTICAL_MARKETING_PROFILES {
  const s = industrySlug.toLowerCase().replace(/_/g, '-')
  if (s === 'ac' || s.startsWith('ac-')) return 'ac'
  if (s.includes('electric')) return 'electrician'
  if (s.includes('plumb')) return 'plumber'
  if (s.includes('clean')) return 'cleaning'
  if (s.includes('carpent')) return 'carpenter'
  if (s.includes('paint')) return 'painter'
  if (s.includes('appliance')) return 'appliance-repair'
  if (s.includes('home') && s.includes('repair')) return 'home-repair'
  return 'default'
}

/** One file: keyed verticals + default fallback. Strings use `{service}` etc.; resolved at runtime. */
export const VERTICAL_MARKETING_PROFILES: Record<string, VerticalProfile> = {
  ac: {
    extraLocalitySections: [
      {
        h2: 'AC gas pressure, leaks, and summer load in {locShort}',
        paragraphs: [
          'Low cooling often traces to gas pressure, clogged filters, or a weak outdoor fan—photos of the indoor unit, outdoor unit, and any error code help the partner bring the right kit on the first visit.',
          'If you are on a high floor or a narrow service lift route in {metro}, mention lift rules and parking so ETA stays realistic during peak heat.',
        ],
      },
    ],
    serviceCards: [
      {
        title: 'Split AC jet service',
        description:
          '<p>Deep clean of indoor coil &amp; blower, drain flush, and basic outdoor wash—ideal before summer in <strong>{location}</strong>.</p>',
        price: 'From ₹499',
        rating: '4.8+',
        duration: '60–90 min',
        warranty: 'Service warranty as per policy',
        bookUrl: '{origin}/book',
      },
      {
        title: 'Gas charging & leak check',
        description:
          '<p>Pressure test, leak trace on accessible lines, and top-up only where scope is safe and approved after inspection.</p>',
        price: 'Inspection priced on site',
        rating: '4.7+',
        duration: '45–120 min',
        warranty: 'Parts quoted separately',
        bookUrl: '{origin}/book',
      },
      {
        title: 'AC not cooling — diagnosis',
        description:
          '<p>Structured checklist for thermostat, airflow, and outdoor unit health—clear next steps before you spend on parts.</p>',
        price: 'Visit fee as per live rate card',
        rating: '4.8+',
        duration: '45–75 min',
        warranty: 'Digital invoice',
        bookUrl: '{localUrl}',
      },
    ],
    serviceTypes: [
      {
        title: 'Install & uninstall',
        description:
          '<p>Bracket check, vibration pads, vacuum where applicable, and safe line routing for <strong>{location}</strong> apartments.</p>',
        bullets: ['Standard split', 'Window AC', 'Stand / tower installs where supported'],
      },
      {
        title: 'Repair & PCB faults',
        description:
          '<p>Sensor, relay, and communication faults—partner carries common spares; exotic PCBs may need a second visit.</p>',
        bullets: ['Error code capture', 'Safe temporary cooling advice', 'Quote before board swap'],
      },
    ],
    trustBenefits: [
      {
        heading: 'Inspection-first pricing',
        body: '<p>We separate <strong>visit + diagnosis</strong> from material-heavy work so you can approve scope before major spends—especially during peak summer in {metro}.</p>',
      },
      {
        heading: 'Trained AC partners',
        body: '<p>Partners are onboarded with document checks; you get tidy visits, shoe covers where requested, and a digital trail for warranty claims.</p>',
      },
      {
        heading: 'Same-day where possible',
        body: '<p>Dispatch density varies by pincode in <strong>{locShort}</strong>; early bookings improve odds for same-day slots.</p>',
      },
    ],
    waysHeading: 'Four practical ways we keep AC visits predictable',
    waysBullets: [
      'Photos + tower/wing in booking notes',
      'Clear society gate rules before the partner arrives',
      'Ask for written scope before gas or PCB work',
      'Keep the invoice for service warranty queries',
    ],
    experienceIncluded: [
      'Trained AC technicians for split & window units',
      'Digital invoice after the visit',
      'Option to rebook the same partner when available',
      'Support channel for post-visit questions',
    ],
    areasCopy:
      '<p>We route <strong>{service}</strong> visits across <strong>{location}</strong> and nearby pockets in <strong>{metro}</strong>. Narrow lanes or society restrictions may add a few minutes—share accurate pins.</p>',
    areasList: ['{locShort} core', 'Adjacent sectors (edit to match ops)', '{metro} — confirm at booking'],
    areasCta: 'Check live slots for your pincode',
    bookingSteps: [
      { stepNumber: '1', title: 'Pick AC job type', description: '<p>Choose service, add photos, and set <strong>{location}</strong> address with society rules.</p>' },
      { stepNumber: '2', title: 'Select slot', description: '<p>Pick a time; we show partner availability where the product supports it.</p>' },
      { stepNumber: '3', title: 'Partner visit', description: '<p>Inspection-first quote for repairs; confirm scope before gas-heavy or PCB work.</p>' },
      { stepNumber: '4', title: 'Pay & records', description: '<p>Digital invoice; save it for warranty and rebook flows.</p>' },
    ],
    pricingIncluded: [
      'Standard visit / inspection labour as quoted',
      'Basic cleaning consumables on jet service SKUs',
      'Leak test labour on scoped packages',
    ],
    pricingExcluded: [
      'Refrigerant top-up beyond quoted grams',
      'Outdoor unit chemical overhaul unless purchased',
      'Core drilling / civil work',
      'Parts not approved after inspection',
    ],
    comparisonRows: [
      { label: 'Quote clarity', profixer: 'Written scope before major parts', others: 'Often verbal only' },
      { label: 'Revisit policy', profixer: 'Booking ID carries context', others: 'May restart diagnosis' },
      { label: 'Payments', profixer: 'Digital trail by default', others: 'Cash-heavy variance' },
    ],
    spareParts: [
      { name: '1.5T universal remote (if applicable)', priceRange: 'Quoted after model check' },
      { name: 'Capacitor kit (common values)', priceRange: 'MRP + labour on invoice' },
    ],
    introLeadMagnetLabel: 'Free AC health checklist',
    introLeadMagnetUrl: '{catalogUrl}',
    leadMagnet: {
      headline: 'Planning summer AC service in {locShort}?',
      description:
        '<p>Book a <strong>jet service</strong> or <strong>diagnosis</strong> slot—partners carry common consumables for faster first-visit resolution in <strong>{metro}</strong>.</p>',
      ctaLabel: 'See AC services',
    },
  },
  electrician: {
    serviceCards: [
      {
        title: 'Fan / light / switch faults',
        description: '<p>Trips, loose neutrals, and fixture swaps—safe isolation and testing before close-up in <strong>{location}</strong>.</p>',
        price: 'From ₹199 visit',
        rating: '4.8+',
        duration: '45–90 min',
        warranty: 'Labour as per policy',
        bookUrl: '{origin}/book',
      },
      {
        title: 'MCB / DB health check',
        description: '<p>Thermal scan where applicable, torque check on terminations, and clear labelling suggestions for societies in {metro}.</p>',
        price: 'Package on quote',
        rating: '4.7+',
        duration: '60–120 min',
        warranty: 'Scope in writing',
        bookUrl: '{origin}/book',
      },
      {
        title: 'Earthing & leakage',
        description: '<p>ELCB/RCCB trip investigations with stepwise isolation—critical for monsoon load in {locShort}.</p>',
        price: 'Diagnosis on visit',
        rating: '4.8+',
        duration: '60–150 min',
        warranty: 'Safety-first escalation',
        bookUrl: '{localUrl}',
      },
    ],
    serviceTypes: [
      {
        title: 'Small jobs & fixtures',
        description: '<p>Replacements that do not require rewiring runs—ideal for quick slots in <strong>{location}</strong>.</p>',
        bullets: ['Ceiling / wall lights', 'Switches & sockets', 'Doorbells'],
      },
      {
        title: 'Heavy load & rewiring',
        description: '<p>AC point, kitchen load, or aluminum-to-copper remediation—material lists after site survey.</p>',
        bullets: ['Cable sizing', 'DB upgrade path', 'Society compliance notes'],
      },
    ],
    trustBenefits: [
      {
        heading: 'Safety-first electrical work',
        body: '<p>Partners follow isolation + test discipline; if a circuit is unsafe to energize, you get a clear explanation—not a rushed patch.</p>',
      },
      {
        heading: 'Transparent estimates',
        body: '<p>Material and labour split before major rewiring in <strong>{locShort}</strong>; approvals captured on the job record.</p>',
      },
      {
        heading: 'Monsoon-ready response',
        body: '<p>Leakage trips spike during rains in <strong>{metro}</strong>; book early slots for faster dispatch.</p>',
      },
    ],
    waysHeading: 'How we keep electrical visits safe and fast',
    waysBullets: [
      'Share DB photo + trip history in booking',
      'Mention single-phase vs three-phase supply if known',
      'Clear furniture access to the DB area',
      'Approve scope before concealed wiring cuts',
    ],
    experienceIncluded: [
      'Insulated tools & test sequence on power work',
      'Digital invoice & visit notes',
      'Escalation path for unsafe hidden wiring',
    ],
    areasCopy:
      '<p><strong>{service}</strong> coverage across <strong>{location}</strong> with partners routed for dense pockets and society access rules in <strong>{metro}</strong>.</p>',
    areasList: ['{locShort}', 'Nearby micro-markets (edit)', '{metro}'],
    areasCta: 'Book an electrician slot',
    bookingSteps: [
      { stepNumber: '1', title: 'Describe the fault', description: '<p>Trips, sparks, or appliance dead—photos of DB help.</p>' },
      { stepNumber: '2', title: 'Book slot', description: '<p>Pick time; confirm society gate rules for {location}.</p>' },
      { stepNumber: '3', title: 'Visit & test', description: '<p>Isolation, root-cause, and quote before big material spends.</p>' },
      { stepNumber: '4', title: 'Close & invoice', description: '<p>Digital receipt; keep for warranty.</p>' },
    ],
    pricingIncluded: ['Standard labour on booked SKU', 'Basic consumables (tape, screws) where part of package'],
    pricingExcluded: ['Copper cable by the meter unless quoted', 'Civil / chasing', 'Exclusive imported fittings'],
    comparisonRows: [
      { label: 'DB documentation', profixer: 'Photos + notes on request', others: 'Often minimal' },
      { label: 'Scope changes', profixer: 'Written approval before expansion', others: 'Ad hoc' },
    ],
    spareParts: [
      { name: '16A / 6A sockets (common brands)', priceRange: 'MRP + labour' },
      { name: 'MCB 10–32A', priceRange: 'Quoted on model' },
    ],
    introLeadMagnetLabel: 'Electrical safety checklist',
    introLeadMagnetUrl: '{catalogUrl}',
    leadMagnet: {
      headline: 'Need a reliable electrician in {locShort}?',
      description: '<p>Book inspection-first <strong>{service}</strong> visits—clear estimates before heavy rewiring in <strong>{metro}</strong>.</p>',
      ctaLabel: 'Book electrical help',
    },
  },
  plumber: {
    serviceCards: [
      {
        title: 'Leak & choke visits',
        description: '<p>Kitchen sink, bathroom traps, and concealed leak triage with moisture-safe first steps in <strong>{location}</strong>.</p>',
        price: 'From ₹199',
        rating: '4.7+',
        duration: '45–90 min',
        warranty: 'As per policy',
        bookUrl: '{origin}/book',
      },
      {
        title: 'Motor / tank / pressure issues',
        description: '<p>Pressure checks, foot valve, and pump health—ideal for {metro} low-rise and mid-rise homes.</p>',
        price: 'Quoted after inspection',
        rating: '4.7+',
        duration: '60–120 min',
        warranty: 'Parts on invoice',
        bookUrl: '{origin}/book',
      },
      {
        title: 'Bath fittings & mixers',
        description: '<p>Cartridge swaps, silencing hammer noise, and safe shutoff sequencing before work.</p>',
        price: 'Visit + labour',
        rating: '4.8+',
        duration: '45–75 min',
        warranty: 'Manufacturer parts only when supplied',
        bookUrl: '{localUrl}',
      },
    ],
    serviceTypes: [
      {
        title: 'Chokes & drain lines',
        description: '<p>Mechanical snaking where applicable; chemical use only when safe for your pipes.</p>',
        bullets: ['Kitchen', 'Bathroom', 'Balcony drain'],
      },
      {
        title: 'Installations',
        description: '<p>WC, geysers, and kitchen sink sets—alignment, level, and leak test before handover.</p>',
        bullets: ['Silicone finishing', 'Pressure test', 'Drip watch window'],
      },
    ],
    trustBenefits: [
      {
        heading: 'Water-safe work habits',
        body: '<p>Shoe covers, area protection, and controlled shutoff sequence—important for apartments in <strong>{locShort}</strong>.</p>',
      },
      {
        heading: 'Clear leak diagnosis',
        body: '<p>We separate gasket issues from concealed line failures so you do not pay for the wrong fix.</p>',
      },
      {
        heading: 'Parts with invoices',
        body: '<p>Major cartridges, pumps, and geysers are quoted with MRP references where available.</p>',
      },
    ],
    waysHeading: 'Better plumbing outcomes in four steps',
    waysBullets: [
      'Photo of leak + wide context shot',
      'Mention main shutoff location if known',
      'Society water window / timings',
      'Approve concealed chase scope before cutting',
    ],
    experienceIncluded: ['Leak-first triage', 'Pressure tests on installs', 'Digital invoice', 'Rebook support'],
    areasCopy: '<p><strong>{service}</strong> across <strong>{location}</strong>—dense lanes in <strong>{metro}</strong> may need extra ETA buffer; pin accurately.</p>',
    areasList: ['{locShort}', 'Neighbouring sectors', '{metro}'],
    areasCta: 'Book a plumber',
    bookingSteps: [
      { stepNumber: '1', title: 'Describe leak / choke', description: '<p>Photos speed dispatch to {location}.</p>' },
      { stepNumber: '2', title: 'Slot', description: '<p>Pick time; confirm society water hours if relevant.</p>' },
      { stepNumber: '3', title: 'Visit', description: '<p>Quote before major parts or concealed work.</p>' },
      { stepNumber: '4', title: 'Invoice', description: '<p>Digital receipt for warranty.</p>' },
    ],
    pricingIncluded: ['Labour on booked service', 'Basic seal tape / thread where included in SKU'],
    pricingExcluded: ['Major cartridges unless quoted', 'Geyser tanks beyond scope', 'Hidden civil'],
    comparisonRows: [
      { label: 'Leak diagnosis', profixer: 'Triage before parts swap', others: 'Trial-and-error swaps' },
      { label: 'Mess control', profixer: 'Area protection default', others: 'Varies' },
    ],
    spareParts: [
      { name: 'Kitchen sink bottle trap', priceRange: 'Quoted' },
      { name: 'Common mixer cartridges', priceRange: 'MRP + labour' },
    ],
    introLeadMagnetLabel: 'Plumbing maintenance tips',
    introLeadMagnetUrl: '{catalogUrl}',
    leadMagnet: {
      headline: 'Stop small leaks before they stain walls',
      description: '<p>Book <strong>{service}</strong> in <strong>{location}</strong>—partners carry common traps and seals for faster fixes.</p>',
      ctaLabel: 'Book plumbing',
    },
  },
  cleaning: {
    serviceCards: [
      {
        title: 'Deep home cleaning',
        description: '<p>2–3 member team, checklist-driven corners, and safe detergents for <strong>{location}</strong> apartments.</p>',
        price: 'From ₹1,999',
        rating: '4.8+',
        duration: '3–6 hrs',
        warranty: 'Re-clean window on selected SKUs',
        bookUrl: '{origin}/book',
      },
      {
        title: 'Move-in / move-out',
        description: '<p>Cupboards, balconies, and bathrooms—photo baseline for handover disputes in {metro} rentals.</p>',
        price: 'On survey',
        rating: '4.7+',
        duration: '4–8 hrs',
        warranty: 'Scope sheet',
        bookUrl: '{origin}/book',
      },
      {
        title: 'Kitchen degrease',
        description: '<p>Hood filters, backsplash, and sticky cabinets—ventilation-friendly sequence.</p>',
        price: 'Add-on or package',
        rating: '4.8+',
        duration: '2–4 hrs',
        warranty: 'As per SKU',
        bookUrl: '{localUrl}',
      },
    ],
    serviceTypes: [
      {
        title: 'Bathroom & tiles',
        description: '<p>Grout brush-down, acid-safe treatments only where approved for your tile type.</p>',
        bullets: ['Hard water rings', 'Glass & chrome', 'Exhaust fan face'],
      },
      {
        title: 'Living & bedrooms',
        description: '<p>Dust ladders from top fixtures; microfiber sequence for floors in {locShort} dust conditions.</p>',
        bullets: ['Fans', 'Skirting', 'Windows reachable on ladder policy'],
      },
    ],
    trustBenefits: [
      {
        heading: 'Checklist + supervision',
        body: '<p>Team lead signs off rooms so nothing is “almost done”—important for rental handovers in <strong>{metro}</strong>.</p>',
      },
      {
        heading: 'Safe chemistry',
        body: '<p>We avoid mixing unknown acids on marble/granite; test patches on sensitive stones in <strong>{location}</strong>.</p>',
      },
      {
        heading: 'Punctual windows',
        body: '<p>Society gate delays happen—narrow arrival slots get buffer notes in booking.</p>',
      },
    ],
    waysHeading: 'Get the most from a cleaning visit',
    waysBullets: ['Declutter surfaces before arrival', 'Hot water access if booked', 'Pets secured', 'Valuables stowed'],
    experienceIncluded: ['Team with supervisor', 'Mop + cloths carried', 'Photos on request', 'Digital invoice'],
    areasCopy: '<p><strong>{service}</strong> slots in <strong>{location}</strong>—evening and weekend demand is high in <strong>{metro}</strong>; book early.</p>',
    areasList: ['{locShort}', 'Nearby complexes', '{metro}'],
    areasCta: 'Book cleaning',
    bookingSteps: [
      { stepNumber: '1', title: 'Choose home size', description: '<p>BHK + bathrooms drive team size for {location}.</p>' },
      { stepNumber: '2', title: 'Pick slot', description: '<p>Gate pass notes if applicable.</p>' },
      { stepNumber: '3', title: 'Service', description: '<p>Checklist walkthrough; highlight fragile zones.</p>' },
      { stepNumber: '4', title: 'Sign-off', description: '<p>Room-by-room approval; digital invoice.</p>' },
    ],
    pricingIncluded: ['Team labour hours booked', 'Standard equipment carry'],
    pricingExcluded: ['Outside windows beyond policy height', 'Bleach on unknown fabrics', 'Pest control'],
    comparisonRows: [
      { label: 'Checklist', profixer: 'Room sign-off', others: 'Informal' },
      { label: 'Chemistry', profixer: 'Stone-safe defaults', others: 'Generic acids' },
    ],
    spareParts: [{ name: 'Consumables kit (on SKU)', priceRange: 'Included / quoted' }],
    introLeadMagnetLabel: 'Cleaning prep checklist',
    introLeadMagnetUrl: '{catalogUrl}',
    leadMagnet: {
      headline: 'Deep clean weekend slots fill fast',
      description: '<p>Lock <strong>{service}</strong> in <strong>{locShort}</strong>—teams carry standard kits for typical {metro} apartments.</p>',
      ctaLabel: 'Book cleaning',
    },
  },
  carpenter: {
    serviceCards: [
      {
        title: 'Furniture repair & alignment',
        description: '<p>Door sag, hinge swaps, and wardrobe alignment—measure twice for rentals in <strong>{location}</strong>.</p>',
        price: 'From ₹249',
        rating: '4.7+',
        duration: '60–120 min',
        warranty: 'Labour policy',
        bookUrl: '{origin}/book',
      },
      {
        title: 'Shelf / bracket installs',
        description: '<p>Wall-type detection and correct anchors for AAC / brick in {metro} towers.</p>',
        price: 'Per item on quote',
        rating: '4.7+',
        duration: '30–90 min',
        warranty: 'Fixings quoted',
        bookUrl: '{origin}/book',
      },
      {
        title: 'On-site assembly',
        description: '<p>Flat-pack wardrobes and beds—sequence for tight service lifts in {locShort}.</p>',
        price: 'BHK-based',
        rating: '4.8+',
        duration: '1–4 hrs',
        warranty: 'As per SKU',
        bookUrl: '{localUrl}',
      },
    ],
    serviceTypes: [
      {
        title: 'Kitchen modules',
        description: '<p>Soft-close hinges, channel noise, and handle swaps—without cabinet tear-out unless scoped.</p>',
        bullets: ['Hinge packs', 'Handles', 'Minor realign'],
      },
      {
        title: 'Doors & locks',
        description: '<p>Latch misalignment, peephole height, and basic mortise help—escalate high-security locks to brand service.</p>',
        bullets: ['Mortise basics', 'Tower door shave (dust-controlled)', 'Stopper installs'],
      },
    ],
    trustBenefits: [
      {
        heading: 'Dust-controlled cuts',
        body: '<p>Vacuum-assisted cuts where possible; sheet protection for occupied homes in <strong>{location}</strong>.</p>',
      },
      {
        heading: 'Anchor discipline',
        body: '<p>Wrong anchors on hollow AAC are a safety issue—we probe and choose fixings for your wall type in <strong>{metro}</strong>.</p>',
      },
      {
        heading: 'Scope before sawdust',
        body: '<p>Written confirmation before irreversible trims on expensive laminates.</p>',
      },
    ],
    waysHeading: 'Smoother carpentry visits',
    waysBullets: ['Wall photos if unsure of type', 'Clear floor path to work area', 'Keep pets away from tools', 'Approve trims before cutting'],
    experienceIncluded: ['Measuring tape & levels', 'Invoice with item notes', 'Support for revisit alignment'],
    areasCopy: '<p><strong>{service}</strong> visits across <strong>{location}</strong>—lift dimensions matter for long panels in <strong>{metro}</strong> high-rises.</p>',
    areasList: ['{locShort}', 'Nearby wards', '{metro}'],
    areasCta: 'Book a carpenter',
    bookingSteps: [
      { stepNumber: '1', title: 'Describe job', description: '<p>Photos + dimensions for {location}.</p>' },
      { stepNumber: '2', title: 'Materials', description: '<p>Confirm who supplies wood/screw packs.</p>' },
      { stepNumber: '3', title: 'Visit', description: '<p>Measure, quote, execute per approval.</p>' },
      { stepNumber: '4', title: 'Finish', description: '<p>Vacuum pass; digital invoice.</p>' },
    ],
    pricingIncluded: ['Labour on booked items', 'Standard fasteners where in SKU'],
    pricingExcluded: ['Imported hardware', 'Paint touch-ups', 'Full modular redesign'],
    comparisonRows: [
      { label: 'Wall safety', profixer: 'Anchor choice by probe', others: 'One-size anchors' },
    ],
    spareParts: [{ name: 'Hinge / hydraulic packs', priceRange: 'Quoted' }],
    introLeadMagnetLabel: 'Measure-before-drill guide',
    introLeadMagnetUrl: '{catalogUrl}',
    leadMagnet: {
      headline: 'Furniture fixes without guesswork',
      description: '<p>Book <strong>{service}</strong> in <strong>{locShort}</strong> for hinge, shelf, and alignment jobs.</p>',
      ctaLabel: 'Book carpenter',
    },
  },
  painter: {
    serviceCards: [
      {
        title: 'Rental refresh package',
        description: '<p>1–2 coat refresh on approved surfaces—shade cards for {metro} lighting conditions.</p>',
        price: 'Per sq ft on quote',
        rating: '4.7+',
        duration: '1–3 days',
        warranty: 'Touch-up window as per SKU',
        bookUrl: '{origin}/book',
      },
      {
        title: 'Waterproofing consult',
        description: '<p>Bathroom seepage triage—where to break vs where to surface treat first in {location}.</p>',
        price: 'Visit + report',
        rating: '4.6+',
        duration: '60–90 min',
        warranty: 'Scope document',
        bookUrl: '{origin}/book',
      },
      {
        title: 'Wood polish / touch-ups',
        description: '<p>Door frames and furniture—solvent-aware sequencing for occupied homes.</p>',
        price: 'Itemised',
        rating: '4.7+',
        duration: 'Varies',
        warranty: 'As quoted',
        bookUrl: '{localUrl}',
      },
    ],
    serviceTypes: [
      {
        title: 'Interior emulsion',
        description: '<p>Primer sequence for alkaline walls common in <strong>{locShort}</strong> new towers.</p>',
        bullets: ['Low-VOC options where stocked', 'Edge masking discipline', 'Drying time guidance'],
      },
      {
        title: 'Enamel & metal',
        description: '<p>Grills and MS—rust passivation before topcoat where scoped.</p>',
        bullets: ['Sanding levels', 'Anti-rust primer', 'Finish gloss levels'],
      },
    ],
    trustBenefits: [
      {
        heading: 'Shade discipline',
        body: '<p>Lit swatches on your wall plane—not just the store strip—before locking litres for <strong>{location}</strong>.</p>',
      },
      {
        heading: 'Masking quality',
        body: '<p>AC vents, wardrobes, and floors protected; dust doors for occupied homes in <strong>{metro}</strong>.</p>',
      },
      {
        heading: 'Quantities on paper',
        body: '<p>Approximate litres + roller/pad counts before billing to reduce mid-job surprises.</p>',
      },
    ],
    waysHeading: 'Cleaner paint outcomes',
    waysBullets: ['Share north-light photos of wall', 'Confirm furniture move scope', 'Pets off wet rooms 24h', 'Ventilation plan for monsoon'],
    experienceIncluded: ['Site masking', 'Liters planned with buffer %', 'Touch-up list at handover'],
    areasCopy: '<p><strong>{service}</strong> crews in <strong>{location}</strong>—monsoon recoat windows are tighter in <strong>{metro}</strong>; plan dates accordingly.</p>',
    areasList: ['{locShort}', 'Suburbs on request', '{metro}'],
    areasCta: 'Get a painting estimate',
    bookingSteps: [
      { stepNumber: '1', title: 'Site pics', description: '<p>All planes + cracks for {location}.</p>' },
      { stepNumber: '2', title: 'Shade shortlist', description: '<p>2–3 finalists on wall.</p>' },
      { stepNumber: '3', title: 'Execution', description: '<p>Primer + coats per ladder policy.</p>' },
      { stepNumber: '4', title: 'Snag list', description: '<p>Touch-ups; digital invoice.</p>' },
    ],
    pricingIncluded: ['Masking labour in package', 'Standard emulsion rolls where included'],
    pricingExcluded: ['POP / civil', 'Texture beyond SKU', 'Scaffolding beyond policy'],
    comparisonRows: [{ label: 'Liters planning', profixer: 'Written approx', others: 'Often ad hoc' }],
    spareParts: [{ name: 'Primer / putty buckets', priceRange: 'MRP on invoice' }],
    introLeadMagnetLabel: 'Shade shortlist template',
    introLeadMagnetUrl: '{catalogUrl}',
    leadMagnet: {
      headline: 'Repaint without shade regret',
      description: '<p>Book <strong>{service}</strong> consult in <strong>{locShort}</strong> before monsoon interiors peak.</p>',
      ctaLabel: 'Book painting',
    },
  },
  'appliance-repair': {
    serviceCards: [
      {
        title: 'Washing machine diagnosis',
        description: '<p>Drain errors, drum noise, and inlet issues—error code capture speeds parts for <strong>{location}</strong>.</p>',
        price: 'Visit on quote',
        rating: '4.7+',
        duration: '45–90 min',
        warranty: 'Labour as per policy',
        bookUrl: '{origin}/book',
      },
      {
        title: 'Refrigerator cooling',
        description: '<p>Gas pressure suspects, fan faults, and thermostat checks—food safety first in {metro} heat.</p>',
        price: 'Inspection + quote',
        rating: '4.7+',
        duration: '60–120 min',
        warranty: 'Parts separate',
        bookUrl: '{origin}/book',
      },
      {
        title: 'Microwave / oven basics',
        description: '<p>Fuse, interlock, and magnetron triage where SKU allows on-site work.</p>',
        price: 'Model dependent',
        rating: '4.6+',
        duration: '30–75 min',
        warranty: 'Brand policy',
        bookUrl: '{localUrl}',
      },
    ],
    serviceTypes: [
      {
        title: 'Front-load washers',
        description: '<p>Bearing noise vs foreign object—disassembly only after approval in {locShort} apartments.</p>',
        bullets: ['Shock checks', 'Filter clean', 'Inlet screens'],
      },
      {
        title: 'Direct cool fridges',
        description: '<p>Defrost cycles, thermostat, and door seal checks before gas work.</p>',
        bullets: ['Vacuum interval advice', 'Leveling', 'Ventilation gap check'],
      },
    ],
    trustBenefits: [
      {
        heading: 'Model-aware visits',
        body: '<p>Partners ask for model sticker photos up front to reduce repeat visits across <strong>{metro}</strong>.</p>',
      },
      {
        heading: 'Parts transparency',
        body: '<p>OEM-preferred where available; compatible options explained in writing for <strong>{location}</strong> jobs.</p>',
      },
      {
        heading: 'Water-safe washer work',
        body: '<p>Inlet hoses checked; slow leaks caught before they flood utility areas.</p>',
      },
    ],
    waysHeading: 'Faster appliance fixes',
    waysBullets: ['Model + error code in booking', 'Clear path to utility area', 'Power socket reachable', 'Pets away from open panels'],
    experienceIncluded: ['Test report before reassembly', 'Digital invoice', 'Revisit window on labour'],
    areasCopy: '<p><strong>{service}</strong> across <strong>{location}</strong>—carry-in paths in <strong>{metro}</strong> towers affect slot length; mention service lift rules.</p>',
    areasList: ['{locShort}', 'Nearby pin codes', '{metro}'],
    areasCta: 'Book appliance repair',
    bookingSteps: [
      { stepNumber: '1', title: 'Model + fault', description: '<p>Sticker photo for {location} booking.</p>' },
      { stepNumber: '2', title: 'Slot', description: '<p>Choose time; confirm water tap access.</p>' },
      { stepNumber: '3', title: 'Diagnose', description: '<p>Quote before expensive modules.</p>' },
      { stepNumber: '4', title: 'Test & invoice', description: '<p>Cycle test; digital receipt.</p>' },
    ],
    pricingIncluded: ['Diagnosis labour on package', 'Basic inlet clean where in SKU'],
    pricingExcluded: ['Compressor swaps unless quoted', 'Refrigerant beyond grams', 'Imported boards'],
    comparisonRows: [{ label: 'Error codes', profixer: 'Asked before dispatch', others: 'Sometimes missed' }],
    spareParts: [{ name: 'Inlet hose / filter kits', priceRange: 'Quoted' }],
    introLeadMagnetLabel: 'Appliance error-code cheatsheet',
    introLeadMagnetUrl: '{catalogUrl}',
    leadMagnet: {
      headline: 'Washer or fridge acting up in {locShort}?',
      description: '<p>Book <strong>{service}</strong> diagnostics—fewer repeat visits when model data is shared early.</p>',
      ctaLabel: 'Book repair',
    },
  },
  'home-repair': {
    serviceCards: [
      {
        title: 'Handyman visit',
        description: '<p>Small fixes bundle—hinges, hooks, and minor siliconing for <strong>{location}</strong> homes.</p>',
        price: 'From ₹299',
        rating: '4.7+',
        duration: '60–120 min',
        warranty: 'Labour policy',
        bookUrl: '{origin}/book',
      },
      {
        title: 'Wall hang / TV mount',
        description: '<p>Stud / anchor selection for your wall type in {metro} towers.</p>',
        price: 'Per bracket quote',
        rating: '4.7+',
        duration: '45–90 min',
        warranty: 'Mount brand limits',
        bookUrl: '{origin}/book',
      },
      {
        title: 'Silicone & grout touch',
        description: '<p>Kitchen/bath renewals without full retiling—colour match expectations set upfront.</p>',
        price: 'Visit + labour',
        rating: '4.6+',
        duration: '45–120 min',
        warranty: 'As quoted',
        bookUrl: '{localUrl}',
      },
    ],
    serviceTypes: [
      {
        title: 'Minor civil',
        description: '<p>Nail pops, small cracks—cosmetic passes, not structural certification.</p>',
        bullets: ['Crack V-groove', 'Skim patch', 'Paint match disclaimer'],
      },
      {
        title: 'Hardware fixes',
        description: '<p>Handles, channels, and loose fixtures—tighten sequences that last in {locShort} humidity.</p>',
        bullets: ['Corrosion pass', 'Threadlocker where apt', 'Torque discipline'],
      },
    ],
    trustBenefits: [
      {
        heading: 'Honest scope',
        body: '<p>If a fix needs a specialist (wet seepage source, structural crack), we say so before charging for the wrong trade in <strong>{location}</strong>.</p>',
      },
      {
        heading: 'Multi-small-job bundling',
        body: '<p>List tasks in booking so the partner brings the right bits for <strong>{metro}</strong> one-trip efficiency.</p>',
      },
      {
        heading: 'Neat close-out',
        body: '<p>Vacuum + wipe down after drilling; important in furnished rentals.</p>',
      },
    ],
    waysHeading: 'Handyman visits that finish the list',
    waysBullets: ['Bullet list of tasks in booking', 'Photos of wall type', 'Ladder policy of society', 'Approve silicone colour'],
    experienceIncluded: ['Multi-task routing', 'Invoice with line items', 'Support for missed items'],
    areasCopy: '<p><strong>{service}</strong> coverage in <strong>{location}</strong>—bundle small jobs to save on visit fees across <strong>{metro}</strong>.</p>',
    areasList: ['{locShort}', 'Nearby sectors', '{metro}'],
    areasCta: 'Book handyman',
    bookingSteps: [
      { stepNumber: '1', title: 'Task list', description: '<p>Prioritise for {location}.</p>' },
      { stepNumber: '2', title: 'Slot', description: '<p>Book enough time for count of jobs.</p>' },
      { stepNumber: '3', title: 'Visit', description: '<p>Quote odd materials.</p>' },
      { stepNumber: '4', title: 'Done', description: '<p>Walkthrough; invoice.</p>' },
    ],
    pricingIncluded: ['First N tasks per SKU', 'Basic fasteners'],
    pricingExcluded: ['Specialist trades', 'Large material runs', 'Height beyond ladder policy'],
    comparisonRows: [{ label: 'Bundling', profixer: 'Encouraged in notes', others: 'Single-task only' }],
    spareParts: [{ name: 'Anchor / screw assortment', priceRange: '₹–₹₹ on usage' }],
    introLeadMagnetLabel: 'Handyman job list PDF',
    introLeadMagnetUrl: '{catalogUrl}',
    leadMagnet: {
      headline: 'One visit, many niggles fixed',
      description: '<p>Book <strong>{service}</strong> in <strong>{locShort}</strong>—clear task lists reduce return trips.</p>',
      ctaLabel: 'Book home repair',
    },
  },
  default: {
    serviceCards: [
      {
        title: 'Standard visit',
        description: '<p>Inspection-first <strong>{service}</strong> visit in <strong>{location}</strong>—clear scope before material-heavy work.</p>',
        price: 'From ₹199',
        rating: '4.7+',
        duration: '45–90 min',
        warranty: 'As per policy',
        bookUrl: '{origin}/book',
      },
      {
        title: 'Planned maintenance',
        description: '<p>Checklist jobs for homes in <strong>{metro}</strong>—ideal before festivals or season peaks.</p>',
        price: 'Package on quote',
        rating: '4.7+',
        duration: '1–3 hrs',
        warranty: 'SKU-based',
        bookUrl: '{origin}/book',
      },
      {
        title: 'Urgent help',
        description: '<p>Same-day subject to partner density near <strong>{locShort}</strong>; photos in booking improve dispatch.</p>',
        price: 'Surge as per product',
        rating: '4.6+',
        duration: 'Varies',
        warranty: 'See live terms',
        bookUrl: '{localUrl}',
      },
    ],
    serviceTypes: [
      {
        title: 'What we typically cover',
        description: '<p>Common SKUs for <strong>{service}</strong> in <strong>{location}</strong>—edit bullets to match your catalogue.</p>',
        bullets: ['Visit + diagnosis', 'Standard labour packages', 'Parts with invoice'],
      },
      {
        title: 'When we escalate',
        description: '<p>Out-of-trade or unsafe conditions—clear referral or pause instead of risky improvisation.</p>',
        bullets: ['Structural unknowns', 'Permit-only work', 'Brand-authorised-only repairs'],
      },
    ],
    trustBenefits: [
      {
        heading: 'Transparent estimates',
        body: '<p>Written scope before big spends—especially for first-time bookings in <strong>{location}</strong>.</p>',
      },
      {
        heading: 'Verified partners',
        body: '<p>Onboarding checks and behaviour standards for visits across <strong>{metro}</strong>.</p>',
      },
      {
        heading: 'Digital records',
        body: '<p>Invoices and job context stored for warranty and rebook flows.</p>',
      },
    ],
    waysHeading: 'Four habits that speed up home service visits',
    waysBullets: [
      'Photos + exact tower/wing in booking',
      'Society gate rules noted up front',
      'Clear the work area before arrival',
      'Approve scope changes before add-ons',
    ],
    experienceIncluded: [
      'Trained partners for booked SKUs',
      'Digital invoice',
      'Support for post-visit questions',
      'Rebook flows with context',
    ],
    areasCopy:
      '<p>We aim to serve <strong>{location}</strong> and nearby areas in <strong>{metro}</strong>—edge pincodes may need ETA confirmation at booking.</p>',
    areasList: ['{locShort}', 'Neighbouring areas (edit)', '{metro}'],
    areasCta: 'Check availability for your pincode',
    bookingSteps: [
      { stepNumber: '1', title: 'Choose service', description: '<p>Select SKU, add photos, and confirm <strong>{location}</strong> address.</p>' },
      { stepNumber: '2', title: 'Pick a slot', description: '<p>Live availability where enabled in the product.</p>' },
      { stepNumber: '3', title: 'Partner visit', description: '<p>Inspection-first quote; approvals before major work.</p>' },
      { stepNumber: '4', title: 'Pay & invoice', description: '<p>Digital receipt; keep for warranty queries.</p>' },
    ],
    pricingIncluded: ['Labour on booked package', 'Basic consumables where part of SKU'],
    pricingExcluded: ['Parts not in package', 'Concealed / exploratory opens', 'Third-party fees'],
    comparisonRows: [
      { label: 'Scope clarity', profixer: 'Written before big spends', others: 'Often verbal' },
      { label: 'Rebook', profixer: 'Context carried on ID', others: 'Re-explains from zero' },
      { label: 'Payments', profixer: 'Digital-first', others: 'Cash variance' },
    ],
    spareParts: [
      { name: 'Common consumables kit', priceRange: 'As per SKU' },
      { name: 'Fasteners / sealant', priceRange: 'Usage on invoice' },
    ],
    introLeadMagnetLabel: 'Browse all {service} options',
    introLeadMagnetUrl: '{catalogUrl}',
    leadMagnet: {
      headline: 'Book {service} in {locShort} with confidence',
      description: '<p>Transparent estimates, verified partners, and digital invoices across <strong>{metro}</strong>.</p>',
      ctaLabel: 'Book now',
    },
  },
}

function mapServiceTypes(rows: VerticalProfile['serviceTypes'], c: VerticalPrefillContext): ServiceTypeBlock[] {
  return rows.map((r) => ({
    title: ix(r.title, c),
    description: ix(r.description, c),
    bullets: r.bullets?.length ? r.bullets.map((b) => ix(b, c)) : [''],
  }))
}

/** Optional locality-guide H2 blocks (prepended to base autofill sections). */
export function getVerticalExtraLocalityGuideSections(ctx: VerticalPrefillContext): LocalityGuideSectionBlock[] {
  const key = resolveMarketingVerticalKey(ctx.industrySlug)
  const profile = VERTICAL_MARKETING_PROFILES[key] ?? VERTICAL_MARKETING_PROFILES.default
  return (profile.extraLocalitySections ?? []).map((sec) => ({
    h2: ix(sec.h2, ctx),
    paragraphs: sec.paragraphs.map((p) => ix(p, ctx)),
  }))
}

/** Prefill for Service cards, Detailed options, Trust, Areas & booking, Pricing, Hero lead magnet, Closing CTA. */
export function buildVerticalTabsPrefill(ctx: VerticalPrefillContext): Partial<CategoryMarketingConfig> {
  const key = resolveMarketingVerticalKey(ctx.industrySlug)
  const profile = VERTICAL_MARKETING_PROFILES[key] ?? VERTICAL_MARKETING_PROFILES.default

  const serviceCards: ServiceCardBlock[] = profile.serviceCards.map((card) => ({
    title: ix(card.title, ctx),
    description: ix(card.description, ctx),
    price: ix(card.price, ctx),
    rating: ix(card.rating, ctx),
    duration: ix(card.duration, ctx),
    warranty: ix(card.warranty, ctx),
    bookUrl: ix(card.bookUrl, ctx),
  }))

  const trustBenefits: TrustBenefitBlock[] = profile.trustBenefits.map((t) => ({
    heading: ix(t.heading, ctx),
    body: ix(t.body, ctx),
  }))

  const bookingSteps: BookingStepBlock[] = profile.bookingSteps.map((b) => ({
    stepNumber: ix(b.stepNumber, ctx),
    title: ix(b.title, ctx),
    description: ix(b.description, ctx),
  }))

  const comparisonRows: ComparisonRow[] = profile.comparisonRows.map((r) => ({
    label: ix(r.label, ctx),
    profixer: ix(r.profixer, ctx),
    others: ix(r.others, ctx),
  }))

  const spareParts: SparePartRow[] = profile.spareParts.map((s) => ({
    name: ix(s.name, ctx),
    priceRange: ix(s.priceRange, ctx),
  }))

  const lm = profile.leadMagnet
  const leadMagnet: LeadMagnetBlock = {
    headline: ix(lm.headline, ctx),
    description: ix(lm.description, ctx),
    ctaLabel: ix(lm.ctaLabel, ctx),
  }

  const out: Partial<CategoryMarketingConfig> = {
    serviceCards,
    serviceTypes: mapServiceTypes(profile.serviceTypes, ctx),
    trustBenefits,
    waysHeading: ix(profile.waysHeading, ctx),
    waysBullets: profile.waysBullets.map((b) => ix(b, ctx)),
    experienceIncluded: profile.experienceIncluded.map((e) => ix(e, ctx)),
    areasCopy: ix(profile.areasCopy, ctx),
    areasList: profile.areasList.map((a) => ix(a, ctx)),
    areasCta: ix(profile.areasCta, ctx),
    bookingSteps,
    pricingIncluded: profile.pricingIncluded.map((p) => ix(p, ctx)),
    pricingExcluded: profile.pricingExcluded.map((p) => ix(p, ctx)),
    comparisonRows,
    spareParts,
    introLeadMagnetLabel: ix(profile.introLeadMagnetLabel, ctx),
    introLeadMagnetUrl: ix(profile.introLeadMagnetUrl, ctx),
    leadMagnet,
  }

  return out
}
