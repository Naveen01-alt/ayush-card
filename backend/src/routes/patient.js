"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../lib/db");
const auth_1 = require("../lib/auth");
const router = (0, express_1.Router)();
// Apply auth middleware to all routes in this router
router.use(auth_1.authenticate);
router.use((0, auth_1.requireRole)(['PATIENT']));
router.get('/dashboard', async (req, res) => {
    try {
        // @ts-ignore
        const user = req.user;
        const patient = await db_1.prisma.user.findUnique({
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
        const availableDoctors = await db_1.prisma.user.findMany({
            where: { role: 'DOCTOR' },
            include: { doctorProfile: true }
        });
        if (!patient || !patient.patientProfile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.json({ patient, availableDoctors });
    }
    catch (error) {
        console.error('Error fetching patient dashboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/consent', async (req, res) => {
    try {
        // @ts-ignore
        const user = req.user;
        const { consentId, action } = req.body;
        if (!consentId || !action) {
            return res.status(400).json({ error: 'consentId and action are required' });
        }
        const consent = await db_1.prisma.consent.findUnique({
            where: { id: consentId }
        });
        if (!consent || consent.patientId !== user.id) {
            return res.status(404).json({ error: 'Consent not found' });
        }
        if (action === 'APPROVE') {
            await db_1.prisma.consent.update({
                where: { id: consentId },
                data: { status: 'APPROVED' }
            });
        }
        else if (action === 'REJECT') {
            await db_1.prisma.consent.update({
                where: { id: consentId },
                data: { status: 'REJECTED' }
            });
        }
        else if (action === 'REVOKE') {
            await db_1.prisma.consent.update({
                where: { id: consentId },
                data: { status: 'REVOKED' }
            });
        }
        else {
            return res.status(400).json({ error: 'Invalid action' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating consent:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=patient.js.map