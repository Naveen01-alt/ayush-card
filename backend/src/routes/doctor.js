"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../lib/db");
const auth_1 = require("../lib/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use((0, auth_1.requireRole)(['DOCTOR']));
router.get('/dashboard', async (req, res) => {
    try {
        // @ts-ignore
        const user = req.user;
        const doctor = await db_1.prisma.user.findUnique({
            where: { id: user.id },
            include: { doctorProfile: true }
        });
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [todaysOP, patientsSeen, pendingConsents, activeConsentsList] = await Promise.all([
            db_1.prisma.oPRegistration.count({
                where: {
                    doctorId: user.id,
                    status: { not: 'COMPLETED' },
                    createdAt: { gte: today }
                }
            }),
            db_1.prisma.consultation.count({
                where: { doctorId: user.id }
            }),
            db_1.prisma.consent.count({
                where: {
                    doctorId: user.id,
                    status: 'PENDING'
                }
            }),
            db_1.prisma.consent.findMany({
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
    }
    catch (error) {
        console.error('Error fetching doctor dashboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/patients', async (req, res) => {
    try {
        // @ts-ignore
        const user = req.user;
        const consents = await db_1.prisma.consent.findMany({
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
    }
    catch (error) {
        console.error('Error fetching doctor patients:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=doctor.js.map