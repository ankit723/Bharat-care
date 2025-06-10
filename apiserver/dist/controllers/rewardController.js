"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServiceReferral = exports.updateRewardSetting = exports.getRewardSettings = exports.getUserReferrals = exports.getUserRewardHistory = exports.getUserPoints = exports.completeReferral = exports.createReferral = void 0;
const rewardManager_1 = require("../utils/rewardManager");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Create a new referral
const createReferral = async (req, res) => {
    try {
        // Accept either referredUserId or referredId to make the API more flexible
        const referredUserId = req.body.referredUserId || req.body.referredId;
        const { referredRole } = req.body;
        // Get referrer info from auth token
        const referrerId = req.user?.userId;
        const referrerRole = req.user?.role;
        if (!referrerId || !referrerRole) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        if (!referredUserId || !referredRole) {
            res.status(400).json({ error: 'Missing referredUserId/referredId or referredRole' });
            return;
        }
        // Validate referredRole is a valid Role enum value
        if (!Object.values(client_1.Role).includes(referredRole)) {
            res.status(400).json({ error: 'Invalid referredRole' });
            return;
        }
        // Ensure user isn't referring themselves
        if (referrerId === referredUserId && referrerRole === referredRole) {
            res.status(400).json({ error: 'Cannot refer yourself' });
            return;
        }
        // Check if the referred user exists
        const userExists = await validateUserExists(referredUserId, referredRole);
        if (!userExists) {
            res.status(404).json({ error: 'Referred user not found' });
            return;
        }
        // Check if this referral already exists
        const existingReferral = await prisma.referral.findFirst({
            where: {
                referrerId,
                referrerRole,
                referredId: referredUserId,
                referredRole: referredRole,
            },
        });
        if (existingReferral) {
            res.status(409).json({
                error: 'Referral already exists',
                referralId: existingReferral.id,
                status: existingReferral.status,
            });
            return;
        }
        // Create the referral
        const referral = await rewardManager_1.RewardManager.createReferral(referrerId, referrerRole, referredUserId, referredRole);
        res.status(201).json(referral);
    }
    catch (error) {
        console.error('Error creating referral:', error);
        res.status(500).json({ error: error.message || 'Failed to create referral' });
    }
};
exports.createReferral = createReferral;
// Complete a referral
const completeReferral = async (req, res) => {
    try {
        const { referralId } = req.params;
        if (!referralId) {
            res.status(400).json({ error: 'Missing referralId' });
            return;
        }
        const referral = await prisma.referral.findUnique({
            where: { id: referralId },
        });
        if (!referral) {
            res.status(404).json({ error: 'Referral not found' });
            return;
        }
        // Only admin or referred user can complete a referral
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const isAdmin = userRole === client_1.Role.ADMIN;
        const isReferredUser = userId === referral.referredId && userRole === referral.referredRole;
        if (!isAdmin && !isReferredUser) {
            res.status(403).json({ error: 'Unauthorized to complete this referral' });
            return;
        }
        const completedReferral = await rewardManager_1.RewardManager.completeReferral(referralId);
        res.status(200).json(completedReferral);
    }
    catch (error) {
        console.error('Error completing referral:', error);
        res.status(500).json({ error: error.message || 'Failed to complete referral' });
    }
};
exports.completeReferral = completeReferral;
// Get user's reward points
const getUserPoints = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId || !userRole) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const points = await rewardManager_1.RewardManager.getUserRewardPoints(userId, userRole);
        res.status(200).json({ rewardPoints: points });
    }
    catch (error) {
        console.error('Error getting user points:', error);
        res.status(500).json({ error: error.message || 'Failed to get user points' });
    }
};
exports.getUserPoints = getUserPoints;
// Get user's reward transaction history
const getUserRewardHistory = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId || !userRole) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;
        const history = await rewardManager_1.RewardManager.getUserRewardHistory(userId, userRole, limit, offset);
        res.status(200).json(history);
    }
    catch (error) {
        console.error('Error getting user reward history:', error);
        res.status(500).json({ error: error.message || 'Failed to get user reward history' });
    }
};
exports.getUserRewardHistory = getUserRewardHistory;
// Get user's referrals
const getUserReferrals = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId || !userRole) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const type = req.query.type === 'received' ? 'received' : 'given';
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;
        // Enhanced referrals with complete relation data
        const referrals = await rewardManager_1.RewardManager.getUserReferrals(userId, userRole, type, limit, offset);
        // Log information to help debug missing relation data
        if (process.env.NODE_ENV !== 'production') {
            const serviceReferrals = referrals.referrals.filter(ref => ref.isServiceReferral);
            console.log(`Service referrals count: ${serviceReferrals.length}`);
            // Log the first referral for debugging
            if (serviceReferrals.length > 0) {
                const firstRef = serviceReferrals[0];
                console.log(`Sample referral - id: ${firstRef.id}, referredRole: ${firstRef.referredRole}`);
                // Type-safe way to access relation properties
                let relationInfo = "not found";
                const role = firstRef.referredRole;
                if (role === 'DOCTOR' && firstRef.referredDoctor) {
                    relationInfo = JSON.stringify(firstRef.referredDoctor);
                }
                else if (role === 'PATIENT' && firstRef.referredPatient) {
                    relationInfo = JSON.stringify(firstRef.referredPatient);
                }
                else if (role === 'HOSPITAL' && firstRef.referredHospital) {
                    relationInfo = JSON.stringify(firstRef.referredHospital);
                }
                else if (role === 'MEDSTORE' && firstRef.referredMedStore) {
                    relationInfo = JSON.stringify(firstRef.referredMedStore);
                }
                else if (role === 'CLINIC' && firstRef.referredClinic) {
                    relationInfo = JSON.stringify(firstRef.referredClinic);
                }
                else if (role === 'CHECKUP_CENTER' && firstRef.referredCheckupCenter) {
                    relationInfo = JSON.stringify(firstRef.referredCheckupCenter);
                }
                console.log(`Relation check - referred${role.charAt(0) + role.slice(1).toLowerCase()}: ${relationInfo}`);
            }
        }
        res.status(200).json(referrals);
    }
    catch (error) {
        console.error('Error getting user referrals:', error);
        res.status(500).json({ error: error.message || 'Failed to get user referrals' });
    }
};
exports.getUserReferrals = getUserReferrals;
// Get reward settings (admin only)
const getRewardSettings = async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== client_1.Role.ADMIN) {
            res.status(403).json({ error: 'Unauthorized. Admin access required.' });
            return;
        }
        const settings = await rewardManager_1.RewardManager.getRewardSettings();
        res.status(200).json(settings);
    }
    catch (error) {
        console.error('Error getting reward settings:', error);
        res.status(500).json({ error: error.message || 'Failed to get reward settings' });
    }
};
exports.getRewardSettings = getRewardSettings;
// Update reward settings (admin only)
const updateRewardSetting = async (req, res) => {
    try {
        const userRole = req.user?.role;
        const userId = req.user?.userId;
        if (!userId || userRole !== client_1.Role.ADMIN) {
            res.status(403).json({ error: 'Unauthorized. Admin access required.' });
            return;
        }
        const { key, value } = req.body;
        if (!key || value === undefined || value === null) {
            res.status(400).json({ error: 'Missing key or value' });
            return;
        }
        if (typeof value !== 'number' || value < 0) {
            res.status(400).json({ error: 'Value must be a non-negative number' });
            return;
        }
        const setting = await rewardManager_1.RewardManager.updateRewardSetting(key, value, userId);
        res.status(200).json(setting);
    }
    catch (error) {
        console.error('Error updating reward setting:', error);
        res.status(500).json({ error: error.message || 'Failed to update reward setting' });
    }
};
exports.updateRewardSetting = updateRewardSetting;
// Helper function to validate if a user exists
const validateUserExists = async (userId, role) => {
    try {
        switch (role) {
            case client_1.Role.DOCTOR:
                return !!(await prisma.doctor.findUnique({ where: { id: userId } }));
            case client_1.Role.PATIENT:
                return !!(await prisma.patient.findUnique({ where: { id: userId } }));
            case client_1.Role.HOSPITAL:
                return !!(await prisma.hospital.findUnique({ where: { id: userId } }));
            case client_1.Role.MEDSTORE:
                return !!(await prisma.medStore.findUnique({ where: { id: userId } }));
            case client_1.Role.CLINIC:
                return !!(await prisma.clinic.findUnique({ where: { id: userId } }));
            case client_1.Role.CHECKUP_CENTER:
                return !!(await prisma.checkupCenter.findUnique({ where: { id: userId } }));
            case client_1.Role.ADMIN:
                return !!(await prisma.admin.findUnique({ where: { id: userId } }));
            default:
                return false;
        }
    }
    catch (error) {
        console.error('Error validating user existence:', error);
        return false;
    }
};
// Create a service referral (doctor to doctor, doctor to med store, etc.)
const createServiceReferral = async (req, res) => {
    try {
        const { referredId, referredRole, patientId, serviceType, notes } = req.body;
        // Get referrer info from auth token
        const referrerId = req.user?.userId;
        const referrerRole = req.user?.role;
        if (!referrerId || !referrerRole) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        if (!referredId || !referredRole || !patientId || !serviceType) {
            res.status(400).json({ error: 'Missing required fields: referredId, referredRole, patientId, or serviceType' });
            return;
        }
        // Validate referredRole is a valid Role enum value
        if (!Object.values(client_1.Role).includes(referredRole)) {
            res.status(400).json({ error: 'Invalid referredRole' });
            return;
        }
        // Validate serviceType
        const validServiceTypes = ['DOCTOR_CONSULT', 'MEDSTORE_PURCHASE', 'CHECKUP_SERVICE'];
        if (!validServiceTypes.includes(serviceType)) {
            res.status(400).json({ error: 'Invalid serviceType' });
            return;
        }
        // Ensure the service referral makes sense based on the service type
        if (serviceType === 'DOCTOR_CONSULT' && referredRole !== client_1.Role.DOCTOR) {
            res.status(400).json({ error: 'For doctor consultation, referredRole must be DOCTOR' });
            return;
        }
        if (serviceType === 'MEDSTORE_PURCHASE' && referredRole !== client_1.Role.MEDSTORE) {
            res.status(400).json({ error: 'For medicine purchase, referredRole must be MEDSTORE' });
            return;
        }
        if (serviceType === 'CHECKUP_SERVICE' && referredRole !== client_1.Role.CHECKUP_CENTER) {
            res.status(400).json({ error: 'For checkup service, referredRole must be CHECKUP_CENTER' });
            return;
        }
        // Ensure user isn't referring to themselves
        if (referrerId === referredId && referrerRole === referredRole) {
            res.status(400).json({ error: 'Cannot refer to yourself' });
            return;
        }
        // Check if the referred user exists
        const referredUserExists = await validateUserExists(referredId, referredRole);
        if (!referredUserExists) {
            res.status(404).json({ error: 'Referred provider not found' });
            return;
        }
        // Check if the patient exists
        const patientExists = await prisma.patient.findUnique({ where: { id: patientId } });
        if (!patientExists) {
            res.status(404).json({ error: 'Patient not found' });
            return;
        }
        // Create the service referral
        const referral = await prisma.referral.create({
            data: {
                referrerId,
                referrerRole,
                referredId,
                referredRole: referredRole,
                pointsAwarded: 0, // Will be updated upon completion
                status: 'PENDING',
                patientId,
                serviceType,
                notes,
                isServiceReferral: true,
            },
            include: {
                referrerDoctor: {
                    select: { name: true, userId: true }
                },
                referrerPatient: {
                    select: { name: true, userId: true }
                },
                referrerHospital: {
                    select: { name: true, userId: true }
                },
                referrerMedStore: {
                    select: { name: true, userId: true }
                },
                referrerClinic: {
                    select: { name: true, userId: true }
                },
                referrerCheckupCenter: {
                    select: { name: true, userId: true }
                },
                referredDoctor: {
                    select: { name: true, userId: true }
                },
                referredPatient: {
                    select: { name: true, userId: true }
                },
                referredHospital: {
                    select: { name: true, userId: true }
                },
                referredMedStore: {
                    select: { name: true, userId: true }
                },
                referredClinic: {
                    select: { name: true, userId: true }
                },
                referredCheckupCenter: {
                    select: { name: true, userId: true }
                },
                patientDetails: {
                    select: { name: true, email: true, phone: true, userId: true }
                },
            }
        });
        res.status(201).json(referral);
    }
    catch (error) {
        console.error('Error creating service referral:', error);
        res.status(500).json({ error: error.message || 'Failed to create service referral' });
    }
};
exports.createServiceReferral = createServiceReferral;
