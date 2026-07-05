import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import apiRoutes from './routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' })); // support large canvas drawings
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Atlas connection setup
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  console.log('Initiating MongoDB Atlas Connection...');
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log('Successfully connected to MongoDB Atlas cluster.');
    })
    .catch((err) => {
      console.error('Mongoose failed to connect to MongoDB Atlas. Falling back to High-Stability Sandbox Memory DB.');
      console.error(err);
    });
} else {
  console.log('No MONGODB_URI detected in env. Nexus is operating in High-Stability In-Memory Sandbox Mode.');
}

// Register API Routes
app.use('/api', apiRoutes);

// Vite Integration Middleware
async function configureVite() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Configuring Vite developer middleware routing...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Production mode detected. Mounting static distribution directories...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// Start Server after configuring Vite
configureVite().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`===========================================================`);
    console.log(`🚀 Nexus Platform running on http://${HOST}:${PORT}`);
    console.log(`🌐 Sandbox UI accessible in real-time.`);
    console.log(`===========================================================`);
  });
}).catch(err => {
  console.error('Error starting server or configuring Vite:', err);
});
