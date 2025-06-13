import { Request, Response } from 'express';
import prisma from '../utils/db';
import { AuthenticatedRequest } from '../types';

// Global search across all healthcare entities
export const globalSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, type, city, state, limit = 20, offset = 0 } = req.query;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const searchTerm = query.trim().toLowerCase();
    const limitNum = parseInt(limit as string) || 20;
    const offsetNum = parseInt(offset as string) || 0;

    const results: any = {
      query: searchTerm,
      total: 0,
      filters: { type, city, state },
      results: {
        doctors: [],
        hospitals: [],
        medstores: [],
        checkupCenters: [],
      },
    };

    // Search doctors
    if (!type || type === 'doctors') {
      // Use basic name search that definitely works
      const doctors = await prisma.doctor.findMany({
        where: {
          verificationStatus: 'VERIFIED',
          ...(city ? { city: { contains: city as string, mode: 'insensitive' } } : {}),
          ...(state ? { state: { contains: state as string, mode: 'insensitive' } } : {}),
        },
        select: {
          id: true,
          userId: true,
          name: true,
          specialization: true,
          phone: true,
          email: true,
          addressLine: true,
          city: true,
          state: true,
          verificationStatus: true,
          rewardPoints: true,
        },
        skip: type === 'doctors' ? offsetNum : 0,
        take: type === 'doctors' ? limitNum : 10,
        orderBy: {
          rewardPoints: 'desc',
        },
      });

      // Filter client-side for now to avoid Prisma issues
      const filteredDoctors = doctors.filter(doctor => 
        doctor.name.toLowerCase().includes(searchTerm) ||
        doctor.specialization.toLowerCase().includes(searchTerm) ||
        doctor.city.toLowerCase().includes(searchTerm) ||
        doctor.state.toLowerCase().includes(searchTerm) ||
        doctor.email.toLowerCase().includes(searchTerm) ||
        doctor.phone.includes(searchTerm)
      );

      results.results.doctors = filteredDoctors.map(doctor => ({
        ...doctor,
        type: 'doctor',
        rating: Math.min(5, Math.floor(doctor.rewardPoints / 20) + 3),
      }));
      
      if (type === 'doctors') {
        results.total = filteredDoctors.length;
      }
    }

    // Search hospitals
    if (!type || type === 'hospitals') {
      const hospitals = await prisma.hospital.findMany({
        where: {
          verificationStatus: 'VERIFIED',
          ...(city ? { city: { contains: city as string, mode: 'insensitive' } } : {}),
          ...(state ? { state: { contains: state as string, mode: 'insensitive' } } : {}),
        },
        select: {
          id: true,
          userId: true,
          name: true,
          phone: true,
          email: true,
          addressLine: true,
          city: true,
          state: true,
          verificationStatus: true,
          rewardPoints: true,
          doctor: {
            select: {
              id: true,
              name: true,
              specialization: true,
            },
            take: 5,
          },
        },
        skip: type === 'hospitals' ? offsetNum : 0,
        take: type === 'hospitals' ? limitNum : 8,
        orderBy: {
          rewardPoints: 'desc',
        },
      });

      // Filter client-side
      const filteredHospitals = hospitals.filter(hospital => 
        hospital.name.toLowerCase().includes(searchTerm) ||
        hospital.city.toLowerCase().includes(searchTerm) ||
        hospital.state.toLowerCase().includes(searchTerm) ||
        hospital.email.toLowerCase().includes(searchTerm) ||
        hospital.phone.includes(searchTerm)
      );

      results.results.hospitals = filteredHospitals.map(hospital => ({
        ...hospital,
        type: 'hospital',
        rating: Math.min(5, Math.floor(hospital.rewardPoints / 20) + 3),
        doctorCount: hospital.doctor.length,
      }));

      if (type === 'hospitals') {
        results.total = filteredHospitals.length;
      }
    }

    // Search medstores
    if (!type || type === 'medstores') {
      const medstores = await prisma.medStore.findMany({
        where: {
          verificationStatus: 'VERIFIED',
          ...(city ? { city: { contains: city as string, mode: 'insensitive' } } : {}),
          ...(state ? { state: { contains: state as string, mode: 'insensitive' } } : {}),
        },
        select: {
          id: true,
          userId: true,
          name: true,
          phone: true,
          email: true,
          addressLine: true,
          city: true,
          state: true,
          verificationStatus: true,
          rewardPoints: true,
        },
        skip: type === 'medstores' ? offsetNum : 0,
        take: type === 'medstores' ? limitNum : 8,
        orderBy: {
          rewardPoints: 'desc',
        },
      });

      // Filter client-side
      const filteredMedstores = medstores.filter(medstore => 
        medstore.name.toLowerCase().includes(searchTerm) ||
        medstore.city.toLowerCase().includes(searchTerm) ||
        medstore.state.toLowerCase().includes(searchTerm) ||
        medstore.email.toLowerCase().includes(searchTerm) ||
        medstore.phone.includes(searchTerm)
      );

      results.results.medstores = filteredMedstores.map(medstore => ({
        ...medstore,
        type: 'medstore',
        rating: Math.min(5, Math.floor(medstore.rewardPoints / 20) + 3),
      }));

      if (type === 'medstores') {
        results.total = filteredMedstores.length;
      }
    }

    // Search checkup centers
    if (!type || type === 'checkup_centers') {
      const checkupCenters = await prisma.checkupCenter.findMany({
        where: {
          verificationStatus: 'VERIFIED',
          ...(city ? { city: { contains: city as string, mode: 'insensitive' } } : {}),
          ...(state ? { state: { contains: state as string, mode: 'insensitive' } } : {}),
        },
        select: {
          id: true,
          userId: true,
          name: true,
          phone: true,
          email: true,
          addressLine: true,
          city: true,
          state: true,
          verificationStatus: true,
          rewardPoints: true,
        },
        skip: type === 'checkup_centers' ? offsetNum : 0,
        take: type === 'checkup_centers' ? limitNum : 8,
        orderBy: {
          rewardPoints: 'desc',
        },
      });

      // Filter client-side
      const filteredCheckupCenters = checkupCenters.filter(center => 
        center.name.toLowerCase().includes(searchTerm) ||
        center.city.toLowerCase().includes(searchTerm) ||
        center.state.toLowerCase().includes(searchTerm) ||
        center.email.toLowerCase().includes(searchTerm) ||
        center.phone.includes(searchTerm)
      );

      results.results.checkupCenters = filteredCheckupCenters.map(center => ({
        ...center,
        type: 'checkup_center',
        rating: Math.min(5, Math.floor(center.rewardPoints / 20) + 3),
      }));

      if (type === 'checkup_centers') {
        results.total = filteredCheckupCenters.length;
      }
    }

    // Calculate total if searching all types
    if (!type) {
      results.total = 
        results.results.doctors.length +
        results.results.hospitals.length +
        results.results.medstores.length +
        results.results.checkupCenters.length;
    }

    // Add pagination info
    results.pagination = {
      limit: limitNum,
      offset: offsetNum,
      hasMore: type ? results.total > offsetNum + limitNum : false,
    };

    res.status(200).json(results);
  } catch (error) {
    console.error('Error in global search:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
};

// Medicine search functionality
export const searchMedicines = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, limit = 50, offset = 0 } = req.query;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Medicine search query is required' });
      return;
    }

    const searchTerm = query.trim().toLowerCase();
    const limitNum = parseInt(limit as string) || 50;
    const offsetNum = parseInt(offset as string) || 0;

    // Search in medicine schedules to find commonly prescribed medicines
    const medicineItems = await prisma.scheduledMedicineItem.findMany({
      where: {
        OR: [
          { medicineName: { contains: searchTerm, mode: 'insensitive' } },
          { dosage: { contains: searchTerm, mode: 'insensitive' } },
          { notes: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        medicineName: true,
        dosage: true,
        notes: true,
        medicineSchedule: {
          select: {
            schedulerId: true,
            schedulerType: true,
          },
        },
      },
      skip: offsetNum,
      take: limitNum,
    });

    // Group and aggregate medicine data
    const medicineMap = new Map();

    medicineItems.forEach(item => {
      const key = `${item.medicineName.toLowerCase()}-${item.dosage.toLowerCase()}`;
      
      if (medicineMap.has(key)) {
        const existing = medicineMap.get(key);
        existing.prescriptionCount += 1;
        existing.prescribedBy.add(item.medicineSchedule.schedulerId);
      } else {
        medicineMap.set(key, {
          medicineName: item.medicineName,
          dosage: item.dosage,
          commonNotes: item.notes,
          prescriptionCount: 1,
          prescribedBy: new Set([item.medicineSchedule.schedulerId]),
          type: 'prescription_medicine',
        });
      }
    });

    // Convert to array and add metadata
    const medicines = Array.from(medicineMap.values()).map(med => ({
      ...med,
      prescribedBy: med.prescribedBy.size,
      popularity: med.prescriptionCount,
      category: determineMedicineCategory(med.medicineName),
    })).sort((a, b) => b.popularity - a.popularity);

    // Add some common over-the-counter medicines if search matches
    const commonMedicines = [
      { medicineName: 'Paracetamol', dosage: '500mg', category: 'Pain Relief', type: 'otc' },
      { medicineName: 'Ibuprofen', dosage: '400mg', category: 'Anti-inflammatory', type: 'otc' },
      { medicineName: 'Amoxicillin', dosage: '250mg', category: 'Antibiotic', type: 'prescription' },
      { medicineName: 'Omeprazole', dosage: '20mg', category: 'Acid Reducer', type: 'prescription' },
      { medicineName: 'Aspirin', dosage: '75mg', category: 'Blood Thinner', type: 'otc' },
      { medicineName: 'Cetirizine', dosage: '10mg', category: 'Antihistamine', type: 'otc' },
      { medicineName: 'Metformin', dosage: '500mg', category: 'Diabetes', type: 'prescription' },
      { medicineName: 'Atorvastatin', dosage: '20mg', category: 'Cholesterol', type: 'prescription' },
    ];

    const matchingCommonMedicines = commonMedicines.filter(med =>
      med.medicineName.toLowerCase().includes(searchTerm) ||
      med.category.toLowerCase().includes(searchTerm)
    );

    const allResults = [...medicines, ...matchingCommonMedicines];

    res.status(200).json({
      query: searchTerm,
      total: allResults.length,
      medicines: allResults.slice(0, limitNum),
      categories: [...new Set(allResults.map(m => m.category))],
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        hasMore: allResults.length > limitNum,
      },
    });
  } catch (error) {
    console.error('Error searching medicines:', error);
    res.status(500).json({ error: 'Failed to search medicines' });
  }
};

// Get available healthcare providers by location
export const getProvidersByLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { city, state, type, limit = 20 } = req.query;

    if (!city && !state) {
      res.status(400).json({ error: 'City or state parameter is required' });
      return;
    }

    const locationFilter: any = {};
    if (city) locationFilter.city = { contains: city as string, mode: 'insensitive' };
    if (state) locationFilter.state = { contains: state as string, mode: 'insensitive' };

    const whereCondition = {
      ...locationFilter,
      verificationStatus: 'VERIFIED',
    };

    const limitNum = parseInt(limit as string) || 20;
    const results: any = {};

    if (!type || type === 'doctors') {
      results.doctors = await prisma.doctor.findMany({
        where: whereCondition,
        select: {
          id: true,
          userId: true,
          name: true,
          specialization: true,
          phone: true,
          city: true,
          state: true,
          rewardPoints: true,
        },
        take: limitNum,
        orderBy: { rewardPoints: 'desc' },
      });
    }

    if (!type || type === 'hospitals') {
      results.hospitals = await prisma.hospital.findMany({
        where: whereCondition,
        select: {
          id: true,
          userId: true,
          name: true,
          phone: true,
          city: true,
          state: true,
          rewardPoints: true,
        },
        take: limitNum,
        orderBy: { rewardPoints: 'desc' },
      });
    }

    if (!type || type === 'medstores') {
      results.medstores = await prisma.medStore.findMany({
        where: whereCondition,
        select: {
          id: true,
          userId: true,
          name: true,
          phone: true,
          city: true,
          state: true,
          rewardPoints: true,
        },
        take: limitNum,
        orderBy: { rewardPoints: 'desc' },
      });
    }

    if (!type || type === 'checkup_centers') {
      results.checkupCenters = await prisma.checkupCenter.findMany({
        where: whereCondition,
        select: {
          id: true,
          userId: true,
          name: true,
          phone: true,
          city: true,
          state: true,
          rewardPoints: true,
        },
        take: limitNum,
        orderBy: { rewardPoints: 'desc' },
      });
    }

    res.status(200).json({
      location: { city, state },
      type: type || 'all',
      results,
    });
  } catch (error) {
    console.error('Error getting providers by location:', error);
    res.status(500).json({ error: 'Failed to get providers by location' });
  }
};

// Get popular searches and trending providers
export const getTrendingSearches = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get most common specializations
    const doctorSpecializations = await prisma.doctor.groupBy({
      by: ['specialization'],
      _count: {
        specialization: true,
      },
      where: {
        verificationStatus: 'VERIFIED',
      },
      orderBy: {
        _count: {
          specialization: 'desc',
        },
      },
      take: 10,
    });

    // Get top cities with most providers
    const topCities = await prisma.doctor.groupBy({
      by: ['city'],
      _count: {
        city: true,
      },
      where: {
        verificationStatus: 'VERIFIED',
      },
      orderBy: {
        _count: {
          city: 'desc',
        },
      },
      take: 10,
    });

    // Get most prescribed medicines
    const topMedicines = await prisma.scheduledMedicineItem.groupBy({
      by: ['medicineName'],
      _count: {
        medicineName: true,
      },
      orderBy: {
        _count: {
          medicineName: 'desc',
        },
      },
      take: 15,
    });

    res.status(200).json({
      trending: {
        specializations: doctorSpecializations.map(s => ({
          name: s.specialization,
          count: s._count.specialization,
        })),
        cities: topCities.map(c => ({
          name: c.city,
          count: c._count.city,
        })),
        medicines: topMedicines.map(m => ({
          name: m.medicineName,
          count: m._count.medicineName,
        })),
      },
      suggestions: [
        'Cardiologist near me',
        'Emergency hospital',
        'Pharmacy 24 hours',
        'Pediatrician consultation',
        'Blood test center',
        'Paracetamol alternatives',
        'Diabetes specialist',
        'Orthopedic doctor',
      ],
    });
  } catch (error) {
    console.error('Error getting trending searches:', error);
    res.status(500).json({ error: 'Failed to get trending searches' });
  }
};

// Helper function to determine medicine category
function determineMedicineCategory(medicineName: string): string {
  const name = medicineName.toLowerCase();
  
  if (name.includes('paracetamol') || name.includes('acetaminophen') || name.includes('ibuprofen') || name.includes('aspirin')) {
    return 'Pain Relief';
  } else if (name.includes('amoxicillin') || name.includes('azithromycin') || name.includes('ciprofloxacin')) {
    return 'Antibiotic';
  } else if (name.includes('omeprazole') || name.includes('pantoprazole') || name.includes('ranitidine')) {
    return 'Acid Reducer';
  } else if (name.includes('metformin') || name.includes('insulin') || name.includes('glipizide')) {
    return 'Diabetes';
  } else if (name.includes('atorvastatin') || name.includes('simvastatin')) {
    return 'Cholesterol';
  } else if (name.includes('cetirizine') || name.includes('loratadine') || name.includes('fexofenadine')) {
    return 'Antihistamine';
  } else if (name.includes('calcium') || name.includes('vitamin') || name.includes('iron')) {
    return 'Supplement';
  } else {
    return 'General Medicine';
  }
} 