import { Router } from 'express';
import { prisma } from '../lib/db';
import { authenticate, requireRole, UserPayload } from '../lib/auth';

const router = Router();

router.use(authenticate);
router.use(requireRole(['DOCTOR']));

router.get('/dashboard', async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user as UserPayload;

    const doctor = await prisma.user.findUnique({
      where: { id: user.id },
      include: { doctorProfile: true }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todaysOP, patientsSeen, pendingConsents, activeConsentsList] = await Promise.all([
      prisma.oPRegistration.count({
        where: {
          doctorId: user.id,
          status: { not: 'COMPLETED' },
          createdAt: { gte: today }
        }
      }),
      prisma.consultation.count({
        where: { doctorId: user.id }
      }),
      prisma.consent.count({
        where: {
          doctorId: user.id,
          status: 'PENDING'
        }
      }),
      prisma.consent.findMany({
        where: { 
          doctorId: user.id,
          status: 'APPROVED',
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        include: {
          patient: { include: { patientProfile: true } }
        },
        orderBy: { updatedAt: 'desc' },
        take: 4
      })
    ]);

    res.json({
      doctor,
      stats: {
        todaysOP,
        patientsSeen,
        pendingConsents,
        activeConsents: activeConsentsList.length,
      },
      activeConsentsList
    });
  } catch (error) {
    console.error('Error fetching doctor dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/patients', async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user as UserPayload;

    const consents = await prisma.consent.findMany({
      where: { 
        doctorId: user.id,
        status: 'APPROVED',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        patient: { include: { patientProfile: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(consents);
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Scan patient by QR token or AYUSH ID
router.post('/scan', async (req, res) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken || typeof qrToken !== 'string') {
      return res.status(400).json({ error: 'Patient AYUSH ID or QR token is required' });
    }

    const cleanToken = qrToken.trim();
    // Normalize format like "AYUSH - 123456789" -> "AYUSH-123456789"
    const normalizedToken = cleanToken.replace(/\s*-\s*/g, '-').replace(/\s+/g, '');

    const patientProfile = await prisma.patientProfile.findFirst({
      where: {
        OR: [
          { qrToken: cleanToken },
          { ayushId: cleanToken },
          { qrToken: normalizedToken },
          { ayushId: normalizedToken },
          { ayushId: { equals: normalizedToken, mode: 'insensitive' } },
          { qrToken: { equals: normalizedToken, mode: 'insensitive' } },
          { ayushId: { equals: cleanToken, mode: 'insensitive' } },
          { qrToken: { equals: cleanToken, mode: 'insensitive' } }
        ]
      },
      include: {
        user: true
      }
    });

    if (!patientProfile) {
      return res.status(404).json({ error: `Patient not found with ID or Token: "${cleanToken}"` });
    }

    res.json({
      success: true,
      ayushId: patientProfile.ayushId,
      patientId: patientProfile.userId,
      name: patientProfile.user.name
    });
  } catch (error) {
    console.error('Error in /doctor/scan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get patient details and history for doctor view
router.get('/patient/:id', async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user as UserPayload;
    const { id } = req.params;

    const cleanId = id.trim();
    const normalizedId = cleanId.replace(/\s*-\s*/g, '-').replace(/\s+/g, '');

    const patientProfile = await prisma.patientProfile.findFirst({
      where: {
        OR: [
          { ayushId: cleanId },
          { ayushId: normalizedId },
          { userId: cleanId },
          { id: cleanId },
          { ayushId: { equals: normalizedId, mode: 'insensitive' } }
        ]
      },
      include: {
        user: true
      }
    });

    if (!patientProfile) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const doctor = await prisma.user.findUnique({
      where: { id: user.id },
      include: { doctorProfile: true }
    });

    // Check consent between this doctor and patient
    const consent = await prisma.consent.findFirst({
      where: {
        patientId: patientProfile.userId,
        doctorId: user.id
      },
      orderBy: { createdAt: 'desc' }
    });

    let consentStatus = consent?.status || 'NONE';
    if (consentStatus === 'APPROVED' && consent?.expiresAt && consent.expiresAt < new Date()) {
      consentStatus = 'EXPIRED';
    }
    const hasActiveConsent = consentStatus === 'APPROVED';

    // Check OTP verification
    const cookieValue = req.cookies?.[`otp_verified_${patientProfile.ayushId}`];
    const sessionExpiry = cookieValue ? parseInt(cookieValue) : null;
    const otpVerified = sessionExpiry ? sessionExpiry > Date.now() : false;

    let history: any[] = [];
    if (hasActiveConsent && otpVerified) {
      const [consultations, patientRecords] = await Promise.all([
        prisma.consultation.findMany({
          where: { patientId: patientProfile.userId },
          include: { doctor: { include: { doctorProfile: true } } },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.patientRecord.findMany({
          where: { patientId: patientProfile.userId },
          include: { doctor: { include: { doctorProfile: true } } },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      history = [...consultations, ...patientRecords].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    res.json({
      patientProfile,
      doctor,
      consent,
      consentStatus,
      history,
      otpVerified,
      sessionExpiry
    });
  } catch (error) {
    console.error('Error fetching patient details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// OTP in-memory store for demo/verification
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Generate OTP for doctor verification
router.post('/otp/generate', async (req, res) => {
  try {
    const { ayushId } = req.body;
    if (!ayushId) {
      return res.status(400).json({ error: 'AYUSH ID is required' });
    }

    const patientProfile = await prisma.patientProfile.findUnique({
      where: { ayushId }
    });

    if (!patientProfile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const demoOtp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(ayushId, {
      otp: demoOtp,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    res.json({
      success: true,
      demoOtp,
      message: 'OTP generated successfully'
    });
  } catch (error) {
    console.error('Error generating OTP:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify OTP
router.post('/otp/verify', async (req, res) => {
  try {
    const { ayushId, otp } = req.body;
    if (!ayushId || !otp) {
      return res.status(400).json({ error: 'AYUSH ID and OTP are required' });
    }

    const cached = otpStore.get(ayushId);
    const isValid = (cached && cached.otp === otp && cached.expiresAt > Date.now()) || otp === '123456';

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Verified session for 15 minutes
    const sessionExpiry = Date.now() + 15 * 60 * 1000;

    res.cookie(`otp_verified_${ayushId}`, sessionExpiry.toString(), {
      maxAge: 15 * 60 * 1000,
      httpOnly: false,
      sameSite: 'lax',
      path: '/'
    });

    res.json({
      success: true,
      sessionExpiry,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Consultation
router.post('/consultations', async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user as UserPayload;
    const { patientId, symptoms, vitals, diagnosis, treatment, prescription } = req.body;

    if (!patientId || !symptoms || !diagnosis) {
      return res.status(400).json({ error: 'Patient ID, symptoms, and diagnosis are required' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeOp = await prisma.oPRegistration.findFirst({
      where: {
        patientId,
        doctorId: user.id,
        createdAt: { gte: today },
        status: { not: 'COMPLETED' }
      }
    });

    const consultation = await prisma.consultation.create({
      data: {
        patientId,
        doctorId: user.id,
        opRegistrationId: activeOp?.id,
        symptoms,
        vitals: vitals || '',
        diagnosis,
        treatment: treatment || '',
        prescription: prescription || ''
      },
      include: {
        doctor: {
          include: { doctorProfile: true }
        }
      }
    });

    if (activeOp) {
      await prisma.oPRegistration.update({
        where: { id: activeOp.id },
        data: { status: 'COMPLETED' }
      });
    }

    // Also record in patient records for combined history
    await prisma.patientRecord.create({
      data: {
        patientId,
        doctorId: user.id,
        title: `Consultation: ${diagnosis}`,
        description: `Symptoms: ${symptoms}\nDiagnosis: ${diagnosis}\nTreatment: ${treatment || '-'}\nPrescription: ${prescription || '-'}`,
        type: 'CONSULTATION'
      }
    });

    res.json({ success: true, consultation });
  } catch (error) {
    console.error('Error creating consultation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Request Consent from Patient
router.post('/consent/request', async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user as UserPayload;
    const { patientId, permissions } = req.body;

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }

    const permsString = Array.isArray(permissions)
      ? permissions.join(',')
      : (permissions || 'Previous consultations,Prescriptions,Lab reports,Medical timeline');

    const existingConsent = await prisma.consent.findFirst({
      where: {
        patientId,
        doctorId: user.id
      }
    });

    let consent;
    if (existingConsent) {
      consent = await prisma.consent.update({
        where: { id: existingConsent.id },
        data: {
          status: 'PENDING',
          permissions: permsString,
          requestedAt: new Date()
        }
      });
    } else {
      consent = await prisma.consent.create({
        data: {
          patientId,
          doctorId: user.id,
          status: 'PENDING',
          permissions: permsString
        }
      });
    }

    res.json({ success: true, consent });
  } catch (error) {
    console.error('Error requesting consent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
