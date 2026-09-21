"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../lib/db");
const auth_1 = require("../lib/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use((0, auth_1.requireRole)(['ADMIN']));
router.get('/dashboard', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [patients, doctors, todayOP, consents, auditLogs, totalConsultations] = await Promise.all([
            db_1.prisma.user.findMany({
                where: { role: 'PATIENT' },
                include: { patientProfile: true },
                orderBy: { createdAt: 'desc' }
            }),
            db_1.prisma.user.findMany({
                where: { role: 'DOCTOR' },
                include: { doctorProfile: true },
                orderBy: { createdAt: 'desc' }
            }),
            db_1.prisma.oPRegistration.findMany({
                where: { createdAt: { gte: today } },
                include: { patient: true, doctor: true },
                orderBy: { createdAt: 'desc' }
            }),
            db_1.prisma.consent.findMany({
                include: { patient: true, doctor: true },
                orderBy: { createdAt: 'desc' }
            }),
            db_1.prisma.auditLog.findMany({
                include: { actor: true },
                orderBy: { createdAt: 'desc' },
                take: 100
            }),
            db_1.prisma.consultation.count()
        ]);
        const activeConsentsCount = consents.filter(c => c.status === 'APPROVED').length;
        const securityEvents = auditLogs.filter(log => ['RECORD_ACCESS_DENIED', 'DOCTOR_LOGIN_FAILED', 'CONSENT_EXPIRED_ATTEMPT'].includes(log.action));
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
    }
    catch (error) {
        console.error('Error fetching admin dashboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map