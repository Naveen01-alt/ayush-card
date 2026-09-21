type AuditAction = 
  | 'DOCTOR_LOGIN_SUCCESS' 
  | 'DOCTOR_LOGIN_FAILED'
  | 'QR_SCANNED'
  | 'PATIENT_VIEWED'
  | 'OP_REGISTERED'
  | 'ACCESS_REQUESTED'
  | 'CONSENT_GRANTED'
  | 'CONSENT_REJECTED'
  | 'RECORD_VIEWED'
  | 'CONSULTATION_CREATED'
  | 'ACCESS_DENIED'
  | 'LOGOUT'

export async function logAudit(
  actorId: string,
  action: AuditAction,
  targetId?: string,
  details?: string
) {
  try {
    // Send audit log to backend API instead of direct Prisma insert
    await fetch('https://ayush-card-qj9n.vercel.app/api/audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        actorId,
        action,
        targetId,
        details
      })
    })
  } catch (error) {
    console.error('Failed to write audit log:', error)
  }
}
