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

export default router;
