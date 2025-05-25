"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePatient = exports.updatePatient = exports.createPatient = exports.getPatientById = exports.getPatients = void 0;
const db_1 = __importDefault(require("../utils/db"));
// Get all patients
const getPatients = async (_req, res) => {
    try {
        const patients = await db_1.default.patient.findMany();
        res.json(patients);
    }
    catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ error: 'Failed to fetch patients' });
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
