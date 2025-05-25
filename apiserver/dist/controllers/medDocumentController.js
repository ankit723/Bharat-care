"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokePermissionFromCheckupCenter = exports.grantPermissionToCheckupCenter = exports.revokePermissionFromDoctor = exports.grantPermissionToDoctor = exports.deleteMedDocument = exports.updateMedDocument = exports.getMedDocumentById = exports.getMedDocuments = exports.createMedDocument = void 0;
const db_1 = __importDefault(require("../utils/db"));
const client_1 = require("@prisma/client"); // Import Role enum and PrismaDocumentType
// Helper to check if user can view a document
const canViewDocument = async (documentId, userId, userRole) => {
    const document = await db_1.default.medDocument.findUnique({ where: { id: documentId } });
    if (!document)
        return false;
    // Owner can always view
    if (document.uploadedById === userId)
        return true;
    // Patient can view their own documents
    if (userRole === client_1.Role.PATIENT && document.patientId === userId)
        return true;
    // Check permissions for doctors and checkup centers
    if (userRole === client_1.Role.DOCTOR && document.permittedDoctorIds.includes(userId))
        return true;
    if (userRole === client_1.Role.CHECKUP_CENTER && document.permittedCheckupCenterIds.includes(userId))
        return true;
    // Doctors can view documents they uploaded for a patient
    if (userRole === client_1.Role.DOCTOR && document.uploaderType === client_1.Role.DOCTOR && document.uploadedById === userId)
        return true;
    // CheckupCenters can view documents they uploaded for a patient
    if (userRole === client_1.Role.CHECKUP_CENTER && document.uploaderType === client_1.Role.CHECKUP_CENTER && document.uploadedById === userId)
        return true;
    // Patients can view documents uploaded FOR them by a doctor or checkup center who is the uploader
    if (userRole === client_1.Role.PATIENT && document.patientId === userId && (document.uploaderType === client_1.Role.DOCTOR || document.uploaderType === client_1.Role.CHECKUP_CENTER))
        return true;
    return false;
};
// Create a new medical document record
const createMedDocument = async (req, res) => {
    try {
        const { fileName, fileUrl, documentType, patientId, description, uploaderType } = req.body;
        const uploadedById = req.user?.userId; // Assuming userId is available in req.user from auth middleware
        if (!uploadedById || !uploaderType) {
            res.status(400).json({ error: 'Uploader ID and Type are required' });
            return;
        }
        if (!fileName || !fileUrl || !documentType || !patientId) {
            res.status(400).json({ error: 'Missing required fields: fileName, fileUrl, documentType, patientId' });
            return;
        }
        const medDocument = await db_1.default.medDocument.create({
            data: {
                fileName,
                fileUrl,
                documentType,
                patientId,
                uploadedById,
                uploaderType,
                description,
                // Set specific uploader based on uploaderType
                ...(uploaderType === client_1.Role.DOCTOR && { doctorId: uploadedById }),
                ...(uploaderType === client_1.Role.CHECKUP_CENTER && { checkupCenterId: uploadedById }),
                ...(uploaderType === client_1.Role.PATIENT && { patientUploaderId: uploadedById }),
            },
        });
        res.status(201).json(medDocument);
    }
    catch (error) {
        console.error('Error creating medical document:', error);
        res.status(500).json({ error: 'Failed to create medical document' });
    }
};
exports.createMedDocument = createMedDocument;
// Get all medical documents (with filters and permissions)
const getMedDocuments = async (req, res) => {
    try {
        const { patientId, documentType, uploaderType, uploadedByMySelf } = req.query;
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId || !userRole) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const whereClause = {};
        if (patientId)
            whereClause.patientId = patientId;
        if (documentType) {
            // Ensure documentType is a valid enum string before casting
            const docTypeString = documentType;
            if (Object.values(client_1.DocumentType).includes(docTypeString)) {
                whereClause.documentType = docTypeString;
            }
            else if (docTypeString) {
                // Handle invalid documentType query param if necessary, e.g., ignore or error
                console.warn(`Invalid documentType query parameter: ${docTypeString}`);
            }
        }
        if (uploaderType)
            whereClause.uploaderType = uploaderType;
        if (uploadedByMySelf === 'true')
            whereClause.uploadedById = userId;
        let documents = await db_1.default.medDocument.findMany({
            where: whereClause,
            include: {
                patient: { select: { id: true, name: true, email: true } },
                doctor: { select: { id: true, name: true, email: true } },
                checkupCenter: { select: { id: true, name: true, email: true } },
                patientUploader: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        // Filter based on complex permissions
        documents = documents.filter(doc => {
            if (doc.uploadedById === userId)
                return true; // Owner can always view
            if (userRole === client_1.Role.PATIENT && doc.patientId === userId)
                return true; // Patient can view their own documents
            if (userRole === client_1.Role.DOCTOR && doc.permittedDoctorIds.includes(userId))
                return true;
            if (userRole === client_1.Role.CHECKUP_CENTER && doc.permittedCheckupCenterIds.includes(userId))
                return true;
            // Doctors/CheckupCenters can view docs they uploaded
            if ((userRole === client_1.Role.DOCTOR || userRole === client_1.Role.CHECKUP_CENTER) && doc.uploadedById === userId)
                return true;
            // Patient can view docs uploaded FOR them by others
            if (userRole === client_1.Role.PATIENT && doc.patientId === userId && (doc.uploaderType === client_1.Role.DOCTOR || doc.uploaderType === client_1.Role.CHECKUP_CENTER))
                return true;
            return false;
        });
        res.json(documents);
    }
    catch (error) {
        console.error('Error fetching medical documents:', error);
        res.status(500).json({ error: 'Failed to fetch medical documents' });
    }
};
exports.getMedDocuments = getMedDocuments;
// Get a specific medical document by ID (with permissions)
const getMedDocumentById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId || !userRole) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const document = await db_1.default.medDocument.findUnique({
            where: { id },
            include: {
                patient: { select: { id: true, name: true, email: true } },
                doctor: { select: { id: true, name: true, email: true } },
                checkupCenter: { select: { id: true, name: true, email: true } },
                patientUploader: { select: { id: true, name: true, email: true } },
            }
        });
        if (!document) {
            res.status(404).json({ error: 'Medical document not found' });
            return;
        }
        const canView = await canViewDocument(id, userId, userRole);
        if (!canView) {
            res.status(403).json({ error: 'Forbidden: You do not have permission to view this document' });
            return;
        }
        res.json(document);
    }
    catch (error) {
        console.error('Error fetching medical document:', error);
        res.status(500).json({ error: 'Failed to fetch medical document' });
    }
};
exports.getMedDocumentById = getMedDocumentById;
// Update a medical document (e.g., description, permissions)
const updateMedDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        if (!userId || !userRole) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const document = await db_1.default.medDocument.findUnique({ where: { id } });
        if (!document) {
            res.status(404).json({ error: 'Medical document not found' });
            return;
        }
        // Only the uploader or patient (if it's their document) can update permissions or description
        // Or admin in future
        const canUpdate = (document.uploadedById === userId) || (userRole === client_1.Role.PATIENT && document.patientId === userId);
        if (!canUpdate) {
            res.status(403).json({ error: 'Forbidden: You do not have permission to update this document' });
            return;
        }
        // Fields in 'data' are already restricted by MedDocumentUpdateData type
        // So, no need to destructure and omit restricted fields here
        const updatedDocument = await db_1.default.medDocument.update({
            where: { id },
            data: data, // data already contains only allowed fields due to MedDocumentUpdateData type
        });
        res.json(updatedDocument);
    }
    catch (error) {
        console.error('Error updating medical document:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Medical document not found' });
            return;
        }
        res.status(500).json({ error: 'Failed to update medical document' });
    }
};
exports.updateMedDocument = updateMedDocument;
// Delete a medical document (with permissions)
const deleteMedDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        // const userRole = req.user?.role as Role; // Role check might be needed if only certain roles can delete
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const document = await db_1.default.medDocument.findUnique({ where: { id } });
        if (!document) {
            res.status(404).json({ error: 'Medical document not found' });
            return;
        }
        // Only the uploader can delete the document metadata
        // File deletion from Supabase should be handled separately if needed or by a cron job for orphaned files
        if (document.uploadedById !== userId) {
            res.status(403).json({ error: 'Forbidden: You do not have permission to delete this document' });
            return;
        }
        await db_1.default.medDocument.delete({ where: { id } });
        res.status(200).json({ message: 'Medical document deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting medical document:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Medical document not found during deletion' });
            return;
        }
        res.status(500).json({ error: 'Failed to delete medical document' });
    }
};
exports.deleteMedDocument = deleteMedDocument;
// Grant permission to a doctor
const grantPermissionToDoctor = async (req, res) => {
    try {
        const { documentId, doctorIdToPermit } = req.body;
        const patientUserId = req.user?.userId;
        if (!patientUserId || req.user?.role !== client_1.Role.PATIENT) {
            res.status(403).json({ error: 'Only patients can grant permissions.' });
            return;
        }
        const document = await db_1.default.medDocument.findUnique({ where: { id: documentId } });
        if (!document || document.patientId !== patientUserId) {
            res.status(404).json({ error: 'Document not found or does not belong to this patient.' });
            return;
        }
        const updatedDocument = await db_1.default.medDocument.update({
            where: { id: documentId },
            data: { permittedDoctorIds: { push: doctorIdToPermit } },
        });
        res.json(updatedDocument);
    }
    catch (error) {
        console.error('Error granting permission to doctor:', error);
        res.status(500).json({ error: 'Failed to grant permission.' });
    }
};
exports.grantPermissionToDoctor = grantPermissionToDoctor;
// Revoke permission from a doctor
const revokePermissionFromDoctor = async (req, res) => {
    try {
        const { documentId, doctorIdToRevoke } = req.body;
        const patientUserId = req.user?.userId;
        if (!patientUserId || req.user?.role !== client_1.Role.PATIENT) {
            res.status(403).json({ error: 'Only patients can revoke permissions.' });
            return;
        }
        const document = await db_1.default.medDocument.findUnique({ where: { id: documentId } });
        if (!document || document.patientId !== patientUserId) {
            res.status(404).json({ error: 'Document not found or does not belong to this patient.' });
            return;
        }
        const updatedPermittedIds = document.permittedDoctorIds.filter(id => id !== doctorIdToRevoke);
        const updatedDocument = await db_1.default.medDocument.update({
            where: { id: documentId },
            data: { permittedDoctorIds: updatedPermittedIds },
        });
        res.json(updatedDocument);
    }
    catch (error) {
        console.error('Error revoking permission from doctor:', error);
        res.status(500).json({ error: 'Failed to revoke permission.' });
    }
};
exports.revokePermissionFromDoctor = revokePermissionFromDoctor;
// Grant permission to a Checkup Center
const grantPermissionToCheckupCenter = async (req, res) => {
    try {
        const { documentId, checkupCenterIdToPermit } = req.body;
        const patientUserId = req.user?.userId;
        if (!patientUserId || req.user?.role !== client_1.Role.PATIENT) {
            res.status(403).json({ error: 'Only patients can grant permissions.' });
            return;
        }
        const document = await db_1.default.medDocument.findUnique({ where: { id: documentId } });
        if (!document || document.patientId !== patientUserId) {
            res.status(404).json({ error: 'Document not found or does not belong to this patient.' });
            return;
        }
        const updatedDocument = await db_1.default.medDocument.update({
            where: { id: documentId },
            data: { permittedCheckupCenterIds: { push: checkupCenterIdToPermit } },
        });
        res.json(updatedDocument);
    }
    catch (error) {
        console.error('Error granting permission to checkup center:', error);
        res.status(500).json({ error: 'Failed to grant permission.' });
    }
};
exports.grantPermissionToCheckupCenter = grantPermissionToCheckupCenter;
// Revoke permission from a Checkup Center
const revokePermissionFromCheckupCenter = async (req, res) => {
    try {
        const { documentId, checkupCenterIdToRevoke } = req.body;
        const patientUserId = req.user?.userId;
        if (!patientUserId || req.user?.role !== client_1.Role.PATIENT) {
            res.status(403).json({ error: 'Only patients can revoke permissions.' });
            return;
        }
        const document = await db_1.default.medDocument.findUnique({ where: { id: documentId } });
        if (!document || document.patientId !== patientUserId) {
            res.status(404).json({ error: 'Document not found or does not belong to this patient.' });
            return;
        }
        const updatedPermittedIds = document.permittedCheckupCenterIds.filter(id => id !== checkupCenterIdToRevoke);
        const updatedDocument = await db_1.default.medDocument.update({
            where: { id: documentId },
            data: { permittedCheckupCenterIds: updatedPermittedIds },
        });
        res.json(updatedDocument);
    }
    catch (error) {
        console.error('Error revoking permission from checkup center:', error);
        res.status(500).json({ error: 'Failed to revoke permission.' });
    }
};
exports.revokePermissionFromCheckupCenter = revokePermissionFromCheckupCenter;
