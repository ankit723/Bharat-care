import { Request } from 'express';
import { Doctor, Clinic, MedStore, Hospital, Patient, Review, MedDocument, DocumentType, Role, CheckupCenter, VerificationStatus } from '@prisma/client';

export interface RequestWithBody<T> extends Request {
  body: T;
}

export type DoctorCreationData = Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>;
export type ClinicCreationData = Omit<Clinic, 'id' | 'createdAt' | 'updatedAt'> & { doctorId: string };
export type MedStoreCreationData = Omit<MedStore, 'id' | 'createdAt' | 'updatedAt'>;
export type HospitalCreationData = Omit<Hospital, 'id' | 'createdAt'>;
export type PatientCreationData = Omit<Patient, 'id' | 'createdAt'>;
export type ReviewCreationData = Omit<Review, 'id' | 'createdAt'>; 
export type CheckupCenterCreateData = Omit<CheckupCenter, 'id' | 'createdAt' | 'updatedAt' | 'role'>;
export type CheckupCenterUpdateData = Partial<Omit<CheckupCenter, 'id' | 'createdAt' | 'updatedAt' | 'role'> >;

// Medical Document Types
export type MedDocumentCreateData = {
    fileName: string;
    fileUrl: string;
    documentType: DocumentType;
    patientId: string;
    uploaderType: Role; // From req.user, indicates the role of the uploader
    description?: string;
  };
  
export type MedDocumentUpdateData = Partial<Omit<MedDocument, 'id' | 'createdAt' | 'updatedAt' | 'patientId' | 'uploadedById' | 'uploaderType' | 'doctorId' | 'checkupCenterId' | 'patientUploaderId' | 'fileName' | 'fileUrl'>>; 

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
    verificationStatus: string;
    name?: string;
    email?: string;
  };
} 

// Medicine Schedule Types
export interface ScheduledMedicineItemCreateData {
  medicineName: string;
  dosage: string;
  timesPerDay: number;
  gapBetweenDays: number;
  notes?: string;
}

export interface ScheduledMedicineItemUpdateData extends Partial<ScheduledMedicineItemCreateData> {
  id?: string; // Required if updating an existing item
}

export interface MedicineScheduleCreateData {
  patientId: string;
  startDate: string | Date;
  numberOfDays: number;
  notes?: string;
  items: ScheduledMedicineItemCreateData[];
}

export interface MedicineScheduleUpdateData {
  patientId?: string;
  startDate?: string | Date;
  numberOfDays?: number;
  notes?: string;
  items?: ScheduledMedicineItemUpdateData[]; // To add, update, or delete items
} 