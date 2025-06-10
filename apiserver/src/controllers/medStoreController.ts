import { Request, Response } from 'express';
import prisma from '../utils/db'; // Changed to shared prisma instance
import bcrypt from 'bcryptjs';
import { VerificationStatus } from '@prisma/client';
import { generateUserId } from '../utils/userIdGenerator';

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
      search: {
        term: search ? String(search) : '',
        recommendedDebounceMs: 300, // Recommend client-side debounce time
        minSearchLength: 2, // Recommend minimum search term length
      }
    });
  } catch (error) {
    console.error('Error fetching med stores:', error);
    res.status(500).json({ 
      error: 'Failed to fetch med stores',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};

// GET /api/medstores/:id - Get med store by ID
export const getMedStoreById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const medStore = await prisma.medStore.findUnique({
      where: { id },
      include: {
        raisedHands: {
          include: {
            medDocument: {
              include: {
                patient: {
                  select: { id: true, name: true, email: true, phone: true }
                }
              }
            }
          }
        }
      }
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

    // Generate userId from name
    const userId = generateUserId(name);

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
        verificationStatus: 'PENDING' as VerificationStatus,
        role: 'MEDSTORE',
        userId,
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

// GET /api/medstores/available-prescriptions - Get all med documents with seekAvailability = true
export const getAvailablePrescriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      seekAvailability: true,
    };

    if (search) {
      where.OR = [
        { fileName: { contains: search as string, mode: 'insensitive' as const } },
        { description: { contains: search as string, mode: 'insensitive' as const } },
        {
          patient: {
            OR: [
              { name: { contains: search as string, mode: 'insensitive' as const } },
              { email: { contains: search as string, mode: 'insensitive' as const } },
            ],
          },
        },
      ];
    }

    const [medDocuments, total] = await Promise.all([
      prisma.medDocument.findMany({
        where,
        skip: parseInt(skip.toString()),
        take: parseInt(limit.toString()),
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              city: true,
              state: true,
            },
          },
          // Optionally, include info about which medstores have already raised hands
          // medStoreHandRaises: { select: { medStoreId: true } } 
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.medDocument.count({ where }),
    ]);

    res.json({
      data: medDocuments,
      pagination: {
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching available prescriptions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/medstores/:medStoreId/raise-hand/:medDocumentId - MedStore raises hand for a prescription
export const raiseHandForPrescription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { medStoreId, medDocumentId } = req.params;

    // Check if MedDocument exists and has seekAvailability = true
    const medDocument = await prisma.medDocument.findUnique({
      where: { id: medDocumentId },
    });

    if (!medDocument) {
      res.status(404).json({ error: 'Medical document not found' });
      return;
    }

    if (!medDocument.seekAvailability) {
      res.status(400).json({ error: 'This medical document is not seeking availability' });
      return;
    }

    // Check if MedStore exists and is verified
    const medStore = await prisma.medStore.findUnique({
      where: { id: medStoreId },
    });

    if (!medStore) {
      res.status(404).json({ error: 'MedStore not found' });
      return;
    }

    if (medStore.verificationStatus !== 'VERIFIED') {
      res.status(403).json({ error: 'MedStore not verified. Cannot raise hand.' });
      return;
    }

    // Create MedStoreHandRaise record
    const handRaise = await prisma.medStoreHandRaise.create({
      data: {
        medDocumentId,
        medStoreId,
      },
      include: {
        medDocument: {
          include: { patient: {select: { name: true, email: true}} }
        },
        medStore: {select: {name: true, email: true}}
      }
    });

    res.status(201).json(handRaise);
  } catch (error: any) {
    console.error('Error raising hand for prescription:', error);
    if (error.code === 'P2002') { // Unique constraint violation
      res.status(409).json({ error: 'MedStore has already raised hand for this prescription' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/medstores/:medStoreId/withdraw-hand/:medDocumentId - MedStore withdraws hand for a prescription
export const withdrawHandForPrescription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { medStoreId, medDocumentId } = req.params;

    const handRaise = await prisma.medStoreHandRaise.findUnique({
      where: {
        medDocumentId_medStoreId: {
          medDocumentId,
          medStoreId,
        },
      },
    });

    if (!handRaise) {
      res.status(404).json({ error: 'Hand raise record not found' });
      return;
    }

    await prisma.medStoreHandRaise.delete({
      where: {
        id: handRaise.id,
      },
    });

    res.json({ message: 'Successfully withdrew hand for prescription' });
  } catch (error) {
    console.error('Error withdrawing hand for prescription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 