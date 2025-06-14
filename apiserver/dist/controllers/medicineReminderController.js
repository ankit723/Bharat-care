"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMedicineItemReminderTimes = exports.markMedicineTaken = exports.updateReminderTime = exports.setReminderTimes = exports.getPatientReminderTimes = void 0;
const db_1 = __importDefault(require("../utils/db"));
const client_1 = require("@prisma/client");
// Get medicine reminder times for a patient
const getPatientReminderTimes = async (req, res) => {
    try {
        const patientId = req.user?.userId;
        const userRole = req.user?.role;
        if (!patientId || userRole !== client_1.Role.PATIENT) {
            res.status(403).json({ error: 'Only patients can access their reminder times' });
            return;
        }
        const reminderTimes = await db_1.default.medicineReminderTime.findMany({
            where: {
                patientId,
                isActive: true
            },
            include: {
                medicineItem: {
                    include: {
                        medicineSchedule: {
                            select: {
                                id: true,
                                startDate: true,
                                numberOfDays: true,
                                notes: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                reminderTime: 'asc'
            }
        });
        res.json(reminderTimes);
    }
    catch (error) {
        console.error('Error fetching reminder times:', error);
        res.status(500).json({ error: 'Failed to fetch reminder times' });
    }
};
exports.getPatientReminderTimes = getPatientReminderTimes;
// Set reminder times for a medicine item
const setReminderTimes = async (req, res) => {
    try {
        const { medicineItemId, reminderTimes } = req.body;
        const patientId = req.user?.userId;
        const userRole = req.user?.role;
        if (!patientId || userRole !== client_1.Role.PATIENT) {
            res.status(403).json({ error: 'Only patients can set reminder times' });
            return;
        }
        if (!medicineItemId || !reminderTimes || !Array.isArray(reminderTimes)) {
            res.status(400).json({ error: 'Medicine item ID and reminder times array are required' });
            return;
        }
        // Verify the medicine item belongs to a schedule for this patient
        const medicineItem = await db_1.default.scheduledMedicineItem.findUnique({
            where: { id: medicineItemId },
            include: {
                medicineSchedule: true
            }
        });
        if (!medicineItem) {
            res.status(404).json({ error: 'Medicine item not found' });
            return;
        }
        if (medicineItem.medicineSchedule.patientId !== patientId) {
            res.status(403).json({ error: 'This medicine is not prescribed to you' });
            return;
        }
        // Validate reminder times format (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        for (const time of reminderTimes) {
            if (!timeRegex.test(time)) {
                res.status(400).json({ error: `Invalid time format: ${time}. Use HH:MM format.` });
                return;
            }
        }
        // Check if number of reminder times matches timesPerDay
        if (reminderTimes.length !== medicineItem.timesPerDay) {
            res.status(400).json({
                error: `Number of reminder times (${reminderTimes.length}) must match times per day (${medicineItem.timesPerDay})`
            });
            return;
        }
        // Delete existing reminder times for this medicine item
        await db_1.default.medicineReminderTime.deleteMany({
            where: {
                medicineItemId,
                patientId
            }
        });
        // Create new reminder times
        const newReminderTimes = await Promise.all(reminderTimes.map((time) => db_1.default.medicineReminderTime.create({
            data: {
                medicineItemId,
                patientId,
                reminderTime: time,
                isActive: true
            },
            include: {
                medicineItem: {
                    include: {
                        medicineSchedule: {
                            select: {
                                id: true,
                                startDate: true,
                                numberOfDays: true,
                                notes: true
                            }
                        }
                    }
                }
            }
        })));
        res.status(201).json({
            message: 'Reminder times set successfully',
            reminderTimes: newReminderTimes
        });
    }
    catch (error) {
        console.error('Error setting reminder times:', error);
        res.status(500).json({ error: 'Failed to set reminder times' });
    }
};
exports.setReminderTimes = setReminderTimes;
// Update a specific reminder time
const updateReminderTime = async (req, res) => {
    try {
        const { reminderId } = req.params;
        const { reminderTime, isActive } = req.body;
        const patientId = req.user?.userId;
        const userRole = req.user?.role;
        if (!patientId || userRole !== client_1.Role.PATIENT) {
            res.status(403).json({ error: 'Only patients can update reminder times' });
            return;
        }
        // Verify the reminder belongs to this patient
        const existingReminder = await db_1.default.medicineReminderTime.findUnique({
            where: { id: reminderId }
        });
        if (!existingReminder) {
            res.status(404).json({ error: 'Reminder not found' });
            return;
        }
        if (existingReminder.patientId !== patientId) {
            res.status(403).json({ error: 'This reminder does not belong to you' });
            return;
        }
        // Validate time format if provided
        if (reminderTime) {
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(reminderTime)) {
                res.status(400).json({ error: `Invalid time format: ${reminderTime}. Use HH:MM format.` });
                return;
            }
        }
        const updatedReminder = await db_1.default.medicineReminderTime.update({
            where: { id: reminderId },
            data: {
                ...(reminderTime && { reminderTime }),
                ...(typeof isActive === 'boolean' && { isActive })
            },
            include: {
                medicineItem: {
                    include: {
                        medicineSchedule: {
                            select: {
                                id: true,
                                startDate: true,
                                numberOfDays: true,
                                notes: true
                            }
                        }
                    }
                }
            }
        });
        res.json(updatedReminder);
    }
    catch (error) {
        console.error('Error updating reminder time:', error);
        res.status(500).json({ error: 'Failed to update reminder time' });
    }
};
exports.updateReminderTime = updateReminderTime;
// Mark medicine as taken for a specific reminder
const markMedicineTaken = async (req, res) => {
    try {
        const { reminderId } = req.params;
        const { takenAt } = req.body;
        const patientId = req.user?.userId;
        const userRole = req.user?.role;
        if (!patientId || userRole !== client_1.Role.PATIENT) {
            res.status(403).json({ error: 'Only patients can mark medicine as taken' });
            return;
        }
        const reminder = await db_1.default.medicineReminderTime.findUnique({
            where: { id: reminderId },
            include: {
                medicineItem: {
                    include: {
                        medicineSchedule: true
                    }
                }
            }
        });
        if (!reminder) {
            res.status(404).json({ error: 'Reminder not found' });
            return;
        }
        if (reminder.patientId !== patientId) {
            res.status(403).json({ error: 'This reminder does not belong to you' });
            return;
        }
        // Check if the medicine schedule is still active
        const now = new Date();
        const scheduleEndDate = new Date(reminder.medicineItem.medicineSchedule.startDate);
        scheduleEndDate.setDate(scheduleEndDate.getDate() + reminder.medicineItem.medicineSchedule.numberOfDays);
        if (now > scheduleEndDate) {
            res.status(400).json({ error: 'This medicine schedule has already ended' });
            return;
        }
        const takenTime = takenAt ? new Date(takenAt) : new Date();
        // Check if taken within grace period (30 minutes from scheduled time)
        const [hours, minutes] = reminder.reminderTime.split(':').map(Number);
        const scheduledDateTime = new Date();
        scheduledDateTime.setHours(hours, minutes, 0, 0);
        const timeDiff = Math.abs(takenTime.getTime() - scheduledDateTime.getTime());
        const gracePeriodMs = 30 * 60 * 1000; // 30 minutes
        const isOnTime = timeDiff <= gracePeriodMs;
        const pointsAwarded = isOnTime ? 5 : 1; // Full points for on-time, reduced for late
        // Update reminder tracking
        const updatedReminder = await db_1.default.medicineReminderTime.update({
            where: { id: reminderId },
            data: {
                lastTakenAt: takenTime,
                totalTimesTaken: { increment: 1 },
                consecutiveDaysTaken: isOnTime
                    ? { increment: 1 }
                    : reminder.consecutiveDaysTaken // Reset if late, or handle differently
            }
        });
        // Award reward points
        const { RewardManager } = await Promise.resolve().then(() => __importStar(require('../utils/rewardManager')));
        await RewardManager.awardPoints(patientId, client_1.Role.PATIENT, pointsAwarded, 'MEDICINE_COMPLIANCE', `Medicine taken${isOnTime ? ' on time' : ' late'}: ${reminder.medicineItem.medicineName}`);
        res.json({
            success: true,
            pointsAwarded,
            isOnTime,
            message: `Medicine confirmed! You earned ${pointsAwarded} reward points.`,
            reminder: updatedReminder
        });
    }
    catch (error) {
        console.error('Error marking medicine as taken:', error);
        res.status(500).json({ error: 'Failed to mark medicine as taken' });
    }
};
exports.markMedicineTaken = markMedicineTaken;
// Get reminder times for a specific medicine item
const getMedicineItemReminderTimes = async (req, res) => {
    try {
        const { medicineItemId } = req.params;
        const patientId = req.user?.userId;
        const userRole = req.user?.role;
        if (!patientId || userRole !== client_1.Role.PATIENT) {
            res.status(403).json({ error: 'Only patients can access reminder times' });
            return;
        }
        // Verify the medicine item belongs to this patient
        const medicineItem = await db_1.default.scheduledMedicineItem.findUnique({
            where: { id: medicineItemId },
            include: {
                medicineSchedule: true
            }
        });
        if (!medicineItem) {
            res.status(404).json({ error: 'Medicine item not found' });
            return;
        }
        if (medicineItem.medicineSchedule.patientId !== patientId) {
            res.status(403).json({ error: 'This medicine is not prescribed to you' });
            return;
        }
        const reminderTimes = await db_1.default.medicineReminderTime.findMany({
            where: {
                medicineItemId,
                patientId,
                isActive: true
            },
            orderBy: {
                reminderTime: 'asc'
            }
        });
        res.json({
            medicineItem,
            reminderTimes
        });
    }
    catch (error) {
        console.error('Error fetching medicine item reminder times:', error);
        res.status(500).json({ error: 'Failed to fetch reminder times' });
    }
};
exports.getMedicineItemReminderTimes = getMedicineItemReminderTimes;
