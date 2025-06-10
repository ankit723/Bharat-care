"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePatient = exports.updatePatient = exports.createPatient = exports.getPatientById = exports.getPatients = void 0;
const db_1 = __importDefault(require("../utils/db"));
// Get all patients
const getPatients = async (req, res) => {
    try {
        const { page = '1', limit = '10', search, doctorId } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        // Build where clause
        let where = {};
        // Add search condition if provided
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { userId: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
                { state: { contains: search, mode: 'insensitive' } },
            ];
        }
        // Add doctorId filter if provided
        if (doctorId) {
            where.doctors = {
                some: {
                    id: doctorId
                }
            };
        }
        const [patients, total] = await Promise.all([
            db_1.default.patient.findMany({
                where,
                skip,
                take: Number(limit),
                select: {
                    id: true,
                    name: true,
                    email: true,
                    userId: true,
                    phone: true,
                    city: true,
                    state: true,
                },
                orderBy: { name: 'asc' },
            }),
            db_1.default.patient.count({ where }),
        ]);
        // Provide search metadata in response to help client-side implementations
        res.json({
            data: patients,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            },
            search: {
                term: search ? String(search) : '',
                recommendedDebounceMs: 300, // Recommend client-side debounce time
                minSearchLength: 2, // Recommend minimum search term length
            }
        });
    }
    catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({
            error: 'Failed to fetch patients',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
};
exports.getPatients = getPatients;
// Get patient by ID
const getPatientById = async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await db_1.default.patient.findUnique({
            where: { id },
            include: {
                doctors: true,
                hospitals: true,
            }
        });
        if (!patient) {
            res.status(404).json({ error: 'Patient not found' });
            return;
        }
        res.json(patient);
    }
    catch (error) {
        console.error('Error fetching patient:', error);
        res.status(500).json({ error: 'Failed to fetch patient' });
    }
};
exports.getPatientById = getPatientById;
// Create a new patient
const createPatient = async (req, res) => {
    try {
        const patientData = req.body;
        const patient = await db_1.default.patient.create({
            data: patientData
        });
        res.status(201).json(patient);
    }
    catch (error) {
        console.error('Error creating patient:', error);
        res.status(500).json({ error: 'Failed to create patient' });
    }
};
exports.createPatient = createPatient;
// Update patient
const updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const patientData = req.body;
        const patient = await db_1.default.patient.update({
            where: { id },
            data: patientData
        });
        res.json(patient);
    }
    catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({ error: 'Failed to update patient' });
    }
};
exports.updatePatient = updatePatient;
// Delete patient
const deletePatient = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.patient.delete({
            where: { id }
        });
        res.status(204).end();
    }
    catch (error) {
        console.error('Error deleting patient:', error);
        res.status(500).json({ error: 'Failed to delete patient' });
    }
};
exports.deletePatient = deletePatient;
