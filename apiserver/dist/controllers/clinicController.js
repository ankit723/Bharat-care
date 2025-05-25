"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeCompounderFromClinic = exports.assignCompounderToClinic = exports.removeDoctorFromClinic = exports.assignDoctorToClinic = exports.deleteClinic = exports.updateClinic = exports.createClinic = exports.getClinicById = exports.getClinics = void 0;
const db_1 = __importDefault(require("../utils/db"));
const getClinics = async (req, res) => {
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
        const [clinics, total] = await Promise.all([
            db_1.default.clinic.findMany({
                where,
                skip: parseInt(skip.toString()),
                take: parseInt(limit.toString()),
                include: {
                    doctor: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                    compounder: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            db_1.default.clinic.count({ where }),
        ]);
        res.json({
            data: clinics,
            pagination: {
                page: parseInt(page.toString()),
                limit: parseInt(limit.toString()),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Error fetching clinics:', error);
        res.status(500).json({ error: 'Failed to fetch clinics' });
    }
};
exports.getClinics = getClinics;
const getClinicById = async (req, res) => {
    try {
        const { id } = req.params;
        const clinic = await db_1.default.clinic.findUnique({
            where: { id },
            include: {
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        addressLine: true,
                        city: true,
                        state: true,
                        pin: true,
                        country: true,
                    },
                },
                compounder: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        addressLine: true,
                        city: true,
                        state: true,
                        pin: true,
                        country: true,
                    },
                },
            },
        });
        if (!clinic) {
            res.status(404).json({ error: 'Clinic not found' });
            return;
        }
        res.json(clinic);
    }
    catch (error) {
        console.error('Error fetching clinic:', error);
        res.status(500).json({ error: 'Failed to fetch clinic' });
    }
};
exports.getClinicById = getClinicById;
const createClinic = async (req, res) => {
    try {
        const { name, email, password, phone, addressLine, city, state, pin, country } = req.body;
        // Validate required fields
        if (!name || !email || !password || !phone) {
            res.status(400).json({
                error: 'Name, email, password, and phone are required',
            });
            return;
        }
        // Check if clinic with this email already exists
        const existingClinic = await db_1.default.clinic.findUnique({
            where: { email },
        });
        if (existingClinic) {
            res.status(400).json({
                error: 'A clinic with this email already exists',
            });
            return;
        }
        const clinic = await db_1.default.clinic.create({
            data: {
                name,
                email,
                password,
                phone,
                addressLine: addressLine || '',
                city: city || '',
                state: state || '',
                pin: pin || '',
                country: country || '',
            },
            include: {
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                compounder: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
        res.status(201).json(clinic);
    }
    catch (error) {
        console.error('Error creating clinic:', error);
        res.status(500).json({ error: 'Failed to create clinic' });
    }
};
exports.createClinic = createClinic;
const updateClinic = async (req, res) => {
    try {
        const { id } = req.params;
        const clinic = await db_1.default.clinic.update({
            where: { id },
            data: req.body,
            include: {
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                compounder: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
        res.json(clinic);
    }
    catch (error) {
        console.error('Error updating clinic:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Clinic not found' });
            return;
        }
        res.status(500).json({ error: 'Failed to update clinic' });
    }
};
exports.updateClinic = updateClinic;
const deleteClinic = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.clinic.delete({
            where: { id },
        });
        res.json({ message: 'Clinic deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting clinic:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Clinic not found' });
            return;
        }
        res.status(500).json({ error: 'Failed to delete clinic' });
    }
};
exports.deleteClinic = deleteClinic;
// POST /api/clinics/:id/assign-doctor - Assign doctor to clinic
const assignDoctorToClinic = async (req, res) => {
    try {
        const { id: clinicId } = req.params;
        const { doctorId } = req.body;
        if (!doctorId) {
            res.status(400).json({ error: 'Doctor ID is required' });
            return;
        }
        // Check if clinic exists
        const clinic = await db_1.default.clinic.findUnique({
            where: { id: clinicId },
        });
        if (!clinic) {
            res.status(404).json({ error: 'Clinic not found' });
            return;
        }
        // Check if doctor exists
        const doctor = await db_1.default.doctor.findUnique({
            where: { id: doctorId },
        });
        if (!doctor) {
            res.status(404).json({ error: 'Doctor not found' });
            return;
        }
        // Check if doctor is already assigned to another clinic
        if (doctor.clinicId && doctor.clinicId !== clinicId) {
            res.status(400).json({
                error: 'Doctor is already assigned to another clinic',
            });
            return;
        }
        // Assign doctor to clinic
        await db_1.default.doctor.update({
            where: { id: doctorId },
            data: { clinicId },
        });
        // Get updated clinic with doctor info
        const updatedClinic = await db_1.default.clinic.findUnique({
            where: { id: clinicId },
            include: {
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                compounder: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
        res.json({
            message: 'Doctor assigned to clinic successfully',
            clinic: updatedClinic,
        });
    }
    catch (error) {
        console.error('Error assigning doctor to clinic:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.assignDoctorToClinic = assignDoctorToClinic;
// POST /api/clinics/:id/remove-doctor - Remove doctor from clinic
const removeDoctorFromClinic = async (req, res) => {
    try {
        const { id: clinicId } = req.params;
        // Check if clinic exists
        const clinic = await db_1.default.clinic.findUnique({
            where: { id: clinicId },
            include: { doctor: true },
        });
        if (!clinic) {
            res.status(404).json({ error: 'Clinic not found' });
            return;
        }
        if (!clinic.doctor) {
            res.status(400).json({
                error: 'No doctor is currently assigned to this clinic',
            });
            return;
        }
        // Remove doctor from clinic
        await db_1.default.doctor.update({
            where: { id: clinic.doctor.id },
            data: { clinicId: null },
        });
        // Get updated clinic
        const updatedClinic = await db_1.default.clinic.findUnique({
            where: { id: clinicId },
            include: {
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                compounder: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
        res.json({
            message: 'Doctor removed from clinic successfully',
            clinic: updatedClinic,
        });
    }
    catch (error) {
        console.error('Error removing doctor from clinic:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.removeDoctorFromClinic = removeDoctorFromClinic;
// POST /api/clinics/:id/assign-compounder - Assign compounder to clinic
const assignCompounderToClinic = async (req, res) => {
    try {
        const { id: clinicId } = req.params;
        const { compounderId } = req.body;
        if (!compounderId) {
            res.status(400).json({ error: 'Compounder ID is required' });
            return;
        }
        // Check if clinic exists
        const clinic = await db_1.default.clinic.findUnique({
            where: { id: clinicId },
        });
        if (!clinic) {
            res.status(404).json({ error: 'Clinic not found' });
            return;
        }
        // Check if compounder exists
        const compounder = await db_1.default.compounder.findUnique({
            where: { id: compounderId },
        });
        if (!compounder) {
            res.status(404).json({ error: 'Compounder not found' });
            return;
        }
        // Check if compounder is already assigned to another clinic
        if (compounder.clinicId && compounder.clinicId !== clinicId) {
            res.status(400).json({
                error: 'Compounder is already assigned to another clinic',
            });
            return;
        }
        // Assign compounder to clinic
        await db_1.default.compounder.update({
            where: { id: compounderId },
            data: { clinicId },
        });
        // Get updated clinic with compounder info
        const updatedClinic = await db_1.default.clinic.findUnique({
            where: { id: clinicId },
            include: {
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                compounder: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
        res.json({
            message: 'Compounder assigned to clinic successfully',
            clinic: updatedClinic,
        });
    }
    catch (error) {
        console.error('Error assigning compounder to clinic:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.assignCompounderToClinic = assignCompounderToClinic;
// POST /api/clinics/:id/remove-compounder - Remove compounder from clinic
const removeCompounderFromClinic = async (req, res) => {
    try {
        const { id: clinicId } = req.params;
        // Check if clinic exists
        const clinic = await db_1.default.clinic.findUnique({
            where: { id: clinicId },
            include: { compounder: true },
        });
        if (!clinic) {
            res.status(404).json({ error: 'Clinic not found' });
            return;
        }
        if (!clinic.compounder) {
            res.status(400).json({
                error: 'No compounder is currently assigned to this clinic',
            });
            return;
        }
        // Remove compounder from clinic
        await db_1.default.compounder.update({
            where: { id: clinic.compounder.id },
            data: { clinicId: null },
        });
        // Get updated clinic
        const updatedClinic = await db_1.default.clinic.findUnique({
            where: { id: clinicId },
            include: {
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                compounder: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
        res.json({
            message: 'Compounder removed from clinic successfully',
            clinic: updatedClinic,
        });
    }
    catch (error) {
        console.error('Error removing compounder from clinic:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.removeCompounderFromClinic = removeCompounderFromClinic;
