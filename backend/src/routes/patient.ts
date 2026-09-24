import { Router } from 'express';
import { prisma } from '../lib/db';
import { authenticate, requireRole, UserPayload } from '../lib/auth';

const router = Router();

// Apply auth middleware to all routes in this router
router.use(authenticate);
router.use(requireRole(['PATIENT']));

router.get('/dashboard', async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user as UserPayload;

    const patient = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        patientProfile: true,
        consentsGiven: {
          include: { doctor: { include: { doctorProfile: true } } },
          orderBy: { createdAt: 'desc' }
        },
        records: {
          include: { doctor: { include: { doctorProfile: true } } },
          orderBy: { createdAt: 'desc' }
        },
        opRegistrations: {
          include: { doctor: { include: { doctorProfile: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    const availableDoctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      include: { doctorProfile: true }
    });

    if (!patient || !patient.patientProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ patient, availableDoctors });
  } catch (error) {
    console.error('Error fetching patient dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/consent', async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user as UserPayload;
    const { consentId, action } = req.body;

    if (!consentId || !action) {
      return res.status(400).json({ error: 'consentId and action are required' });
    }

    const consent = await prisma.consent.findUnique({
      where: { id: consentId }
    });

    if (!consent || consent.patientId !== user.id) {
      return res.status(404).json({ error: 'Consent not found' });
    }

    if (action === 'APPROVE') {
      await prisma.consent.update({
        where: { id: consentId },
        data: { status: 'APPROVED' }
      });
    } else if (action === 'REJECT') {
      await prisma.consent.update({
        where: { id: consentId },
        data: { status: 'REJECTED' }
      });
    } else if (action === 'REVOKE') {
      await prisma.consent.update({
        where: { id: consentId },
        data: { status: 'REVOKED' }
      });
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating consent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/op', async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user as UserPayload;
    const { doctorId, reason } = req.body;

    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }

    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      include: { doctorProfile: true }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const today = new Date();
    const count = await prisma.oPRegistration.count();
    const opNumber = `OP-${today.getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const hospital = await prisma.hospital.findFirst();

    const op = await prisma.oPRegistration.create({
      data: {
        opNumber,
        patientId: user.id,
        doctorId,
        hospitalId: hospital?.id,
        department: doctor.doctorProfile?.specialization || 'General Medicine',
        visitType: 'CONSULTATION',
        reason: reason || 'General Consultation',
        status: 'WAITING'
      }
    });

    res.json({ success: true, op });
  } catch (error) {
    console.error('Error creating OP registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
