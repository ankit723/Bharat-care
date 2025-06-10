"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardManager = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Manages reward points and referrals in the application
 */
class RewardManager {
    /**
     * Create a new referral
     * @param referrerId ID of the user making the referral
     * @param referrerRole Role of the referrer
     * @param referredId ID of the user being referred
     * @param referredRole Role of the referred user
     * @returns The created referral
     */
    static async createReferral(referrerId, referrerRole, referredId, referredRole) {
        try {
            // Get default referral points
            const rewardSetting = await prisma.rewardSetting.findUnique({
                where: { key: 'referral_points' },
            });
            const pointsAwarded = rewardSetting?.value || 2; // Default to 2 if setting not found
            // Prepare relationship data based on roles
            const referrerData = {};
            const referredData = {};
            // Set appropriate referrer field
            switch (referrerRole) {
                case client_1.Role.DOCTOR:
                    referrerData.referrerDoctorId = referrerId;
                    break;
                case client_1.Role.PATIENT:
                    referrerData.referrerPatientId = referrerId;
                    break;
                case client_1.Role.HOSPITAL:
                    referrerData.referrerHospitalId = referrerId;
                    break;
                case client_1.Role.MEDSTORE:
                    referrerData.referrerMedStoreId = referrerId;
                    break;
                case client_1.Role.CLINIC:
                    referrerData.referrerClinicId = referrerId;
                    break;
                case client_1.Role.CHECKUP_CENTER:
                    referrerData.referrerCheckupCenterId = referrerId;
                    break;
                case client_1.Role.ADMIN:
                    referrerData.referrerAdminId = referrerId;
                    break;
            }
            // Set appropriate referred field
            switch (referredRole) {
                case client_1.Role.DOCTOR:
                    referredData.referredDoctorId = referredId;
                    break;
                case client_1.Role.PATIENT:
                    referredData.referredPatientId = referredId;
                    break;
                case client_1.Role.HOSPITAL:
                    referredData.referredHospitalId = referredId;
                    break;
                case client_1.Role.MEDSTORE:
                    referredData.referredMedStoreId = referredId;
                    break;
                case client_1.Role.CLINIC:
                    referredData.referredClinicId = referredId;
                    break;
                case client_1.Role.CHECKUP_CENTER:
                    referredData.referredCheckupCenterId = referredId;
                    break;
            }
            // Create the referral
            const referral = await prisma.referral.create({
                data: {
                    referrerId,
                    referrerRole,
                    referredId,
                    referredRole,
                    pointsAwarded,
                    status: 'PENDING',
                    ...referrerData,
                    ...referredData,
                },
            });
            return referral;
        }
        catch (error) {
            console.error('Error creating referral:', error);
            throw error;
        }
    }
    /**
     * Complete a referral and award points to both parties
     * @param referralId ID of the referral to complete
     * @returns The completed referral
     */
    static async completeReferral(referralId) {
        try {
            const referral = await prisma.referral.findUnique({
                where: { id: referralId },
            });
            if (!referral) {
                throw new Error('Referral not found');
            }
            if (referral.status !== 'PENDING') {
                throw new Error(`Referral is already ${referral.status.toLowerCase()}`);
            }
            let pointsToAward = referral.pointsAwarded;
            // For service referrals, determine points based on service type
            if (referral.isServiceReferral) {
                // Get points from settings based on service type
                let settingKey = 'service_referral_points'; // Default
                if (referral.serviceType === 'DOCTOR_CONSULT') {
                    settingKey = 'doctor_consult_referral_points';
                }
                else if (referral.serviceType === 'MEDSTORE_PURCHASE') {
                    settingKey = 'medstore_purchase_referral_points';
                }
                else if (referral.serviceType === 'CHECKUP_SERVICE') {
                    settingKey = 'checkup_service_referral_points';
                }
                const setting = await prisma.rewardSetting.findUnique({
                    where: { key: settingKey },
                });
                // Default to specific point values if setting not found
                if (setting) {
                    pointsToAward = setting.value;
                }
                else {
                    // Set default values based on service type
                    switch (referral.serviceType) {
                        case 'DOCTOR_CONSULT':
                            pointsToAward = 25;
                            break;
                        case 'MEDSTORE_PURCHASE':
                            pointsToAward = 15;
                            break;
                        case 'CHECKUP_SERVICE':
                            pointsToAward = 20;
                            break;
                        default:
                            pointsToAward = 20;
                    }
                    // Create the setting if it doesn't exist for future use
                    try {
                        await prisma.rewardSetting.create({
                            data: {
                                key: settingKey,
                                value: pointsToAward,
                                description: `Points awarded for ${referral.serviceType?.toLowerCase().replace('_', ' ')} service referrals`,
                                updatedById: 'system',
                            }
                        });
                    }
                    catch (error) {
                        console.warn(`Failed to create reward setting for ${settingKey}:`, error);
                    }
                }
            }
            // Update referral status and points
            const completedReferral = await prisma.referral.update({
                where: { id: referralId },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    pointsAwarded: pointsToAward,
                },
                include: {
                    referrerDoctor: { select: { name: true, userId: true } },
                    referrerPatient: { select: { name: true, userId: true } },
                    referrerHospital: { select: { name: true, userId: true } },
                    referrerMedStore: { select: { name: true, userId: true } },
                    referrerClinic: { select: { name: true, userId: true } },
                    referrerCheckupCenter: { select: { name: true, userId: true } },
                    referrerAdmin: { select: { name: true, userId: true } },
                    referredDoctor: { select: { name: true, userId: true } },
                    referredPatient: { select: { name: true, userId: true } },
                    referredHospital: { select: { name: true, userId: true } },
                    referredMedStore: { select: { name: true, userId: true } },
                    referredClinic: { select: { name: true, userId: true } },
                    referredCheckupCenter: { select: { name: true, userId: true } },
                    patientDetails: { select: { name: true, email: true, phone: true, userId: true } },
                }
            });
            // For service referrals, only award points to the referrer
            if (referral.isServiceReferral) {
                await this.awardPoints(referral.referrerId, referral.referrerRole, pointsToAward, client_1.TransactionType.REFERRAL_REWARD, `Service referral reward for referring a patient to ${referral.serviceType?.toLowerCase().replace('_', ' ')}`, referralId);
            }
            else {
                // Standard referral - award points to both parties
                // Award points to referrer
                await this.awardPoints(referral.referrerId, referral.referrerRole, pointsToAward, client_1.TransactionType.REFERRAL_REWARD, `Referral reward for referring a ${referral.referredRole.toLowerCase()}`, referralId);
                // Award points to referred user
                await this.awardPoints(referral.referredId, referral.referredRole, pointsToAward, client_1.TransactionType.REFERRAL_REWARD, `Reward for being referred by a ${referral.referrerRole.toLowerCase()}`, referralId);
            }
            return completedReferral;
        }
        catch (error) {
            console.error('Error completing referral:', error);
            throw error;
        }
    }
    /**
     * Award points to a user
     * @param userId ID of the user to award points to
     * @param userRole Role of the user
     * @param points Number of points to award
     * @param transactionType Type of transaction
     * @param description Description of the transaction
     * @param referralId Optional ID of the related referral
     * @returns The transaction record
     */
    static async awardPoints(userId, userRole, points, transactionType, description, referralId) {
        try {
            // Prepare entity data based on role
            const entityData = {};
            // Set appropriate entity field
            switch (userRole) {
                case client_1.Role.DOCTOR:
                    entityData.doctorId = userId;
                    break;
                case client_1.Role.PATIENT:
                    entityData.patientId = userId;
                    break;
                case client_1.Role.HOSPITAL:
                    entityData.hospitalId = userId;
                    break;
                case client_1.Role.MEDSTORE:
                    entityData.medStoreId = userId;
                    break;
                case client_1.Role.CLINIC:
                    entityData.clinicId = userId;
                    break;
                case client_1.Role.CHECKUP_CENTER:
                    entityData.checkupCenterId = userId;
                    break;
                case client_1.Role.ADMIN:
                    entityData.adminId = userId;
                    break;
            }
            // Start a transaction
            return await prisma.$transaction(async (tx) => {
                // Create transaction record
                const transaction = await tx.rewardTransaction.create({
                    data: {
                        userId,
                        userRole,
                        points,
                        transactionType,
                        description,
                        referralId,
                        ...entityData,
                    },
                });
                // Update user's reward points based on role
                switch (userRole) {
                    case client_1.Role.DOCTOR:
                        await tx.doctor.update({
                            where: { id: userId },
                            data: { rewardPoints: { increment: points } },
                        });
                        break;
                    case client_1.Role.PATIENT:
                        await tx.patient.update({
                            where: { id: userId },
                            data: { rewardPoints: { increment: points } },
                        });
                        break;
                    case client_1.Role.HOSPITAL:
                        await tx.hospital.update({
                            where: { id: userId },
                            data: { rewardPoints: { increment: points } },
                        });
                        break;
                    case client_1.Role.MEDSTORE:
                        await tx.medStore.update({
                            where: { id: userId },
                            data: { rewardPoints: { increment: points } },
                        });
                        break;
                    case client_1.Role.CLINIC:
                        await tx.clinic.update({
                            where: { id: userId },
                            data: { rewardPoints: { increment: points } },
                        });
                        break;
                    case client_1.Role.CHECKUP_CENTER:
                        await tx.checkupCenter.update({
                            where: { id: userId },
                            data: { rewardPoints: { increment: points } },
                        });
                        break;
                    case client_1.Role.ADMIN:
                        await tx.admin.update({
                            where: { id: userId },
                            data: { rewardPoints: { increment: points } },
                        });
                        break;
                }
                return transaction;
            });
        }
        catch (error) {
            console.error('Error awarding points:', error);
            throw error;
        }
    }
    /**
     * Get user's reward points
     * @param userId ID of the user
     * @param userRole Role of the user
     * @returns The user's reward points
     */
    static async getUserRewardPoints(userId, userRole) {
        try {
            let points = 0;
            switch (userRole) {
                case client_1.Role.DOCTOR:
                    const doctor = await prisma.doctor.findUnique({
                        where: { id: userId },
                        select: { rewardPoints: true },
                    });
                    points = doctor?.rewardPoints || 0;
                    break;
                case client_1.Role.PATIENT:
                    const patient = await prisma.patient.findUnique({
                        where: { id: userId },
                        select: { rewardPoints: true },
                    });
                    points = patient?.rewardPoints || 0;
                    break;
                case client_1.Role.HOSPITAL:
                    const hospital = await prisma.hospital.findUnique({
                        where: { id: userId },
                        select: { rewardPoints: true },
                    });
                    points = hospital?.rewardPoints || 0;
                    break;
                case client_1.Role.MEDSTORE:
                    const medStore = await prisma.medStore.findUnique({
                        where: { id: userId },
                        select: { rewardPoints: true },
                    });
                    points = medStore?.rewardPoints || 0;
                    break;
                case client_1.Role.CLINIC:
                    const clinic = await prisma.clinic.findUnique({
                        where: { id: userId },
                        select: { rewardPoints: true },
                    });
                    points = clinic?.rewardPoints || 0;
                    break;
                case client_1.Role.CHECKUP_CENTER:
                    const checkupCenter = await prisma.checkupCenter.findUnique({
                        where: { id: userId },
                        select: { rewardPoints: true },
                    });
                    points = checkupCenter?.rewardPoints || 0;
                    break;
                case client_1.Role.ADMIN:
                    const admin = await prisma.admin.findUnique({
                        where: { id: userId },
                        select: { rewardPoints: true },
                    });
                    points = admin?.rewardPoints || 0;
                    break;
            }
            return points;
        }
        catch (error) {
            console.error('Error getting user reward points:', error);
            throw error;
        }
    }
    /**
     * Get user's reward transaction history
     * @param userId ID of the user
     * @param userRole Role of the user
     * @param limit Number of transactions to return
     * @param offset Offset for pagination
     * @returns The user's reward transaction history
     */
    static async getUserRewardHistory(userId, userRole, limit = 10, offset = 0) {
        try {
            const transactions = await prisma.rewardTransaction.findMany({
                where: {
                    userId,
                    userRole,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: limit,
                skip: offset,
            });
            const totalCount = await prisma.rewardTransaction.count({
                where: {
                    userId,
                    userRole,
                },
            });
            return {
                transactions,
                totalCount,
            };
        }
        catch (error) {
            console.error('Error getting user reward history:', error);
            throw error;
        }
    }
    /**
     * Get all referrals for a user
     * @param userId ID of the user
     * @param userRole Role of the user
     * @param type 'given' or 'received'
     * @param limit Number of referrals to return
     * @param offset Offset for pagination
     * @returns The user's referrals
     */
    static async getUserReferrals(userId, userRole, type, limit = 10, offset = 0) {
        try {
            const referralsQuery = {
                where: type === 'given'
                    ? { referrerId: userId, referrerRole: userRole }
                    : { referredId: userId, referredRole: userRole },
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
                    referrerAdmin: {
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
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip: offset,
                take: limit,
            };
            const [referrals, totalCount] = await prisma.$transaction([
                prisma.referral.findMany(referralsQuery),
                prisma.referral.count({
                    where: type === 'given'
                        ? { referrerId: userId, referrerRole: userRole }
                        : { referredId: userId, referredRole: userRole },
                }),
            ]);
            return { referrals, totalCount };
        }
        catch (error) {
            console.error(`Error getting user ${type} referrals:`, error);
            throw error;
        }
    }
    /**
     * Get reward settings
     * @returns The reward settings
     */
    static async getRewardSettings() {
        try {
            const settings = await prisma.rewardSetting.findMany();
            return settings;
        }
        catch (error) {
            console.error('Error getting reward settings:', error);
            throw error;
        }
    }
    /**
     * Update a reward setting
     * @param key Setting key
     * @param value New value
     * @param adminId ID of the admin making the change
     * @returns The updated setting
     */
    static async updateRewardSetting(key, value, adminId) {
        try {
            const setting = await prisma.rewardSetting.update({
                where: { key },
                data: {
                    value,
                    updatedById: adminId,
                },
            });
            return setting;
        }
        catch (error) {
            console.error('Error updating reward setting:', error);
            throw error;
        }
    }
}
exports.RewardManager = RewardManager;
