"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHomeRecommendations = void 0;
const db_1 = __importDefault(require("../utils/db"));
const client_1 = require("@prisma/client");
// Get personalized home recommendations for patient
const getHomeRecommendations = async (req, res) => {
    try {
        const patientId = req.user?.userId;
        const userRole = req.user?.role;
        if (!patientId || userRole !== client_1.Role.PATIENT) {
            res.status(403).json({ error: 'Only patients can access home recommendations' });
            return;
        }
        // Get patient details for location-based recommendations
        const patient = await db_1.default.patient.findUnique({
            where: { id: patientId },
            select: {
                id: true,
                city: true,
                state: true,
                doctors: {
                    select: {
                        id: true,
                        name: true,
                        specialization: true,
                        city: true,
                        state: true,
                        verificationStatus: true,
                    },
                    take: 3,
                },
                hospitals: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        state: true,
                        verificationStatus: true,
                    },
                    take: 3,
                },
                checkupCenters: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        state: true,
                        verificationStatus: true,
                    },
                    take: 3,
                },
            },
        });
        if (!patient) {
            res.status(404).json({ error: 'Patient not found' });
            return;
        }
        // Get upcoming appointments
        const upcomingAppointments = await db_1.default.doctorNextVisit.findMany({
            where: {
                patientId: patientId,
                nextVisit: {
                    gte: new Date(),
                },
            },
            include: {
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        specialization: true,
                        phone: true,
                        city: true,
                        state: true,
                    },
                },
            },
            orderBy: {
                nextVisit: 'asc',
            },
            take: 5,
        });
        const upcomingCheckupAppointments = await db_1.default.checkupCenterNextVisit.findMany({
            where: {
                patientId: patientId,
                nextVisit: {
                    gte: new Date(),
                },
            },
            include: {
                checkupCenter: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        city: true,
                        state: true,
                    },
                },
            },
            orderBy: {
                nextVisit: 'asc',
            },
            take: 5,
        });
        // Get active medicine schedules
        const activeMedicineSchedules = await db_1.default.medicineSchedule.findMany({
            where: {
                patientId: patientId,
                startDate: {
                    lte: new Date(),
                },
            },
            include: {
                items: true,
            },
            orderBy: {
                startDate: 'desc',
            },
            take: 5,
        });
        // Filter active schedules (not ended)
        const now = new Date();
        const activeSchedules = activeMedicineSchedules.filter(schedule => {
            const endDate = new Date(schedule.startDate);
            endDate.setDate(endDate.getDate() + schedule.numberOfDays);
            return endDate > now;
        });
        // Get recommended doctors in same city/state (excluding already assigned)
        const assignedDoctorIds = patient.doctors.map(d => d.id);
        const recommendedDoctors = await db_1.default.doctor.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { city: patient.city },
                            { state: patient.state },
                        ],
                    },
                    {
                        id: {
                            notIn: assignedDoctorIds,
                        },
                    },
                    {
                        verificationStatus: 'VERIFIED',
                    },
                ],
            },
            select: {
                id: true,
                userId: true,
                name: true,
                specialization: true,
                phone: true,
                addressLine: true,
                city: true,
                state: true,
                verificationStatus: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 10,
        });
        // Get recommended hospitals in same city/state
        const assignedHospitalIds = patient.hospitals.map(h => h.id);
        const recommendedHospitals = await db_1.default.hospital.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { city: patient.city },
                            { state: patient.state },
                        ],
                    },
                    {
                        id: {
                            notIn: assignedHospitalIds,
                        },
                    },
                    {
                        verificationStatus: 'VERIFIED',
                    },
                ],
            },
            select: {
                id: true,
                userId: true,
                name: true,
                phone: true,
                addressLine: true,
                city: true,
                state: true,
                verificationStatus: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 8,
        });
        // Get recommended medstores in same city/state
        const recommendedMedStores = await db_1.default.medStore.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { city: patient.city },
                            { state: patient.state },
                        ],
                    },
                    {
                        verificationStatus: 'VERIFIED',
                    },
                ],
            },
            select: {
                id: true,
                userId: true,
                name: true,
                phone: true,
                addressLine: true,
                city: true,
                state: true,
                verificationStatus: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 8,
        });
        // Get recommended checkup centers in same city/state
        const assignedCheckupCenterIds = patient.checkupCenters.map(c => c.id);
        const recommendedCheckupCenters = await db_1.default.checkupCenter.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { city: patient.city },
                            { state: patient.state },
                        ],
                    },
                    {
                        id: {
                            notIn: assignedCheckupCenterIds,
                        },
                    },
                    {
                        verificationStatus: 'VERIFIED',
                    },
                ],
            },
            select: {
                id: true,
                userId: true,
                name: true,
                phone: true,
                addressLine: true,
                city: true,
                state: true,
                verificationStatus: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 8,
        });
        // Create upcoming medicine reminders from active schedules
        const upcomingReminders = activeSchedules.flatMap(schedule => {
            return schedule.items.flatMap(item => {
                const reminders = [];
                const now = new Date();
                // Calculate reminder times for today and tomorrow
                for (let day = 0; day < 2; day++) {
                    const reminderDate = new Date(now);
                    reminderDate.setDate(reminderDate.getDate() + day);
                    // Check if this day should have medicine (based on gapBetweenDays)
                    const daysSinceStart = Math.floor((reminderDate.getTime() - new Date(schedule.startDate).getTime()) / (1000 * 60 * 60 * 24));
                    if (daysSinceStart >= 0 && (item.gapBetweenDays === 0 || daysSinceStart % (item.gapBetweenDays + 1) === 0)) {
                        // Create reminders based on timesPerDay
                        for (let timeIndex = 0; timeIndex < item.timesPerDay; timeIndex++) {
                            const reminderTime = new Date(reminderDate);
                            // Distribute times throughout the day
                            const hourGap = Math.floor(16 / item.timesPerDay);
                            reminderTime.setHours(6 + (timeIndex * hourGap), 0, 0, 0);
                            if (reminderTime > now) {
                                reminders.push({
                                    id: `${item.id}-${day}-${timeIndex}`,
                                    medicineItemId: item.id,
                                    medicineName: item.medicineName,
                                    dosage: item.dosage,
                                    scheduledTime: reminderTime,
                                    isCompleted: false,
                                    pointsAwarded: 5,
                                    scheduleDate: reminderDate,
                                    notes: item.notes,
                                });
                            }
                        }
                    }
                }
                return reminders;
            });
        }).slice(0, 10); // Limit to 10 upcoming reminders
        // Combine all appointments
        const todayAppointments = [
            ...upcomingAppointments.map(apt => ({
                id: apt.id,
                type: 'DOCTOR_VISIT',
                title: `Dr. ${apt.doctor.name}`,
                subtitle: apt.doctor.specialization,
                scheduledTime: apt.nextVisit,
                provider: apt.doctor,
            })),
            ...upcomingCheckupAppointments.map(apt => ({
                id: apt.id,
                type: 'CHECKUP',
                title: apt.checkupCenter.name,
                subtitle: 'Health Checkup',
                scheduledTime: apt.nextVisit,
                provider: apt.checkupCenter,
            })),
        ].filter(apt => {
            const today = new Date();
            const scheduleDate = new Date(apt.scheduledTime);
            return scheduleDate.toDateString() === today.toDateString();
        });
        const response = {
            assignedProviders: {
                doctors: patient.doctors,
                hospitals: patient.hospitals,
                checkupCenters: patient.checkupCenters,
            },
            recommendations: {
                doctors: recommendedDoctors,
                hospitals: recommendedHospitals,
                medStores: recommendedMedStores,
                checkupCenters: recommendedCheckupCenters,
            },
            upcomingReminders: upcomingReminders,
            todayAppointments: todayAppointments,
            upcomingAppointments: [
                ...upcomingAppointments.map(apt => ({
                    id: apt.id,
                    type: 'DOCTOR_VISIT',
                    title: `Dr. ${apt.doctor.name}`,
                    subtitle: apt.doctor.specialization,
                    scheduledTime: apt.nextVisit,
                    provider: apt.doctor,
                })),
                ...upcomingCheckupAppointments.map(apt => ({
                    id: apt.id,
                    type: 'CHECKUP',
                    title: apt.checkupCenter.name,
                    subtitle: 'Health Checkup',
                    scheduledTime: apt.nextVisit,
                    provider: apt.checkupCenter,
                })),
            ].slice(0, 10),
            activeMedicineSchedules: activeSchedules.length,
            patientLocation: {
                city: patient.city,
                state: patient.state,
            },
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Error getting home recommendations:', error);
        res.status(500).json({ error: 'Failed to get home recommendations' });
    }
};
exports.getHomeRecommendations = getHomeRecommendations;
