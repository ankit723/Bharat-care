import { Request, Response } from 'express';
import prisma from '../utils/db';
import { ClinicCreationData, RequestWithBody } from '../types/index';
import bcrypt from 'bcryptjs';
import { VerificationStatus } from '@prisma/client';
import { generateUserId } from '../utils/userIdGenerator';

export const getClinics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search
      ? {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' as const } },
            { email: { contains: search as string, mode: 'insensitive' as const } },
            { phone: { contains: search as string } },
            { city: { contains: search as string, mode: 'insensitive' as const } },
            { state: { contains: search as string, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [clinics, total] = await Promise.all([
      prisma.clinic.findMany({
        where,
        skip: parseInt(skip.toString()),
        take: parseInt(limit.toString()),
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.clinic.count({ where }),
    ]);

    res.json({
      data: clinics,
      pagination: {
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching clinics:', error);
    res.status(500).json({ error: 'Failed to fetch clinics' });
  }
}

export const getClinicById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            addressLine: true,
            city: true,
            state: true,
            pin: true,
            country: true,
          },
        },
      },
    });

    if (!clinic) {
      res.status(404).json({ error: 'Clinic not found' });
      return;
    }

    res.json(clinic);
  } catch (error) {
    console.error('Error fetching clinic:', error);
    res.status(500).json({ error: 'Failed to fetch clinic' });
  }
}

export const createClinic = async (req: RequestWithBody<ClinicCreationData>, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, addressLine, city, state, pin, country } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone) {
      res.status(400).json({
        error: 'Name, email, password, and phone are required',
      });
      return;
    }

    // Check if clinic with this email already exists
    const existingClinic = await prisma.clinic.findUnique({
      where: { email },
    });

    if (existingClinic) {
      res.status(400).json({
        error: 'A clinic with this email already exists',
      });
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate userId from name
    const userId = generateUserId(name);

    const clinic = await prisma.clinic.create({
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
        verificationStatus: 'PENDING' as VerificationStatus,
        role: 'CLINIC',
        userId,
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    res.status(201).json(clinic);
  } catch (error) {
    console.error('Error creating clinic:', error);
    res.status(500).json({ error: 'Failed to create clinic' });
  }
}

export const updateClinic = async (req: RequestWithBody<Partial<ClinicCreationData>>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clinic = await prisma.clinic.update({
      where: { id },
      data: req.body,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    res.json(clinic);
  } catch (error: any) {
    console.error('Error updating clinic:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Clinic not found' });
      return;
    }
    res.status(500).json({ error: 'Failed to update clinic' });
  }
}

export const deleteClinic = async (req: Request, res: Response): Promise<void> => { 
  try {
    const { id } = req.params;
    await prisma.clinic.delete({
      where: { id },
    });

    res.json({ message: 'Clinic deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting clinic:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Clinic not found' });
      return;
    }
    res.status(500).json({ error: 'Failed to delete clinic' });
  }
}

// POST /api/clinics/:id/assign-doctor - Assign doctor to clinic
export const assignDoctorToClinic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: clinicId } = req.params;
    const { doctorId } = req.body;

    if (!doctorId) {
      res.status(400).json({ error: 'Doctor ID is required' });
      return;
    }

    // Check if clinic exists
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: { doctor: true }
    });

    if (!clinic) {
      res.status(404).json({ error: 'Clinic not found' });
      return;
    }

    // Check if clinic already has a doctor
    if (clinic.doctor) {
      res.status(400).json({ error: 'Clinic already has a doctor assigned. Remove the current doctor first.'});
      return;
    }

    // Check if doctor exists and is not already assigned to another clinic
    const doctorToAssign = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { clinic: true }
    });

    if (!doctorToAssign) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }

    if (doctorToAssign.clinic && doctorToAssign.clinic.id !== clinicId) {
      res.status(400).json({ error: 'Doctor is already assigned to another clinic' });
      return;
    }
    
    // Assign doctor to clinic by updating the doctor model
    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        clinic: {
          connect: { id: clinicId }
        }
      },
      include: { clinic: true }
    });

    // Fetch the updated clinic with the doctor info
    const updatedClinic = await prisma.clinic.findUnique({
      where: {id: clinicId},
      include: {doctor: true}
    });

    res.json(updatedClinic);
  } catch (error) {
    console.error('Error assigning doctor to clinic:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/clinics/:id/remove-doctor - Remove doctor from clinic
export const removeDoctorFromClinic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: clinicId } = req.params;

    // Check if clinic exists and has a doctor
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: { doctor: true },
    });

    if (!clinic) {
      res.status(404).json({ error: 'Clinic not found' });
      return;
    }

    if (!clinic.doctor) {
      res.status(400).json({ error: 'No doctor assigned to this clinic' });
      return;
    }

    const doctorId = clinic.doctor.id;

    // Remove doctor from clinic by updating the doctor model
    // Set clinicId to null for the doctor
    await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        clinicId: null,
      },
    });

    // Fetch the updated clinic (doctor should be null)
    const updatedClinic = await prisma.clinic.findUnique({
        where: {id: clinicId},
        include: {doctor: true}
    });

    res.json(updatedClinic);
  } catch (error) {
    console.error('Error removing doctor from clinic:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

