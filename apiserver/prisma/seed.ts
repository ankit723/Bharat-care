/// <reference types="node" />
import { PrismaClient, Role, DocumentType, Prisma } from '@prisma/client';
import { hashSync } from 'bcryptjs';
import { faker } from '@faker-js/faker/locale/en_IN'; // Using Indian locale
import { generateUserId } from '../src/utils/userIdGenerator';

const prisma = new PrismaClient();

// Configuration for number of entities
const SEED_COUNT = {
  HOSPITALS: 5,
  CLINICS: 8,
  DOCTORS: 15,
  MED_STORES: 6,
  CHECKUP_CENTERS: 6,
  PATIENTS: 20,
  DOCUMENTS_PER_PATIENT: 3,
  REVIEWS_PER_ENTITY: 2,
  REFERRALS_PER_USER: 3,  // Number of referrals created per user type
  SERVICE_REFERRALS: 10    // Total number of service referrals to create
};

// Default reward settings
const DEFAULT_REWARD_SETTINGS = {
  REFERRAL_POINTS: 2, // Points awarded for each referral
};

// Helper function to generate address
const generateAddress = () => ({
  addressLine: faker.location.streetAddress(),
  city: faker.location.city(),
  state: faker.location.state(),
  pin: faker.location.zipCode(),
  country: 'India',
});

// Helper function to generate common fields
const generateCommonFields = (role: string) => {
  const name = role === 'DOCTOR' ? `Dr. ${faker.person.fullName()}` : faker.person.fullName();
  return {
    name,
  email: faker.internet.email().toLowerCase(),
  password: hashSync('0000', 10),
  phone: faker.string.numeric(10),
    userId: generateUserId(name), // Add userId using the generator
  ...generateAddress(),
  };
};

async function main() {
  console.log('Starting seeding...');

  // Clear existing data in correct order to handle foreign key constraints
  await prisma.$transaction([
    // Delete dependent records first
    prisma.rewardSetting.deleteMany(),
    prisma.rewardTransaction.deleteMany(),
    prisma.referral.deleteMany(),
    prisma.review.deleteMany(),
    prisma.medDocument.deleteMany(),
    prisma.doctorNextVisit.deleteMany(), // Add this
    prisma.checkupCenterNextVisit.deleteMany(), // Add this
    prisma.scheduledMedicineItem.deleteMany(),
    prisma.medicineSchedule.deleteMany(),
    // Then delete main entities
    prisma.patient.deleteMany(),
    prisma.doctor.deleteMany(),
    prisma.clinic.deleteMany(),
    prisma.hospital.deleteMany(),
    prisma.medStore.deleteMany(),
    prisma.checkupCenter.deleteMany(),
    prisma.admin.deleteMany(),
  ]);

  console.log('Cleared existing data');

  // Create Admin
  const adminName = 'Super Admin';
  const adminPassword = hashSync('0000', 10);
  const admin = await prisma.admin.create({
    data: {
      name: adminName,
      email: 'admin@bharatcare.com',
      password: adminPassword,
      phone: faker.string.numeric(10),
      addressLine: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      pin: faker.location.zipCode(),
      country: 'India',
      role: 'ADMIN', // Explicitly set role, though it defaults
      userId: generateUserId(adminName), // Add userId for admin
    }
  });
  console.log(`Created admin: ${admin.name} (${admin.email})`);

  // Create default reward settings
  await prisma.rewardSetting.upsert({
    where: { key: 'referral_points' },
    update: {},
    create: {
      key: 'referral_points',
      value: 50,
      description: 'Points awarded for a completed user referral',
      updatedById: admin.id,
    },
  });

  // Service referral points - points awarded for service referrals
  await prisma.rewardSetting.upsert({
    where: { key: 'service_referral_points' },
    update: {},
    create: {
      key: 'service_referral_points',
      value: 20,
      description: 'Points awarded for a completed service referral',
      updatedById: admin.id,
    },
  });

  // Service referral points by type
  await prisma.rewardSetting.upsert({
    where: { key: 'doctor_consult_referral_points' },
    update: {},
    create: {
      key: 'doctor_consult_referral_points',
      value: 25,
      description: 'Points awarded for a completed doctor consultation referral',
      updatedById: admin.id,
    },
  });

  await prisma.rewardSetting.upsert({
    where: { key: 'medstore_purchase_referral_points' },
    update: {},
    create: {
      key: 'medstore_purchase_referral_points',
      value: 15,
      description: 'Points awarded for a completed medicine purchase referral',
      updatedById: admin.id,
    },
  });

  await prisma.rewardSetting.upsert({
    where: { key: 'checkup_service_referral_points' },
    update: {},
    create: {
      key: 'checkup_service_referral_points',
      value: 30,
      description: 'Points awarded for a completed medical checkup referral',
      updatedById: admin.id,
    },
  });

  // Create hospitals
  const hospitals = await Promise.all(
    Array(SEED_COUNT.HOSPITALS).fill(null).map(async () => 
      prisma.hospital.create({
        data: {
          ...await generateCommonFields('HOSPITAL'),
          name: faker.company.name() + ' Hospital',
        },
      })
    )
  );
  console.log(`Created ${hospitals.length} hospitals`);

  // Create clinics
  const clinics = await Promise.all(
    Array(SEED_COUNT.CLINICS).fill(null).map(async () => 
      prisma.clinic.create({
        data: {
          ...await generateCommonFields('CLINIC'),
          name: faker.company.name() + ' Clinic',
        },
      })
    )
  );
  console.log(`Created ${clinics.length} clinics`);

  // Create doctors
  const doctors = await Promise.all(
    Array(SEED_COUNT.DOCTORS).fill(null).map(async (_, index) => {
      // Only assign clinic to doctors where index < number of clinics
      const clinicAssignment = index < clinics.length ? { clinicId: clinics[index].id } : {};
      
      return prisma.doctor.create({
        data: {
          ...await generateCommonFields('DOCTOR'),
          ...clinicAssignment,
          hospitals: {
            connect: [
              { id: hospitals[index % hospitals.length].id },
              { id: hospitals[(index + 1) % hospitals.length].id },
            ],
          },
        },
      });
    })
  );
  console.log(`Created ${doctors.length} doctors`);

  // Create med stores
  const medStores = await Promise.all(
    Array(SEED_COUNT.MED_STORES).fill(null).map(async () => 
      prisma.medStore.create({
        data: {
          ...await generateCommonFields('MEDSTORE'),
          name: faker.company.name() + ' Pharmacy',
        },
      })
    )
  );
  console.log(`Created ${medStores.length} med stores`);

  // Create checkup centers
  const checkupCenters = await Promise.all(
    Array(SEED_COUNT.CHECKUP_CENTERS).fill(null).map(async () => 
      prisma.checkupCenter.create({
        data: {
          ...await generateCommonFields('CHECKUP_CENTER'),
          name: faker.company.name() + ' Diagnostics',
        },
      })
    )
  );
  console.log(`Created ${checkupCenters.length} checkup centers`);

  // Create patients with their documents and relationships
  const patients = await Promise.all(
    Array(SEED_COUNT.PATIENTS).fill(null).map(async (_, index) => {
      // Assign multiple doctors and one checkup center to each patient
      const patientDoctors = [
        doctors[index % doctors.length],
        doctors[(index + 1) % doctors.length],
        doctors[(index + 2) % doctors.length],
      ];

      const patient = await prisma.patient.create({
        data: {
          ...await generateCommonFields('PATIENT'),
          doctors: {
            connect: patientDoctors.map(d => ({ id: d.id })),
          },
          hospitals: {
            connect: [{ id: hospitals[index % hospitals.length].id }],
          },
          checkupCenters: {
            connect: [{ id: checkupCenters[index % checkupCenters.length].id }],
          },
        },
      });

      // Create documents for each patient
      const documentTypes = [DocumentType.PRESCRIPTION, DocumentType.MEDICAL_REPORT];
      const uploaderTypes = [Role.DOCTOR, Role.CHECKUP_CENTER, Role.PATIENT];

      await Promise.all(
        Array(SEED_COUNT.DOCUMENTS_PER_PATIENT).fill(null).map(async (_, docIndex) => {
          const documentType = documentTypes[docIndex % documentTypes.length];
          const uploaderType = uploaderTypes[docIndex % uploaderTypes.length];
          let uploaderId, doctorId, checkupCenterId;

          switch (uploaderType) {
            case Role.DOCTOR:
              uploaderId = patientDoctors[0].id;
              doctorId = patientDoctors[0].id;
              break;
            case Role.CHECKUP_CENTER:
              uploaderId = checkupCenters[index % checkupCenters.length].id;
              checkupCenterId = checkupCenters[index % checkupCenters.length].id;
              break;
            case Role.PATIENT:
              uploaderId = patient.id;
              break;
          }

          // Determine if seekAvailability should be true
          // Only for prescriptions, and for roughly 1/3rd of them
          const shouldSeekAvailability = 
            documentType === DocumentType.PRESCRIPTION && 
            docIndex % 3 === 0;

          return prisma.medDocument.create({
            data: {
              fileName: `${documentType.toLowerCase()}_${faker.string.alphanumeric(8)}.pdf`,
              fileUrl: faker.internet.url(),
              documentType,
              seekAvailability: shouldSeekAvailability,
              patientId: patient.id,
              uploadedById: uploaderId!,
              uploaderType,
              description: faker.lorem.sentence(),
              doctorId,
              checkupCenterId,
              permittedDoctorIds: patientDoctors.map(d => d.id),
              permittedCheckupCenterIds: [checkupCenters[index % checkupCenters.length].id],
            },
          });
        })
      );

      return patient;
    })
  );
  console.log(`Created ${patients.length} patients with their documents`);

  // Create Medicine Schedules
  if (patients.length > 0 && (doctors.length > 0 || medStores.length > 0)) {
    const schedulesToCreate: Prisma.PrismaPromise<any>[] = [];
    const itemsToCreate: Prisma.PrismaPromise<any>[] = [];

    for (let i = 0; i < SEED_COUNT.PATIENTS / 2; i++) { // Create schedules for half the patients
      const patient = patients[i];
      const numSchedulesForPatient = faker.number.int({ min: 1, max: 2 }); // 1-2 schedules per patient

      for (let j = 0; j < numSchedulesForPatient; j++) {
        let schedulerId: string;
        let schedulerType: Role;

        // Alternate between doctor and medstore if both exist
        if (doctors.length > 0 && medStores.length > 0) {
          if (j % 2 === 0) {
            schedulerId = doctors[i % doctors.length].id;
            schedulerType = Role.DOCTOR;
          } else {
            schedulerId = medStores[i % medStores.length].id;
            schedulerType = Role.MEDSTORE;
          }
        } else if (doctors.length > 0) {
          schedulerId = doctors[i % doctors.length].id;
          schedulerType = Role.DOCTOR;
        } else { // Only medstores exist
          schedulerId = medStores[i % medStores.length].id;
          schedulerType = Role.MEDSTORE;
        }
        
        const startDate = faker.date.recent({ days: 30 });
        const scheduleId = faker.string.uuid(); // Generate ID for linking

        const medicineScheduleData = {
          id: scheduleId, // Assign the generated ID
          patientId: patient.id,
          numberOfDays: faker.number.int({ min: 5, max: 30 }),
          startDate: startDate,
          notes: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : undefined, // 30% chance of notes
          schedulerId: schedulerId!,
          schedulerType: schedulerType!,
        };
        schedulesToCreate.push(prisma.medicineSchedule.create({ data: medicineScheduleData }));

        // Create 1 to 3 medicine items for this schedule
        const numMedicineItems = faker.number.int({ min: 1, max: 3 });
        for (let k = 0; k < numMedicineItems; k++) {
          const medicineItemData = {
            medicineScheduleId: scheduleId, // Link to the parent schedule
            medicineName: faker.commerce.productName() + ` ${faker.helpers.arrayElement(['Tablets', 'Syrup', 'Capsules', 'Ointment'])}`,
            dosage: `${faker.number.int({ min: 1, max: 2 })} ${faker.helpers.arrayElement(['tablet', 'capsule', 'ml', 'spoonful', 'application'])}`,
            timesPerDay: faker.number.int({ min: 1, max: 4 }),
            gapBetweenDays: faker.number.int({ min: 0, max: 2 }), // 0 for daily, 1 for alt days, etc.
            notes: faker.datatype.boolean(0.2) ? faker.lorem.words(5) : undefined, // 20% chance of item-specific notes
          };
          itemsToCreate.push(prisma.scheduledMedicineItem.create({ data: medicineItemData }));
        }
      }
    }
    if (schedulesToCreate.length > 0) {
      await prisma.$transaction(schedulesToCreate);
      console.log(`Created ${schedulesToCreate.length} medicine schedules`);
    }
    if (itemsToCreate.length > 0) {
      await prisma.$transaction(itemsToCreate); // Persist items after schedules
      console.log(`Created ${itemsToCreate.length} scheduled medicine items`);
    }
  } else {
    console.log('Skipping medicine schedule creation due to missing patients, doctors, or medstores.');
  }

  // Create reviews for hospitals, doctors
  const reviews = await Promise.all([
    // Hospital reviews
    ...hospitals.flatMap(hospital => 
      Array(SEED_COUNT.REVIEWS_PER_ENTITY).fill(null).map(() =>
        prisma.review.create({
          data: {
            rating: faker.number.int({ min: 3, max: 5 }),
            comment: faker.lorem.paragraph(),
            hospitalId: hospital.id,
            patientId: patients[faker.number.int({ min: 0, max: patients.length - 1 })].id,
          },
        })
      )
    ),
    // Doctor reviews
    ...doctors.flatMap(doctor => 
      Array(SEED_COUNT.REVIEWS_PER_ENTITY).fill(null).map(() =>
        prisma.review.create({
          data: {
            rating: faker.number.int({ min: 3, max: 5 }),
            comment: faker.lorem.paragraph(),
            doctorId: doctor.id,
            patientId: patients[faker.number.int({ min: 0, max: patients.length - 1 })].id,
          },
        })
      )
    ),
    // Checkup Center reviews
    ...checkupCenters.flatMap(center => 
      Array(SEED_COUNT.REVIEWS_PER_ENTITY).fill(null).map(() =>
        prisma.review.create({
          data: {
            rating: faker.number.int({ min: 3, max: 5 }),
            comment: faker.lorem.paragraph(),
            checkupCenterId: center.id,
            patientId: patients[faker.number.int({ min: 0, max: patients.length - 1 })].id,
          },
        })
      )
    ),
  ]);
  console.log(`Created ${reviews.length} reviews`);

  // Create Standard Referrals (between users, not service referrals)
  interface ReferralPair {
    referrerRole: Role;
    referredRole: Role;
  }

  const referralPairs: ReferralPair[] = [
    { referrerRole: Role.DOCTOR, referredRole: Role.PATIENT },
    { referrerRole: Role.DOCTOR, referredRole: Role.DOCTOR },
    { referrerRole: Role.PATIENT, referredRole: Role.DOCTOR },
    { referrerRole: Role.MEDSTORE, referredRole: Role.PATIENT },
    { referrerRole: Role.CHECKUP_CENTER, referredRole: Role.PATIENT },
    { referrerRole: Role.HOSPITAL, referredRole: Role.PATIENT },
    { referrerRole: Role.CLINIC, referredRole: Role.PATIENT },
  ];

  const standardReferrals: Prisma.PrismaPromise<any>[] = [];

  for (const pair of referralPairs) {
    // Get entities based on role
    const referrers = getEntitiesByRole(pair.referrerRole, {
      doctors,
      patients,
      hospitals,
      medStores,
      clinics,
      checkupCenters
    });
    
    const referreds = getEntitiesByRole(pair.referredRole, {
      doctors,
      patients,
      hospitals,
      medStores,
      clinics,
      checkupCenters
    });

    if (referrers.length === 0 || referreds.length === 0) {
      continue;
    }

    for (let i = 0; i < Math.min(SEED_COUNT.REFERRALS_PER_USER, referrers.length); i++) {
      const referrer = referrers[i];
      const referredIndex = (i + 1) % referreds.length; // Avoid self-referrals
      const referred = referreds[referredIndex];

      if (referrer.id === referred.id) {
        continue; // Skip self-referrals
      }

      // Prepare data based on referrer role
      const referrerData: any = {};
      switch (pair.referrerRole) {
        case Role.DOCTOR:
          referrerData.referrerDoctorId = referrer.id;
          break;
        case Role.PATIENT:
          referrerData.referrerPatientId = referrer.id;
          break;
        case Role.HOSPITAL:
          referrerData.referrerHospitalId = referrer.id;
          break;
        case Role.MEDSTORE:
          referrerData.referrerMedStoreId = referrer.id;
          break;
        case Role.CLINIC:
          referrerData.referrerClinicId = referrer.id;
          break;
        case Role.CHECKUP_CENTER:
          referrerData.referrerCheckupCenterId = referrer.id;
          break;
      }

      // Prepare data based on referred role
      const referredData: any = {};
      switch (pair.referredRole) {
        case Role.DOCTOR:
          referredData.referredDoctorId = referred.id;
          break;
        case Role.PATIENT:
          referredData.referredPatientId = referred.id;
          break;
        case Role.HOSPITAL:
          referredData.referredHospitalId = referred.id;
          break;
        case Role.MEDSTORE:
          referredData.referredMedStoreId = referred.id;
          break;
        case Role.CLINIC:
          referredData.referredClinicId = referred.id;
          break;
        case Role.CHECKUP_CENTER:
          referredData.referredCheckupCenterId = referred.id;
          break;
      }

      // Determine status - 50% completed, 40% pending, 10% rejected
      const statusRandom = Math.random();
      const status = statusRandom < 0.5 ? 'COMPLETED' : 
                     statusRandom < 0.9 ? 'PENDING' : 
                     'REJECTED';
      
      const completedAt = status === 'COMPLETED' ? 
                          faker.date.recent({ days: 30 }) : 
                          null;
      
      const pointsAwarded = status === 'COMPLETED' ? 
                           faker.number.int({ min: 10, max: 100 }) : 
                           status === 'PENDING' ? 50 : 0; // Default points for pending

      const referralData = {
        referrerId: referrer.id,
        referrerRole: pair.referrerRole,
        referredId: referred.id,
        referredRole: pair.referredRole,
        status,
        pointsAwarded,
        completedAt,
        isServiceReferral: false,
        ...referrerData,
        ...referredData,
      };

      standardReferrals.push(prisma.referral.create({ data: referralData }));
    }
  }

  // Create Service Referrals (doctor to doctor, doctor to med store, etc.)
  interface ServiceReferralType {
    referrerRole: Role;
    referredRole: Role;
    serviceType: 'DOCTOR_CONSULT' | 'MEDSTORE_PURCHASE' | 'CHECKUP_SERVICE';
  }

  const serviceReferralTypes: ServiceReferralType[] = [
    { referrerRole: Role.DOCTOR, referredRole: Role.DOCTOR, serviceType: 'DOCTOR_CONSULT' },
    { referrerRole: Role.DOCTOR, referredRole: Role.MEDSTORE, serviceType: 'MEDSTORE_PURCHASE' },
    { referrerRole: Role.DOCTOR, referredRole: Role.CHECKUP_CENTER, serviceType: 'CHECKUP_SERVICE' },
  ];

  const serviceReferrals: Prisma.PrismaPromise<any>[] = [];

  // Creating service referrals
  for (let i = 0; i < SEED_COUNT.SERVICE_REFERRALS; i++) {
    const typeIndex = i % serviceReferralTypes.length;
    const referralType = serviceReferralTypes[typeIndex];

    const referrerPool = getEntitiesByRole(referralType.referrerRole, {
      doctors,
      patients,
      hospitals,
      medStores,
      clinics,
      checkupCenters
    });
    
    const referredPool = getEntitiesByRole(referralType.referredRole, {
      doctors,
      patients,
      hospitals,
      medStores,
      clinics,
      checkupCenters
    });
    
    if (referrerPool.length === 0 || referredPool.length === 0 || patients.length === 0) {
      continue;
    }

    const referrerIndex = i % referrerPool.length;
    const referredIndex = (i + 1) % referredPool.length; // Avoid self-referrals
    const patientIndex = i % patients.length;

    const referrer = referrerPool[referrerIndex];
    const referred = referredPool[referredIndex];
    const patient = patients[patientIndex];

    if (referrer.id === referred.id) {
      continue; // Skip self-referrals
    }

    // Prepare data based on referrer role
    const referrerData: any = {};
    if (referralType.referrerRole === Role.DOCTOR) {
      referrerData.referrerDoctorId = referrer.id;
    }

    // Prepare data based on referred role
    const referredData: any = {};
    switch (referralType.referredRole) {
      case Role.DOCTOR:
        referredData.referredDoctorId = referred.id;
        break;
      case Role.MEDSTORE:
        referredData.referredMedStoreId = referred.id;
        break;
      case Role.CHECKUP_CENTER:
        referredData.referredCheckupCenterId = referred.id;
        break;
    }

    // Determine status - 40% completed, 60% pending
    const status = Math.random() < 0.4 ? 'COMPLETED' : 'PENDING';
    const completedAt = status === 'COMPLETED' ? faker.date.recent({ days: 30 }) : null;
    
    // Points depend on the service type
    let pointsAwarded = 0;
    if (status === 'COMPLETED') {
      switch (referralType.serviceType) {
        case 'DOCTOR_CONSULT':
          pointsAwarded = 25;
          break;
        case 'MEDSTORE_PURCHASE':
          pointsAwarded = 15;
          break;
        case 'CHECKUP_SERVICE':
          pointsAwarded = 30;
          break;
        default:
          pointsAwarded = 20;
      }
    }

    const serviceReferralData = {
      referrerId: referrer.id,
      referrerRole: referralType.referrerRole,
      referredId: referred.id,
      referredRole: referralType.referredRole,
      patientId: patient.id,
      serviceType: referralType.serviceType,
      notes: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null,
      status,
      pointsAwarded,
      completedAt,
      isServiceReferral: true,
      ...referrerData,
      ...referredData,
    };

    serviceReferrals.push(prisma.referral.create({ data: serviceReferralData }));
  }

  // Execute all referral creations
  if (standardReferrals.length > 0 || serviceReferrals.length > 0) {
    const allReferrals = [...standardReferrals, ...serviceReferrals];
    await prisma.$transaction(allReferrals);
    console.log(`Created ${standardReferrals.length} standard referrals and ${serviceReferrals.length} service referrals`);

    // Create reward transactions for completed referrals
    const completedReferrals = await prisma.referral.findMany({
      where: { status: 'COMPLETED' }
    });

    const rewardTransactions: Prisma.PrismaPromise<any>[] = [];

    for (const referral of completedReferrals) {
      // For service referrals, only award points to the referrer
      if (referral.isServiceReferral) {
        rewardTransactions.push(
          prisma.rewardTransaction.create({
            data: {
              userId: referral.referrerId,
              userRole: referral.referrerRole,
              points: referral.pointsAwarded,
              transactionType: 'REFERRAL_REWARD',
              description: `Service referral reward for referring a patient to ${referral.serviceType?.toLowerCase().replace('_', ' ')}`,
              referralId: referral.id
            }
          })
        );
      } else {
        // Standard referral - award points to both parties
        rewardTransactions.push(
          prisma.rewardTransaction.create({
            data: {
              userId: referral.referrerId,
              userRole: referral.referrerRole,
              points: referral.pointsAwarded,
              transactionType: 'REFERRAL_REWARD',
              description: `Referral reward for referring a ${referral.referredRole.toLowerCase()}`,
              referralId: referral.id
            }
          })
        );

        rewardTransactions.push(
          prisma.rewardTransaction.create({
            data: {
              userId: referral.referredId,
              userRole: referral.referredRole,
              points: referral.pointsAwarded,
              transactionType: 'REFERRAL_REWARD',
              description: `Reward for being referred by a ${referral.referrerRole.toLowerCase()}`,
              referralId: referral.id
            }
          })
        );
      }
    }

    if (rewardTransactions.length > 0) {
      await prisma.$transaction(rewardTransactions);
      console.log(`Created ${rewardTransactions.length} reward transactions`);

      // Update reward points for each entity
      const updatePromises: Prisma.PrismaPromise<any>[] = [];
      
      // Get the sum of points for each user
      const referrerTransactions = await prisma.rewardTransaction.groupBy({
        by: ['userId', 'userRole'],
        _sum: { points: true },
      });
      
      for (const transaction of referrerTransactions) {
        const { userId, userRole } = transaction;
        const points = transaction._sum.points || 0;
        
        switch (userRole) {
          case Role.DOCTOR:
            updatePromises.push(prisma.doctor.update({
              where: { id: userId },
              data: { rewardPoints: points }
            }));
            break;
          case Role.PATIENT:
            updatePromises.push(prisma.patient.update({
              where: { id: userId },
              data: { rewardPoints: points }
            }));
            break;
          case Role.HOSPITAL:
            updatePromises.push(prisma.hospital.update({
              where: { id: userId },
              data: { rewardPoints: points }
            }));
            break;
          case Role.MEDSTORE:
            updatePromises.push(prisma.medStore.update({
              where: { id: userId },
              data: { rewardPoints: points }
            }));
            break;
          case Role.CLINIC:
            updatePromises.push(prisma.clinic.update({
              where: { id: userId },
              data: { rewardPoints: points }
            }));
            break;
          case Role.CHECKUP_CENTER:
            updatePromises.push(prisma.checkupCenter.update({
              where: { id: userId },
              data: { rewardPoints: points }
            }));
            break;
        }
      }
      
      if (updatePromises.length > 0) {
        await prisma.$transaction(updatePromises);
        console.log(`Updated reward points for ${updatePromises.length} users`);
      }
    }
  } else {
    console.log('Skipping referral creation due to missing doctors, patients, or other entities.');
  }

  console.log('Seeding completed successfully!');
}

// Helper function to get entities by role
function getEntitiesByRole(role: Role, entities: {
  doctors: any[],
  patients: any[],
  hospitals: any[],
  medStores: any[],
  clinics: any[],
  checkupCenters: any[]
}): any[] {
  switch (role) {
    case Role.DOCTOR:
      return entities.doctors;
    case Role.PATIENT:
      return entities.patients;
    case Role.HOSPITAL:
      return entities.hospitals;
    case Role.MEDSTORE:
      return entities.medStores;
    case Role.CLINIC:
      return entities.clinics;
    case Role.CHECKUP_CENTER:
      return entities.checkupCenters;
    default:
      return [];
  }
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 