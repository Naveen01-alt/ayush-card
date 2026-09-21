"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../lib/db");
const router = (0, express_1.Router)();
router.post('/', async (req, res) => {
    try {
        const { actorId, action, targetId, details } = req.body;
        if (!actorId || !action) {
            return res.status(400).json({ error: 'actorId and action are required' });
        }
        await db_1.prisma.auditLog.create({
            data: {
                actorId,
                action,
                targetId,
                details
            }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Failed to write audit log:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=audit.js.map