//initialize the app

import express, { Request, Response } from 'express'
import cors from 'cors'
import { 
  authRoutes, 
  patientRoutes, 
  hospitalRoutes, 
  checkupCentersRoutes,
  doctorRoutes,
  clinicRoutes,
  medStoreRoutes,
  reviewRoutes,
  medDocumentRoutes,
  medicineScheduleRoutes,
  rewardRoutes,
  prescriptionRoutes,
  globalMedicineRoutes
} from './routes/index'
import config from './config/index'
import adminRoutes from './routes/adminRoutes'
import homeRoutes from './routes/homeRoutes'
import appointmentRoutes from './routes/appointmentRoutes'
import searchRoutes from './routes/searchRoutes'

const app = express()

app.use(express.json())

// Configure CORS with more specific options
app.use(cors())

app.use((req, res, next) => {
  console.log(req.method, req.url, req.headers['authorization'] ? 'Has Auth' : 'No Auth');
  next()
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/clinics', clinicRoutes)
app.use('/api/medstores', medStoreRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/hospitals', hospitalRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/checkup-centers', checkupCentersRoutes)
app.use('/api/med-documents', medDocumentRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/medicine-schedules', medicineScheduleRoutes)
app.use('/api/rewards', rewardRoutes)
app.use('/api/prescriptions', prescriptionRoutes)
app.use('/api/global-medicine', globalMedicineRoutes)

// New patient mobile app routes
app.use('/api/home', homeRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/search', searchRoutes)

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'))

// Add a ping endpoint for testing connectivity
app.get('/api/ping', (req: Request, res: Response) => {
  // Log request details
  console.log('Received ping request');
  console.log('Headers:', req.headers);
  
  res.status(200).json({
    status: 'success',
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  })
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

const PORT = config.port

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${config.nodeEnv} mode`)
})

