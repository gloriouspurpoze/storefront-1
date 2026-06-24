import {
  isValidIndianPincode,
  isValidPosServicePhone,
  posScheduledMaxLocalValue,
  posScheduledMinLocalValue,
  sanitizeIndianPinInput,
  validatePosCheckoutForm,
} from '../posCheckoutValidation'

function localDatetimeOffsetMs(ms: number): string {
  const d = new Date(Date.now() + ms)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

describe('posCheckoutValidation', () => {
  const base = {
    hasCustomer: true,
    cartLineCount: 1,
    scheduledLocal: localDatetimeOffsetMs(60 * 60 * 1000),
    addrLine: '221B Baker Street',
    addrCity: 'Mumbai',
    addrState: 'Maharashtra',
    addrZip: '400001',
    addrCountry: 'India',
    phone: '+919876543210',
    useSplitTender: false,
    splitOk: true,
    grandTotal: 500,
  }

  it('passes a complete India checkout', () => {
    const r = validatePosCheckoutForm(base)
    expect(r.valid).toBe(true)
    expect(r.messages).toHaveLength(0)
  })

  it('requires 6-digit PIN for India', () => {
    const r = validatePosCheckoutForm({ ...base, addrZip: '4000' })
    expect(r.valid).toBe(false)
    expect(r.errors.addrZip).toMatch(/6-digit/)
  })

  it('rejects past schedule', () => {
    const r = validatePosCheckoutForm({
      ...base,
      scheduledLocal: localDatetimeOffsetMs(-60 * 60 * 1000),
    })
    expect(r.valid).toBe(false)
    expect(r.errors.scheduled).toMatch(/past/)
  })

  it('validates service phone', () => {
    expect(isValidPosServicePhone('9876543210')).toBe(true)
    expect(isValidPosServicePhone('123')).toBe(false)
  })

  it('sanitizes PIN input', () => {
    expect(sanitizeIndianPinInput('40a001x')).toBe('40001')
    expect(isValidIndianPincode('400001')).toBe(true)
  })

  it('exposes datetime-local bounds', () => {
    expect(posScheduledMinLocalValue()).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(posScheduledMaxLocalValue() >= posScheduledMinLocalValue()).toBe(true)
  })
})
