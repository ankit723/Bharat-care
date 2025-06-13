import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get current date for monthly stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all stats in parallel
    const [
      totalDocuments,
      prescriptions,
      medicalReports,
      documentsThisMonth,
      totalPatients,
      documentsWithPermissions,
    ] = await Promise.all([
      // Total documents
      prisma.medDocument.count(),
      
      // Prescriptions count
      prisma.medDocument.count({
        where: { documentType: 'PRESCRIPTION' },
      }),
      
      // Medical reports count
      prisma.medDocument.count({
        where: { documentType: 'MEDICAL_REPORT' },
      }),
      
      // Documents uploaded this month
      prisma.medDocument.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),
      
      // Total unique patients with documents
      prisma.medDocument.findMany({
        select: { patientId: true },
        distinct: ['patientId'],
      }),
      
      // Documents with permissions (either doctor or checkup center permissions)
      prisma.medDocument.count({
        where: {
          OR: [
            {
              permittedDoctorIds: {
                not: [],
              },
            },
            {
              permittedCheckupCenterIds: {
                not: [],
              },
            },
            {
              seekAvailability: true,
            },
          ],
        },
      }),
    ]);

    // Calculate average documents per patient
    const averageDocumentsPerPatient = totalPatients.length > 0 
      ? totalDocuments / totalPatients.length 
      : 0;

    const stats = {
      totalDocuments,
      prescriptions,
      medicalReports,
      documentsThisMonth,
      averageDocumentsPerPatient,
      documentsWithPermissions,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching document stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document statistics' },
      { status: 500 }
    );
  }
} 