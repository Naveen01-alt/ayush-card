import { Router } from 'express';
import { prisma } from '../lib/db';
import { authenticate } from '../lib/auth';

const router = Router();

router.use(authenticate);

// We can add health records logic here in the future
router.get('/', (req, res) => {
  res.json({ message: 'Records route placeholder' });
});

export default router;
