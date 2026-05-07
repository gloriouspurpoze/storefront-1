/** Matches fixer-backend Professional.documents[].type and fixerprovider Document types */

export type ProfessionalKycDocumentType =
  | 'aadhar'
  | 'pan'
  | 'license'
  | 'certificate'
  | 'police_verification'
  | 'other'

export const PROFESSIONAL_KYC_TYPE_LABELS: Record<string, string> = {
  aadhar: 'Aadhaar',
  pan: 'PAN',
  license: 'License / registration',
  certificate: 'Certificate',
  police_verification: 'Police verification',
  other: 'Other',
}

export function professionalKycTypeLabel(type: string | undefined): string {
  if (!type) return 'Document'
  return PROFESSIONAL_KYC_TYPE_LABELS[type] ?? type.replace(/_/g, ' ')
}
