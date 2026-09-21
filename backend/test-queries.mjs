import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function test() {
  const doctorId = '7f3f8e71-f0f1-4967-af87-9cd1ce5c5c20'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const opRegistrations = await prisma.oPRegistration.findMany({
    where: {
      doctorId: doctorId,
      createdAt: { gte: today }
    }
  })
  console.log('Today OP count:', opRegistrations.length)

  const consents = await prisma.consent.findMany({
    where: { 
      doctorId: doctorId,
      status: 'APPROVED',
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    }
  })
  console.log('Active Consents count:', consents.length)

  const consultations = await prisma.consultation.findMany({
    where: { doctorId: doctorId }
  })
  console.log('Consultations count:', consultations.length)
}

test().catch(console.error).finally(() => prisma.$disconnect())
