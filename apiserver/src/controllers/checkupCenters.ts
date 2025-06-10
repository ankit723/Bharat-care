import { Request, Response } from 'express';
import prisma from '../utils/db'; // Use shared prisma instance
import { CheckupCenterCreateData, CheckupCenterUpdateData } from '../types'; // Assuming types are defined
import bcrypt from 'bcryptjs';
import { Role, VerificationStatus } from '@prisma/client';
import { generateUserId } from '../utils/userIdGenerator';

// Get all checkup centers with pagination and search
export const getCheckupCenters = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = search
      ? {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } },
            { city: { contains: search as string, mode: 'insensitive' } },
            { state: { contains: search as string, mode: 'insensitive' } },
          ],
        }
      : {};

    const [checkupCenters, total] = await Promise.all([
      prisma.checkupCenter.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          patients: { select: { id: true, name: true } }, // Include basic patient info
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.checkupCenter.count({ where }),
    ]);
    
    // Omit passwords if they were to be included in the future for some reason
    const centersWithoutPasswords = checkupCenters.map(({ password, ...center }) => center);

    res.json({
      data: centersWithoutPasswords,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
      search: {
        term: search ? String(search) : '',
        recommendedDebounceMs: 300, // Recommend client-side debounce time
        minSearchLength: 2, // Recommend minimum search term length
      }
    });
  } catch (error) {
    console.error('Error fetching checkup centers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch checkup centers',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};

// Get checkup center by ID
export const getCheckupCenterById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const checkupCenter = await prisma.checkupCenter.findUnique({
      where: { id },
      include: {
        patients: { // Include full patient details
          include: { // Include the checkupCenterNextVisit relation for each patient
            checkupCenterNextVisit: {
              where: { checkupCenterId: id }, // Filter for visits with this center
              orderBy: { nextVisit: 'desc' }, // Get the latest one
              take: 1,
            }
          }
        },
        medDocuments: { // Include documents uploaded by this center
            where: { uploadedById: id, uploaderType: Role.CHECKUP_CENTER },
            include: { patient: {select: {id: true, name: true}} }
        }
      },
    });

    if (!checkupCenter) {
      res.status(404).json({ error: 'Checkup center not found' });
      return;
    }
    const { password, ...centerData } = checkupCenter;

    // Map patients to include a simplified checkupCenterNextVisit field
    const processedPatients = centerData.patients.map(patient => {
      const latestVisit = patient.checkupCenterNextVisit && patient.checkupCenterNextVisit.length > 0 
                          ? patient.checkupCenterNextVisit[0].nextVisit 
                          : null;
      
      const { checkupCenterNextVisit, ...patientWithoutFullVisitData } = patient;
      return {
        ...patientWithoutFullVisitData,
        checkupCenterNextVisit: latestVisit, // This will be Date | null
      };
    });

    res.json({ ...centerData, patients: processedPatients });
  } catch (error) {
    console.error('Error fetching checkup center:', error);
    res.status(500).json({ error: 'Failed to fetch checkup center' });
  }
};

// Create a new checkup center
export const createCheckupCenter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, addressLine, city, state, pin, country } = req.body;

    // Check if email already exists
    const existingCenter = await prisma.checkupCenter.findUnique({
      where: { email },
    });

    if (existingCenter) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate userId from name
    const userId = generateUserId(name);

    // Create the checkup center
    const checkupCenter = await prisma.checkupCenter.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        addressLine,
        city,
        state,
        pin,
        country,
        userId,
      },
    });
    const { password: _, ...centerWithoutPassword } = checkupCenter;
    res.status(201).json(centerWithoutPassword);
  } catch (error) {
    console.error('Error creating checkup center:', error);
    res.status(500).json({ error: 'Failed to create checkup center' });
  }
};

// Update checkup center
export const updateCheckupCenter = async (req: Request, res: Response): Promise<void> => {
  try {
  const { id } = req.params;
    const { name, email, phone, addressLine, city, state, pin, country, password } = req.body as CheckupCenterUpdateData;
    
    let hashedPassword;
    if (password) {
        const saltRounds = 10;
        hashedPassword = await bcrypt.hash(password, saltRounds);
    }

  const checkupCenter = await prisma.checkupCenter.update({
    where: { id },
      data: {
        name,
        email,
        phone,
        addressLine,
        city,
        state,
        pin,
        country,
        ...(hashedPassword && { password: hashedPassword }),
      },
  });
    const { password: _, ...centerWithoutPassword } = checkupCenter;
    res.json(centerWithoutPassword);
  } catch (error: any) {
    console.error('Error updating checkup center:', error);
    if (error.code === 'P2025') {
        res.status(404).json({ error: 'Checkup center not found' });
        return;
    }
    res.status(500).json({ error: 'Failed to update checkup center' });
  }
};

// Delete checkup center
export const deleteCheckupCenter = async (req: Request, res: Response): Promise<void> => {
  try {
  const { id } = req.params;
    await prisma.checkupCenter.delete({ where: { id } });
    res.json({ message: 'Checkup center deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting checkup center:', error);
    if (error.code === 'P2025') {
        res.status(404).json({ error: 'Checkup center not found' });
        return;
    }
    res.status(500).json({ error: 'Failed to delete checkup center' });
  }
};

// Assign a patient to a checkup center
export const assignPatientToCheckupCenter = async (req: Request, res: Response): Promise<void> => {
    try {
        const { checkupCenterId, patientId } = req.body;
        if (!checkupCenterId || !patientId) {
            res.status(400).json({ error: 'Checkup Center ID and Patient ID are required' });
            return;
        }

        const updatedCenter = await prisma.checkupCenter.update({
            where: { id: checkupCenterId },
            data: {
                patients: {
                    connect: { id: patientId }
                }
            },
            include: { patients: true }
        });
        const { password, ...centerWithoutPassword } = updatedCenter;
        res.json(centerWithoutPassword);
    } catch (error: any) {
        console.error('Error assigning patient to checkup center:', error);
        if (error.code === 'P2025') { // Target record not found
            res.status(404).json({ error: 'Checkup center or patient not found' });
            return;
        }
        res.status(500).json({ error: 'Failed to assign patient' });
    }
};

// Remove a patient from a checkup center
export const removePatientFromCheckupCenter = async (req: Request, res: Response): Promise<void> => {
    try {
        const { checkupCenterId, patientId } = req.body;
         if (!checkupCenterId || !patientId) {
            res.status(400).json({ error: 'Checkup Center ID and Patient ID are required' });
            return;
        }

        const updatedCenter = await prisma.checkupCenter.update({
            where: { id: checkupCenterId },
            data: {
                patients: {
                    disconnect: { id: patientId }
                }
            },
            include: { patients: true }
        });
        const { password, ...centerWithoutPassword } = updatedCenter;
        res.json(centerWithoutPassword);
    } catch (error: any) {
        console.error('Error removing patient from checkup center:', error);
         if (error.code === 'P2025') {
            res.status(404).json({ error: 'Checkup center or patient not found, or patient not assigned' });
            return;
        }
        res.status(500).json({ error: 'Failed to remove patient' });
    }
};

// Update patient's next visit date for a checkup center
export const updatePatientNextVisit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { checkupCenterId, patientId } = req.params;
    const { nextVisitDate } = req.body;

    if (!checkupCenterId || !patientId || !nextVisitDate) {
      res.status(400).json({ error: 'Checkup Center ID, Patient ID, and next visit date are required' });
      return;
    }
    
    const newVisitDate = new Date(nextVisitDate);

    // Verify if the patient is assigned to this checkup center
    const center = await prisma.checkupCenter.findFirst({
      where: {
        id: checkupCenterId,
        patients: {
          some: {
            id: patientId
          }
        }
      }
    });

    if (!center) {
      res.status(404).json({ error: 'Checkup center not found or patient not assigned to this center' });
      return;
    }

    // Upsert the next visit for the checkup center
    const existingVisit = await prisma.checkupCenterNextVisit.findFirst({
      where: {
        checkupCenterId: checkupCenterId,
        patientId: patientId,
      }
    });

    if (existingVisit) {
      const updatedVisit = await prisma.checkupCenterNextVisit.update({
        where: { id: existingVisit.id },
        data: { nextVisit: newVisitDate },
        include: { patient: true } 
      });
      const patientData = {
        ...updatedVisit.patient,
        checkupCenterNextVisit: updatedVisit.nextVisit
      };
      res.json(patientData);
    } else {
      const newVisit = await prisma.checkupCenterNextVisit.create({
        data: {
          checkupCenterId: checkupCenterId,
          patientId: patientId,
          nextVisit: newVisitDate,
        },
        include: { patient: true }
      });
      const patientData = {
        ...newVisit.patient,
        checkupCenterNextVisit: newVisit.nextVisit
      };
      res.json(patientData);
    }

  } catch (error: any) {
    console.error('Error updating patient next visit date for checkup center:', error);
    if (error.code === 'P2025') { // Patient not found or related record for update failed
      res.status(404).json({ error: 'Patient not found or related record for update failed.' });
      return;
    }
    res.status(500).json({ error: 'Failed to update patient next visit date' });
  }
};