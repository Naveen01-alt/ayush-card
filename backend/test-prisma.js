const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const doctor = await prisma.user.findFirst({ where: { role: 'DOCTOR' } });
  const patient = await prisma.user.findFirst({ where: { role: 'PATIENT' } });
  
  if (!doctor || !patient) {
    console.log('Missing doctor or patient');
    return;
  }
  
  try {
    const consultation = await prisma.consultation.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        symptoms: 'test symptoms',
        diagnosis: 'test diagnosis',
      }
    });
    console.log('Success:', consultation.id);
  } catch (err) {
    console.error('Error:', err);
  }
}

main().finally(() => prisma.$disconnect());
