"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCheckupCenterAppointments = exports.getDoctorAppointments = exports.cancelCheckupAppointment = exports.cancelDoctorAppointment = exports.scheduleCheckupAppointment = exports.scheduleDoctorAppointment = exports.getNextVisits = exports.getPatientAppointments = void 0;
const db_1 = __importDefault(require("../utils/db"));
const client_1 = require("@prisma/client");
// Get appointments for patient
const getPatientAppointments = async (req, res) => {
    try {
        const patientId = req.user?.userId;
        const userRole = req.user?.role;
        if (!patientId || userRole !== client_1.Role.PATIENT) {
            res.status(403).json({ error: 'Only patients can access their appointments' });
            return;
        }
        // Get doctor appointments
        const doctorAppointments = await db_1.default.doctorNextVisit.findMany({
            where: { patientId },
            include: {
                doctor: {
                    select: {
                        id: true,
                        userId: true,
                        name: true,
                        specialization: true,
                        phone: true,
                        email: true,
                        addressLine: true,
                        city: true,
                        state: true,
                        verificationStatus: true,
                    },
                },
                patient: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                nextVisit: 'asc',
            },
        });
        // Get checkup center appointments
        const checkupAppointments = await db_1.default.checkupCenterNextVisit.findMany({
            where: { patientId },
            include: {
                checkupCenter: {
                    select: {
                        id: true,
                        userId: true,
                        name: true,
                        phone: true,
                        email: true,
                        addressLine: true,
                        city: true,
                        state: true,
                        verificationStatus: true,
                    },
                },
                patient: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                nextVisit: 'asc',
            },
        });
        // Combine and format appointments
        const appointments = [
            ...doctorAppointments.map(apt => ({
                id: apt.id,
                type: 'DOCTOR_VISIT',
                appointmentDate: apt.nextVisit,
                status: new Date(apt.nextVisit) > new Date() ? 'UPCOMING' : 'PAST',
                provider: {
                    id: apt.doctor.id,
                    userId: apt.doctor.userId,
                    name: apt.doctor.name,
                    type: 'doctor',
                    specialization: apt.doctor.specialization,
                    phone: apt.doctor.phone,
                    email: apt.doctor.email,
                    address: apt.doctor.addressLine,
                    city: apt.doctor.city,
                    state: apt.doctor.state,
                    verificationStatus: apt.doctor.verificationStatus,
                },
                patient: apt.patient,
            })),
            ...checkupAppointments.map(apt => ({
                id: apt.id,
                type: 'CHECKUP',
                appointmentDate: apt.nextVisit,
                status: new Date(apt.nextVisit) > new Date() ? 'UPCOMING' : 'PAST',
                provider: {
                    id: apt.checkupCenter.id,
                    userId: apt.checkupCenter.userId,
                    name: apt.checkupCenter.name,
                    type: 'checkup_center',
                    phone: apt.checkupCenter.phone,
                    email: apt.checkupCenter.email,
                    address: apt.checkupCenter.addressLine,
                    city: apt.checkupCenter.city,
                    state: apt.checkupCenter.state,
                    verificationStatus: apt.checkupCenter.verificationStatus,
                },
                patient: apt.patient,
            })),
        ].sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
        res.status(200).json({
            appointments,
            upcoming: appointments.filter(apt => apt.status === 'UPCOMING'),
            past: appointments.filter(apt => apt.status === 'PAST'),
            total: appointments.length,
        });
    }
    catch (error) {
        console.error('Error getting patient appointments:', error);
        res.status(500).json({ error: 'Failed to get appointments' });
    }
};
exports.getPatientAppointments = getPatientAppointments;
// Get next visits for patient (alias for mobile app compatibility)
const getNextVisits = async (req, res) => {
    try {
        const patientId = req.user?.userId;
        const userRole = req.user?.role;
        if (!patientId || userRole !== client_1.Role.PATIENT) {
            res.status(403).json({ error: 'Only patients can access their next visits' });
            return;
        }
        const now = new Date();
        // Get upcoming doctor visits
        const doctorVisits = await db_1.default.doctorNextVisit.findMany({
            where: {
                patientId,
                nextVisit: {
                    gte: now,
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
            take: 10,
        });
        // Get upcoming checkup visits
        const checkupVisits = await db_1.default.checkupCenterNextVisit.findMany({
            where: {
                patientId,
                nextVisit: {
                    gte: now,
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
            take: 10,
        });
        const nextVisits = [
            ...doctorVisits.map(visit => ({
                id: visit.id,
                type: 'DOCTOR_VISIT',
                nextVisit: visit.nextVisit,
                provider: visit.doctor,
                providerType: 'doctor',
            })),
            ...checkupVisits.map(visit => ({
                id: visit.id,
                type: 'CHECKUP',
                nextVisit: visit.nextVisit,
                provider: visit.checkupCenter,
                providerType: 'checkup_center',
            })),
        ].sort((a, b) => new Date(a.nextVisit).getTime() - new Date(b.nextVisit).getTime());
        res.status(200).json(nextVisits);
    }
    catch (error) {
        console.error('Error getting next visits:', error);
        res.status(500).json({ error: 'Failed to get next visits' });
    }
};
exports.getNextVisits = getNextVisits;
// Schedule doctor appointment
const scheduleDoctorAppointment = async (req, res) => {
    try {
        const { doctorId, nextVisit } = req.body;
        const patientId = req.user?.userId;
        const userRole = req.user?.role;
        if (!patientId || userRole !== client_1.Role.PATIENT) {
            res.status(403).json({ error: 'Only patients can schedule appointments' });
            return;
        }
        if (!doctorId || !nextVisit) {
            res.status(400).json({ error: 'Doctor ID and appointment date are required' });
            return;
        }
        // Verify doctor exists
        const doctor = await db_1.default.doctor.findUnique({
            where: { id: doctorId },
        });
        if (!doctor) {
            res.status(404).json({ error: 'Doctor not found' });
            return;
        }
        // Verify appointment date is in the future
        if (new Date(nextVisit) <= new Date()) {
            res.status(400).json({ error: 'Appointment date must be in the future' });
            return;
        }
        // Check if appointment already exists for this date/time
        const existingAppointment = await db_1.default.doctorNextVisit.findFirst({
            where: {
                doctorId,
                nextVisit: new Date(nextVisit),
            },
        });
        if (existingAppointment) {
            res.status(409).json({ error: 'This time slot is already booked' });
            return;
        }
        // Create appointment
        const appointment = await db_1.default.doctorNextVisit.create({
            data: {
                doctorId,
                patientId,
                nextVisit: new Date(nextVisit),
            },
            include: {
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        specialization: true,
                        phone: true,
                        email: true,
                        city: true,
                        state: true,
                    },
                },
                patient: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                    },
                },
            },
        });
        // Add patient to doctor's patient list if not already added
        await db_1.default.doctor.update({
            where: { id: doctorId },
            data: {
                patients: {
                    connect: { id: patientId },
                },
            },
        }).catch(() => {
            // Patient might already be connected, ignore error
        });
        res.status(201).json(appointment);
    }
    catch (error) {
        console.error('Error scheduling doctor appointment:', error);
        res.status(500).json({ error: 'Failed to schedule appointment' });
    }
};
exports.scheduleDoctorAppointment = scheduleDoctorAppointment;
// Schedule checkup center appointment
const scheduleCheckupAppointment = async (req, res) => {
    try {
        const { checkupCenterId, nextVisit } = req.body;
        const patientId = req.user?.userId;
        const userRole = req.user?.role;
        if (!patientId || userRole !== client_1.Role.PATIENT) {
            res.status(403).json({ error: 'Only patients can schedule appointments' });
            return;
        }
        if (!checkupCenterId || !nextVisit) {
            res.status(400).json({ error: 'Checkup center ID and appointment date are required' });
            return;
        }
        // Verify checkup center exists
        const checkupCenter = await db_1.default.checkupCenter.findUnique({
            where: { id: checkupCenterId },
        });
        if (!checkupCenter) {
            res.status(404).json({ error: 'Checkup center not found' });
            return;
        }
        // Verify appointment date is in the future
        if (new Date(nextVisit) <= new Date()) {
            res.status(400).json({ error: 'Appointment date must be in the future' });
            return;
        }
        // Check if appointment already exists for this date/time
        const existingAppointment = await db_1.default.checkupCenterNextVisit.findFirst({
            where: {
                checkupCenterId,
                nextVisit: new Date(nextVisit),
            },
        });
        if (existingAppointment) {
            res.status(409).json({ error: 'This time slot is already booked' });
            return;
        }
        // Create appointment
        const appointment = await db_1.default.checkupCenterNextVisit.create({
            data: {
                checkupCenterId,
                patientId,
                nextVisit: new Date(nextVisit),
            },
            include: {
                checkupCenter: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                        city: true,
                        state: true,
                    },
                },
                patient: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                    },
                },
            },
        });
        // Add patient to checkup center's patient list if not already added
        await db_1.default.checkupCenter.update({
            where: { id: checkupCenterId },
            data: {
                patients: {
                    connect: { id: patientId },
                },
            },
        }).catch(() => {
            // Patient might already be connected, ignore error
        });
        res.status(201).json(appointment);
    }
    catch (error) {
        console.error('Error scheduling checkup appointment:', error);
        res.status(500).json({ error: 'Failed to schedule appointment' });
    }
};
exports.scheduleCheckupAppointment = scheduleCheckupAppointment;
// Cancel doctor appointment
const cancelDoctorAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const patientId = req.user?.userId;
        const userRole = req.user?.role;
        if (!patientId || userRole !== client_1.Role.PATIENT) {
            res.status(403).json({ error: 'Only patients can cancel their appointments' });
            return;
        }
        // Find and verify appointment belongs to patient
        const appointment = await db_1.default.doctorNextVisit.findUnique({
            where: { id: appointmentId },
        });
        if (!appointment) {
            res.status(404).json({ error: 'Appointment not found' });
            return;
        }
        if (appointment.patientId !== patientId) {
            res.status(403).json({ error: 'You can only cancel your own appointments' });
            return;
        }
        // Delete appointment
        await db_1.default.doctorNextVisit.delete({
            where: { id: appointmentId },
        });
        res.status(200).json({ message: 'Appointment cancelled successfully' });
    }
    catch (error) {
        console.error('Error cancelling doctor appointment:', error);
        res.status(500).json({ error: 'Failed to cancel appointment' });
    }
};
exports.cancelDoctorAppointment = cancelDoctorAppointment;
// Cancel checkup appointment
const cancelCheckupAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const patientId = req.user?.userId;
        const userRole = req.user?.role;
        if (!patientId || userRole !== client_1.Role.PATIENT) {
            res.status(403).json({ error: 'Only patients can cancel their appointments' });
            return;
        }
        // Find and verify appointment belongs to patient
        const appointment = await db_1.default.checkupCenterNextVisit.findUnique({
            where: { id: appointmentId },
        });
        if (!appointment) {
            res.status(404).json({ error: 'Appointment not found' });
            return;
        }
        if (appointment.patientId !== patientId) {
            res.status(403).json({ error: 'You can only cancel your own appointments' });
            return;
        }
        // Delete appointment
        await db_1.default.checkupCenterNextVisit.delete({
            where: { id: appointmentId },
        });
        res.status(200).json({ message: 'Appointment cancelled successfully' });
    }
    catch (error) {
        console.error('Error cancelling checkup appointment:', error);
        res.status(500).json({ error: 'Failed to cancel appointment' });
    }
};
exports.cancelCheckupAppointment = cancelCheckupAppointment;
// Get doctor's appointments (for doctor dashboard)
const getDoctorAppointments = async (req, res) => {
    try {
        const doctorId = req.user?.userId;
        const userRole = req.user?.role;
        if (!doctorId || userRole !== client_1.Role.DOCTOR) {
            res.status(403).json({ error: 'Only doctors can access their appointments' });
            return;
        }
        const appointments = await db_1.default.doctorNextVisit.findMany({
            where: { doctorId },
            include: {
                patient: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                        city: true,
                        state: true,
                    },
                },
            },
            orderBy: {
                nextVisit: 'asc',
            },
        });
        res.status(200).json(appointments);
    }
    catch (error) {
        console.error('Error getting doctor appointments:', error);
        res.status(500).json({ error: 'Failed to get appointments' });
    }
};
exports.getDoctorAppointments = getDoctorAppointments;
// Get checkup center's appointments (for checkup center dashboard)
const getCheckupCenterAppointments = async (req, res) => {
    try {
        const checkupCenterId = req.user?.userId;
        const userRole = req.user?.role;
        if (!checkupCenterId || userRole !== client_1.Role.CHECKUP_CENTER) {
            res.status(403).json({ error: 'Only checkup centers can access their appointments' });
            return;
        }
        const appointments = await db_1.default.checkupCenterNextVisit.findMany({
            where: { checkupCenterId },
            include: {
                patient: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                        city: true,
                        state: true,
                    },
                },
            },
            orderBy: {
                nextVisit: 'asc',
            },
        });
        res.status(200).json(appointments);
    }
    catch (error) {
        console.error('Error getting checkup center appointments:', error);
        res.status(500).json({ error: 'Failed to get appointments' });
    }
};
exports.getCheckupCenterAppointments = getCheckupCenterAppointments;
