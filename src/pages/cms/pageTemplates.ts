/**
 * Industry-standard page templates for legal, policy, and marketing pages.
 * Content is HTML for use with the rich text editor.
 */

export interface PageTemplate {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
}

const REFUND_POLICY_CONTENT = `
<h2>1. Refund Eligibility</h2>
<p>We want you to be satisfied with your purchase. Refunds may be requested under the following conditions:</p>
<ul>
  <li>Request made within <strong>14 days</strong> of the transaction date</li>
  <li>Service not yet completed or partially completed as per agreement</li>
  <li>Cancellation in line with our cancellation policy</li>
</ul>

<h2>2. Non-Refundable Items</h2>
<p>The following are generally not eligible for refunds:</p>
<ul>
  <li>Services already fully completed</li>
  <li>Gift cards or promotional credits unless required by law</li>
  <li>Fees paid to third parties (e.g. payment processing)</li>
</ul>

<h2>3. How to Request a Refund</h2>
<p>To request a refund:</p>
<ol>
  <li>Contact our support team via the contact form or email provided on the website</li>
  <li>Include your order/booking reference and reason for the request</li>
  <li>We will respond within <strong>5 business days</strong> and process eligible refunds within 10 business days</li>
</ol>

<h2>4. Refund Method</h2>
<p>Refunds will be credited to the original payment method. Depending on your bank or card issuer, it may take 5–10 business days for the refund to appear on your statement.</p>

<h2>5. Partial Refunds</h2>
<p>In cases of partial service delivery or disputes, we may offer a partial refund. The amount will be determined based on the work completed and our fair use policy.</p>

<h2>6. Contact</h2>
<p>For refund requests or questions, contact us at the email or address listed in the Contact or footer section of this website.</p>
<p><em>Last updated: January 2025</em></p>
`.trim();

const COOKIE_POLICY_CONTENT = `
<h2>1. What Are Cookies</h2>
<p>Cookies are small text files stored on your device when you visit our website. They help us provide a better experience, remember your preferences, and understand how the site is used.</p>

<h2>2. How We Use Cookies</h2>
<p>We use cookies for: essential functionality, preferences, analytics, and (where applicable) marketing. You can manage or disable cookies via your browser settings.</p>

<h2>3. Types of Cookies</h2>
<p><strong>Strictly necessary</strong> – Site functionality and security. <strong>Functional</strong> – Preferences and language. <strong>Analytics</strong> – Usage statistics. Third-party cookies may be set by payment or analytics providers; their use is governed by their privacy policies.</p>

<h2>4. Managing Cookies</h2>
<p>You can control or delete cookies via your browser settings. Blocking certain cookies may affect site functionality.</p>
<p><em>Last updated: January 2025</em></p>
`.trim();

const TERMS_OF_SERVICE_CONTENT = `
<h2>1. Acceptance of Terms</h2>
<p>By accessing or using this website and our services, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>

<h2>2. Description of Services</h2>
<p>Fixer provides a marketplace for home services including plumbing, electrical, cleaning, repairs, and maintenance. We connect customers with verified service professionals. Services are subject to availability and may vary by location. We reserve the right to modify, suspend, or discontinue any service with reasonable notice where feasible.</p>

<h2>3. User Accounts and Conduct</h2>
<p>You are responsible for maintaining the confidentiality of your account and password. You agree to provide accurate information and to use the service only for lawful purposes. Prohibited conduct includes fraud, harassment, abuse, or violation of applicable laws.</p>

<h2>4. Bookings, Payments, and Cancellations</h2>
<p>Bookings are subject to availability and our booking policy. Payment terms are as displayed at checkout. Cancellation and refund terms are set out in our <a href="/refund-policy">Refund Policy</a>. We may charge cancellation fees where stated in the booking terms.</p>

<h2>5. Intellectual Property</h2>
<p>All content on this website (text, logos, images, design) is owned by us or our licensors and is protected by copyright and other intellectual property laws. You may not copy, modify, or distribute our content without written permission.</p>

<h2>6. Limitation of Liability</h2>
<p>To the fullest extent permitted by law, we are not liable for indirect, incidental, special, or consequential damages arising from your use of our services. Our total liability shall not exceed the amount you paid for the relevant service in the twelve months preceding the claim.</p>

<h2>7. Indemnification</h2>
<p>You agree to indemnify and hold us harmless from any claims, damages, or expenses arising from your use of the service or breach of these terms.</p>

<h2>8. Governing Law and Disputes</h2>
<p>These terms are governed by the laws of the United States and the State of New York. Any disputes shall be resolved in the courts of New York, or by binding arbitration if we agree in writing.</p>

<h2>9. Changes</h2>
<p>We may update these Terms of Service from time to time. Continued use of the service after changes constitutes acceptance. Material changes may be communicated by email or a notice on the website.</p>

<h2>10. Contact</h2>
<p>For questions about these terms, contact us via the details in the <a href="/contact">Contact</a> page.</p>
<p><em>Last updated: January 2025</em></p>
`.trim();

const PRIVACY_POLICY_CONTENT = `
<h2>1. Introduction</h2>
<p>We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.</p>

<h2>2. Information We Collect</h2>
<p>We may collect:</p>
<ul>
  <li><strong>Personal information</strong> – Name, email, phone number, address, payment details when you register, book, or contact us</li>
  <li><strong>Usage data</strong> – IP address, browser type, device information, pages visited, and how you use our site</li>
  <li><strong>Cookies and similar technologies</strong> – As described in our <a href="/cookie-policy">Cookie Policy</a></li>
</ul>

<h2>3. How We Use Your Information</h2>
<p>We use your information to: provide and improve our services; process bookings and payments; communicate with you; send service-related and (with consent) marketing communications; prevent fraud and ensure security; comply with legal obligations; and for analytics to improve our website.</p>

<h2>4. Sharing and Disclosure</h2>
<p>We may share your information with: service providers (e.g. payment processors, hosting, analytics) who assist our operations; professional advisors where required by law; and law enforcement or regulators when necessary. We do not sell your personal information to third parties for their marketing.</p>

<h2>5. Data Retention</h2>
<p>We retain your data for as long as your account is active or as needed to provide services, comply with legal obligations, resolve disputes, and enforce our agreements. You may request deletion of your data subject to applicable law.</p>

<h2>6. Your Rights</h2>
<p>Depending on your location, you may have the right to: access, correct, or delete your data; object to or restrict processing; data portability; and withdraw consent. To exercise these rights, contact us using the details below. You may also have the right to lodge a complaint with a supervisory authority.</p>

<h2>7. Security</h2>
<p>We implement appropriate technical and organisational measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction.</p>

<h2>8. Children</h2>
<p>Our services are not directed to individuals under the age of 16. We do not knowingly collect personal information from children. If you believe we have collected such information, please contact us at support@fixer.com so we can delete it.</p>

<h2>9. International Transfers</h2>
<p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place where required by law.</p>

<h2>10. Updates and Contact</h2>
<p>We may update this Privacy Policy from time to time. The “Last updated” date will be revised when changes are made. For privacy-related questions or to exercise your rights, contact us via the <a href="/contact">Contact</a> page.</p>
<p><em>Last updated: January 2025</em></p>
`.trim();

const ABOUT_US_CONTENT = `
<h2>Our Story</h2>
<p>Fixer was founded with a simple mission: to make quality home services accessible and connect customers with trusted professionals. Since 2020, we have grown to serve thousands of households, building a network of verified plumbers, electricians, cleaners, and repair specialists.</p>

<h2>What We Do</h2>
<p>We offer plumbing, electrical, cleaning, repairs, and general maintenance. Our platform connects you with vetted professionals so you can book, pay, and get the job done with transparent pricing and a satisfaction guarantee.</p>

<h2>Our Values</h2>
<ul>
  <li><strong>Quality</strong> – Every professional is verified and rated; we stand behind the work.</li>
  <li><strong>Trust</strong> – Background checks, insurance, and real reviews so you book with confidence.</li>
  <li><strong>Customer First</strong> – We’re here to help before, during, and after every booking.</li>
</ul>

<h2>Why Choose Us</h2>
<p>We stand out through verified professionals, transparent pricing, easy online booking, and a satisfaction guarantee. Our partners are trained, insured, and background-checked so you get peace of mind with every booking.</p>

<h2>Get in Touch</h2>
<p>We’d love to hear from you. Visit our <a href="/contact">Contact</a> page to get in touch with our team.</p>
`.trim();

const CONTACT_US_CONTENT = `
<h2>Get in Touch</h2>
<p>Have a question, feedback, or need support? Reach out using one of the options below.</p>

<h2>Contact Options</h2>
<ul>
  <li><strong>Email</strong> – support@fixer.com</li>
  <li><strong>Phone</strong> – +1 (800) 555-0123</li>
  <li><strong>Contact form</strong> – Use the form on this page or linked from the main navigation</li>
</ul>

<h2>Office Address</h2>
<p>Fixer Inc.<br>123 Service Avenue, Suite 100<br>New York, NY 10001<br>United States</p>

<h2>Business Hours</h2>
<p>Monday – Friday: 9:00 AM – 6:00 PM EST<br>Saturday: 10:00 AM – 4:00 PM EST<br>Sunday: Closed (emergency support via phone)</p>

<h2>Response Time</h2>
<p>We aim to respond to all enquiries within <strong>24–48 business hours</strong>. For urgent booking or service issues, please call us directly.</p>
`.trim();

const DISCLAIMER_CONTENT = `
<h2>General Disclaimer</h2>
<p>The information on this website is for general purposes only. While we strive to keep the content accurate and up to date, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, or availability of the website or the information, products, or services contained on it.</p>

<h2>Professional Advice</h2>
<p>Content on this site does not constitute legal, medical, or financial advice. You should seek appropriate professional advice before relying on any information for decisions that could affect you legally, financially, or personally.</p>

<h2>Service Listings and Third Parties</h2>
<p>Where we list or refer to third-party service providers, we do not guarantee their performance, quality, or outcomes. Your contract and any disputes are between you and the relevant provider. We are not liable for the acts or omissions of third parties.</p>

<h2>Limitation of Liability</h2>
<p>To the maximum extent permitted by law, we shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of this website or our services. Use of the site is at your own risk.</p>

<h2>External Links</h2>
<p>This website may contain links to external sites. We are not responsible for the content or practices of those sites. Inclusion of a link does not imply endorsement.</p>

<p><em>Last updated: January 2025</em></p>
`.trim();

const HOW_IT_WORKS_CONTENT = `
<h2>How It Works</h2>
<p>Booking a service with Fixer is simple. Follow these steps to get started.</p>

<h2>1. Choose Your Service</h2>
<p>Browse our services and categories—plumbing, electrical, cleaning, repairs, and more—and select what you need. You can compare options, read descriptions, and check pricing and availability before booking.</p>

<h2>2. Pick a Time</h2>
<p>Select a date and time that works for you. Our booking system shows available slots so you can book instantly or request a callback for confirmation.</p>

<h2>3. Confirm & Pay</h2>
<p>Review your booking details, enter any special instructions, and complete payment securely. You’ll receive a confirmation by email and SMS.</p>

<h2>4. We Get It Done</h2>
<p>Our verified professionals will arrive at the scheduled time. For in-home services, we’ll call ahead and send tracking. After the job, we’ll confirm completion and follow up if needed.</p>

<h2>5. Rate & Review</h2>
<p>After your service, you can rate your experience and leave a review. Your feedback helps us maintain quality and helps other customers choose with confidence.</p>

<h2>Need Help?</h2>
<p>Check our <a href="/faq">FAQ</a> or <a href="/contact">Contact</a> us for support.</p>
`.trim();

const FAQ_PAGE_CONTENT = `
<h2>Frequently Asked Questions</h2>
<p>Quick answers to common questions. For more details, visit our full <a href="/faq">FAQ section</a> or <a href="/contact">contact us</a>.</p>

<h3>How do I book a service?</h3>
<p>Select your service, choose a date and time, and complete the booking. You’ll receive a confirmation by email.</p>

<h3>What payment methods do you accept?</h3>
<p>We accept major credit and debit cards, and digital wallets where available. Payment is processed securely at checkout.</p>

<h3>Can I cancel or reschedule?</h3>
<p>Yes. Cancellation and rescheduling options depend on the service and timing. See our <a href="/refund-policy">Refund Policy</a> and booking terms for details.</p>

<h3>Are your professionals verified?</h3>
<p>Yes. We verify identity, run background checks, and ensure insurance where applicable so you can book with confidence.</p>

<h3>How can I contact support?</h3>
<p>Use the <a href="/contact">Contact</a> page, email, or phone. We aim to respond within 24–48 business hours.</p>
`.trim();

const CAREERS_CONTENT = `
<h2>Careers at Fixer</h2>
<p>Join a team that’s putting customers first and redefining home services. We’re always looking for talented people who share our values of quality, trust, and customer focus.</p>

<h2>Why Work With Us</h2>
<ul>
  <li>Competitive pay and benefits</li>
  <li>Flexible schedules and remote options where applicable</li>
  <li>Training and growth opportunities</li>
  <li>Inclusive and supportive culture</li>
</ul>

<h2>Open Positions</h2>
<p>We currently have openings in Operations, Customer Support, Sales, and Field Technicians. For the latest roles, please check our jobs board or email careers@fixer.com with your resume and the role you’re interested in.</p>

<h2>Apply</h2>
<p>To apply, send your CV and a short cover letter to careers@fixer.com with the job title in the subject line. We review applications regularly and will get back to shortlisted candidates within two weeks.</p>
`.trim();

const ACCESSIBILITY_CONTENT = `
<h2>Accessibility Statement</h2>
<p>Fixer is committed to ensuring our website is accessible to as many people as possible, including those with disabilities. We aim to conform to WCAG 2.1 Level AA where practicable.</p>

<h2>Measures We Take</h2>
<ul>
  <li>Semantic HTML and clear structure</li>
  <li>Keyboard navigation support</li>
  <li>Sufficient colour contrast and resizable text</li>
  <li>Alt text for images where appropriate</li>
  <li>Forms that are labelled and error-friendly</li>
</ul>

<h2>Feedback</h2>
<p>If you encounter an accessibility barrier on our site, please <a href="/contact">contact us</a>. We will work to address the issue and improve your experience.</p>

<p><em>Last updated: January 2025</em></p>
`.trim();

export const PAGE_TEMPLATES: Record<string, PageTemplate> = {
  'refund-policy': {
    title: 'Refund Policy',
    slug: 'refund-policy',
    excerpt: 'Our refund policy explains when and how you can request a refund for services or purchases.',
    content: REFUND_POLICY_CONTENT,
    seoTitle: 'Refund Policy',
    seoDescription: 'Read our refund policy to understand eligibility, how to request a refund, and processing times.',
    seoKeywords: 'refund policy, refunds, cancellation, money back',
  },
  'cookie-policy': {
    title: 'Cookie Policy',
    slug: 'cookie-policy',
    excerpt: 'How we use cookies and similar technologies on our website.',
    content: COOKIE_POLICY_CONTENT,
    seoTitle: 'Cookie Policy',
    seoDescription: 'Learn how we use cookies and how you can manage your cookie preferences.',
    seoKeywords: 'cookie policy, cookies, privacy, website cookies',
  },
  'terms-of-service': {
    title: 'Terms of Service',
    slug: 'terms-of-service',
    excerpt: 'Terms and conditions governing the use of our website and services.',
    content: TERMS_OF_SERVICE_CONTENT,
    seoTitle: 'Terms of Service',
    seoDescription: 'Read our terms of service for use of our website and services.',
    seoKeywords: 'terms of service, terms and conditions, legal',
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    excerpt: 'How we collect, use, and protect your personal information.',
    content: PRIVACY_POLICY_CONTENT,
    seoTitle: 'Privacy Policy',
    seoDescription: 'Our privacy policy explains how we handle your personal data.',
    seoKeywords: 'privacy policy, data protection, personal information',
  },
  'about-us': {
    title: 'About Us',
    slug: 'about-us',
    excerpt: 'Learn about our company, mission, and values.',
    content: ABOUT_US_CONTENT,
    seoTitle: 'About Us',
    seoDescription: 'Discover our story, what we do, and why you can trust us.',
    seoKeywords: 'about us, company, mission, team',
  },
  'contact-us': {
    title: 'Contact Us',
    slug: 'contact',
    excerpt: 'Get in touch with our team for support or enquiries.',
    content: CONTACT_US_CONTENT,
    seoTitle: 'Contact Us',
    seoDescription: 'Contact our team by email, phone, or contact form.',
    seoKeywords: 'contact, support, email, phone',
  },
  'disclaimer': {
    title: 'Disclaimer',
    slug: 'disclaimer',
    excerpt: 'General disclaimer and limitation of liability for use of this website.',
    content: DISCLAIMER_CONTENT,
    seoTitle: 'Disclaimer',
    seoDescription: 'General disclaimer for the use of our website and services.',
    seoKeywords: 'disclaimer, legal, liability',
  },
  'how-it-works': {
    title: 'How It Works',
    slug: 'how-it-works',
    excerpt: 'A simple guide to booking and using our services.',
    content: HOW_IT_WORKS_CONTENT,
    seoTitle: 'How It Works',
    seoDescription: 'Learn how to book a service in a few easy steps.',
    seoKeywords: 'how it works, booking, process, guide',
  },
  'faq': {
    title: 'FAQ',
    slug: 'faq',
    excerpt: 'Frequently asked questions and quick answers.',
    content: FAQ_PAGE_CONTENT,
    seoTitle: 'FAQ',
    seoDescription: 'Find answers to frequently asked questions.',
    seoKeywords: 'FAQ, frequently asked questions, help',
  },
  'careers': {
    title: 'Careers',
    slug: 'careers',
    excerpt: 'Join our team. View open positions and apply.',
    content: CAREERS_CONTENT,
    seoTitle: 'Careers',
    seoDescription: 'Explore career opportunities and join our team.',
    seoKeywords: 'careers, jobs, hiring, work with us',
  },
  'accessibility': {
    title: 'Accessibility',
    slug: 'accessibility',
    excerpt: 'Our commitment to digital accessibility.',
    content: ACCESSIBILITY_CONTENT,
    seoTitle: 'Accessibility Statement',
    seoDescription: 'Our commitment to making our website accessible to everyone.',
    seoKeywords: 'accessibility, WCAG, inclusive',
  },
};

export const PAGE_TEMPLATE_KEYS = Object.keys(PAGE_TEMPLATES) as string[];
