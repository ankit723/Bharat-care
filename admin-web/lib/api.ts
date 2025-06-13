import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

// API base URL - can be overridden by environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Create a custom axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      // Clear token
      Cookies.remove('token');
      
      // Redirect to login page if we're in the browser environment
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string): Promise<AxiosResponse> => 
    apiClient.post('/auth/login', { email, password }),
  
  register: (userData: any): Promise<AxiosResponse> => 
    apiClient.post('/auth/register', userData),
  
  getCurrentUser: (): Promise<AxiosResponse> => 
    apiClient.get('/auth/me')
};

// Doctors API
export const doctorsApi = {
  getAll: (params?: any): Promise<AxiosResponse> => 
    apiClient.get('/doctors', { params }),
  
  getById: (id: string): Promise<AxiosResponse> => 
    apiClient.get(`/doctors/${id}`),
  
  create: (doctorData: any): Promise<AxiosResponse> => 
    apiClient.post('/doctors', doctorData),
  
  update: (id: string, doctorData: any): Promise<AxiosResponse> => 
    apiClient.put(`/doctors/${id}`, doctorData),
  
  delete: (id: string): Promise<AxiosResponse> => 
    apiClient.delete(`/doctors/${id}`),

  assignToHospital: (doctorId: string, hospitalId: string): Promise<AxiosResponse> => 
    apiClient.post('/doctors/assign', { doctorId, hospitalId }),

  assignToPatient: (doctorId: string, patientId: string): Promise<AxiosResponse> => 
    apiClient.post('/doctors/assign-patient', { doctorId, patientId }),

  removeFromPatient: (doctorId: string, patientId: string): Promise<AxiosResponse> => 
    apiClient.post('/doctors/remove-patient', { doctorId, patientId }),

  updatePatientNextVisit: (doctorId: string, patientId: string, nextVisitDate: Date) =>
    apiClient.patch(`/doctors/${doctorId}/patients/${patientId}/next-visit`, { nextVisitDate })
};

// Patients API
export const patientsApi = {
  getAll: (params?: any): Promise<AxiosResponse> => 
    apiClient.get('/patients', { params }),
  
  getById: (id: string): Promise<AxiosResponse> => 
    apiClient.get(`/patients/${id}`),
  
  create: (patientData: any): Promise<AxiosResponse> => 
    apiClient.post('/patients', patientData),
  
  update: (id: string, patientData: any): Promise<AxiosResponse> => 
    apiClient.put(`/patients/${id}`, patientData),
  
  delete: (id: string): Promise<AxiosResponse> => 
    apiClient.delete(`/patients/${id}`)
};

// Hospitals API
export const hospitalsApi = {
  getAll: (params?: any): Promise<AxiosResponse> => 
    apiClient.get('/hospitals', { params }),
  
  getById: (id: string): Promise<AxiosResponse> => 
    apiClient.get(`/hospitals/${id}`),
  
  create: (hospitalData: any): Promise<AxiosResponse> => 
    apiClient.post('/hospitals', hospitalData),
  
  update: (id: string, hospitalData: any): Promise<AxiosResponse> => 
    apiClient.put(`/hospitals/${id}`, hospitalData),
  
  delete: (id: string): Promise<AxiosResponse> => 
    apiClient.delete(`/hospitals/${id}`),

  assignPatient: (hospitalId: string, patientId: string): Promise<AxiosResponse> => 
    apiClient.post('/hospitals/assign-patient', { hospitalId, patientId }),

  removePatient: (hospitalId: string, patientId: string): Promise<AxiosResponse> => 
    apiClient.post('/hospitals/remove-patient', { hospitalId, patientId })
};

// Clinics API
export const clinicsApi = {
  getAll: (params?: any): Promise<AxiosResponse> => 
    apiClient.get('/clinics', { params }),
  
  getById: (id: string): Promise<AxiosResponse> => 
    apiClient.get(`/clinics/${id}`),

  create: (clinicData: any): Promise<AxiosResponse> => 
    apiClient.post('/clinics', clinicData),
  
  update: (id: string, clinicData: any): Promise<AxiosResponse> => 
    apiClient.put(`/clinics/${id}`, clinicData),
  
  delete: (id: string): Promise<AxiosResponse> => 
    apiClient.delete(`/clinics/${id}`),

  assignDoctor: (clinicId: string, doctorId: string): Promise<AxiosResponse> => 
    apiClient.post(`/clinics/${clinicId}/assign-doctor`, { doctorId }),

  removeDoctor: (clinicId: string): Promise<AxiosResponse> => 
    apiClient.post(`/clinics/${clinicId}/remove-doctor`)
};

// Med Stores API
export const medStoresApi = {
  getAll: (params?: any): Promise<AxiosResponse> => 
    apiClient.get('/medstores', { params }),
  
  getById: (id: string): Promise<AxiosResponse> => 
    apiClient.get(`/medstores/${id}`),
  
  create: (medStoreData: any): Promise<AxiosResponse> => 
    apiClient.post('/medstores', medStoreData),
  
  update: (id: string, medStoreData: any): Promise<AxiosResponse> => 
    apiClient.put(`/medstores/${id}`, medStoreData),
  
  delete: (id: string): Promise<AxiosResponse> => 
    apiClient.delete(`/medstores/${id}`),

  getAvailablePrescriptions: (page?: number, limit?: number, search?: string): Promise<AxiosResponse> => 
    apiClient.get('/medstores/available-prescriptions', { params: { page, limit, search } }),

  raiseHand: (medStoreId: string, medDocumentId: string): Promise<AxiosResponse> => 
    apiClient.post(`/medstores/${medStoreId}/raise-hand/${medDocumentId}`),

  withdrawHand: (medStoreId: string, medDocumentId: string): Promise<AxiosResponse> => 
    apiClient.delete(`/medstores/${medStoreId}/withdraw-hand/${medDocumentId}`)
};

// Checkup Centers API
export const checkupCentersApi = {
  getAll: (params?: any): Promise<AxiosResponse> => 
    apiClient.get('/checkup-centers', { params }),
  
  getById: (id: string): Promise<AxiosResponse> => 
    apiClient.get(`/checkup-centers/${id}`),

  create: (checkupCenterData: any): Promise<AxiosResponse> => 
    apiClient.post('/checkup-centers', checkupCenterData),
  
  update: (id: string, checkupCenterData: any): Promise<AxiosResponse> => 
    apiClient.put(`/checkup-centers/${id}`, checkupCenterData),
  
  delete: (id: string): Promise<AxiosResponse> => 
    apiClient.delete(`/checkup-centers/${id}`),

  assignPatient: (checkupCenterId: string, patientId: string): Promise<AxiosResponse> =>
    apiClient.post('/checkup-centers/assign-patient', { checkupCenterId, patientId }),

  removePatient: (checkupCenterId: string, patientId: string): Promise<AxiosResponse> =>
    apiClient.post('/checkup-centers/remove-patient', { checkupCenterId, patientId }),

  assignPatientToCheckupCenter: (checkupCenterId: string, patientId: string): Promise<AxiosResponse> =>
    apiClient.post('/checkup-centers/assign-patient', { checkupCenterId, patientId }),

  removePatientFromCheckupCenter: (checkupCenterId: string, patientId: string): Promise<AxiosResponse> =>
    apiClient.post('/checkup-centers/remove-patient', { checkupCenterId, patientId }),

  updatePatientNextVisit: (checkupCenterId: string, patientId: string, nextVisitDate: Date): Promise<AxiosResponse> =>
    apiClient.patch(`/checkup-centers/${checkupCenterId}/patients/${patientId}/next-visit`, { nextVisitDate }),
};

// MedDocuments API
export const medDocumentsApi = {
  getAll: (params?: any): Promise<AxiosResponse> =>
    apiClient.get('/med-documents', { params }),

  getById: (id: string): Promise<AxiosResponse> =>
    apiClient.get(`/med-documents/${id}`),

  create: (docData: any): Promise<AxiosResponse> =>
    apiClient.post('/med-documents', docData),

  update: (id: string, docData: any): Promise<AxiosResponse> =>
    apiClient.put(`/med-documents/${id}`, docData),

  delete: (id: string): Promise<AxiosResponse> =>
    apiClient.delete(`/med-documents/${id}`),
  
  grantDoctorPermission: (documentId: string, doctorIdToPermit: string): Promise<AxiosResponse> =>
    apiClient.post('/med-documents/grant-doctor-permission', { documentId, doctorIdToPermit }),

  revokeDoctorPermission: (documentId: string, doctorIdToRevoke: string): Promise<AxiosResponse> =>
    apiClient.post('/med-documents/revoke-doctor-permission', { documentId, doctorIdToRevoke }),

  grantCheckupCenterPermission: (documentId: string, checkupCenterIdToPermit: string): Promise<AxiosResponse> =>
    apiClient.post('/med-documents/grant-checkupcenter-permission', { documentId, checkupCenterIdToPermit }),

  revokeCheckupCenterPermission: (documentId: string, checkupCenterIdToRevoke: string): Promise<AxiosResponse> =>
    apiClient.post('/med-documents/revoke-checkupcenter-permission', { documentId, checkupCenterIdToRevoke }),
};

// Reviews API
export const reviewsApi = {
  getAll: (params?: any): Promise<AxiosResponse> => 
    apiClient.get('/reviews', { params }),
  
  getById: (id: string): Promise<AxiosResponse> => 
    apiClient.get(`/reviews/${id}`),
  
  create: (reviewData: any): Promise<AxiosResponse> => 
    apiClient.post('/reviews', reviewData),
  
  update: (id: string, reviewData: any): Promise<AxiosResponse> => 
    apiClient.put(`/reviews/${id}`, reviewData),
  
  delete: (id: string): Promise<AxiosResponse> => 
    apiClient.delete(`/reviews/${id}`)
};

// Admin API for User Verification
export interface VerifiableUser {
  id: string; // Actual ID of the entity (Doctor, Clinic, etc.)
  name: string;
  email: string;
  role: string; // User-friendly role name like 'Doctor', 'Clinic'
  entityType: string; // Model name like 'doctor', 'clinic' for API calls
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  // Add any other relevant fields you want to display, e.g., phone, address
  phone?: string;
  userId?: string;
  createdAt?: string; 
}

export interface PatientBasicInfo {
  id: string;
  name: string;
  email: string;
  userId?: string;
  phone?: string;
  city?: string;
  state?: string;
}

export interface MedDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  documentType: string; // PRESCRIPTION | MEDICAL_REPORT
  seekAvailability: boolean;
  patientId: string;
  uploadedById: string;
  uploaderType: string; // Role enum
  permittedDoctorIds: string[];
  permittedCheckupCenterIds: string[];
  description?: string;
  doctorId?: string;
  checkupCenterId?: string;
  patientUploaderId?: string;
  createdAt: string; 
  updatedAt: string;
}

export interface MedDocumentWithPatient extends MedDocument {
  patient?: PatientBasicInfo;
  // medStoreHandRaises?: any[]; // Define more specifically if needed later
}

export const adminApi = {
  getPendingVerifications: (): Promise<AxiosResponse<VerifiableUser[]>> => 
    apiClient.get('/admin/pending-verifications'),

  updateVerificationStatus: (entityType: string, entityId: string, status: 'VERIFIED' | 'REJECTED'): Promise<AxiosResponse> => 
    apiClient.patch(`/admin/verification/${entityType}/${entityId}`, { status }),
};

// Medicine Schedule Interfaces
// NEW: Interface for individual medicine items within a schedule
export interface ScheduledMedicineItem {
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

export interface MedicineSchedule {
  id: string;
  patientId: string;
  patient?: PatientBasicInfo; // Included when fetching lists created by doctor/medstore
  // Removed single medicine fields
  startDate: string; // ISO date string
  numberOfDays: number;
  notes?: string; // Overall schedule notes
  schedulerId: string;
  schedulerType: string; // 'DOCTOR' | 'MEDSTORE'
  items: ScheduledMedicineItem[]; // Array of medicine items
  createdAt: string;
  updatedAt: string;
}

// NEW: Interface for creating/updating individual medicine items
export interface ScheduledMedicineItemData {
  id?: string; // Present if updating an existing item, absent for new one
  medicineName: string;
  dosage: string;
  timesPerDay: number;
  gapBetweenDays: number;
  notes?: string;
}

export type MedicineScheduleCreateData = {
  patientId: string;
  startDate: string | Date; // Allow Date object for creation, will be stringified by API call
  numberOfDays: number;
  notes?: string;
  items: ScheduledMedicineItemData[]; // Array of items to create
};

export type MedicineScheduleUpdateData = {
  patientId?: string;
  startDate?: string | Date;
  numberOfDays?: number;
  notes?: string;
  items?: ScheduledMedicineItemData[]; // Array of items to create, update, or implicitly delete
};

// Medicine Schedules API
export const medicineSchedulesApi = {
  createSchedule: (data: MedicineScheduleCreateData): Promise<AxiosResponse<MedicineSchedule>> =>
    apiClient.post('/medicine-schedules', data),

  getSchedulesForPatient: (patientId: string): Promise<AxiosResponse<MedicineSchedule[]>> =>
    apiClient.get(`/medicine-schedules/patient/${patientId}`),

  getSchedulesByDoctor: (): Promise<AxiosResponse<MedicineSchedule[]>> => // For currently logged-in doctor
    apiClient.get('/medicine-schedules/doctor/mine'),

  getSchedulesByMedStore: (): Promise<AxiosResponse<MedicineSchedule[]>> => // For currently logged-in medstore
    apiClient.get('/medicine-schedules/medstore/mine'),

  updateSchedule: (scheduleId: string, data: MedicineScheduleUpdateData): Promise<AxiosResponse<MedicineSchedule>> =>
    apiClient.put(`/medicine-schedules/${scheduleId}`, data),

  deleteSchedule: (scheduleId: string): Promise<AxiosResponse<void>> =>
    apiClient.delete(`/medicine-schedules/${scheduleId}`),
};

// Rewards and Referrals Types
export interface Referral {
  id: string;
  referrerId: string;
  referrerRole: string;
  referredId: string;
  referredRole: string;
  pointsAwarded: number;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Relations (will be populated when included in response)
  referrerDoctor?: { name: string; userId: string };
  referrerPatient?: { name: string; userId: string };
  referrerHospital?: { name: string; userId: string };
  referrerMedStore?: { name: string; userId: string };
  referrerClinic?: { name: string; userId: string };
  referrerCheckupCenter?: { name: string; userId: string };
  referrerAdmin?: { name: string; userId: string };
  referredDoctor?: { name: string; userId: string };
  referredPatient?: { name: string; userId: string };
  referredHospital?: { name: string; userId: string };
  referredMedStore?: { name: string; userId: string };
  referredClinic?: { name: string; userId: string };
  referredCheckupCenter?: { name: string; userId: string };
  // Service referral fields
  patientId?: string;
  patientDetails?: PatientBasicInfo;
  serviceType?: 'DOCTOR_CONSULT' | 'MEDSTORE_PURCHASE' | 'CHECKUP_SERVICE';
  notes?: string;
  isServiceReferral?: boolean;
}

export interface RewardTransaction {
  id: string;
  userId: string;
  userRole: string;
  points: number;
  transactionType: 'REFERRAL_REWARD' | 'ADMIN_ADJUSTMENT' | 'OTHER';
  description: string;
  referralId?: string;
  createdAt: string;
}

export interface RewardSetting {
  id: string;
  key: string;
  value: number;
  description: string;
  updatedById: string;
  updatedBy?: { name: string };
  createdAt: string;
  updatedAt: string;
}

// Rewards API
export const rewardsApi = {
  // Referral endpoints
  createReferral: (referredUserId: string, referredRole: string): Promise<AxiosResponse<Referral>> =>
    apiClient.post('/rewards/referrals', { referredUserId, referredRole }),
  
  // Service referral endpoints (doctor to doctor, doctor to med store, etc.)
  createServiceReferral: (data: {
    referredId: string, 
    referredRole: string, 
    patientId: string,
    serviceType: 'DOCTOR_CONSULT' | 'MEDSTORE_PURCHASE' | 'CHECKUP_SERVICE',
    notes?: string
  }): Promise<AxiosResponse<Referral>> =>
    apiClient.post('/rewards/service-referrals', data),
  
  completeReferral: (referralId: string): Promise<AxiosResponse<Referral>> =>
    apiClient.put(`/rewards/referrals/${referralId}/complete`),
  
  // Reward endpoints
  getUserPoints: (): Promise<AxiosResponse<{ rewardPoints: number }>> =>
    apiClient.get('/rewards/points'),
  
  getRewardHistory: (limit?: number, offset?: number): Promise<AxiosResponse<{ transactions: RewardTransaction[], totalCount: number }>> =>
    apiClient.get('/rewards/history', { params: { limit, offset } }),
  
  getUserReferrals: (type: 'given' | 'received' = 'given', limit?: number, offset?: number): Promise<AxiosResponse<{ referrals: Referral[], totalCount: number }>> =>
    apiClient.get('/rewards/referrals', { params: { type, limit, offset } }),
  
  // Admin endpoints
  getRewardSettings: (): Promise<AxiosResponse<RewardSetting[]>> =>
    apiClient.get('/rewards/settings'),
  
  updateRewardSetting: (key: string, value: number): Promise<AxiosResponse<RewardSetting>> =>
    apiClient.put('/rewards/settings', { key, value }),
};

// Export the raw axios instance for custom calls
export default apiClient; 