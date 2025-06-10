import { Request, Response } from 'express';
import prisma from '../utils/db';
import { PatientCreationData, RequestWithBody } from '../types/index';

// Get all patients
export const getPatients = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', search, doctorId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build where clause
    let where: any = {};
    
    // Add search condition if provided
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { userId: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } },
        { state: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    // Add doctorId filter if provided
    if (doctorId) {
      where.doctors = {
        some: {
          id: doctorId as string
        }
      };
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          name: true,
          email: true,
          userId: true,
          phone: true,
          city: true,
          state: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.patient.count({ where }),
    ]);

    // Provide search metadata in response to help client-side implementations
    res.json({
      data: patients,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      },
      search: {
        term: search ? String(search) : '',
        recommendedDebounceMs: 300, // Recommend client-side debounce time
        minSearchLength: 2, // Recommend minimum search term length
      }
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ 
      error: 'Failed to fetch patients',
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
};

// Get patient by ID
export const getPatientById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        doctors: true,
        hospitals: true,
      }
    });

    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
};

// Create a new patient
export const createPatient = async (
  req: RequestWithBody<PatientCreationData>,
  res: Response
): Promise<void> => {
  try {
    const patientData = req.body;
    const patient = await prisma.patient.create({
      data: patientData
    });
    res.status(201).json(patient);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
};

// Update patient
export const updatePatient = async (
  req: RequestWithBody<Partial<PatientCreationData>>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const patientData = req.body;
    
    const patient = await prisma.patient.update({
      where: { id },
      data: patientData
    });
    
    res.json(patient);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
};

// Delete patient
export const deletePatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.patient.delete({
      where: { id }
    });
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
}; 