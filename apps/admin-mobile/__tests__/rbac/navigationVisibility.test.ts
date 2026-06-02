import { canAccessRoute } from '@profixer/rbac'
import { isAdminTabVisible } from '@/config/mobileNav.config'

describe('admin mobile tab visibility', () => {
  const check = (path: string) => canAccessRoute('staff', path)

  it('shows home when dashboard is allowed', () => {
    expect(isAdminTabVisible('home', check)).toBe(true)
  })

  it('hides chat for roles without messages', () => {
    const noChat = (path: string) => canAccessRoute('customer', path)
    expect(isAdminTabVisible('chat', noChat)).toBe(false)
  })
})
