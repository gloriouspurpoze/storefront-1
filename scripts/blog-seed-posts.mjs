/**
 * Example blog payloads aligned with BlogPostCreatePayload / CMS admin API.
 * HTML is Quill-compatible (headings, lists, links, paragraphs).
 */

/** Stable Unsplash URLs (format & crop for OG-style thumbnails). */
const IMG = {
  home: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&h=630&q=80',
  plumbing: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1200&h=630&q=80',
  hvac: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&h=630&q=80',
}

export const exampleBlogSeeds = [
  {
    title: 'The Complete Home Maintenance Checklist Every Homeowner Should Follow',
    slug: 'seed-home-maintenance-checklist',
    excerpt:
      'A practical, season-by-season checklist to protect your investment, avoid costly repairs, and keep your home running smoothly year-round.',
    content: `
<h2>Why a maintenance rhythm matters</h2>
<p>Small issues compound when they are ignored. A predictable <strong>home maintenance</strong> rhythm helps you catch problems early, preserve resale value, and avoid emergency call-outs. Use this guide as a starting point and adapt it to your climate and home type.</p>

<h2>Monthly tasks</h2>
<ul>
<li>Test smoke and carbon monoxide detectors; replace batteries if needed.</li>
<li>Inspect HVAC filters; clean or replace per manufacturer guidance.</li>
<li>Check under sinks and around appliances for moisture or leaks.</li>
<li>Clear debris from exterior drains and window wells.</li>
</ul>

<h2>Quarterly tasks</h2>
<h3>Plumbing and water</h3>
<p>Flush sediment from the water heater per manual instructions, and inspect visible pipes for corrosion or damp spots. If you notice persistent dampness, document it with photos before calling a professional.</p>

<h3>Exterior and roof</h3>
<p>Walk the perimeter to look for cracked caulk, peeling paint, and loose siding. Binoculars can help you spot missing or lifted shingles without climbing a ladder.</p>

<h2>Seasonal deep dives</h2>
<p>Before winter, disconnect hoses, insulate exposed pipes in unheated areas, and verify heating system performance. Before summer, service cooling equipment and ensure attic ventilation is unobstructed.</p>

<h2>When to call a pro</h2>
<p>Electrical panel work, gas lines, major roof repairs, and structural concerns are not DIY projects for most homeowners. When safety or code compliance is in question, hire a licensed professional.</p>

<p>For more on prioritizing repairs, see our <a href="/blog/seed-when-to-hire-a-plumber">guide to hiring a plumber</a> and seasonal <a href="/blog/seed-hvac-seasonal-care">HVAC care tips</a>.</p>
`.trim(),
    tags: ['maintenance', 'homeowner', 'checklist', 'seasonal'],
    status: 'published',
    isFeatured: true,
    allowComments: true,
    featuredImage: IMG.home,
    seo: {
      title: 'Home Maintenance Checklist for Homeowners (Seasonal Guide)',
      description:
        'Monthly, quarterly, and seasonal home maintenance checklist: HVAC, plumbing, roof, and safety tasks to protect your home and budget.',
      keywords: ['home maintenance', 'homeowner checklist', 'seasonal maintenance'],
      ogImage: IMG.home,
    },
  },
  {
    title: 'When to Hire a Professional Plumber (and When a Simple Fix Is Enough)',
    slug: 'seed-when-to-hire-a-plumber',
    excerpt:
      'Learn the warning signs that mean you should stop DIY and call a licensed plumber—plus quick fixes that are usually safe for homeowners.',
    content: `
<h2>Signs you should call a plumber</h2>
<p>Some problems escalate quickly. If you see any of the following, prioritize a licensed <strong>plumber</strong>:</p>
<ul>
<li>Sewage odors indoors or water backing up in multiple drains.</li>
<li>No water pressure change across the whole house.</li>
<li>Bulging walls or ceilings with active dripping.</li>
<li>Gas smell near water heaters or other gas appliances (call emergency services first).</li>
</ul>

<h2>Usually safe homeowner tasks</h2>
<h3>Clogs and fixtures</h3>
<p>A plunger or drain snake on a single slow sink is often reasonable. Avoid chemical drain cleaners on old galvanized pipes; they can accelerate corrosion.</p>

<h3>Supply lines and toilets</h3>
<p>Replacing a flapper or fill valve, or tightening a loose supply line with the water off, is within reach for many people—provided you know where the shutoff is and test for leaks afterward.</p>

<h2>Protecting your home</h2>
<p>Know the location of your main water shutoff. In winter, keep cabinet doors open during freezes and maintain heat in basements where pipes run along exterior walls.</p>

<p>Pair plumbing care with our broader <a href="/blog/seed-home-maintenance-checklist">home maintenance checklist</a> for a full-house approach.</p>
`.trim(),
    tags: ['plumbing', 'diy', 'home repair', 'safety'],
    status: 'published',
    isFeatured: false,
    allowComments: true,
    featuredImage: IMG.plumbing,
    seo: {
      title: 'When to Hire a Plumber vs DIY Fixes',
      description:
        'Warning signs that require a professional plumber, safe DIY fixes for clogs and toilets, and how to protect pipes in cold weather.',
      keywords: ['hire a plumber', 'plumbing DIY', 'drain clog'],
      ogImage: IMG.plumbing,
    },
  },
  {
    title: 'Seasonal HVAC Care: Simple Habits for Better Comfort and Lower Bills',
    slug: 'seed-hvac-seasonal-care',
    excerpt:
      'Filter swaps, thermostat habits, and professional tune-ups—what to do each season so your heating and cooling system lasts longer.',
    content: `
<h2>Foundations of efficient HVAC</h2>
<p>Your <strong>HVAC</strong> system moves a lot of air. Restricted airflow and ignored maintenance drive up energy bills and shorten equipment life. A few habits make an outsized difference.</p>

<h2>Spring and summer</h2>
<ul>
<li>Replace or clean filters on the schedule your equipment manual recommends.</li>
<li>Keep outdoor condenser coils clear of leaves and debris (power off first).</li>
<li>Verify thermostat schedules match occupancy; small setbacks add up.</li>
</ul>

<h2>Fall and winter</h2>
<h3>Heating prep</h3>
<p>Test heating before the first cold snap. Listen for unusual noises, check that registers are open and unblocked, and consider a professional inspection if the system is more than ten years old.</p>

<h3>Air quality</h3>
<p>Humidity that is too low in winter can irritate sinuses; modest humidification may help if your climate is very dry—balance with ventilation to avoid condensation issues.</p>

<h2>Professional maintenance</h2>
<p>Annual tune-ups typically include safety checks, refrigerant verification (cooling), and burner inspection (heating). Keep records of service dates for warranty and resale documentation.</p>

<p>See our <a href="/blog/seed-home-maintenance-checklist">maintenance checklist</a> for tasks beyond HVAC.</p>
`.trim(),
    tags: ['hvac', 'energy savings', 'heating', 'cooling'],
    status: 'draft',
    isFeatured: false,
    allowComments: true,
    featuredImage: IMG.hvac,
    seo: {
      title: 'Seasonal HVAC Maintenance Tips for Homeowners',
      description:
        'Spring and fall HVAC habits: filters, condenser care, thermostat settings, and when to book professional tune-ups for comfort and savings.',
      keywords: ['HVAC maintenance', 'seasonal HVAC', 'lower energy bills'],
      ogImage: IMG.hvac,
    },
  },
]
