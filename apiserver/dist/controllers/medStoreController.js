"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawHandForPrescription = exports.raiseHandForPrescription = exports.getAvailablePrescriptions = exports.deleteMedStore = exports.updateMedStore = exports.createMedStore = exports.getMedStoreById = exports.getMedStores = void 0;
const db_1 = __importDefault(require("../utils/db")); // Changed to shared prisma instance
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userIdGenerator_1 = require("../utils/userIdGenerator");
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
            db_1.default.medStore.findMany({
                where,
                skip: parseInt(skip.toString()),
                take: parseInt(limit.toString()),
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            db_1.default.medStore.count({ where }),
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
            search: {
                term: search ? String(search) : '',
                recommendedDebounceMs: 300, // Recommend client-side debounce time
                minSearchLength: 2, // Recommend minimum search term length
            }
        });
    }
    catch (error) {
        console.error('Error fetching med stores:', error);
        res.status(500).json({
            error: 'Failed to fetch med stores',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
};
exports.getMedStores = getMedStores;
// GET /api/medstores/:id - Get med store by ID
const getMedStoreById = async (req, res) => {
    try {
        const { id } = req.params;
        const medStore = await db_1.default.medStore.findUnique({
            where: { id },
            include: {
                raisedHands: {
                    include: {
                        medDocument: {
                            include: {
                                patient: {
                                    select: { id: true, name: true, email: true, phone: true }
                                }
                            }
                        }
                    }
                }
            }
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
        const existingMedStore = await db_1.default.medStore.findUnique({
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
        // Generate userId from name
        const userId = (0, userIdGenerator_1.generateUserId)(name);
        // Create med store
        const medStore = await db_1.default.medStore.create({
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
                verificationStatus: 'PENDING',
                role: 'MEDSTORE',
                userId,
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
        const medStore = await db_1.default.medStore.update({
            where: { id },
            data: updateData,
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
        await db_1.default.medStore.delete({
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
// GET /api/medstores/available-prescriptions - Get all med documents with seekAvailability = true
const getAvailablePrescriptions = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {
            seekAvailability: true,
        };
        if (search) {
            where.OR = [
                { fileName: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                {
                    patient: {
                        OR: [
                            { name: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } },
                        ],
                    },
                },
            ];
        }
        const [medDocuments, total] = await Promise.all([
            db_1.default.medDocument.findMany({
                where,
                skip: parseInt(skip.toString()),
                take: parseInt(limit.toString()),
                include: {
                    patient: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            city: true,
                            state: true,
                        },
                    },
                    // Optionally, include info about which medstores have already raised hands
                    // medStoreHandRaises: { select: { medStoreId: true } } 
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            db_1.default.medDocument.count({ where }),
        ]);
        res.json({
            data: medDocuments,
            pagination: {
                page: parseInt(page.toString()),
                limit: parseInt(limit.toString()),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Error fetching available prescriptions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAvailablePrescriptions = getAvailablePrescriptions;
// POST /api/medstores/:medStoreId/raise-hand/:medDocumentId - MedStore raises hand for a prescription
const raiseHandForPrescription = async (req, res) => {
    try {
        const { medStoreId, medDocumentId } = req.params;
        // Check if MedDocument exists and has seekAvailability = true
        const medDocument = await db_1.default.medDocument.findUnique({
            where: { id: medDocumentId },
        });
        if (!medDocument) {
            res.status(404).json({ error: 'Medical document not found' });
            return;
        }
        if (!medDocument.seekAvailability) {
            res.status(400).json({ error: 'This medical document is not seeking availability' });
            return;
        }
        // Check if MedStore exists and is verified
        const medStore = await db_1.default.medStore.findUnique({
            where: { id: medStoreId },
        });
        if (!medStore) {
            res.status(404).json({ error: 'MedStore not found' });
            return;
        }
        if (medStore.verificationStatus !== 'VERIFIED') {
            res.status(403).json({ error: 'MedStore not verified. Cannot raise hand.' });
            return;
        }
        // Create MedStoreHandRaise record
        const handRaise = await db_1.default.medStoreHandRaise.create({
            data: {
                medDocumentId,
                medStoreId,
            },
            include: {
                medDocument: {
                    include: { patient: { select: { name: true, email: true } } }
                },
                medStore: { select: { name: true, email: true } }
            }
        });
        res.status(201).json(handRaise);
    }
    catch (error) {
        console.error('Error raising hand for prescription:', error);
        if (error.code === 'P2002') { // Unique constraint violation
            res.status(409).json({ error: 'MedStore has already raised hand for this prescription' });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.raiseHandForPrescription = raiseHandForPrescription;
// DELETE /api/medstores/:medStoreId/withdraw-hand/:medDocumentId - MedStore withdraws hand for a prescription
const withdrawHandForPrescription = async (req, res) => {
    try {
        const { medStoreId, medDocumentId } = req.params;
        const handRaise = await db_1.default.medStoreHandRaise.findUnique({
            where: {
                medDocumentId_medStoreId: {
                    medDocumentId,
                    medStoreId,
                },
            },
        });
        if (!handRaise) {
            res.status(404).json({ error: 'Hand raise record not found' });
            return;
        }
        await db_1.default.medStoreHandRaise.delete({
            where: {
                id: handRaise.id,
            },
        });
        res.json({ message: 'Successfully withdrew hand for prescription' });
    }
    catch (error) {
        console.error('Error withdrawing hand for prescription:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.withdrawHandForPrescription = withdrawHandForPrescription;
