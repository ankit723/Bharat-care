"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePatientNextVisit = exports.removePatientFromDoctor = exports.assignPatientToDoctor = exports.assignDoctorToHospital = exports.deleteDoctor = exports.updateDoctor = exports.createDoctor = exports.getDoctorById = exports.getDoctors = void 0;
const db_1 = __importDefault(require("../utils/db"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Get all doctors
const getDoctors = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search } },
                    { city: { contains: search, mode: 'insensitive' } },
                    { state: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};
        const [doctors, total] = await Promise.all([
            db_1.default.doctor.findMany({
                where,
                skip: parseInt(skip.toString()),
                take: parseInt(limit.toString()),
                include: {
                    clinic: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                        },
                    },
                    hospitals: {
                        select: {
                            id: true,
                            name: true,
                            city: true,
                            state: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            db_1.default.doctor.count({ where }),
        ]);
        // Remove passwords from response
        const doctorsWithoutPasswords = doctors.map(({ password, ...doctor }) => doctor);
        res.json({
            data: doctorsWithoutPasswords,
            pagination: {
                page: parseInt(page.toString()),
                limit: parseInt(limit.toString()),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ error: 'Failed to fetch doctors' });
    }
};
exports.getDoctors = getDoctors;
// Get doctor by ID
const getDoctorById = async (req, res) => {
    try {
        const { id } = req.params;
        const doctor = await db_1.default.doctor.findUnique({
            where: { id },
            include: {
                clinic: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        addressLine: true,
                        city: true,
                        state: true,
                        pin: true,
                        country: true,
                    },
                },
                hospitals: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        addressLine: true,
                        city: true,
                        state: true,
                        pin: true,
                        country: true,
                    },
                },
                patients: {
                    include: {
                        doctorNextVisit: {
                            where: { doctorId: id },
                            orderBy: { nextVisit: 'desc' },
                            take: 1,
                        }
                    }
                },
                reviews: {
                    include: {
                        patient: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            }
        });
        if (!doctor) {
            res.status(404).json({ error: 'Doctor not found' });
            return;
        }
        // Remove password from response
        const { password, ...doctorData } = doctor;
        // Map patients to include a simplified doctorNextVisit field
        const processedPatients = doctorData.patients.map(patient => {
            const latestVisit = patient.doctorNextVisit && patient.doctorNextVisit.length > 0
                ? patient.doctorNextVisit[0].nextVisit
                : null;
            // Create a new object for the patient without the full doctorNextVisit array
            // and with the simplified doctorNextVisit date
            const { doctorNextVisit, ...patientWithoutFullVisitData } = patient;
            return {
                ...patientWithoutFullVisitData,
                doctorNextVisit: latestVisit, // This will be Date | null
            };
        });
        res.json({ ...doctorData, patients: processedPatients });
    }
    catch (error) {
        console.error('Error fetching doctor:', error);
        res.status(500).json({ error: 'Failed to fetch doctor' });
    }
};
exports.getDoctorById = getDoctorById;
// Create a new doctor
const createDoctor = async (req, res) => {
    try {
        const { name, email, password, phone, addressLine, city, state, pin, country, } = req.body;
        // Validate required fields
        if (!name || !email || !password || !phone) {
            res.status(400).json({
                error: 'Name, email, password, and phone are required',
            });
            return;
        }
        // Check if doctor with this email already exists
        const existingDoctor = await db_1.default.doctor.findUnique({
            where: { email },
        });
        if (existingDoctor) {
            res.status(400).json({
                error: 'A doctor with this email already exists',
            });
            return;
        }
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        const doctor = await db_1.default.doctor.create({
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
            include: {
                clinic: true,
                hospitals: true,
            },
        });
        // Remove password from response
        const { password: _, ...doctorWithoutPassword } = doctor;
        res.status(201).json(doctorWithoutPassword);
    }
    catch (error) {
        console.error('Error creating doctor:', error);
        res.status(500).json({ error: 'Failed to create doctor' });
    }
};
exports.createDoctor = createDoctor;
// Update doctor
const updateDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // If password is being updated, hash it
        if (updateData.password) {
            const saltRounds = 10;
            updateData.password = await bcryptjs_1.default.hash(updateData.password, saltRounds);
        }
        const doctor = await db_1.default.doctor.update({
            where: { id },
            data: updateData,
            include: {
                clinic: true,
                hospitals: true,
            },
        });
        // Remove password from response
        const { password, ...doctorWithoutPassword } = doctor;
        res.json(doctorWithoutPassword);
    }
    catch (error) {
        console.error('Error updating doctor:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Doctor not found' });
            return;
        }
        res.status(500).json({ error: 'Failed to update doctor' });
    }
};
exports.updateDoctor = updateDoctor;
// Delete doctor
const deleteDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.doctor.delete({
            where: { id }
        });
        res.json({ message: 'Doctor deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting doctor:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Doctor not found' });
            return;
        }
        res.status(500).json({ error: 'Failed to delete doctor' });
    }
};
exports.deleteDoctor = deleteDoctor;
const assignDoctorToHospital = async (req, res) => {
    try {
        const { doctorId, hospitalId } = req.body;
        if (!doctorId || !hospitalId) {
            res.status(400).json({ error: 'Doctor ID and Hospital ID are required' });
            return;
        }
        const doctor = await db_1.default.doctor.update({
            where: { id: doctorId },
            data: {
                hospitals: {
                    connect: {
                        id: hospitalId
                    }
                }
            },
            include: {
                hospitals: true,
                clinic: true,
            },
        });
        // Remove password from response
        const { password, ...doctorWithoutPassword } = doctor;
        res.json(doctorWithoutPassword);
    }
    catch (error) {
        console.error('Error assigning doctor to hospital:', error);
        res.status(500).json({ error: 'Failed to assign doctor to hospital' });
    }
};
exports.assignDoctorToHospital = assignDoctorToHospital;
const assignPatientToDoctor = async (req, res) => {
    try {
        const { doctorId, patientId } = req.body;
        if (!doctorId || !patientId) {
            res.status(400).json({ error: 'Doctor ID and Patient ID are required' });
            return;
        }
        const doctor = await db_1.default.doctor.update({
            where: { id: doctorId },
            data: {
                patients: {
                    connect: {
                        id: patientId,
                    }
                }
            },
            include: {
                patients: true,
                clinic: true,
                hospitals: true,
            },
        });
        // Remove password from response
        const { password, ...doctorWithoutPassword } = doctor;
        res.json(doctorWithoutPassword);
    }
    catch (error) {
        console.error('Error assigning patient to doctor:', error);
        res.status(500).json({ error: 'Failed to assign patient to doctor' });
    }
};
exports.assignPatientToDoctor = assignPatientToDoctor;
const removePatientFromDoctor = async (req, res) => {
    try {
        const { doctorId, patientId } = req.body;
        if (!doctorId || !patientId) {
            res.status(400).json({ error: 'Doctor ID and Patient ID are required' });
            return;
        }
        const doctor = await db_1.default.doctor.update({
            where: { id: doctorId },
            data: {
                patients: {
                    disconnect: {
                        id: patientId,
                    }
                }
            },
            include: {
                patients: true,
                clinic: true,
                hospitals: true,
            },
        });
        // Remove password from response
        const { password, ...doctorWithoutPassword } = doctor;
        res.json(doctorWithoutPassword);
    }
    catch (error) {
        console.error('Error removing patient from doctor:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Doctor or patient not found, or patient not assigned' });
            return;
        }
        res.status(500).json({ error: 'Failed to remove patient from doctor' });
    }
};
exports.removePatientFromDoctor = removePatientFromDoctor;
const updatePatientNextVisit = async (req, res) => {
    try {
        const { doctorId, patientId } = req.params;
        const { nextVisitDate } = req.body;
        if (!doctorId || !patientId || !nextVisitDate) {
            res.status(400).json({ error: 'Doctor ID, Patient ID, and next visit date are required' });
            return;
        }
        const newVisitDate = new Date(nextVisitDate);
        // First verify if the patient is assigned to this doctor
        const doctor = await db_1.default.doctor.findFirst({
            where: {
                id: doctorId,
                patients: {
                    some: {
                        id: patientId
                    }
                }
            }
        });
        if (!doctor) {
            res.status(404).json({ error: 'Doctor not found or patient not assigned to this doctor' });
            return;
        }
        // Upsert the next visit:
        // If a visit for this doctor and patient already exists, update it.
        // Otherwise, create a new visit.
        // This logic assumes we want to manage one "next visit" per doctor-patient pair.
        // If multiple future visits are allowed and should be created, this logic needs adjustment.
        // For simplicity with the current frontend, we'll find any existing visit record
        // for this doctor and patient and update it, or create a new one.
        // A more robust solution might involve identifying a specific visit to update if multiple exist.
        const existingVisit = await db_1.default.doctorNextVisit.findFirst({
            where: {
                doctorId: doctorId,
                patientId: patientId,
            }
        });
        if (existingVisit) {
            const updatedVisit = await db_1.default.doctorNextVisit.update({
                where: { id: existingVisit.id },
                data: { nextVisit: newVisitDate },
                include: { patient: true } // Return patient data to match frontend expectations
            });
            // To match the previous structure where patient was returned directly,
            // we return the patient part of the updated visit.
            // The frontend Patient interface expects doctorNextVisit to be on the patient object itself.
            const patientData = {
                ...updatedVisit.patient,
                doctorNextVisit: updatedVisit.nextVisit // Add the updated date here
            };
            res.json(patientData);
        }
        else {
            const newVisit = await db_1.default.doctorNextVisit.create({
                data: {
                    doctorId: doctorId,
                    patientId: patientId,
                    nextVisit: newVisitDate,
                },
                include: { patient: true }
            });
            const patientData = {
                ...newVisit.patient,
                doctorNextVisit: newVisit.nextVisit
            };
            res.json(patientData);
        }
    }
    catch (error) {
        console.error('Error updating patient next visit date:', error);
        // P2025 can occur if patientId is invalid for a new visit creation
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Patient not found or related record for update failed.' });
            return;
        }
        res.status(500).json({ error: 'Failed to update patient next visit date' });
    }
};
exports.updatePatientNextVisit = updatePatientNextVisit;
