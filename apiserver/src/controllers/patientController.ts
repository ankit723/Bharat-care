import { Request, Response } from 'express';
import prisma from '../utils/db';
import { PatientCreationData, RequestWithBody } from '../types/index';

// Get all patients
export const getPatients = async (_req: Request, res: Response): Promise<void> => {
  try {
    const patients = await prisma.patient.findMany();
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
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