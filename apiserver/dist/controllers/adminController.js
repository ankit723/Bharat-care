"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVerificationStatus = exports.getPendingVerifications = void 0;
const db_1 = __importDefault(require("../utils/db"));
const mapToVerifiableEntity = (entity, entityType, userFriendlyRole) => {
    // Ensure all fields exist, providing defaults or handling nulls where necessary
    if (!entity.id || !entity.name || !entity.email || !entity.createdAt || !entity.verificationStatus) {
        console.error(`Missing required fields for entityType: ${entityType}, id: ${entity.id}`);
        // Decide how to handle this, e.g., throw an error or return a partial object that might be filtered out
        // For now, let's throw to make it explicit during development if data is inconsistent
        throw new Error(`Incomplete data for ${entityType} with id ${entity.id}`);
    }
    return {
        id: entity.id,
        name: entity.name,
        email: entity.email,
        phone: entity.phone || null,
        role: userFriendlyRole,
        entityType: entityType,
        verificationStatus: entity.verificationStatus,
        createdAt: entity.createdAt,
    };
};
const getPendingVerifications = async (req, res) => {
    try {
        const pendingDoctors = await db_1.default.doctor.findMany({
            where: { verificationStatus: 'PENDING' },
            select: { id: true, name: true, email: true, phone: true, createdAt: true, verificationStatus: true },
        });
        const pendingClinics = await db_1.default.clinic.findMany({
            where: { verificationStatus: 'PENDING' },
            select: { id: true, name: true, email: true, phone: true, createdAt: true, verificationStatus: true },
        });
        const pendingHospitals = await db_1.default.hospital.findMany({
            where: { verificationStatus: 'PENDING' },
            select: { id: true, name: true, email: true, phone: true, createdAt: true, verificationStatus: true },
        });
        const pendingCheckupCenters = await db_1.default.checkupCenter.findMany({
            where: { verificationStatus: 'PENDING' },
            select: { id: true, name: true, email: true, phone: true, createdAt: true, verificationStatus: true },
        });
        const pendingMedStores = await db_1.default.medStore.findMany({
            where: { verificationStatus: 'PENDING' },
            select: { id: true, name: true, email: true, phone: true, createdAt: true, verificationStatus: true },
        });
        const allPending = [
            ...pendingDoctors.map(d => mapToVerifiableEntity(d, 'doctor', 'Doctor')),
            ...pendingClinics.map(c => mapToVerifiableEntity(c, 'clinic', 'Clinic')),
            ...pendingHospitals.map(h => mapToVerifiableEntity(h, 'hospital', 'Hospital')),
            ...pendingCheckupCenters.map(cc => mapToVerifiableEntity(cc, 'checkupCenter', 'Checkup Center')),
            ...pendingMedStores.map(ms => mapToVerifiableEntity(ms, 'medStore', 'Med Store')),
        ];
        // Sort by creation date, oldest first
        allPending.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        res.json(allPending);
    }
    catch (error) {
        console.error('Error fetching pending verifications:', error);
        res.status(500).json({ error: 'Failed to fetch pending verifications' });
    }
};
exports.getPendingVerifications = getPendingVerifications;
const updateVerificationStatus = async (req, res) => {
    const { entityType, entityId } = req.params;
    const { status } = req.body;
    if (!status || (status !== 'VERIFIED' && status !== 'REJECTED')) {
        res.status(400).json({ error: 'Invalid verification status provided.' });
        return;
    }
    try {
        let updatedEntity;
        const dataToUpdate = { verificationStatus: status };
        switch (entityType.toLowerCase()) {
            case 'doctor':
                updatedEntity = await db_1.default.doctor.update({ where: { id: entityId }, data: dataToUpdate });
                break;
            case 'clinic':
                updatedEntity = await db_1.default.clinic.update({ where: { id: entityId }, data: dataToUpdate });
                break;
            case 'hospital':
                updatedEntity = await db_1.default.hospital.update({ where: { id: entityId }, data: dataToUpdate });
                break;
            case 'checkupcenter': // frontend uses 'checkupCenter', ensure consistency or handle both
                updatedEntity = await db_1.default.checkupCenter.update({ where: { id: entityId }, data: dataToUpdate });
                break;
            case 'medstore':
                updatedEntity = await db_1.default.medStore.update({ where: { id: entityId }, data: dataToUpdate });
                break;
            default:
                res.status(400).json({ error: 'Invalid entity type provided.' });
                return;
        }
        if (!updatedEntity) {
            res.status(404).json({ error: `${entityType} with ID ${entityId} not found.` });
            return;
        }
        // Omit password if it exists on the entity (though not expected for verification update)
        const { password, ...entityWithoutPassword } = updatedEntity;
        res.json(entityWithoutPassword);
    }
    catch (error) {
        console.error(`Error updating verification status for ${entityType} ${entityId}:`, error);
        if (error.code === 'P2025') { // Prisma error code for record not found
            res.status(404).json({ error: `${entityType} with ID ${entityId} not found.` });
        }
        else {
            res.status(500).json({ error: `Failed to update verification status for ${entityType}.` });
        }
    }
};
exports.updateVerificationStatus = updateVerificationStatus;
