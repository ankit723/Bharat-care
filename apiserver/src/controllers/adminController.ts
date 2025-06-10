import { Request, Response } from 'express';
import prisma from '../utils/db';
import { VerificationStatus } from '@prisma/client'; // Assuming VerificationStatus is exported by Prisma client

interface VerifiableEntity {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  userId?: string | null;
  role: string; // User-friendly role name
  entityType: string; // Model name for API
  verificationStatus: VerificationStatus;
  createdAt: Date;
}

const mapToVerifiableEntity = (entity: any, entityType: string, userFriendlyRole: string): VerifiableEntity => {
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
    userId: entity.userId || null,
    role: userFriendlyRole,
    entityType: entityType,
    verificationStatus: entity.verificationStatus as VerificationStatus,
    createdAt: entity.createdAt,
  };
};

export const getPendingVerifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const pendingDoctors = await prisma.doctor.findMany({
      where: { verificationStatus: 'PENDING' },
      select: { id: true, name: true, email: true, phone: true, userId: true, createdAt: true, verificationStatus: true },
    });
    const pendingClinics = await prisma.clinic.findMany({
      where: { verificationStatus: 'PENDING' },
      select: { id: true, name: true, email: true, phone: true, userId: true, createdAt: true, verificationStatus: true },
    });
    const pendingHospitals = await prisma.hospital.findMany({
      where: { verificationStatus: 'PENDING' },
      select: { id: true, name: true, email: true, phone: true, userId: true, createdAt: true, verificationStatus: true },
    });
    const pendingCheckupCenters = await prisma.checkupCenter.findMany({
      where: { verificationStatus: 'PENDING' },
      select: { id: true, name: true, email: true, phone: true, userId: true, createdAt: true, verificationStatus: true },
    });
    const pendingMedStores = await prisma.medStore.findMany({
      where: { verificationStatus: 'PENDING' },
      select: { id: true, name: true, email: true, phone: true, userId: true, createdAt: true, verificationStatus: true },
    });

    const allPending: VerifiableEntity[] = [
      ...pendingDoctors.map(d => mapToVerifiableEntity(d, 'doctor', 'Doctor')),
      ...pendingClinics.map(c => mapToVerifiableEntity(c, 'clinic', 'Clinic')),
      ...pendingHospitals.map(h => mapToVerifiableEntity(h, 'hospital', 'Hospital')),
      ...pendingCheckupCenters.map(cc => mapToVerifiableEntity(cc, 'checkupCenter', 'Checkup Center')),
      ...pendingMedStores.map(ms => mapToVerifiableEntity(ms, 'medStore', 'Med Store')),
    ];

    // Sort by creation date, oldest first
    allPending.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    res.json(allPending);
  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    res.status(500).json({ error: 'Failed to fetch pending verifications' });
  }
};

export const updateVerificationStatus = async (req: Request, res: Response): Promise<void> => {
  const { entityType, entityId } = req.params;
  const { status } = req.body;

  if (!status || (status !== 'VERIFIED' && status !== 'REJECTED')) {
    res.status(400).json({ error: 'Invalid verification status provided.' });
    return;
  }

  try {
    let updatedEntity;
    const dataToUpdate = { verificationStatus: status as VerificationStatus };

    switch (entityType.toLowerCase()) {
      case 'doctor':
        updatedEntity = await prisma.doctor.update({ where: { id: entityId }, data: dataToUpdate });
        break;
      case 'clinic':
        updatedEntity = await prisma.clinic.update({ where: { id: entityId }, data: dataToUpdate });
        break;
      case 'hospital':
        updatedEntity = await prisma.hospital.update({ where: { id: entityId }, data: dataToUpdate });
        break;
      case 'checkupcenter': // frontend uses 'checkupCenter', ensure consistency or handle both
        updatedEntity = await prisma.checkupCenter.update({ where: { id: entityId }, data: dataToUpdate });
        break;
      case 'medstore':
        updatedEntity = await prisma.medStore.update({ where: { id: entityId }, data: dataToUpdate });
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
    const { password, ...entityWithoutPassword } = updatedEntity as any;
    res.json(entityWithoutPassword);

  } catch (error: any) {
    console.error(`Error updating verification status for ${entityType} ${entityId}:`, error);
    if (error.code === 'P2025') { // Prisma error code for record not found
      res.status(404).json({ error: `${entityType} with ID ${entityId} not found.` });
    } else {
      res.status(500).json({ error: `Failed to update verification status for ${entityType}.` });
    }
  }
}; 