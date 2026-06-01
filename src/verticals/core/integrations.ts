/** Integration marketplace entries per vertical pack. */

export type IntegrationScope = 'orders' | 'payments' | 'messaging' | 'maps' | 'analytics' | 'other'
export type IntegrationAuth = 'oauth2' | 'api_key' | 'webhook_pull'

export interface IntegrationDef {
  key: string
  label: string
  scope: IntegrationScope
  auth?: IntegrationAuth
}
