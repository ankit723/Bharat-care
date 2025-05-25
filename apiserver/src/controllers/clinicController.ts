import { Request, Response } from 'express';
import prisma from '../utils/db';
import { ClinicCreationData, RequestWithBody } from '../types/index';

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
          compounder: {
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
        compounder: {
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

    const clinic = await prisma.clinic.create({
      data: {
        name,
        email,
        password,
        phone,
        addressLine: addressLine || '',
        city: city || '',
        state: state || '',
        pin: pin || '',
        country: country || '',
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
        compounder: {
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
        compounder: {
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
    });

    if (!clinic) {
      res.status(404).json({ error: 'Clinic not found' });
      return;
    }

    // Check if doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      res.status(404).json({ error: 'Doctor not found' });
      return;
    }

    // Check if doctor is already assigned to another clinic
    if (doctor.clinicId && doctor.clinicId !== clinicId) {
      res.status(400).json({
        error: 'Doctor is already assigned to another clinic',
      });
      return;
    }

    // Assign doctor to clinic
    await prisma.doctor.update({
      where: { id: doctorId },
      data: { clinicId },
    });

    // Get updated clinic with doctor info
    const updatedClinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        compounder: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    res.json({
      message: 'Doctor assigned to clinic successfully',
      clinic: updatedClinic,
    });
  } catch (error) {
    console.error('Error assigning doctor to clinic:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/clinics/:id/remove-doctor - Remove doctor from clinic
export const removeDoctorFromClinic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: clinicId } = req.params;

    // Check if clinic exists
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: { doctor: true },
    });

    if (!clinic) {
      res.status(404).json({ error: 'Clinic not found' });
      return;
    }

    if (!clinic.doctor) {
      res.status(400).json({
        error: 'No doctor is currently assigned to this clinic',
      });
      return;
    }

    // Remove doctor from clinic
    await prisma.doctor.update({
      where: { id: clinic.doctor.id },
      data: { clinicId: null },
    });

    // Get updated clinic
    const updatedClinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        compounder: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    res.json({
      message: 'Doctor removed from clinic successfully',
      clinic: updatedClinic,
    });
  } catch (error) {
    console.error('Error removing doctor from clinic:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/clinics/:id/assign-compounder - Assign compounder to clinic
export const assignCompounderToClinic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: clinicId } = req.params;
    const { compounderId } = req.body;

    if (!compounderId) {
      res.status(400).json({ error: 'Compounder ID is required' });
      return;
    }

    // Check if clinic exists
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    if (!clinic) {
      res.status(404).json({ error: 'Clinic not found' });
      return;
    }

    // Check if compounder exists
    const compounder = await prisma.compounder.findUnique({
      where: { id: compounderId },
    });

    if (!compounder) {
      res.status(404).json({ error: 'Compounder not found' });
      return;
    }

    // Check if compounder is already assigned to another clinic
    if (compounder.clinicId && compounder.clinicId !== clinicId) {
      res.status(400).json({
        error: 'Compounder is already assigned to another clinic',
      });
      return;
    }

    // Assign compounder to clinic
    await prisma.compounder.update({
      where: { id: compounderId },
      data: { clinicId },
    });

    // Get updated clinic with compounder info
    const updatedClinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        compounder: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    res.json({
      message: 'Compounder assigned to clinic successfully',
      clinic: updatedClinic,
    });
  } catch (error) {
    console.error('Error assigning compounder to clinic:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/clinics/:id/remove-compounder - Remove compounder from clinic
export const removeCompounderFromClinic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: clinicId } = req.params;

    // Check if clinic exists
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: { compounder: true },
    });

    if (!clinic) {
      res.status(404).json({ error: 'Clinic not found' });
      return;
    }

    if (!clinic.compounder) {
      res.status(400).json({
        error: 'No compounder is currently assigned to this clinic',
      });
      return;
    }

    // Remove compounder from clinic
    await prisma.compounder.update({
      where: { id: clinic.compounder.id },
      data: { clinicId: null },
    });

    // Get updated clinic
    const updatedClinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        compounder: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    res.json({
      message: 'Compounder removed from clinic successfully',
      clinic: updatedClinic,
    });
  } catch (error) {
    console.error('Error removing compounder from clinic:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

