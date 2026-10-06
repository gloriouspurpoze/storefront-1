import { describe, expect, it } from 'vitest'
import { selectTestimonials } from '../testimonials'

const t = (customerName: string, serviceType?: string) => ({ customerName, content: `${customerName} says hi`, serviceType })

describe('marketing testimonials', () => {
  const rows = [t('General A'), t('Salon B', 'Salon & spa'), t('Home C', 'home'), t('Retail D', 'for-retail')]

  it('home shows general testimonials (blank or "Home" service)', () => {
    expect(selectTestimonials(rows, 'home').map((r) => r.customerName)).toEqual(['General A', 'Home C'])
  })

  it('home falls back to any testimonial when none are general', () => {
    expect(selectTestimonials([t('Salon B', 'Salon & spa')], 'home').map((r) => r.customerName)).toEqual(['Salon B'])
  })

  it('industry pages prefer their own, then general ones', () => {
    expect(selectTestimonials(rows, 'industry:salon').map((r) => r.customerName)).toEqual(['Salon B'])
    expect(selectTestimonials(rows, 'industry:fitness').map((r) => r.customerName)).toEqual(['General A', 'Home C'])
  })

  it('caps at three and returns nothing when the CMS is empty', () => {
    expect(selectTestimonials([t('1'), t('2'), t('3'), t('4')], 'home')).toHaveLength(3)
    expect(selectTestimonials([], 'industry:salon')).toEqual([])
  })
})
