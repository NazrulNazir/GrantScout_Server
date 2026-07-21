import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import aiRoutes from './routes/aiRoutes';
import grantRoutes from './routes/grantRoutes';
import rateLimit from 'express-rate-limit';
import { sanitize } from 'express-mongo-sanitize';

dotenv.config();
connectDB(); // Connect to MongoDB

const app = express();
app.set('trust proxy', 1); // Trust first proxy (Vercel/reverse proxy) for correct req.ip
const PORT = process.env.PORT || 5000;

// CORS & Body Parsing (must be before rate limiter and sanitize)
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Security Middlewares
app.use(helmet());
app.use((req, res, next) => {
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: 'Too many requests from this IP, please try again after 15 minutes',
  validate: { trustProxy: false }, // We handle trust proxy ourselves via app.set()
});
app.use('/api', limiter);

// Routes
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'GrantScout API is running' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/grants', grantRoutes);


// Error Handling Middleware
app.use(errorHandler as any);

app.get("/", (req, res) => {
  res.send("GrantScout Server is Running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
