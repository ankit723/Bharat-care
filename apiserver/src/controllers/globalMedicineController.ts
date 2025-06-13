import { Request, Response } from 'express';
import prisma from '../utils/db';
import { AuthenticatedRequest } from '../types';
import { Role, DocumentType } from '@prisma/client';

// Create global medicine request
export const createGlobalMedicineRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const patientId = req.user?.userId;
    const userRole = req.user?.role;

    if (!patientId || (userRole !== Role.PATIENT && userRole !== 'patient')) {
      res.status(403).json({ error: 'Only patients can create global medicine requests' });
      return;
    }

    const { prescriptionImageUrl, notes, deliveryAddress } = req.body;

    if (!prescriptionImageUrl || !deliveryAddress) {
      res.status(400).json({ error: 'Prescription image URL and delivery address are required' });
      return;
    }

    // Create a medical document for the prescription
    const medDocument = await prisma.medDocument.create({
      data: {
        fileName: 'Global Medicine Prescription',
        fileUrl: prescriptionImageUrl,
        documentType: DocumentType.PRESCRIPTION,
        patientId: patientId,
        uploadedById: patientId,
        uploaderType: Role.PATIENT,
        description: `Global medicine request - Delivery to: ${deliveryAddress}. Notes: ${notes || 'No additional notes'}`,
        patientUploaderId: patientId,
        seekAvailability: true, // Make it available for med stores
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Global medicine request created successfully',
      data: {
        id: medDocument.id,
        prescriptionImageUrl: medDocument.fileUrl,
        deliveryAddress,
        notes,
        status: 'PENDING',
        createdAt: medDocument.createdAt,
        patient: medDocument.patient
      }
    });

  } catch (error) {
    console.error('Error creating global medicine request:', error);
    res.status(500).json({ error: 'Failed to create global medicine request' });
  }
};

// Get my global medicine requests
export const getMyGlobalMedicineRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const patientId = req.user?.userId;
    const userRole = req.user?.role;

    if (!patientId || (userRole !== Role.PATIENT && userRole !== 'patient')) {
      res.status(403).json({ error: 'Only patients can view their global medicine requests' });
      return;
    }

    const requests = await prisma.medDocument.findMany({
      where: {
        patientId: patientId,
        documentType: DocumentType.PRESCRIPTION,
        description: {
          contains: 'Global medicine request'
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        medStoreHandRaises: {
          include: {
            medStore: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                city: true,
                state: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to match the expected format
    const transformedRequests = requests.map(request => {
      // Extract delivery address from description
      const deliveryAddressMatch = request.description?.match(/Delivery to: ([^.]+)/);
      const deliveryAddress = deliveryAddressMatch ? deliveryAddressMatch[1] : '';
      
      // Extract notes from description
      const notesMatch = request.description?.match(/Notes: (.+)$/);
      const notes = notesMatch ? notesMatch[1] : '';

      return {
        id: request.id,
        prescriptionImageUrl: request.fileUrl,
        deliveryAddress,
        notes: notes !== 'No additional notes' ? notes : '',
        status: request.medStoreHandRaises.length > 0 ? 'QUOTES_RECEIVED' : 'PENDING',
        createdAt: request.createdAt,
        patient: request.patient,
        quotes: request.medStoreHandRaises.map(handRaise => ({
          medStoreId: handRaise.medStore.id,
          medStoreName: handRaise.medStore.name,
          medStorePhone: handRaise.medStore.phone,
          medStoreLocation: `${handRaise.medStore.city}, ${handRaise.medStore.state}`,
          quotedAt: handRaise.createdAt,
        }))
      };
    });

    res.json({
      success: true,
      data: transformedRequests
    });

  } catch (error) {
    console.error('Error fetching global medicine requests:', error);
    res.status(500).json({ error: 'Failed to fetch global medicine requests' });
  }
}; 