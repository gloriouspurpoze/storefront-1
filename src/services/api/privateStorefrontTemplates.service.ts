import { api } from './base'

export interface PrivateStorefrontTemplate {
  _id: string
  key: string
  name: string
  description: string
  previewGradient: string
  verticalKey: string
  kind: 'layout' | 'style'
  htmlSource?: string
  reactModulePath?: string
  assignedTenantIds: string[]
  isActive: boolean
  notes?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export type PrivateStorefrontTemplateInput = {
  key: string
  name: string
  description: string
  previewGradient: string
  verticalKey: string
  kind?: 'layout' | 'style'
  htmlSource?: string
  reactModulePath?: string
  assignedTenantIds?: string[]
  notes?: string
}

export const privateStorefrontTemplatesService = {
  list() {
    return api.get<PrivateStorefrontTemplate[]>('/platform/storefront-private-templates', {
      showLoading: false,
      showErrorToast: true,
      showSuccessToast: false,
    })
  },

  create(body: PrivateStorefrontTemplateInput) {
    return api.post<PrivateStorefrontTemplate>('/platform/storefront-private-templates', body, {
      showLoading: true,
      showSuccessToast: true,
      successMessage: 'Private template created',
    })
  },

  update(id: string, body: Partial<PrivateStorefrontTemplateInput> & { isActive?: boolean }) {
    return api.patch<PrivateStorefrontTemplate>(
      `/platform/storefront-private-templates/${id}`,
      body,
      {
        showLoading: true,
        showSuccessToast: true,
        successMessage: 'Private template updated',
      },
    )
  },

  assignTenants(id: string, tenantIds: string[]) {
    return api.post<PrivateStorefrontTemplate>(
      `/platform/storefront-private-templates/${id}/assign-tenants`,
      { tenantIds },
      {
        showLoading: true,
        showSuccessToast: true,
        successMessage: 'Tenant assignments saved',
      },
    )
  },

  deactivate(id: string) {
    return api.delete<PrivateStorefrontTemplate>(
      `/platform/storefront-private-templates/${id}`,
      {
        showLoading: true,
        showSuccessToast: true,
        successMessage: 'Private template deactivated',
      },
    )
  },
}
