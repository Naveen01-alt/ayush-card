import { Router } from 'express';
import { prisma } from '../lib/db';
import { authenticate, requireRole } from '../lib/auth';

const router = Router();

router.use(authenticate);
router.use(requireRole(['ADMIN']));

router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      patients,
      doctors,
      todayOP,
      consents,
      auditLogs,
      totalConsultations
    ] = await Promise.all([
      prisma.user.findMany({ 
        where: { role: 'PATIENT' }, 
        include: { patientProfile: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.findMany({ 
        where: { role: 'DOCTOR' }, 
        include: { doctorProfile: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.oPRegistration.findMany({ 
        where: { createdAt: { gte: today } }, 
        include: { patient: true, doctor: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.consent.findMany({ 
        include: { patient: true, doctor: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditLog.findMany({ 
        include: { actor: true }, 
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      prisma.consultation.count()
    ]);

    const activeConsentsCount = consents.filter((c: any) => c.status === 'APPROVED').length;
    const securityEvents = auditLogs.filter((log: any) => 
      ['RECORD_ACCESS_DENIED', 'DOCTOR_LOGIN_FAILED', 'CONSENT_EXPIRED_ATTEMPT'].includes(log.action)
    );

    const data = {
      patients,
      doctors,
      todayOP,
      consents,
      auditLogs,
      stats: {
        totalPatients: patients.length,
        totalDoctors: doctors.length,
        todayOPCount: todayOP.length,
        activeConsentsCount,
        totalConsultations,
        securityEventsCount: securityEvents.length
      }
    };

    res.json(data);
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
