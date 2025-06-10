"use strict";
//initialize the app
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const index_1 = require("./routes/index");
const index_2 = __importDefault(require("./config/index"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Configure CORS with more specific options
app.use((0, cors_1.default)());
app.use((req, res, next) => {
    console.log(req.method, req.url, req.headers['authorization'] ? 'Has Auth' : 'No Auth');
    next();
});
// API routes
app.use('/api/auth', index_1.authRoutes);
app.use('/api/doctors', index_1.doctorRoutes);
app.use('/api/clinics', index_1.clinicRoutes);
app.use('/api/medstores', index_1.medStoreRoutes);
app.use('/api/patients', index_1.patientRoutes);
app.use('/api/hospitals', index_1.hospitalRoutes);
app.use('/api/reviews', index_1.reviewRoutes);
app.use('/api/checkup-centers', index_1.checkupCentersRoutes);
app.use('/api/med-documents', index_1.medDocumentRoutes);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/medicine-schedules', index_1.medicineScheduleRoutes);
app.use('/api/rewards', index_1.rewardRoutes);
// Add a ping endpoint for testing connectivity
app.get('/api/ping', (req, res) => {
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
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
    });
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
const PORT = index_2.default.port;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${index_2.default.nodeEnv} mode`);
});
