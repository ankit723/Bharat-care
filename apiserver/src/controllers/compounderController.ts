import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET /api/compounders - Get all compounders
export const getCompounders = async (req: Request, res: Response): Promise<void> => {
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

    const [compounders, total] = await Promise.all([
      prisma.compounder.findMany({
        where,
        skip: parseInt(skip.toString()),
        take: parseInt(limit.toString()),
        include: {
          clinic: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          medStore: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          hospitals: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.compounder.count({ where }),
    ]);

    // Remove passwords from response
    const compoundersWithoutPasswords = compounders.map(({ password, ...compounder }) => compounder);

    res.json({
      data: compoundersWithoutPasswords,
      pagination: {
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching compounders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/compounders/:id - Get compounder by ID
export const getCompounderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const compounder = await prisma.compounder.findUnique({
      where: { id },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            phone: true,
            addressLine: true,
            city: true,
            state: true,
            pin: true,
            country: true,
          },
        },
        medStore: {
          select: {
            id: true,
            name: true,
            phone: true,
            addressLine: true,
            city: true,
            state: true,
            pin: true,
            country: true,
          },
        },
        hospitals: {
          select: {
            id: true,
            name: true,
            phone: true,
            addressLine: true,
            city: true,
            state: true,
            pin: true,
            country: true,
          },
        },
        reviews: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!compounder) {
      res.status(404).json({ error: 'Compounder not found' });
      return;
    }

    // Remove password from response
    const { password, ...compounderWithoutPassword } = compounder;

    res.json(compounderWithoutPassword);
  } catch (error) {
    console.error('Error fetching compounder:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/compounders - Create new compounder
export const createCompounder = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      phone,
      addressLine,
      city,
      state,
      pin,
      country,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone) {
      res.status(400).json({
        error: 'Name, email, password, and phone are required',
      });
      return;
    }

    // Check if compounder with this email already exists
    const existingCompounder = await prisma.compounder.findUnique({
      where: { email },
    });

    if (existingCompounder) {
      res.status(400).json({
        error: 'A compounder with this email already exists',
      });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create compounder
    const compounder = await prisma.compounder.create({
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
      include: {
        clinic: true,
        medStore: true,
        hospitals: true,
      },
    });

    // Remove password from response
    const { password: _, ...compounderWithoutPassword } = compounder;

    res.status(201).json(compounderWithoutPassword);
  } catch (error) {
    console.error('Error creating compounder:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/compounders/:id - Update compounder
export const updateCompounder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If password is being updated, hash it
    if (updateData.password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    }

    const compounder = await prisma.compounder.update({
      where: { id },
      data: updateData,
      include: {
        clinic: true,
        medStore: true,
        hospitals: true,
      },
    });

    // Remove password from response
    const { password, ...compounderWithoutPassword } = compounder;

    res.json(compounderWithoutPassword);
  } catch (error: any) {
    console.error('Error updating compounder:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Compounder not found' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/compounders/:id - Delete compounder
export const deleteCompounder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.compounder.delete({
      where: { id },
    });

    res.json({ message: 'Compounder deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting compounder:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Compounder not found' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/compounders/assign-hospital - Assign compounder to hospital
export const assignCompounderToHospital = async (req: Request, res: Response): Promise<void> => {
  try {
    const { compounderId, hospitalId } = req.body;

    if (!compounderId || !hospitalId) {
      res.status(400).json({ error: 'Compounder ID and Hospital ID are required' });
      return;
    }

    // Update compounder to connect with hospital
    const compounder = await prisma.compounder.update({
      where: { id: compounderId },
      data: {
        hospitals: {
          connect: { id: hospitalId },
        },
      },
      include: {
        hospitals: true,
        clinic: true,
        medStore: true,
      },
    });

    // Remove password from response
    const { password, ...compounderWithoutPassword } = compounder;

    res.json(compounderWithoutPassword);
  } catch (error) {
    console.error('Error assigning compounder to hospital:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/compounders/assign-clinic - Assign compounder to clinic
export const assignCompounderToClinic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { compounderId, clinicId } = req.body;

    if (!compounderId || !clinicId) {
      res.status(400).json({ error: 'Compounder ID and Clinic ID are required' });
      return;
    }

    // Update compounder to connect with clinic
    const compounder = await prisma.compounder.update({
      where: { id: compounderId },
      data: {
        clinicId,
      },
      include: {
        hospitals: true,
        clinic: true,
        medStore: true,
      },
    });

    // Remove password from response
    const { password, ...compounderWithoutPassword } = compounder;

    res.json(compounderWithoutPassword);
  } catch (error) {
    console.error('Error assigning compounder to clinic:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/compounders/assign-medstore - Assign compounder to med store
export const assignCompounderToMedStore = async (req: Request, res: Response): Promise<void> => {
  try {
    const { compounderId, medStoreId } = req.body;

    if (!compounderId || !medStoreId) {
      res.status(400).json({ error: 'Compounder ID and Med Store ID are required' });
      return;
    }

    // Update compounder to connect with med store
    const compounder = await prisma.compounder.update({
      where: { id: compounderId },
      data: {
        medStoreId,
      },
      include: {
        hospitals: true,
        clinic: true,
        medStore: true,
      },
    });

    // Remove password from response
    const { password, ...compounderWithoutPassword } = compounder;

    res.json(compounderWithoutPassword);
  } catch (error) {
    console.error('Error assigning compounder to med store:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/compounders/remove-clinic - Remove compounder from clinic
export const removeCompounderFromClinic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { compounderId } = req.body;

    if (!compounderId) {
      res.status(400).json({ error: 'Compounder ID is required' });
      return;
    }

    // Update compounder to disconnect from clinic
    const compounder = await prisma.compounder.update({
      where: { id: compounderId },
      data: {
        clinicId: null,
      },
      include: {
        hospitals: true,
        clinic: true,
        medStore: true,
      },
    });

    // Remove password from response
    const { password, ...compounderWithoutPassword } = compounder;

    res.json(compounderWithoutPassword);
  } catch (error) {
    console.error('Error removing compounder from clinic:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/compounders/remove-medstore - Remove compounder from med store
export const removeCompounderFromMedStore = async (req: Request, res: Response): Promise<void> => {
  try {
    const { compounderId } = req.body;

    if (!compounderId) {
      res.status(400).json({ error: 'Compounder ID is required' });
      return;
    }

    // Update compounder to disconnect from med store
    const compounder = await prisma.compounder.update({
      where: { id: compounderId },
      data: {
        medStoreId: null,
      },
      include: {
        hospitals: true,
        clinic: true,
        medStore: true,
      },
    });

    // Remove password from response
    const { password, ...compounderWithoutPassword } = compounder;

    res.json(compounderWithoutPassword);
  } catch (error) {
    console.error('Error removing compounder from med store:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 