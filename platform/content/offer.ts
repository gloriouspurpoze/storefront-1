/**
 * Launch offer. The deadline is fixed (not per-visitor), so the countdown is genuine;
 * once it passes, strike-through pricing and the banner disappear on their own.
 */
export const LAUNCH_OFFER = {
  label: 'Launch offer',
  endsAt: '2026-10-31T23:59:59+05:30',
}

export function launchOfferLive(now = Date.now()): boolean {
  return now < Date.parse(LAUNCH_OFFER.endsAt)
}
