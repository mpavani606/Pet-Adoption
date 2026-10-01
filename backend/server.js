import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import petRoutes from './routes/petRoutes.js';
import requestRoutes from './routes/requestRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'pet-adoption-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/requests', requestRoutes);
app.use((error, req, res, next) => { console.error(error); res.status(error.name === 'ValidationError' ? 400 : 500).json({ message: error.name === 'ValidationError' ? error.message : 'Something went wrong on the server' }); });

const port = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') connectDB().then(() => app.listen(port, () => console.log(`API listening on http://localhost:${port}`))).catch((error) => { console.error(error.message); process.exit(1); });
export default app;
