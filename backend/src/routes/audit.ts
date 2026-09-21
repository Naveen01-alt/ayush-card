import { Router } from 'express';
import { prisma } from '../lib/db';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { actorId, action, targetId, details } = req.body;

    if (!actorId || !action) {
      return res.status(400).json({ error: 'actorId and action are required' });
    }

    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        targetId,
        details
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to write audit log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
