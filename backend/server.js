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
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/compylescan';

mongoose.connect(mongoURI, {
  family: 4, // Forces IPv4 instead of trying IPv6 ::1
})
.then(() => {
  console.log('MongoDB Connected Successfully to Local Instance');
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
})
.catch((err) => {
  console.error('MongoDB Connection Error:', err);
  console.log('\n👉 Tip: Make sure MongoDB Community Server is running.');
});
