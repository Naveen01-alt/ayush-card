import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import multer from 'multer';
import authRoutes from './routes/auth';
import patientRoutes from './routes/patient';
import doctorRoutes from './routes/doctor';
import adminRoutes from './routes/admin';
import recordsRoutes from './routes/records';
import auditRoutes from './routes/audit';
import { verifyToken } from './lib/auth';
import { prisma } from './lib/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000', 'https://ayush-card-ten.vercel.app'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/audit', auditRoutes);

// Upload medicine endpoint
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

app.post('/api/upload-medicine', upload.single('file'), async (req, res) => {
  try {
    const token = req.cookies?.auth_token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : undefined);
    let userId = req.body?.patientId;
    if (token) {
      const payload = verifyToken(token);
      if (payload && !userId) {
        userId = payload.id;
      }
    }

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const record = await prisma.patientRecord.create({
      data: {
        patientId: userId,
        title,
        description,
        type: 'MEDICINE_UPLOAD'
      }
    });

    res.json({ success: true, record });
  } catch (error) {
    console.error('Error uploading medicine record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// JSON 404 handler for API routes to guarantee JSON response instead of HTML
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler returning JSON
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err?.message || 'Internal server error' });
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

export default app;
