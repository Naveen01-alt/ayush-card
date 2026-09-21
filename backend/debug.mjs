import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function debug() {
  const doctor = await prisma.user.findUnique({ where: { email: 'doctor@example.com' } })
  console.log('Doctor ID:', doctor?.id)

  const ops = await prisma.oPRegistration.findMany({ include: { patient: true } })
  console.log('\n--- OP Registrations ---')
  console.dir(ops, { depth: null })

  const consents = await prisma.consent.findMany({ include: { patient: true } })
  console.log('\n--- Consents ---')
  console.dir(consents, { depth: null })

  const consults = await prisma.consultation.findMany({ include: { patient: true } })
  console.log('\n--- Consultations ---')
  console.dir(consults, { depth: null })

  const patients = await prisma.user.findMany({ where: { role: 'PATIENT' } })
  console.log('\n--- Patients ---')
  console.dir(patients.map(p => ({ id: p.id, email: p.email })), { depth: null })
}

debug().catch(console.error).finally(() => prisma.$disconnect())
