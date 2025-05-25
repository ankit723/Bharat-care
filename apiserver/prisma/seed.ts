/// <reference types="node" />
import { PrismaClient, Role, DocumentType } from '@prisma/client';
import { hashSync } from 'bcryptjs';
import { faker } from '@faker-js/faker/locale/en_IN'; // Using Indian locale

const prisma = new PrismaClient();

// Configuration for number of entities
const SEED_COUNT = {
  HOSPITALS: 5,
  CLINICS: 8,
  DOCTORS: 15,
  MED_STORES: 6,
  COMPOUNDERS: 10,
  CHECKUP_CENTERS: 6,
  PATIENTS: 20,
  DOCUMENTS_PER_PATIENT: 3,
  REVIEWS_PER_ENTITY: 2,
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
const generateCommonFields = (role: string) => ({
  name: role === 'DOCTOR' ? `Dr. ${faker.person.fullName()}` : faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  password: hashSync('password123', 10),
  phone: faker.string.numeric(10),
  ...generateAddress(),
});

async function main() {
  console.log('Starting seeding...');

  // Clear existing data
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.medDocument.deleteMany(),
    prisma.patient.deleteMany(),
    prisma.doctor.deleteMany(),
    prisma.compounder.deleteMany(),
    prisma.clinic.deleteMany(),
    prisma.hospital.deleteMany(),
    prisma.medStore.deleteMany(),
    prisma.checkupCenter.deleteMany(),
  ]);

  console.log('Cleared existing data');

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

  // Create compounders
  const compounders = await Promise.all(
    Array(SEED_COUNT.COMPOUNDERS).fill(null).map(async (_, index) => {
      // Only assign clinic and med store to compounders where index is within range
      const clinicAssignment = index < clinics.length ? { clinicId: clinics[index].id } : {};
      const medStoreAssignment = index < medStores.length ? { medStoreId: medStores[index].id } : {};
      
      return prisma.compounder.create({
        data: {
          ...await generateCommonFields('COMPOUNDER'),
          ...clinicAssignment,
          ...medStoreAssignment,
          hospitals: {
            connect: [{ id: hospitals[index % hospitals.length].id }],
          },
        },
      });
    })
  );
  console.log(`Created ${compounders.length} compounders`);

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

          return prisma.medDocument.create({
            data: {
              fileName: `${documentType.toLowerCase()}_${faker.string.alphanumeric(8)}.pdf`,
              fileUrl: faker.internet.url(),
              documentType,
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

  // Create reviews for hospitals, doctors, and compounders
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
    // Compounder reviews
    ...compounders.flatMap(compounder => 
      Array(SEED_COUNT.REVIEWS_PER_ENTITY).fill(null).map(() =>
        prisma.review.create({
          data: {
            rating: faker.number.int({ min: 3, max: 5 }),
            comment: faker.lorem.paragraph(),
            compounderId: compounder.id,
            patientId: patients[faker.number.int({ min: 0, max: patients.length - 1 })].id,
          },
        })
      )
    ),
  ]);
  console.log(`Created ${reviews.length} reviews`);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 