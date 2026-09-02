import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import casesRouter from './routes/cases.js';
import analyticsRouter from './routes/analytics.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.use('/api/auth', authRouter);
app.use('/api/cases', casesRouter);
app.use('/api/analytics', analyticsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'LMPC Gateway Running' });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI || '')
  .then(() => {
    console.log('MongoDB Connected Successfully');
    app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB Connection Error:', err));