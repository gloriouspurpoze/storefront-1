import { describe, expect, it } from 'vitest'
import {
  deliveryDetailsToShippingAddress,
  validateShippingAddress,
} from '../storefrontShippingAddress'

describe('storefrontShippingAddress', () => {
  it('validates required address fields', () => {
    expect(validateShippingAddress({}).ok).toBe(false)
    expect(
      validateShippingAddress({
        addressLine1: '12 Main St',
        city: 'Mumbai',
        pincode: '401107',
      }).ok,
    ).toBe(false)
    expect(
      validateShippingAddress({
        addressLine1: '12 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '401107',
      }).ok,
    ).toBe(true)
  })

  it('maps delivery details to shipping payload', () => {
    const payload = deliveryDetailsToShippingAddress(
      {
        addressLine1: 'qeqwre',
        addressLine2: 'ewrwer',
        city: 'mumbai',
        state: 'Maharashtra',
        pincode: '401107',
      },
      { name: 'Jane Doe', email: 'jane@example.com', phone: '9876543210' },
    )

    expect(payload).toEqual({
      firstName: 'Jane',
      lastName: 'Doe',
      address: 'qeqwre, ewrwer',
      city: 'mumbai',
      state: 'Maharashtra',
      zipCode: '401107',
      pincode: '401107',
      country: 'India',
      phone: '9876543210',
      email: 'jane@example.com',
    })
  })
})
