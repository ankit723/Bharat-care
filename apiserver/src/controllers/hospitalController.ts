import { Request, Response } from 'express';
import prisma from '../utils/db';
import { HospitalCreationData, RequestWithBody } from '../types/index';

// Get all hospitals
export const getHospitals = async (_req: Request, res: Response): Promise<void> => {
  try {
    const hospitals = await prisma.hospital.findMany();
    res.json(hospitals);
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
};

// Get hospital by ID
export const getHospitalById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const hospital = await prisma.hospital.findUnique({
      where: { id },
      include: {
        doctor: true,
        patients: true,
        reviews: true
      }
    });

    if (!hospital) {
      res.status(404).json({ error: 'Hospital not found' });
      return;
    }

    res.json(hospital);
  } catch (error) {
    console.error('Error fetching hospital:', error);
    res.status(500).json({ error: 'Failed to fetch hospital' });
  }
};

// Create a new hospital
export const createHospital = async (
  req: RequestWithBody<HospitalCreationData>,
  res: Response
): Promise<void> => {
  try {
    const hospitalData = req.body;
    const hospital = await prisma.hospital.create({
      data: hospitalData
    });
    res.status(201).json(hospital);
  } catch (error) {
    console.error('Error creating hospital:', error);
    res.status(500).json({ error: 'Failed to create hospital' });
  }
};

// Update hospital
export const updateHospital = async (
  req: RequestWithBody<Partial<HospitalCreationData>>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const hospitalData = req.body;
    
    const hospital = await prisma.hospital.update({
      where: { id },
      data: hospitalData
    }); 
    
    res.json(hospital);
  } catch (error) {
    console.error('Error updating hospital:', error);
    res.status(500).json({ error: 'Failed to update hospital' });
  }
};

// Delete hospital
export const deleteHospital = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.hospital.delete({
      where: { id }
    });
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting hospital:', error);
    res.status(500).json({ error: 'Failed to delete hospital' });
  }
}; 

// Assign a patient to a hospital
export const assignPatientToHospital = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hospitalId, patientId } = req.body;

    if (!hospitalId || !patientId) {
      res.status(400).json({ error: 'Hospital ID and Patient ID are required' });
      return;
    }

    const hospital = await prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        patients: {
          connect: {
            id: patientId,
          }
        }
      },
      include: {
        patients: true,
        doctor: true,
        reviews: true
      },
    });

    res.json(hospital);
  } catch (error: any) {
    console.error('Error assigning patient to hospital:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Hospital or patient not found' });
      return;
    }
    res.status(500).json({ error: 'Failed to assign patient to hospital' });
  }
};

// Remove a patient from a hospital
export const removePatientFromHospital = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hospitalId, patientId } = req.body;

    if (!hospitalId || !patientId) {
      res.status(400).json({ error: 'Hospital ID and Patient ID are required' });
      return;
    }

    const hospital = await prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        patients: {
          disconnect: {
            id: patientId,
          }
        }
      },
      include: {
        patients: true,
        doctor: true,
        reviews: true
      },
    });

    res.json(hospital);
  } catch (error: any) {
    console.error('Error removing patient from hospital:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Hospital or patient not found, or patient not assigned' });
      return;
    }
    res.status(500).json({ error: 'Failed to remove patient from hospital' });
  }
}; 