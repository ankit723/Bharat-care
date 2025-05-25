import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET /api/medstores - Get all med stores
export const getMedStores = async (req: Request, res: Response): Promise<void> => {
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

    const [medStores, total] = await Promise.all([
      prisma.medStore.findMany({
        where,
        skip: parseInt(skip.toString()),
        take: parseInt(limit.toString()),
        include: {
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
      prisma.medStore.count({ where }),
    ]);

    // Remove passwords from response
    const medStoresWithoutPasswords = medStores.map(({ password, ...medStore }) => medStore);

    res.json({
      data: medStoresWithoutPasswords,
      pagination: {
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching med stores:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/medstores/:id - Get med store by ID
export const getMedStoreById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const medStore = await prisma.medStore.findUnique({
      where: { id },
      include: {
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
            createdAt: true,
          },
        },
      },
    });

    if (!medStore) {
      res.status(404).json({ error: 'Med Store not found' });
      return;
    }

    // Remove password from response
    const { password, ...medStoreWithoutPassword } = medStore;

    res.json(medStoreWithoutPassword);
  } catch (error) {
    console.error('Error fetching med store:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/medstores - Create new med store
export const createMedStore = async (req: Request, res: Response): Promise<void> => {
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

    // Check if med store with this email already exists
    const existingMedStore = await prisma.medStore.findUnique({
      where: { email },
    });

    if (existingMedStore) {
      res.status(400).json({
        error: 'A med store with this email already exists',
      });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create med store
    const medStore = await prisma.medStore.create({
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

    // Remove password from response
    const { password: _, ...medStoreWithoutPassword } = medStore;

    res.status(201).json(medStoreWithoutPassword);
  } catch (error) {
    console.error('Error creating med store:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/medstores/:id - Update med store
export const updateMedStore = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If password is being updated, hash it
    if (updateData.password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    }

    const medStore = await prisma.medStore.update({
      where: { id },
      data: updateData,
      include: {
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

    // Remove password from response
    const { password, ...medStoreWithoutPassword } = medStore;

    res.json(medStoreWithoutPassword);
  } catch (error: any) {
    console.error('Error updating med store:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Med Store not found' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/medstores/:id - Delete med store
export const deleteMedStore = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.medStore.delete({
      where: { id },
    });

    res.json({ message: 'Med Store deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting med store:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Med Store not found' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}; 