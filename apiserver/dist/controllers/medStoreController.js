"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMedStore = exports.updateMedStore = exports.createMedStore = exports.getMedStoreById = exports.getMedStores = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
// GET /api/medstores - Get all med stores
const getMedStores = async (req, res) => {
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
        const [medStores, total] = await Promise.all([
            prisma.medStore.findMany({
                where,
                skip: parseInt(skip.toString()),
                take: parseInt(limit.toString()),
                include: {
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
            prisma.medStore.count({ where }),
        ]);
        // Remove passwords from response
        const medStoresWithoutPasswords = medStores.map(({ password, ...medStore }) => medStore);
        res.json({
            data: medStoresWithoutPasswords,
            pagination: {
                page: parseInt(page.toString()),
                limit: parseInt(limit.toString()),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Error fetching med stores:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getMedStores = getMedStores;
// GET /api/medstores/:id - Get med store by ID
const getMedStoreById = async (req, res) => {
    try {
        const { id } = req.params;
        const medStore = await prisma.medStore.findUnique({
            where: { id },
            include: {
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
                        createdAt: true,
                    },
                },
            },
        });
        if (!medStore) {
            res.status(404).json({ error: 'Med Store not found' });
            return;
        }
        // Remove password from response
        const { password, ...medStoreWithoutPassword } = medStore;
        res.json(medStoreWithoutPassword);
    }
    catch (error) {
        console.error('Error fetching med store:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getMedStoreById = getMedStoreById;
// POST /api/medstores - Create new med store
const createMedStore = async (req, res) => {
    try {
        const { name, email, password, phone, addressLine, city, state, pin, country, } = req.body;
        // Validate required fields
        if (!name || !email || !password || !phone) {
            res.status(400).json({
                error: 'Name, email, password, and phone are required',
            });
            return;
        }
        // Check if med store with this email already exists
        const existingMedStore = await prisma.medStore.findUnique({
            where: { email },
        });
        if (existingMedStore) {
            res.status(400).json({
                error: 'A med store with this email already exists',
            });
            return;
        }
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        // Create med store
        const medStore = await prisma.medStore.create({
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
        // Remove password from response
        const { password: _, ...medStoreWithoutPassword } = medStore;
        res.status(201).json(medStoreWithoutPassword);
    }
    catch (error) {
        console.error('Error creating med store:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createMedStore = createMedStore;
// PUT /api/medstores/:id - Update med store
const updateMedStore = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // If password is being updated, hash it
        if (updateData.password) {
            const saltRounds = 10;
            updateData.password = await bcryptjs_1.default.hash(updateData.password, saltRounds);
        }
        const medStore = await prisma.medStore.update({
            where: { id },
            data: updateData,
            include: {
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
        // Remove password from response
        const { password, ...medStoreWithoutPassword } = medStore;
        res.json(medStoreWithoutPassword);
    }
    catch (error) {
        console.error('Error updating med store:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Med Store not found' });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateMedStore = updateMedStore;
// DELETE /api/medstores/:id - Delete med store
const deleteMedStore = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.medStore.delete({
            where: { id },
        });
        res.json({ message: 'Med Store deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting med store:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Med Store not found' });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteMedStore = deleteMedStore;
