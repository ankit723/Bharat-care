// TypeScript types and interfaces for BharatCare Patient App

export interface User {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pin: string;
  country: string;
  rewardPoints: number;
  role: 'PATIENT' | 'DOCTOR' | 'HOSPITAL' | 'CLINIC' | 'MEDSTORE' | 'CHECKUP_CENTER' | 'ADMIN';
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pin: string;
  country: string;
}

export interface MedicineSchedule {
  id: string;
  patientId: string;
  schedulerId: string;
  schedulerType: 'DOCTOR' | 'MEDSTORE';
  startDate: string;
  numberOfDays: number;
  notes?: string;
  items: MedicineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MedicineItem {
  id: string;
  medicineScheduleId: string;
  medicineName: string;
  dosage: string;
  timesPerDay: number;
  gapBetweenDays: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineReminder {
  id: string;
  medicineItemId: string;
  medicineName: string;
  dosage: string;
  scheduledTime: Date;
  actualTakenTime?: Date;
  isCompleted: boolean;
  pointsAwarded: number;
  scheduleDate: Date;
  notes?: string;
}

export interface MedDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  documentType: 'PRESCRIPTION' | 'MEDICAL_REPORT';
  seekAvailability: boolean;
  patientId: string;
  uploadedById: string;
  uploaderType: 'PATIENT' | 'DOCTOR' | 'CHECKUP_CENTER';
  permittedDoctorIds: string[];
  permittedCheckupCenterIds: string[];
  description?: string;
  doctorId?: string;
  checkupCenterId?: string;
  patientUploaderId?: string;
  createdAt: string;
  updatedAt: string;
  // Related entities
  patient?: {
    id: string;
    name: string;
    email: string;
  };
  doctor?: {
    id: string;
    name: string;
    email: string;
  };
  checkupCenter?: {
    id: string;
    name: string;
    email: string;
  };
  patientUploader?: {
    id: string;
    name: string;
    email: string;
  };
  // Med store hand raises
  medStoreHandRaises?: {
    id: string;
    medStoreId: string;
    medDocumentId: string;
    status: string;
    createdAt: string;
    medStore: {
      id: string;
      name: string;
      email: string;
      phone: string;
      city: string;
      state: string;
    };
  }[];
}

export interface DocumentUploadData {
  fileName: string;
  fileUrl: string;
  documentType: 'PRESCRIPTION' | 'MEDICAL_REPORT';
  description?: string;
  seekAvailability?: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  providerType: 'DOCTOR' | 'HOSPITAL' | 'CHECKUP_CENTER' | 'MEDSTORE';
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  userId: string;
  name: string;
  specialization: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rewardPoints: number;
  rating?: number;
  distance?: number; // For location-based recommendations
}

export interface Hospital {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rating?: number;
  distance?: number;
}

export interface MedStore {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rating?: number;
  distance?: number;
}

export interface CheckupCenter {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rating?: number;
  distance?: number;
}

export interface RewardTransaction {
  id: string;
  userId: string;
  points: number;
  transactionType: 'REFERRAL_REWARD' | 'MEDICINE_COMPLIANCE' | 'ADMIN_ADJUSTMENT' | 'OTHER';
  description: string;
  createdAt: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  imageUrl: string;
  uploadedAt: string;
  status: 'PENDING' | 'PROCESSED' | 'REJECTED';
  notes?: string;
  processedBy?: string;
}

export interface GlobalMedicineRequest {
  id: string;
  patientId: string;
  prescriptionImageUrl: string;
  notes?: string;
  status: 'PENDING' | 'MATCHED' | 'DELIVERED' | 'CANCELLED';
  matchedMedStoreId?: string;
  estimatedCost?: number;
  deliveryAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'MEDICINE' | 'APPOINTMENT';
  date: string;
  time: string;
  details: MedicineReminder | Appointment;
  isCompleted: boolean;
}

export interface NotificationConfig {
  id: string;
  type: 'MEDICINE' | 'APPOINTMENT';
  title: string;
  body: string;
  data: {
    medicineItemId?: string;
    appointmentId?: string;
    [key: string]: any;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface SearchFilters {
  location?: string;
  specialization?: string;
  rating?: number;
  distance?: number;
  availability?: 'AVAILABLE' | 'BUSY';
}

export interface HomeRecommendations {
  doctors: Doctor[];
  hospitals: Hospital[];
  medStores: MedStore[];
  checkupCenters: CheckupCenter[];
  upcomingReminders: MedicineReminder[];
  todayAppointments: Appointment[];
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Profile: undefined;
  Medicines: undefined;
  Appointments: undefined;
  Calendar: undefined;
  Documents: undefined;
  DocumentDetails: { documentId: string };
  DocumentUpload: undefined;
  DocumentPermissions: { documentId: string };
  Search: { type?: 'DOCTOR' | 'HOSPITAL' | 'MEDSTORE' | 'CHECKUP_CENTER' };
  Alarm: { reminder: MedicineReminder } | { appointment: Appointment };
  DoctorDetails: { doctorId: string };
  GlobalMedicine: undefined;
  Settings: undefined;
};

export interface AlarmData {
  type: 'MEDICINE' | 'APPOINTMENT';
  id: string;
  title: string;
  subtitle: string;
  time: string;
  data: MedicineReminder | Appointment;
}

export interface AlarmState {
  isActive: boolean;
  currentAlarm: AlarmData | null;
  isGracePeriod: boolean;
  gracePeriodEndsAt: Date | null;
} 