"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyPrescriptions = exports.uploadPrescription = void 0;
const db_1 = __importDefault(require("../utils/db"));
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/prescriptions';
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'prescription-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('Only images (JPEG, JPG, PNG) and PDF files are allowed'));
        }
    }
});
// Upload prescription
const uploadPrescription = async (req, res) => {
    try {
        const patientId = req.user?.userId;
        const userRole = req.user?.role;
        if (!patientId || (userRole !== client_1.Role.PATIENT && userRole !== 'patient')) {
            res.status(403).json({ error: 'Only patients can upload prescriptions' });
            return;
        }
        // Use multer middleware
        upload.single('prescription')(req, res, async (err) => {
            if (err) {
                console.error('Upload error:', err);
                res.status(400).json({ error: err.message });
                return;
            }
            if (!req.file) {
                res.status(400).json({ error: 'No file uploaded' });
                return;
            }
            try {
                const { notes } = req.body;
                // Create file URL (you might want to use a proper file storage service like AWS S3)
                const fileUrl = `/uploads/prescriptions/${req.file.filename}`;
                // Create medical document record
                const medDocument = await db_1.default.medDocument.create({
                    data: {
                        fileName: req.file.originalname,
                        fileUrl: fileUrl,
                        documentType: client_1.DocumentType.PRESCRIPTION,
                        patientId: patientId,
                        uploadedById: patientId,
                        uploaderType: client_1.Role.PATIENT,
                        description: notes || 'Prescription uploaded by patient',
                        patientUploaderId: patientId,
                        seekAvailability: true, // Make it available for med stores
                    },
                    include: {
                        patient: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            }
                        }
                    }
                });
                res.status(201).json({
                    success: true,
                    message: 'Prescription uploaded successfully',
                    data: medDocument
                });
            }
            catch (dbError) {
                console.error('Database error:', dbError);
                // Clean up uploaded file if database operation fails
                if (req.file) {
                    fs_1.default.unlink(req.file.path, (unlinkErr) => {
                        if (unlinkErr)
                            console.error('Error deleting file:', unlinkErr);
                    });
                }
                res.status(500).json({ error: 'Failed to save prescription data' });
            }
        });
    }
    catch (error) {
        console.error('Error uploading prescription:', error);
        res.status(500).json({ error: 'Failed to upload prescription' });
    }
};
exports.uploadPrescription = uploadPrescription;
// Get my prescriptions
const getMyPrescriptions = async (req, res) => {
    try {
        const patientId = req.user?.userId;
        const userRole = req.user?.role;
        if (!patientId || (userRole !== client_1.Role.PATIENT && userRole !== 'patient')) {
            res.status(403).json({ error: 'Only patients can view their prescriptions' });
            return;
        }
        const prescriptions = await db_1.default.medDocument.findMany({
            where: {
                patientId: patientId,
                documentType: client_1.DocumentType.PRESCRIPTION,
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                },
                medStoreHandRaises: {
                    include: {
                        medStore: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json({
            success: true,
            data: prescriptions
        });
    }
    catch (error) {
        console.error('Error fetching prescriptions:', error);
        res.status(500).json({ error: 'Failed to fetch prescriptions' });
    }
};
exports.getMyPrescriptions = getMyPrescriptions;
