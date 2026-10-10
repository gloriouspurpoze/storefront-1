/**
 * Sample data for the illustrative product mocks on the marketing site (hero preview,
 * feature showcase). Productized industries get their own; the rest share a neutral default.
 */
import {
  Calendar,
  ChefHat,
  LayoutDashboard,
  Package,
  Receipt,
  Scissors,
  ShoppingBag,
  Target,
  Users,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { VerticalKey } from '@profixer/marketing-data'

export type PreviewData = {
  business: string
  initials: string
  nav: readonly { icon: LucideIcon; label: string }[]
  kpis: readonly { label: string; value: string; delta: string }[]
  /** Heading of the hero's schedule card and the core-operations mock. */
  todayTitle: string
  today: readonly { time: string; title: string; status: string }[]
  /** Services, menu items or products — shown on the storefront and catalog mocks. */
  items: readonly { name: string; price: string }[]
  /** Call to action on the storefront mock ("Book appointment", "Order now"). */
  bookLabel: string
  client: { name: string; initials: string; detail: string; history: readonly { date: string; title: string; amount: string }[] }
  /** The two floating notifications around the hero preview. */
  toasts: readonly [{ title: string; body: string }, { title: string; body: string }]
}

const HOME_SERVICES: PreviewData = {
  business: 'Acme Services',
  initials: 'AS',
  nav: [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: Calendar, label: 'Bookings' },
    { icon: Package, label: 'Orders' },
    { icon: Target, label: 'CRM' },
    { icon: Users, label: 'Team' },
    { icon: Receipt, label: 'Invoices' },
  ],
  kpis: [
    { label: 'Revenue', value: '₹4,82,300', delta: '+12.4%' },
    { label: 'Bookings', value: '312', delta: '+8.1%' },
    { label: 'New leads', value: '86', delta: '+21%' },
    { label: 'Avg. rating', value: '4.8', delta: '+0.2' },
  ],
  todayTitle: 'Today',
  today: [
    { time: '10:00', title: 'AC service · Green Valley', status: 'Assigned' },
    { time: '12:30', title: 'Deep clean · 3BHK', status: 'En route' },
    { time: '15:00', title: 'Plumbing · Office 4B', status: 'Confirmed' },
  ],
  items: [
    { name: 'AC service', price: '₹599' },
    { name: 'Deep cleaning', price: '₹2,499' },
    { name: 'Plumbing visit', price: '₹349' },
  ],
  bookLabel: 'Book a visit',
  client: {
    name: 'Rahul Mehta',
    initials: 'RM',
    detail: '4 jobs · AMC customer',
    history: [
      { date: '12 Sep', title: 'AC service', amount: '₹599' },
      { date: '02 Jul', title: 'Kitchen deep clean', amount: '₹1,899' },
      { date: '18 Apr', title: 'Plumbing visit', amount: '₹349' },
    ],
  },
  toasts: [
    { title: 'Technician en route', body: 'Arjun · ETA 12 min' },
    { title: 'Payment received', body: '₹2,499 · Deep cleaning' },
  ],
}

const SALON: PreviewData = {
  business: 'Glow Studio',
  initials: 'GS',
  nav: [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: Calendar, label: 'Appointments' },
    { icon: Scissors, label: 'Services' },
    { icon: Users, label: 'Stylists' },
    { icon: Target, label: 'Clients' },
    { icon: ShoppingBag, label: 'Retail' },
  ],
  kpis: [
    { label: 'Revenue', value: '₹3,64,800', delta: '+14.2%' },
    { label: 'Appointments', value: '428', delta: '+9.6%' },
    { label: 'Repeat clients', value: '68%', delta: '+6%' },
    { label: 'No-shows', value: '3.1%', delta: '−42%' },
  ],
  todayTitle: "Today's appointments",
  today: [
    { time: '10:00', title: 'Haircut & blow-dry · Riya', status: 'Confirmed' },
    { time: '11:30', title: 'Hair colour · Priya', status: 'In chair' },
    { time: '14:00', title: 'Spa manicure · Kavya', status: 'Deposit paid' },
  ],
  items: [
    { name: 'Haircut & blow-dry', price: '₹899' },
    { name: 'Global hair colour', price: '₹3,499' },
    { name: 'Spa manicure', price: '₹1,199' },
  ],
  bookLabel: 'Book appointment',
  client: {
    name: 'Riya Sharma',
    initials: 'RS',
    detail: '9 visits · Gold member',
    history: [
      { date: '28 Sep', title: 'Hair colour · with Anu', amount: '₹3,499' },
      { date: '31 Aug', title: 'Haircut · with Anu', amount: '₹899' },
      { date: '04 Aug', title: 'Hair spa', amount: '₹1,499' },
    ],
  },
  toasts: [
    { title: 'Appointment booked', body: 'Riya · Haircut · Sat 10:00' },
    { title: 'Deposit received', body: '₹500 · no-show protected' },
  ],
}

const RESTAURANT: PreviewData = {
  business: 'Spice Route',
  initials: 'SR',
  nav: [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: UtensilsCrossed, label: 'Orders' },
    { icon: ChefHat, label: 'Kitchen' },
    { icon: Package, label: 'Menu' },
    { icon: Target, label: 'Guests' },
    { icon: Receipt, label: 'Billing' },
  ],
  kpis: [
    { label: 'Sales', value: '₹6,12,400', delta: '+11.8%' },
    { label: 'Orders', value: '1,284', delta: '+15%' },
    { label: 'Direct orders', value: '41%', delta: '+9%' },
    { label: 'Avg. ticket', value: '₹477', delta: '+₹32' },
  ],
  todayTitle: 'Live orders',
  today: [
    { time: '12:05', title: 'Table 4 · 2× Paneer tikka', status: 'Cooking' },
    { time: '12:12', title: 'Delivery · Butter chicken', status: 'Ready' },
    { time: '12:18', title: 'Takeaway · Veg biryani', status: 'New' },
  ],
  items: [
    { name: 'Paneer tikka', price: '₹329' },
    { name: 'Butter chicken', price: '₹389' },
    { name: 'Veg biryani', price: '₹279' },
  ],
  bookLabel: 'Order now',
  client: {
    name: 'Aman Gupta',
    initials: 'AG',
    detail: '14 orders · Regular',
    history: [
      { date: '06 Oct', title: 'Delivery · 3 items', amount: '₹1,047' },
      { date: '22 Sep', title: 'Dine-in · Table 7', amount: '₹2,310' },
      { date: '09 Sep', title: 'Takeaway · 2 items', amount: '₹618' },
    ],
  },
  toasts: [
    { title: 'New direct order', body: '₹1,047 · 0% commission' },
    { title: 'KOT sent to kitchen', body: 'Table 4 · 3 items' },
  ],
}

const RETAIL: PreviewData = {
  business: 'Urban Threads',
  initials: 'UT',
  nav: [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: ShoppingBag, label: 'Orders' },
    { icon: Package, label: 'Products' },
    { icon: Target, label: 'Customers' },
    { icon: Users, label: 'Staff' },
    { icon: Receipt, label: 'Invoices' },
  ],
  kpis: [
    { label: 'Sales', value: '₹8,94,200', delta: '+13.1%' },
    { label: 'Orders', value: '642', delta: '+10.4%' },
    { label: 'Online share', value: '37%', delta: '+8%' },
    { label: 'Low stock', value: '12', delta: '−5' },
  ],
  todayTitle: 'Recent orders',
  today: [
    { time: '10:42', title: 'Online · Linen shirt × 2', status: 'Packed' },
    { time: '11:15', title: 'In store · Denim jacket', status: 'Paid' },
    { time: '11:40', title: 'Online · Cotton kurta', status: 'New' },
  ],
  items: [
    { name: 'Linen shirt', price: '₹1,499' },
    { name: 'Denim jacket', price: '₹2,999' },
    { name: 'Cotton kurta', price: '₹1,199' },
  ],
  bookLabel: 'Shop now',
  client: {
    name: 'Sneha Iyer',
    initials: 'SI',
    detail: '7 orders · VIP',
    history: [
      { date: '03 Oct', title: 'Linen shirt × 2', amount: '₹2,998' },
      { date: '15 Sep', title: 'Denim jacket', amount: '₹2,999' },
      { date: '20 Aug', title: 'Cotton kurta', amount: '₹1,199' },
    ],
  },
  toasts: [
    { title: 'Online order', body: '₹2,998 · Linen shirt × 2' },
    { title: 'Stock synced', body: 'Store + website · 12 SKUs' },
  ],
}

const DEFAULT: PreviewData = {
  ...HOME_SERVICES,
  business: 'Acme Co.',
  initials: 'AC',
  nav: [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: Calendar, label: 'Bookings' },
    { icon: Target, label: 'CRM' },
    { icon: Users, label: 'Team' },
    { icon: Wrench, label: 'Services' },
    { icon: Receipt, label: 'Invoices' },
  ],
  today: [
    { time: '10:00', title: 'Consultation · Neha K.', status: 'Confirmed' },
    { time: '12:30', title: 'Follow-up · Vikram S.', status: 'Reminder sent' },
    { time: '15:00', title: 'New enquiry · Website', status: 'Assigned' },
  ],
  items: [
    { name: 'Consultation', price: '₹999' },
    { name: 'Standard package', price: '₹4,999' },
    { name: 'Premium package', price: '₹9,999' },
  ],
  bookLabel: 'Book now',
  client: {
    name: 'Neha Kapoor',
    initials: 'NK',
    detail: '5 visits · Returning',
    history: [
      { date: '30 Sep', title: 'Standard package', amount: '₹4,999' },
      { date: '11 Aug', title: 'Consultation', amount: '₹999' },
      { date: '02 Jul', title: 'Consultation', amount: '₹999' },
    ],
  },
  toasts: [
    { title: 'New booking', body: 'Neha · Consultation · 10:00' },
    { title: 'Invoice paid', body: '₹4,999 · Standard package' },
  ],
}

const PREVIEWS: Partial<Record<VerticalKey, PreviewData>> = {
  home_services: HOME_SERVICES,
  salon: SALON,
  restaurant: RESTAURANT,
  retail: RETAIL,
}

export function previewFor(key: VerticalKey): PreviewData {
  return PREVIEWS[key] ?? DEFAULT
}
