"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removePatientFromHospital = exports.assignPatientToHospital = exports.deleteHospital = exports.updateHospital = exports.createHospital = exports.getHospitalById = exports.getHospitals = void 0;
const db_1 = __importDefault(require("../utils/db"));
// Get all hospitals
const getHospitals = async (_req, res) => {
    try {
        const hospitals = await db_1.default.hospital.findMany();
        res.json(hospitals);
    }
    catch (error) {
        console.error('Error fetching hospitals:', error);
        res.status(500).json({ error: 'Failed to fetch hospitals' });
    }
};
exports.getHospitals = getHospitals;
// Get hospital by ID
const getHospitalById = async (req, res) => {
    try {
        const { id } = req.params;
        const hospital = await db_1.default.hospital.findUnique({
            where: { id },
            include: {
                doctor: true,
                patients: true,
                reviews: true
            }
        });
        if (!hospital) {
            res.status(404).json({ error: 'Hospital not found' });
            return;
        }
        res.json(hospital);
    }
    catch (error) {
        console.error('Error fetching hospital:', error);
        res.status(500).json({ error: 'Failed to fetch hospital' });
    }
};
exports.getHospitalById = getHospitalById;
// Create a new hospital
const createHospital = async (req, res) => {
    try {
        const hospitalData = req.body;
        const hospital = await db_1.default.hospital.create({
            data: hospitalData
        });
        res.status(201).json(hospital);
    }
    catch (error) {
        console.error('Error creating hospital:', error);
        res.status(500).json({ error: 'Failed to create hospital' });
    }
};
exports.createHospital = createHospital;
// Update hospital
const updateHospital = async (req, res) => {
    try {
        const { id } = req.params;
        const hospitalData = req.body;
        const hospital = await db_1.default.hospital.update({
            where: { id },
            data: hospitalData
        });
        res.json(hospital);
    }
    catch (error) {
        console.error('Error updating hospital:', error);
        res.status(500).json({ error: 'Failed to update hospital' });
    }
};
exports.updateHospital = updateHospital;
// Delete hospital
const deleteHospital = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.hospital.delete({
            where: { id }
        });
        res.status(204).end();
    }
    catch (error) {
        console.error('Error deleting hospital:', error);
        res.status(500).json({ error: 'Failed to delete hospital' });
    }
};
exports.deleteHospital = deleteHospital;
// Assign a patient to a hospital
const assignPatientToHospital = async (req, res) => {
    try {
        const { hospitalId, patientId } = req.body;
        if (!hospitalId || !patientId) {
            res.status(400).json({ error: 'Hospital ID and Patient ID are required' });
            return;
        }
        const hospital = await db_1.default.hospital.update({
            where: { id: hospitalId },
            data: {
                patients: {
                    connect: {
                        id: patientId,
                    }
                }
            },
            include: {
                patients: true,
                doctor: true,
                reviews: true
            },
        });
        res.json(hospital);
    }
    catch (error) {
        console.error('Error assigning patient to hospital:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Hospital or patient not found' });
            return;
        }
        res.status(500).json({ error: 'Failed to assign patient to hospital' });
    }
};
exports.assignPatientToHospital = assignPatientToHospital;
// Remove a patient from a hospital
const removePatientFromHospital = async (req, res) => {
    try {
        const { hospitalId, patientId } = req.body;
        if (!hospitalId || !patientId) {
            res.status(400).json({ error: 'Hospital ID and Patient ID are required' });
            return;
        }
        const hospital = await db_1.default.hospital.update({
            where: { id: hospitalId },
            data: {
                patients: {
                    disconnect: {
                        id: patientId,
                    }
                }
            },
            include: {
                patients: true,
                doctor: true,
                reviews: true
            },
        });
        res.json(hospital);
    }
    catch (error) {
        console.error('Error removing patient from hospital:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Hospital or patient not found, or patient not assigned' });
            return;
        }
        res.status(500).json({ error: 'Failed to remove patient from hospital' });
    }
};
exports.removePatientFromHospital = removePatientFromHospital;
