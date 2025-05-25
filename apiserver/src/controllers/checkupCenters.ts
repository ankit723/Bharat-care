import { Request, Response } from 'express';
import prisma from '../utils/db'; // Use shared prisma instance
import { CheckupCenterCreateData, CheckupCenterUpdateData } from '../types'; // Assuming types are defined
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

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
    });
  } catch (error) {
    console.error('Error fetching checkup centers:', error);
    res.status(500).json({ error: 'Failed to fetch checkup centers' });
  }
};

// Get checkup center by ID
export const getCheckupCenterById = async (req: Request, res: Response): Promise<void> => {
  try {
  const { id } = req.params;
    const checkupCenter = await prisma.checkupCenter.findUnique({
      where: { id },
      include: {
        patients: true, // Include full patient details
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
    const { password, ...centerWithoutPassword } = checkupCenter;
    res.json(centerWithoutPassword);
  } catch (error) {
    console.error('Error fetching checkup center:', error);
    res.status(500).json({ error: 'Failed to fetch checkup center' });
  }
};

// Create a new checkup center
export const createCheckupCenter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, addressLine, city, state, pin, country } = req.body as CheckupCenterCreateData;

    if (!name || !email || !password || !phone) {
        res.status(400).json({ error: 'Name, email, password, and phone are required' });
        return;
    }

    const existingCenter = await prisma.checkupCenter.findUnique({ where: { email } });
    if (existingCenter) {
        res.status(400).json({ error: 'A checkup center with this email already exists' });
        return;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const checkupCenter = await prisma.checkupCenter.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        addressLine: addressLine || '',
        city: city || '',
        state: state || '',
        pin: pin || '',
        country: country || '',
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