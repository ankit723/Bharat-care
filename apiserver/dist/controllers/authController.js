"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.register = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const config_1 = __importDefault(require("../config"));
const userIdGenerator_1 = require("../utils/userIdGenerator");
const prisma = new client_1.PrismaClient();
// Generate JWT token for user
const generateToken = (userId, role, verificationStatus) => {
    return jsonwebtoken_1.default.sign({ id: userId, role, verificationStatus }, config_1.default.jwtSecret || 'your-secret-key', { expiresIn: '7d' });
};
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        // Check for user by email across all user types
        let user = await prisma.doctor.findUnique({ where: { email } }) ||
            await prisma.hospital.findUnique({ where: { email } }) ||
            await prisma.clinic.findUnique({ where: { email } }) ||
            await prisma.medStore.findUnique({ where: { email } }) ||
            await prisma.patient.findUnique({ where: { email } }) ||
            await prisma.admin.findUnique({ where: { email } }) ||
            await prisma.checkupCenter.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        let userRoleForToken;
        // Check if the user is a CheckupCenter first, as it doesn't have a `role` field in its model
        const isCheckupCenter = await prisma.checkupCenter.count({ where: { id: user.id, email: user.email } }) > 0;
        if (isCheckupCenter) {
            userRoleForToken = client_1.Role.CHECKUP_CENTER;
        }
        else if (user.role) { // For other models that have a 'role' field from DB (expected to be lowercase)
            userRoleForToken = user.role.toUpperCase(); // Convert to uppercase to match Enum
        }
        else {
            console.error('Could not determine user role for token generation for user:', user.id);
            res.status(500).json({ error: 'Internal server error determining user role' });
            return;
        }
        const token = generateToken(user.id, userRoleForToken, user.verificationStatus || 'PENDING');
        let userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        // Ensure role and verificationStatus are properly set in response
        userWithoutPassword.role = userRoleForToken;
        userWithoutPassword.verificationStatus = user.verificationStatus || 'PENDING';
        res.json({
            token,
            user: userWithoutPassword
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
};
exports.login = login;
const register = async (req, res) => {
    try {
        const { name, email, password, role, phone, addressLine, city, state, pin, country } = req.body;
        if (!name || !email || !password || !role || !phone) {
            res.status(400).json({ error: 'Required fields are missing' });
            return;
        }
        const normalizedRequestRole = role.toUpperCase();
        if (!Object.values(client_1.Role).includes(normalizedRequestRole)) {
            res.status(400).json({ error: `Invalid role specified: ${role}. Valid roles are: ${Object.values(client_1.Role).join(', ')}` });
            return;
        }
        // Check if email already exists across all user types
        const existingUserByEmail = await prisma.doctor.findUnique({ where: { email } }) ||
            await prisma.hospital.findUnique({ where: { email } }) ||
            await prisma.clinic.findUnique({ where: { email } }) ||
            await prisma.medStore.findUnique({ where: { email } }) ||
            await prisma.patient.findUnique({ where: { email } }) ||
            await prisma.checkupCenter.findUnique({ where: { email } });
        if (existingUserByEmail) {
            res.status(400).json({ error: 'Email is already registered' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Generate userId from name
        const userId = (0, userIdGenerator_1.generateUserId)(name);
        let newUser;
        const dbRoleToStore = normalizedRequestRole.toLowerCase(); // Store lowercase in DB as per schema defaults
        const basicUserData = {
            name,
            email,
            password: hashedPassword,
            phone,
            addressLine: addressLine || '',
            city: city || '',
            state: state || '',
            pin: pin || '',
            country: country || '',
            userId, // Add the generated userId
        };
        switch (normalizedRequestRole) {
            case client_1.Role.DOCTOR:
                newUser = await prisma.doctor.create({ data: { ...basicUserData, role: dbRoleToStore } });
                break;
            case client_1.Role.HOSPITAL:
                newUser = await prisma.hospital.create({ data: { ...basicUserData, role: dbRoleToStore } });
                break;
            case client_1.Role.CLINIC:
                newUser = await prisma.clinic.create({ data: { ...basicUserData, role: dbRoleToStore } });
                break;
            case client_1.Role.MEDSTORE:
                newUser = await prisma.medStore.create({ data: { ...basicUserData, role: dbRoleToStore } });
                break;
            case client_1.Role.PATIENT:
                newUser = await prisma.patient.create({ data: { ...basicUserData, role: dbRoleToStore } });
                break;
            case client_1.Role.CHECKUP_CENTER:
                newUser = await prisma.checkupCenter.create({ data: { ...basicUserData } });
                break;
            case client_1.Role.ADMIN:
                newUser = await prisma.admin.create({ data: { ...basicUserData } });
                break;
            default:
                res.status(400).json({ error: 'Invalid role' });
                return;
        }
        const tokenRole = normalizedRequestRole; // Use UPPERCASE for token
        const token = generateToken(newUser.id, tokenRole, newUser.verificationStatus);
        let userWithoutPassword = { ...newUser };
        if ('password' in userWithoutPassword) {
            delete userWithoutPassword.password;
        }
        // Ensure the user object in response has the role, especially for CheckupCenter
        userWithoutPassword.role = tokenRole;
        res.status(201).json({
            token,
            user: userWithoutPassword
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
};
exports.register = register;
const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const roleFromToken = req.user?.role;
        // console.log('Role from token in getCurrentUser:', roleFromToken); // Keep for debugging if needed
        if (!userId || !roleFromToken) {
            res.status(401).json({ error: 'Not authenticated or role missing in token' });
            return;
        }
        // Role from token should now be UPPERCASE and a valid Role enum string value
        const userRole = roleFromToken;
        if (!Object.values(client_1.Role).includes(userRole)) {
            console.error(`Invalid role found in token after processing: ${userRole}`);
            res.status(400).json({ error: 'Invalid role specified in token after processing' });
            return;
        }
        let user;
        switch (userRole) {
            case client_1.Role.ADMIN:
                user = await prisma.admin.findUnique({ where: { id: userId } });
                break;
            case client_1.Role.DOCTOR:
                user = await prisma.doctor.findUnique({
                    where: { id: userId },
                    include: {
                        clinic: true,
                        hospitals: true,
                        patients: true, // Basic patient list
                        reviews: { include: { patient: { select: { name: true } } } }
                    }
                });
                break;
            case client_1.Role.HOSPITAL:
                user = await prisma.hospital.findUnique({
                    where: { id: userId },
                    include: {
                        doctor: true,
                        reviews: { include: { patient: { select: { name: true } } } },
                        patients: true
                    }
                });
                break;
            case client_1.Role.CLINIC:
                user = await prisma.clinic.findUnique({
                    where: { id: userId },
                    include: {
                        doctor: true
                    }
                });
                break;
            case client_1.Role.MEDSTORE:
                user = await prisma.medStore.findUnique({
                    where: { id: userId },
                    include: {
                        raisedHands: {
                            include: {
                                medDocument: {
                                    include: {
                                        patient: { select: { id: true, name: true, email: true, phone: true } }
                                    }
                                }
                            }
                        }
                    }
                });
                break;
            case client_1.Role.PATIENT:
                user = await prisma.patient.findUnique({
                    where: { id: userId },
                    include: {
                        doctors: { select: { id: true, name: true, specialization: true } },
                        hospitals: { select: { id: true, name: true } },
                        checkupCenters: { select: { id: true, name: true } },
                        reviews: true,
                        associatedMedDocuments: { include: { patient: true, doctor: true, checkupCenter: true } },
                        uploadedMedDocuments: { include: { patient: true, doctor: true, checkupCenter: true } }
                    }
                });
                break;
            case client_1.Role.CHECKUP_CENTER:
                user = await prisma.checkupCenter.findUnique({
                    where: { id: userId },
                    include: {
                        patients: true,
                        medDocuments: { include: { patient: true } },
                        reviews: { include: { patient: { select: { name: true } } } }
                    }
                });
                break;
            default:
                console.error(`Unhandled role in getCurrentUser: ${userRole}`);
                res.status(500).json({ error: 'Internal server error: Unhandled user role' });
                return;
        }
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        let userWithoutPassword = { ...user };
        if ('password' in userWithoutPassword) {
            delete userWithoutPassword.password;
        }
        // Ensure the user object in response has the role consistently
        userWithoutPassword.role = userRole;
        res.json(userWithoutPassword);
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Server error retrieving user data' });
    }
};
exports.getCurrentUser = getCurrentUser;
