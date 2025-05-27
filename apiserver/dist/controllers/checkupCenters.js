"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePatientNextVisit = exports.removePatientFromCheckupCenter = exports.assignPatientToCheckupCenter = exports.deleteCheckupCenter = exports.updateCheckupCenter = exports.createCheckupCenter = exports.getCheckupCenterById = exports.getCheckupCenters = void 0;
const db_1 = __importDefault(require("../utils/db")); // Use shared prisma instance
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
// Get all checkup centers with pagination and search
const getCheckupCenters = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { city: { contains: search, mode: 'insensitive' } },
                    { state: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};
        const [checkupCenters, total] = await Promise.all([
            db_1.default.checkupCenter.findMany({
                where,
                skip,
                take: Number(limit),
                include: {
                    patients: { select: { id: true, name: true } }, // Include basic patient info
                },
                orderBy: { createdAt: 'desc' },
            }),
            db_1.default.checkupCenter.count({ where }),
        ]);
        // Omit passwords if they were to be included in the future for some reason
        const centersWithoutPasswords = checkupCenters.map(({ password, ...center }) => center);
        res.json({
            data: centersWithoutPasswords,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Error fetching checkup centers:', error);
        res.status(500).json({ error: 'Failed to fetch checkup centers' });
    }
};
exports.getCheckupCenters = getCheckupCenters;
// Get checkup center by ID
const getCheckupCenterById = async (req, res) => {
    try {
        const { id } = req.params;
        const checkupCenter = await db_1.default.checkupCenter.findUnique({
            where: { id },
            include: {
                patients: {
                    include: {
                        checkupCenterNextVisit: {
                            where: { checkupCenterId: id }, // Filter for visits with this center
                            orderBy: { nextVisit: 'desc' }, // Get the latest one
                            take: 1,
                        }
                    }
                },
                medDocuments: {
                    where: { uploadedById: id, uploaderType: client_1.Role.CHECKUP_CENTER },
                    include: { patient: { select: { id: true, name: true } } }
                }
            },
        });
        if (!checkupCenter) {
            res.status(404).json({ error: 'Checkup center not found' });
            return;
        }
        const { password, ...centerData } = checkupCenter;
        // Map patients to include a simplified checkupCenterNextVisit field
        const processedPatients = centerData.patients.map(patient => {
            const latestVisit = patient.checkupCenterNextVisit && patient.checkupCenterNextVisit.length > 0
                ? patient.checkupCenterNextVisit[0].nextVisit
                : null;
            const { checkupCenterNextVisit, ...patientWithoutFullVisitData } = patient;
            return {
                ...patientWithoutFullVisitData,
                checkupCenterNextVisit: latestVisit, // This will be Date | null
            };
        });
        res.json({ ...centerData, patients: processedPatients });
    }
    catch (error) {
        console.error('Error fetching checkup center:', error);
        res.status(500).json({ error: 'Failed to fetch checkup center' });
    }
};
exports.getCheckupCenterById = getCheckupCenterById;
// Create a new checkup center
const createCheckupCenter = async (req, res) => {
    try {
        const { name, email, password, phone, addressLine, city, state, pin, country } = req.body;
        if (!name || !email || !password || !phone) {
            res.status(400).json({ error: 'Name, email, password, and phone are required' });
            return;
        }
        const existingCenter = await db_1.default.checkupCenter.findUnique({ where: { email } });
        if (existingCenter) {
            res.status(400).json({ error: 'A checkup center with this email already exists' });
            return;
        }
        const saltRounds = 10;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        const checkupCenter = await db_1.default.checkupCenter.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                addressLine: addressLine || '',
                city: city || '',
                state: state || '',
                pin: pin || '',
                country: country || '',
            },
        });
        const { password: _, ...centerWithoutPassword } = checkupCenter;
        res.status(201).json(centerWithoutPassword);
    }
    catch (error) {
        console.error('Error creating checkup center:', error);
        res.status(500).json({ error: 'Failed to create checkup center' });
    }
};
exports.createCheckupCenter = createCheckupCenter;
// Update checkup center
const updateCheckupCenter = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, addressLine, city, state, pin, country, password } = req.body;
        let hashedPassword;
        if (password) {
            const saltRounds = 10;
            hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        }
        const checkupCenter = await db_1.default.checkupCenter.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                addressLine,
                city,
                state,
                pin,
                country,
                ...(hashedPassword && { password: hashedPassword }),
            },
        });
        const { password: _, ...centerWithoutPassword } = checkupCenter;
        res.json(centerWithoutPassword);
    }
    catch (error) {
        console.error('Error updating checkup center:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Checkup center not found' });
            return;
        }
        res.status(500).json({ error: 'Failed to update checkup center' });
    }
};
exports.updateCheckupCenter = updateCheckupCenter;
// Delete checkup center
const deleteCheckupCenter = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.checkupCenter.delete({ where: { id } });
        res.json({ message: 'Checkup center deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting checkup center:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Checkup center not found' });
            return;
        }
        res.status(500).json({ error: 'Failed to delete checkup center' });
    }
};
exports.deleteCheckupCenter = deleteCheckupCenter;
// Assign a patient to a checkup center
const assignPatientToCheckupCenter = async (req, res) => {
    try {
        const { checkupCenterId, patientId } = req.body;
        if (!checkupCenterId || !patientId) {
            res.status(400).json({ error: 'Checkup Center ID and Patient ID are required' });
            return;
        }
        const updatedCenter = await db_1.default.checkupCenter.update({
            where: { id: checkupCenterId },
            data: {
                patients: {
                    connect: { id: patientId }
                }
            },
            include: { patients: true }
        });
        const { password, ...centerWithoutPassword } = updatedCenter;
        res.json(centerWithoutPassword);
    }
    catch (error) {
        console.error('Error assigning patient to checkup center:', error);
        if (error.code === 'P2025') { // Target record not found
            res.status(404).json({ error: 'Checkup center or patient not found' });
            return;
        }
        res.status(500).json({ error: 'Failed to assign patient' });
    }
};
exports.assignPatientToCheckupCenter = assignPatientToCheckupCenter;
// Remove a patient from a checkup center
const removePatientFromCheckupCenter = async (req, res) => {
    try {
        const { checkupCenterId, patientId } = req.body;
        if (!checkupCenterId || !patientId) {
            res.status(400).json({ error: 'Checkup Center ID and Patient ID are required' });
            return;
        }
        const updatedCenter = await db_1.default.checkupCenter.update({
            where: { id: checkupCenterId },
            data: {
                patients: {
                    disconnect: { id: patientId }
                }
            },
            include: { patients: true }
        });
        const { password, ...centerWithoutPassword } = updatedCenter;
        res.json(centerWithoutPassword);
    }
    catch (error) {
        console.error('Error removing patient from checkup center:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Checkup center or patient not found, or patient not assigned' });
            return;
        }
        res.status(500).json({ error: 'Failed to remove patient' });
    }
};
exports.removePatientFromCheckupCenter = removePatientFromCheckupCenter;
// Update patient's next visit date for a checkup center
const updatePatientNextVisit = async (req, res) => {
    try {
        const { checkupCenterId, patientId } = req.params;
        const { nextVisitDate } = req.body;
        if (!checkupCenterId || !patientId || !nextVisitDate) {
            res.status(400).json({ error: 'Checkup Center ID, Patient ID, and next visit date are required' });
            return;
        }
        const newVisitDate = new Date(nextVisitDate);
        // Verify if the patient is assigned to this checkup center
        const center = await db_1.default.checkupCenter.findFirst({
            where: {
                id: checkupCenterId,
                patients: {
                    some: {
                        id: patientId
                    }
                }
            }
        });
        if (!center) {
            res.status(404).json({ error: 'Checkup center not found or patient not assigned to this center' });
            return;
        }
        // Upsert the next visit for the checkup center
        const existingVisit = await db_1.default.checkupCenterNextVisit.findFirst({
            where: {
                checkupCenterId: checkupCenterId,
                patientId: patientId,
            }
        });
        if (existingVisit) {
            const updatedVisit = await db_1.default.checkupCenterNextVisit.update({
                where: { id: existingVisit.id },
                data: { nextVisit: newVisitDate },
                include: { patient: true }
            });
            const patientData = {
                ...updatedVisit.patient,
                checkupCenterNextVisit: updatedVisit.nextVisit
            };
            res.json(patientData);
        }
        else {
            const newVisit = await db_1.default.checkupCenterNextVisit.create({
                data: {
                    checkupCenterId: checkupCenterId,
                    patientId: patientId,
                    nextVisit: newVisitDate,
                },
                include: { patient: true }
            });
            const patientData = {
                ...newVisit.patient,
                checkupCenterNextVisit: newVisit.nextVisit
            };
            res.json(patientData);
        }
    }
    catch (error) {
        console.error('Error updating patient next visit date for checkup center:', error);
        if (error.code === 'P2025') { // Patient not found or related record for update failed
            res.status(404).json({ error: 'Patient not found or related record for update failed.' });
            return;
        }
        res.status(500).json({ error: 'Failed to update patient next visit date' });
    }
};
exports.updatePatientNextVisit = updatePatientNextVisit;
