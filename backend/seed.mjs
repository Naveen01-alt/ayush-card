import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seed() {
  const passwordHash = await bcrypt.hash('password123', 10)
  
  // Hospital
  let hospital = await prisma.hospital.findFirst()
  if (!hospital) {
    hospital = await prisma.hospital.create({
      data: {
        name: 'AYUSH Central Hospital',
        address: '123 Health Ave, Medical City'
      }
    })
    console.log('Created Hospital:', hospital.name)
  }

  // Doctor
  let doctor = await prisma.user.findUnique({ where: { email: 'doctor@example.com' } })
  if (!doctor) {
    doctor = await prisma.user.create({
      data: {
        name: 'Dr. Arjun Reddy',
        email: 'doctor@example.com',
        password: passwordHash,
        role: 'DOCTOR',
        doctorProfile: {
          create: {
            licenseNumber: 'DOC-12345',
            specialization: 'General Medicine',
            hospitalName: hospital.name
          }
        }
      }
    })
    console.log('Created Doctor:', doctor.email)
  }

  // Patient
  let patient = await prisma.user.findUnique({ where: { email: 'patient@example.com' } })
  if (!patient) {
    patient = await prisma.user.create({
      data: {
        name: 'Rahul Kumar',
        email: 'patient@example.com',
        password: passwordHash,
        role: 'PATIENT',
        patientProfile: {
          create: {
            ayushId: 'AYUSH-100001',
            qrToken: 'TOKEN-999999',
            bloodGroup: 'O+',
            dateOfBirth: new Date('1990-01-01')
          }
        }
      }
    })
  console.log('Created Patient 1:', patient.email)
  }

  // Create additional mock patients for demo
  const mockPatients = [
    { name: 'Priya Sharma', email: 'priya@example.com', ayushId: 'AYUSH-100002', qr: 'TOKEN-999998', bg: 'A+', dob: '1985-05-12' },
    { name: 'Amit Patel', email: 'amit@example.com', ayushId: 'AYUSH-100003', qr: 'TOKEN-999997', bg: 'B+', dob: '1978-11-23' },
    { name: 'Sneha Gupta', email: 'sneha@example.com', ayushId: 'AYUSH-100004', qr: 'TOKEN-999996', bg: 'O-', dob: '1992-08-30' },
    { name: 'Vikram Singh', email: 'vikram@example.com', ayushId: 'AYUSH-100005', qr: 'TOKEN-999995', bg: 'AB+', dob: '1965-02-14' },
  ]

  const patientIds = [patient.id] // Keep track of all patient IDs

  for (const mp of mockPatients) {
    let p = await prisma.user.findUnique({ where: { email: mp.email } })
    if (!p) {
      p = await prisma.user.create({
        data: {
          name: mp.name,
          email: mp.email,
          password: passwordHash,
          role: 'PATIENT',
          patientProfile: {
            create: {
              ayushId: mp.ayushId,
              qrToken: mp.qr,
              bloodGroup: mp.bg,
              dateOfBirth: new Date(mp.dob)
            }
          }
        }
      })
      console.log('Created Patient:', p.email)
    }
    patientIds.push(p.id)
  }

  // Seed Consents (Active)
  for (const pid of patientIds.slice(0, 3)) { // Give consent to first 3
    let consent = await prisma.consent.findFirst({ where: { patientId: pid, doctorId: doctor.id } })
    if (!consent) {
      await prisma.consent.create({
        data: {
          patientId: pid,
          doctorId: doctor.id,
          status: 'APPROVED',
          permissions: 'Previous consultations,Prescriptions,Lab reports,Medical timeline',
          approvedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
        }
      })
      console.log(`Granted Consent for Patient ID: ${pid}`)
    }
  }

  // Seed OP Registrations for Today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const opData = [
    { patientId: patientIds[1], status: 'WAITING', timeOffset: 2 }, // 2 hours ago
    { patientId: patientIds[2], status: 'IN_CONSULTATION', timeOffset: 1 }, // 1 hour ago
    { patientId: patientIds[3], status: 'COMPLETED', timeOffset: 4 }, // 4 hours ago
  ]

  for (let i = 0; i < opData.length; i++) {
    const data = opData[i]
    let op = await prisma.oPRegistration.findFirst({
      where: { patientId: data.patientId, doctorId: doctor.id, createdAt: { gte: today } }
    })
    
    if (!op) {
      const opDate = new Date(Date.now() - data.timeOffset * 60 * 60 * 1000)
      op = await prisma.oPRegistration.create({
        data: {
          opNumber: `OP-${today.getFullYear()}-9900${i}`,
          patientId: data.patientId,
          doctorId: doctor.id,
          hospitalId: hospital.id,
          department: 'General Medicine',
          visitType: 'CONSULTATION',
          reason: 'Fever and cold',
          status: data.status,
          createdAt: opDate,
          updatedAt: opDate
        }
      })
      console.log(`Created OP Registration for Patient ID: ${data.patientId}`)
      
      // If completed, add a consultation
      if (data.status === 'COMPLETED') {
        await prisma.consultation.create({
          data: {
            patientId: data.patientId,
            doctorId: doctor.id,
            opRegistrationId: op.id,
            symptoms: 'High fever, cough, body ache',
            vitals: 'Temp: 101F, BP: 120/80',
            diagnosis: 'Viral Fever',
            treatment: 'Paracetamol 500mg, rest for 3 days',
            createdAt: new Date(opDate.getTime() + 30 * 60000), // 30 mins after OP
            updatedAt: new Date(opDate.getTime() + 30 * 60000)
          }
        })
        console.log(`Created Consultation for Patient ID: ${data.patientId}`)
      }
    }
  }

  // Add some historical consultations for Rahul (patientIds[0])
  const histCons = await prisma.consultation.findFirst({ where: { patientId: patientIds[0], doctorId: doctor.id } })
  if (!histCons) {
    const pastDate1 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 1 month ago
    const pastDate2 = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 2 months ago
    
    await prisma.consultation.create({
      data: {
        patientId: patientIds[0],
        doctorId: doctor.id,
        symptoms: 'Mild headache',
        vitals: 'Temp: 98.6F',
        diagnosis: 'Tension Headache',
        treatment: 'Rest and hydration',
        createdAt: pastDate1,
        updatedAt: pastDate1
      }
    })
    
    await prisma.consultation.create({
      data: {
        patientId: patientIds[0],
        doctorId: doctor.id,
        symptoms: 'Stomach pain',
        vitals: 'Temp: 99F',
        diagnosis: 'Gastritis',
        treatment: 'Antacids',
        createdAt: pastDate2,
        updatedAt: pastDate2
      }
    })
    console.log(`Created historical consultations for Rahul`)
  }

  console.log('Seed complete!')
}

seed().catch(console.error).finally(() => prisma.$disconnect())
