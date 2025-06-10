import { PrismaClient } from '@prisma/client';
import { generateUserId } from '../../src/utils/userIdGenerator';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration to add userId to existing records...');

  // Update Doctors
  const doctors = await prisma.doctor.findMany();
  console.log(`Found ${doctors.length} doctors to update`);
  
  for (const doctor of doctors) {
    const userId = generateUserId(doctor.name);
    await prisma.doctor.update({
      where: { id: doctor.id },
      data: { userId }
    });
  }

  // Update Patients
  const patients = await prisma.patient.findMany();
  console.log(`Found ${patients.length} patients to update`);
  
  for (const patient of patients) {
    const userId = generateUserId(patient.name);
    await prisma.patient.update({
      where: { id: patient.id },
      data: { userId }
    });
  }

  // Update Hospitals
  const hospitals = await prisma.hospital.findMany();
  console.log(`Found ${hospitals.length} hospitals to update`);
  
  for (const hospital of hospitals) {
    const userId = generateUserId(hospital.name);
    await prisma.hospital.update({
      where: { id: hospital.id },
      data: { userId }
    });
  }

  // Update Clinics
  const clinics = await prisma.clinic.findMany();
  console.log(`Found ${clinics.length} clinics to update`);
  
  for (const clinic of clinics) {
    const userId = generateUserId(clinic.name);
    await prisma.clinic.update({
      where: { id: clinic.id },
      data: { userId }
    });
  }

  // Update MedStores
  const medStores = await prisma.medStore.findMany();
  console.log(`Found ${medStores.length} med stores to update`);
  
  for (const medStore of medStores) {
    const userId = generateUserId(medStore.name);
    await prisma.medStore.update({
      where: { id: medStore.id },
      data: { userId }
    });
  }

  // Update CheckupCenters
  const checkupCenters = await prisma.checkupCenter.findMany();
  console.log(`Found ${checkupCenters.length} checkup centers to update`);
  
  for (const checkupCenter of checkupCenters) {
    const userId = generateUserId(checkupCenter.name);
    await prisma.checkupCenter.update({
      where: { id: checkupCenter.id },
      data: { userId }
    });
  }

  // Update Admins
  const admins = await prisma.admin.findMany();
  console.log(`Found ${admins.length} admins to update`);
  
  for (const admin of admins) {
    const userId = generateUserId(admin.name);
    await prisma.admin.update({
      where: { id: admin.id },
      data: { userId }
    });
  }

  console.log('Migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 