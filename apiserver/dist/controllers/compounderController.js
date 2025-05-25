"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeCompounderFromMedStore = exports.removeCompounderFromClinic = exports.assignCompounderToMedStore = exports.assignCompounderToClinic = exports.assignCompounderToHospital = exports.deleteCompounder = exports.updateCompounder = exports.createCompounder = exports.getCompounderById = exports.getCompounders = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
// GET /api/compounders - Get all compounders
const getCompounders = async (req, res) => {
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
        const [compounders, total] = await Promise.all([
            prisma.compounder.findMany({
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
                    medStore: {
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
            prisma.compounder.count({ where }),
        ]);
        // Remove passwords from response
        const compoundersWithoutPasswords = compounders.map(({ password, ...compounder }) => compounder);
        res.json({
            data: compoundersWithoutPasswords,
            pagination: {
                page: parseInt(page.toString()),
                limit: parseInt(limit.toString()),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Error fetching compounders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getCompounders = getCompounders;
// GET /api/compounders/:id - Get compounder by ID
const getCompounderById = async (req, res) => {
    try {
        const { id } = req.params;
        const compounder = await prisma.compounder.findUnique({
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
                medStore: {
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
            },
        });
        if (!compounder) {
            res.status(404).json({ error: 'Compounder not found' });
            return;
        }
        // Remove password from response
        const { password, ...compounderWithoutPassword } = compounder;
        res.json(compounderWithoutPassword);
    }
    catch (error) {
        console.error('Error fetching compounder:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getCompounderById = getCompounderById;
// POST /api/compounders - Create new compounder
const createCompounder = async (req, res) => {
    try {
        const { name, email, password, phone, addressLine, city, state, pin, country, } = req.body;
        // Validate required fields
        if (!name || !email || !password || !phone) {
            res.status(400).json({
                error: 'Name, email, password, and phone are required',
            });
            return;
        }
        // Check if compounder with this email already exists
        const existingCompounder = await prisma.compounder.findUnique({
            where: { email },
        });
        if (existingCompounder) {
            res.status(400).json({
                error: 'A compounder with this email already exists',
            });
            return;
        }
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        // Create compounder
        const compounder = await prisma.compounder.create({
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
                medStore: true,
                hospitals: true,
            },
        });
        // Remove password from response
        const { password: _, ...compounderWithoutPassword } = compounder;
        res.status(201).json(compounderWithoutPassword);
    }
    catch (error) {
        console.error('Error creating compounder:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createCompounder = createCompounder;
// PUT /api/compounders/:id - Update compounder
const updateCompounder = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // If password is being updated, hash it
        if (updateData.password) {
            const saltRounds = 10;
            updateData.password = await bcryptjs_1.default.hash(updateData.password, saltRounds);
        }
        const compounder = await prisma.compounder.update({
            where: { id },
            data: updateData,
            include: {
                clinic: true,
                medStore: true,
                hospitals: true,
            },
        });
        // Remove password from response
        const { password, ...compounderWithoutPassword } = compounder;
        res.json(compounderWithoutPassword);
    }
    catch (error) {
        console.error('Error updating compounder:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Compounder not found' });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateCompounder = updateCompounder;
// DELETE /api/compounders/:id - Delete compounder
const deleteCompounder = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.compounder.delete({
            where: { id },
        });
        res.json({ message: 'Compounder deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting compounder:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Compounder not found' });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteCompounder = deleteCompounder;
// POST /api/compounders/assign-hospital - Assign compounder to hospital
const assignCompounderToHospital = async (req, res) => {
    try {
        const { compounderId, hospitalId } = req.body;
        if (!compounderId || !hospitalId) {
            res.status(400).json({ error: 'Compounder ID and Hospital ID are required' });
            return;
        }
        // Update compounder to connect with hospital
        const compounder = await prisma.compounder.update({
            where: { id: compounderId },
            data: {
                hospitals: {
                    connect: { id: hospitalId },
                },
            },
            include: {
                hospitals: true,
                clinic: true,
                medStore: true,
            },
        });
        // Remove password from response
        const { password, ...compounderWithoutPassword } = compounder;
        res.json(compounderWithoutPassword);
    }
    catch (error) {
        console.error('Error assigning compounder to hospital:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.assignCompounderToHospital = assignCompounderToHospital;
// POST /api/compounders/assign-clinic - Assign compounder to clinic
const assignCompounderToClinic = async (req, res) => {
    try {
        const { compounderId, clinicId } = req.body;
        if (!compounderId || !clinicId) {
            res.status(400).json({ error: 'Compounder ID and Clinic ID are required' });
            return;
        }
        // Update compounder to connect with clinic
        const compounder = await prisma.compounder.update({
            where: { id: compounderId },
            data: {
                clinicId,
            },
            include: {
                hospitals: true,
                clinic: true,
                medStore: true,
            },
        });
        // Remove password from response
        const { password, ...compounderWithoutPassword } = compounder;
        res.json(compounderWithoutPassword);
    }
    catch (error) {
        console.error('Error assigning compounder to clinic:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.assignCompounderToClinic = assignCompounderToClinic;
// POST /api/compounders/assign-medstore - Assign compounder to med store
const assignCompounderToMedStore = async (req, res) => {
    try {
        const { compounderId, medStoreId } = req.body;
        if (!compounderId || !medStoreId) {
            res.status(400).json({ error: 'Compounder ID and Med Store ID are required' });
            return;
        }
        // Update compounder to connect with med store
        const compounder = await prisma.compounder.update({
            where: { id: compounderId },
            data: {
                medStoreId,
            },
            include: {
                hospitals: true,
                clinic: true,
                medStore: true,
            },
        });
        // Remove password from response
        const { password, ...compounderWithoutPassword } = compounder;
        res.json(compounderWithoutPassword);
    }
    catch (error) {
        console.error('Error assigning compounder to med store:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.assignCompounderToMedStore = assignCompounderToMedStore;
// POST /api/compounders/remove-clinic - Remove compounder from clinic
const removeCompounderFromClinic = async (req, res) => {
    try {
        const { compounderId } = req.body;
        if (!compounderId) {
            res.status(400).json({ error: 'Compounder ID is required' });
            return;
        }
        // Update compounder to disconnect from clinic
        const compounder = await prisma.compounder.update({
            where: { id: compounderId },
            data: {
                clinicId: null,
            },
            include: {
                hospitals: true,
                clinic: true,
                medStore: true,
            },
        });
        // Remove password from response
        const { password, ...compounderWithoutPassword } = compounder;
        res.json(compounderWithoutPassword);
    }
    catch (error) {
        console.error('Error removing compounder from clinic:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.removeCompounderFromClinic = removeCompounderFromClinic;
// POST /api/compounders/remove-medstore - Remove compounder from med store
const removeCompounderFromMedStore = async (req, res) => {
    try {
        const { compounderId } = req.body;
        if (!compounderId) {
            res.status(400).json({ error: 'Compounder ID is required' });
            return;
        }
        // Update compounder to disconnect from med store
        const compounder = await prisma.compounder.update({
            where: { id: compounderId },
            data: {
                medStoreId: null,
            },
            include: {
                hospitals: true,
                clinic: true,
                medStore: true,
            },
        });
        // Remove password from response
        const { password, ...compounderWithoutPassword } = compounder;
        res.json(compounderWithoutPassword);
    }
    catch (error) {
        console.error('Error removing compounder from med store:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.removeCompounderFromMedStore = removeCompounderFromMedStore;
