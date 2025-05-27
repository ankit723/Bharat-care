"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMedicineSchedule = exports.updateMedicineSchedule = exports.getSchedulesCreatedByMedStore = exports.getSchedulesCreatedByDoctor = exports.getSchedulesForPatient = exports.createMedicineSchedule = void 0;
const db_1 = __importDefault(require("../utils/db"));
const client_1 = require("@prisma/client"); // Import Role enum
// Create a new medicine schedule
const createMedicineSchedule = async (req, res) => {
    try {
        const { patientId, startDate, numberOfDays, notes, items } = req.body;
        const schedulerId = req.user?.userId;
        const schedulerType = req.user?.role; // Cast to Prisma Role
        if (!patientId || !startDate || !numberOfDays || !items || items.length === 0) {
            res.status(400).json({ error: 'Missing required fields or no medicine items provided' });
            return;
        }
        if (!schedulerId || (schedulerType !== client_1.Role.DOCTOR && schedulerType !== client_1.Role.MEDSTORE)) {
            res.status(403).json({ error: 'User is not authorized to create a schedule or user role is missing.' });
            return;
        }
        const patient = await db_1.default.patient.findUnique({ where: { id: patientId } });
        if (!patient) {
            res.status(404).json({ error: 'Patient not found' });
            return;
        }
        // Validate items
        for (const item of items) {
            if (!item.medicineName || !item.dosage || item.timesPerDay === undefined || item.gapBetweenDays === undefined) {
                res.status(400).json({ error: `Missing required fields for medicine item: ${item.medicineName || 'Unnamed Item'}` });
                return;
            }
        }
        const newSchedule = await db_1.default.$transaction(async (tx) => {
            const schedule = await tx.medicineSchedule.create({
                data: {
                    patientId,
                    startDate: new Date(startDate),
                    numberOfDays: parseInt(String(numberOfDays)), // Ensure numberOfDays is number
                    notes,
                    schedulerId,
                    schedulerType,
                    items: {
                        create: items.map(item => ({
                            medicineName: item.medicineName,
                            dosage: item.dosage,
                            timesPerDay: parseInt(String(item.timesPerDay)),
                            gapBetweenDays: parseInt(String(item.gapBetweenDays)),
                            notes: item.notes,
                        })),
                    },
                },
                include: { items: true }, // Include items in the response
            });
            return schedule;
        });
        res.status(201).json(newSchedule);
    }
    catch (error) {
        console.error('Error creating medicine schedule:', error);
        res.status(500).json({ error: 'Failed to create medicine schedule' });
    }
};
exports.createMedicineSchedule = createMedicineSchedule;
// Get all schedules for a specific patient
const getSchedulesForPatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        const requestingUser = req.user;
        // Fetch schedules directly and include items
        const schedules = await db_1.default.medicineSchedule.findMany({
            where: { patientId: patientId },
            include: {
                items: true,
                patient: { select: { id: true, name: true, email: true } }
            },
            orderBy: { startDate: 'desc' }
        });
        if (!schedules) { // Should check if schedules array is empty or if patient doesn't exist for a more precise message
            res.status(404).json({ error: 'No schedules found for this patient or patient does not exist.' });
            return;
        }
        // Authorization: Simplified for now - patient can see their own, Admin, Doctor, MedStore can see.
        // A more robust check might be needed depending on privacy requirements.
        const isPatientOwner = requestingUser?.userId === patientId;
        const isAdmin = requestingUser?.role === client_1.Role.ADMIN;
        const isCareProvider = requestingUser?.role === client_1.Role.DOCTOR || requestingUser?.role === client_1.Role.MEDSTORE;
        if (!isPatientOwner && !isAdmin && !isCareProvider) {
            res.status(403).json({ error: 'Not authorized to view these schedules' });
            return;
        }
        res.json(schedules);
    }
    catch (error) {
        console.error('Error fetching schedules for patient:', error);
        res.status(500).json({ error: 'Failed to fetch schedules' });
    }
};
exports.getSchedulesForPatient = getSchedulesForPatient;
// Get all schedules created by the currently authenticated doctor
const getSchedulesCreatedByDoctor = async (req, res) => {
    try {
        const doctorId = req.user?.userId;
        if (!doctorId || req.user?.role !== client_1.Role.DOCTOR) {
            res.status(403).json({ error: 'Forbidden: User is not a Doctor or not logged in.' });
            return;
        }
        const schedules = await db_1.default.medicineSchedule.findMany({
            where: { schedulerId: doctorId, schedulerType: client_1.Role.DOCTOR },
            include: {
                items: true,
                patient: { select: { id: true, name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(schedules);
    }
    catch (error) {
        console.error('Error fetching schedules by doctor:', error);
        res.status(500).json({ error: 'Failed to fetch schedules' });
    }
};
exports.getSchedulesCreatedByDoctor = getSchedulesCreatedByDoctor;
// Get all schedules created by the currently authenticated medstore
const getSchedulesCreatedByMedStore = async (req, res) => {
    try {
        const medStoreId = req.user?.userId;
        if (!medStoreId || req.user?.role !== client_1.Role.MEDSTORE) {
            res.status(403).json({ error: 'Forbidden: User is not a MedStore or not logged in.' });
            return;
        }
        const schedules = await db_1.default.medicineSchedule.findMany({
            where: { schedulerId: medStoreId, schedulerType: client_1.Role.MEDSTORE },
            include: {
                items: true,
                patient: { select: { id: true, name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(schedules);
    }
    catch (error) {
        console.error('Error fetching schedules by medstore:', error);
        res.status(500).json({ error: 'Failed to fetch schedules' });
    }
};
exports.getSchedulesCreatedByMedStore = getSchedulesCreatedByMedStore;
// Update a medicine schedule
const updateMedicineSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { patientId, startDate, numberOfDays, notes, items } = req.body;
        const requestingUser = req.user;
        const existingSchedule = await db_1.default.medicineSchedule.findUnique({
            where: { id: scheduleId },
            include: { items: true }
        });
        if (!existingSchedule) {
            res.status(404).json({ error: 'Schedule not found' });
            return;
        }
        if (existingSchedule.schedulerId !== requestingUser?.userId && requestingUser?.role !== client_1.Role.ADMIN) {
            res.status(403).json({ error: 'Not authorized to update this schedule' });
            return;
        }
        if (patientId) {
            const patient = await db_1.default.patient.findUnique({ where: { id: patientId } });
            if (!patient) {
                res.status(404).json({ error: `Patient with ID ${patientId} not found` });
                return;
            }
        }
        const updatedSchedule = await db_1.default.$transaction(async (tx) => {
            // 1. Update parent MedicineSchedule fields
            const scheduleDataToUpdate = {};
            if (patientId)
                scheduleDataToUpdate.patientId = patientId;
            if (startDate)
                scheduleDataToUpdate.startDate = new Date(startDate);
            if (numberOfDays !== undefined)
                scheduleDataToUpdate.numberOfDays = parseInt(String(numberOfDays));
            if (notes !== undefined)
                scheduleDataToUpdate.notes = notes; // Allow setting notes to null or empty string
            if (Object.keys(scheduleDataToUpdate).length > 0) {
                await tx.medicineSchedule.update({
                    where: { id: scheduleId },
                    data: scheduleDataToUpdate,
                });
            }
            // 2. Handle ScheduledMedicineItems
            if (items) {
                const itemIdsToKeep = [];
                for (const itemData of items) {
                    if (!itemData.medicineName || !itemData.dosage || itemData.timesPerDay === undefined || itemData.gapBetweenDays === undefined) {
                        throw new Error(`Missing required fields for medicine item: ${itemData.medicineName || 'Unnamed Item'}`);
                    }
                    const itemDataPayload = {
                        medicineName: itemData.medicineName,
                        dosage: itemData.dosage,
                        timesPerDay: parseInt(String(itemData.timesPerDay)),
                        gapBetweenDays: parseInt(String(itemData.gapBetweenDays)),
                        notes: itemData.notes,
                    };
                    if (itemData.id) { // Existing item: Update it
                        itemIdsToKeep.push(itemData.id);
                        await tx.scheduledMedicineItem.update({
                            where: { id: itemData.id, medicineScheduleId: scheduleId }, // Ensure item belongs to schedule
                            data: itemDataPayload,
                        });
                    }
                    else { // New item: Create it
                        const newItem = await tx.scheduledMedicineItem.create({
                            data: {
                                ...itemDataPayload,
                                medicineScheduleId: scheduleId,
                            },
                        });
                        itemIdsToKeep.push(newItem.id);
                    }
                }
                // 3. Delete items that were not in the 'items' array (i.e., were removed)
                const existingItemIds = existingSchedule.items.map(item => item.id);
                const itemIdsToDelete = existingItemIds.filter(id => !itemIdsToKeep.includes(id));
                if (itemIdsToDelete.length > 0) {
                    await tx.scheduledMedicineItem.deleteMany({
                        where: {
                            id: { in: itemIdsToDelete },
                            medicineScheduleId: scheduleId, // Ensure deleting only from this schedule
                        },
                    });
                }
            }
            // Return the updated schedule with its items
            return tx.medicineSchedule.findUnique({
                where: { id: scheduleId },
                include: { items: true, patient: { select: { id: true, name: true, email: true } } },
            });
        });
        res.json(updatedSchedule);
    }
    catch (error) {
        console.error('Error updating medicine schedule:', error);
        if (error.message.startsWith('Missing required fields for medicine item')) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Failed to update schedule' });
        }
    }
};
exports.updateMedicineSchedule = updateMedicineSchedule;
// Delete a medicine schedule
const deleteMedicineSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const requestingUser = req.user;
        const schedule = await db_1.default.medicineSchedule.findUnique({ where: { id: scheduleId } });
        if (!schedule) {
            res.status(404).json({ error: 'Schedule not found' });
            return;
        }
        if (schedule.schedulerId !== requestingUser?.userId && requestingUser?.role !== client_1.Role.ADMIN) {
            res.status(403).json({ error: 'Not authorized to delete this schedule' });
            return;
        }
        // Cascading delete will handle associated ScheduledMedicineItem records
        // as defined by onDelete: Cascade in the Prisma schema.
        await db_1.default.medicineSchedule.delete({
            where: { id: scheduleId },
            include: { items: true } // Not strictly needed for delete, but good for confirmation/logging if any
        });
        res.status(204).send(); // No content
    }
    catch (error) {
        console.error('Error deleting medicine schedule:', error);
        res.status(500).json({ error: 'Failed to delete schedule' });
    }
};
exports.deleteMedicineSchedule = deleteMedicineSchedule;
