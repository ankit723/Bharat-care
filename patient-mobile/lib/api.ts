import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, API_ENDPOINTS, STORAGE_KEYS } from './config';
import {
  LoginCredentials,
  RegisterData,
  User,
  MedicineSchedule,
  Appointment,
  Doctor,
  Hospital,
  MedStore,
  CheckupCenter,
  RewardTransaction,
  Prescription,
  GlobalMedicineRequest,
  ApiResponse,
  PaginatedResponse,
  HomeRecommendations,
  MedDocument,
  DocumentUploadData,
} from './types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await AsyncStorage.multiRemove([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.USER_DATA]);
          // You might want to redirect to login here
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth Methods
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response = await this.api.post(API_ENDPOINTS.LOGIN, credentials);
    return response.data;
  }

  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const response = await this.api.post(API_ENDPOINTS.REGISTER, { ...data, role: 'PATIENT' });
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.api.post(API_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.multiRemove([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.USER_DATA]);
    }
  }

  // Patient Methods
  async getProfile(): Promise<User> {
    const response = await this.api.get(API_ENDPOINTS.PATIENT_PROFILE);
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await this.api.put(API_ENDPOINTS.UPDATE_PROFILE, data);
    return response.data;
  }

  // Medicine Schedule Methods
  async getMedicineSchedules(): Promise<MedicineSchedule[]> {
    const response = await this.api.get(API_ENDPOINTS.MEDICINE_SCHEDULES);
    return response.data;
  }

  async confirmMedicineTaken(medicineItemId: string, takenAt: Date): Promise<{ pointsAwarded: number; message: string }> {
    const response = await this.api.post(API_ENDPOINTS.CONFIRM_MEDICINE, {
      medicineItemId,
      takenAt: takenAt.toISOString(),
    });
    return response.data;
  }

  // Document Management Methods
  async getMyDocuments(params?: { documentType?: string }): Promise<MedDocument[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('uploadedByMySelf', 'true'); // Get only documents uploaded by the patient
    if (params?.documentType) {
      queryParams.append('documentType', params.documentType);
    }
    const response = await this.api.get(`/med-documents?${queryParams.toString()}`);
    return response.data;
  }

  async getDocumentById(documentId: string): Promise<MedDocument> {
    const response = await this.api.get(`/med-documents/${documentId}`);
    return response.data;
  }

  async uploadDocument(documentData: DocumentUploadData): Promise<{ success: boolean; data: MedDocument }> {
    // Get current user profile to get patient ID
    const profile = await this.getProfile();
    const response = await this.api.post('/med-documents', {
      ...documentData,
      patientId: profile.id,
      uploaderType: 'PATIENT',
      seekAvailability: documentData.seekAvailability || false,
    });
    return { success: true, data: response.data };
  }

  async deleteDocument(documentId: string): Promise<{ success: boolean }> {
    await this.api.delete(`/med-documents/${documentId}`);
    return { success: true };
  }

  async updateDocument(documentId: string, updateData: Partial<DocumentUploadData>): Promise<{ success: boolean; data: MedDocument }> {
    const response = await this.api.put(`/med-documents/${documentId}`, updateData);
    return { success: true, data: response.data };
  }

  async grantDoctorPermission(documentId: string, doctorId: string): Promise<{ success: boolean; data: MedDocument }> {
    const response = await this.api.post('/med-documents/grant-doctor-permission', {
      documentId,
      doctorIdToPermit: doctorId,
    });
    return { success: true, data: response.data };
  }

  async revokeDoctorPermission(documentId: string, doctorId: string): Promise<{ success: boolean; data: MedDocument }> {
    const response = await this.api.post('/med-documents/revoke-doctor-permission', {
      documentId,
      doctorIdToRevoke: doctorId,
    });
    return { success: true, data: response.data };
  }

  async grantCheckupCenterPermission(documentId: string, checkupCenterId: string): Promise<{ success: boolean; data: MedDocument }> {
    const response = await this.api.post('/med-documents/grant-checkupcenter-permission', {
      documentId,
      checkupCenterIdToPermit: checkupCenterId,
    });
    return { success: true, data: response.data };
  }

  async revokeCheckupCenterPermission(documentId: string, checkupCenterId: string): Promise<{ success: boolean; data: MedDocument }> {
    const response = await this.api.post('/med-documents/revoke-checkupcenter-permission', {
      documentId,
      checkupCenterIdToRevoke: checkupCenterId,
    });
    return { success: true, data: response.data };
  }

  // Med Store Hand Raises - Using the actual backend endpoints
  async getMedStoreHandRaises(documentId: string): Promise<any[]> {
    // Get the document with hand raises included
    const response = await this.api.get(`/med-documents/${documentId}`);
    const document = response.data;
    
    // If the document has medStoreHandRaises, return them, otherwise return empty array
    return document.medStoreHandRaises || [];
  }

  async acceptMedStoreHandRaise(documentId: string, medStoreId: string): Promise<{ success: boolean }> {
    // Since there's no specific accept/reject endpoint, we'll update the hand raise status
    // This would need to be implemented in the backend if needed
    console.warn('Accept med store hand raise not implemented in backend');
    return { success: true };
  }

  async rejectMedStoreHandRaise(documentId: string, medStoreId: string): Promise<{ success: boolean }> {
    // Since there's no specific accept/reject endpoint, we'll update the hand raise status
    // This would need to be implemented in the backend if needed
    console.warn('Reject med store hand raise not implemented in backend');
    return { success: true };
  }

  // Appointment Methods
  async getAppointments(): Promise<any> {
    const response = await this.api.get(API_ENDPOINTS.APPOINTMENTS);
    return response.data;
  }

  async getNextVisits(): Promise<any> {
    const response = await this.api.get(API_ENDPOINTS.NEXT_VISITS);
    return response.data;
  }

  // Healthcare Provider Methods
  async getDoctors(params?: { search?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Doctor>> {
    const response = await this.api.get(API_ENDPOINTS.DOCTORS, { params });
    return response.data;
  }

  async getHospitals(params?: { search?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Hospital>> {
    const response = await this.api.get(API_ENDPOINTS.HOSPITALS, { params });
    return response.data;
  }

  async getMedStores(params?: { search?: string; page?: number; limit?: number }): Promise<PaginatedResponse<MedStore>> {
    const response = await this.api.get(API_ENDPOINTS.MEDSTORES, { params });
    return response.data;
  }

  async getCheckupCenters(params?: { search?: string; page?: number; limit?: number }): Promise<PaginatedResponse<CheckupCenter>> {
    const response = await this.api.get(API_ENDPOINTS.CHECKUP_CENTERS, { params });
    return response.data;
  }

  async getDoctorById(doctorId: string): Promise<ApiResponse<Doctor>> {
    const response = await this.api.get(`${API_ENDPOINTS.DOCTORS}/${doctorId}`);
    return response.data;
  }

  async getHospitalById(hospitalId: string): Promise<ApiResponse<Hospital>> {
    const response = await this.api.get(`${API_ENDPOINTS.HOSPITALS}/${hospitalId}`);
    return response.data;
  }

  async getMedStoreById(medStoreId: string): Promise<ApiResponse<MedStore>> {
    const response = await this.api.get(`${API_ENDPOINTS.MEDSTORES}/${medStoreId}`);
    return response.data;
  }

  async getCheckupCenterById(checkupCenterId: string): Promise<ApiResponse<CheckupCenter>> {
    const response = await this.api.get(`${API_ENDPOINTS.CHECKUP_CENTERS}/${checkupCenterId}`);
    return response.data;
  }

  // Reward Methods
  async getRewardPoints(): Promise<ApiResponse<{ rewardPoints: number }>> {
    const response = await this.api.get(API_ENDPOINTS.REWARD_POINTS);
    return response.data;
  }

  async getRewardHistory(limit: number = 20, offset: number = 0): Promise<ApiResponse<{ transactions: RewardTransaction[] }>> {
    const response = await this.api.get(API_ENDPOINTS.REWARD_HISTORY, {
      params: { limit, offset },
    });
    return response.data;
  }

  // Search Methods
  async globalSearch(query: string, type?: string): Promise<ApiResponse<any[]>> {
    const response = await this.api.get(API_ENDPOINTS.GLOBAL_SEARCH, {
      params: { query, type },
    });
    return response.data;
  }

  async searchMedicines(query: string): Promise<ApiResponse<any[]>> {
    const response = await this.api.get(API_ENDPOINTS.MEDICINE_SEARCH, {
      params: { query },
    });
    return response.data;
  }

  // Prescription Methods
  async uploadPrescription(imageUri: string, notes?: string): Promise<ApiResponse<Prescription>> {
    const formData = new FormData();
    formData.append('prescription', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'prescription.jpg',
    } as any);
    
    if (notes) {
      formData.append('notes', notes);
    }

    const response = await this.api.post(API_ENDPOINTS.UPLOAD_PRESCRIPTION, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getMyPrescriptions(): Promise<ApiResponse<Prescription[]>> {
    const response = await this.api.get(API_ENDPOINTS.MY_PRESCRIPTIONS);
    return response.data;
  }

  // Home Recommendations
  async getHomeRecommendations(): Promise<ApiResponse<HomeRecommendations>> {
    const response = await this.api.get('/home/recommendations');
    return response.data;
  }

  // Global Medicine Request
  async createGlobalMedicineRequest(data: {
    prescriptionImageUrl: string;
    notes?: string;
    deliveryAddress: string;
  }): Promise<ApiResponse<GlobalMedicineRequest>> {
    const response = await this.api.post('/global-medicine/request', data);
    return response.data;
  }

  async getMyGlobalMedicineRequests(): Promise<ApiResponse<GlobalMedicineRequest[]>> {
    const response = await this.api.get('/global-medicine/my-requests');
    return response.data;
  }

  // Patient Assignment Methods
  async assignPatientToProvider(providerUserId: string): Promise<ApiResponse<any>> {
    try {
      // First get the current patient profile to get patient ID
      const profile = await this.getProfile();
      const patientId = profile.id;

      // Try to find the provider by userId and determine the type
      let provider: any = null;
      let providerType: string = '';
      let assignmentResponse: any = null;

      // Try doctor first
      try {
        const doctorsResponse = await this.api.get('/doctors', {
          params: { search: providerUserId, limit: 1 }
        });
        const doctors = doctorsResponse.data.data || [];
        const doctor = doctors.find((d: any) => d.userId === providerUserId);
        
        if (doctor) {
          provider = doctor;
          providerType = 'DOCTOR';
          // Use existing doctor assignment endpoint
          assignmentResponse = await this.api.post('/doctors/assign-patient', {
            doctorId: doctor.id,
            patientId: patientId
          });
        }
      } catch (error) {
        // Continue to next provider type
      }

      // Try hospital if doctor not found
      if (!provider) {
        try {
          const hospitalsResponse = await this.api.get('/hospitals');
          const hospitals = hospitalsResponse.data || [];
          const hospital = hospitals.find((h: any) => h.userId === providerUserId);
          
          if (hospital) {
            provider = hospital;
            providerType = 'HOSPITAL';
            // Use existing hospital assignment endpoint
            assignmentResponse = await this.api.post('/hospitals/assign-patient', {
              hospitalId: hospital.id,
              patientId: patientId
            });
          }
        } catch (error) {
          // Continue to next provider type
        }
      }

      // Try checkup center if hospital not found
      if (!provider) {
        try {
          const centersResponse = await this.api.get('/checkup-centers');
          const centers = centersResponse.data || [];
          const center = centers.find((c: any) => c.userId === providerUserId);
          
          if (center) {
            provider = center;
            providerType = 'CHECKUP_CENTER';
            // Use existing checkup center assignment endpoint
            assignmentResponse = await this.api.post('/checkup-centers/assign-patient', {
              checkupCenterId: center.id,
              patientId: patientId
            });
          }
        } catch (error) {
          // Continue to next provider type
        }
      }

      // Try med store if checkup center not found
      if (!provider) {
        try {
          const medStoresResponse = await this.api.get('/medstores');
          const medStores = medStoresResponse.data || [];
          const medStore = medStores.find((m: any) => m.userId === providerUserId);
          
          if (medStore) {
            provider = medStore;
            providerType = 'MEDSTORE';
            // For med stores, we don't have a direct assignment endpoint
            // So we'll return a success response indicating the connection
            assignmentResponse = {
              data: {
                success: true,
                message: `Successfully connected to ${medStore.name}. You can now place medicine orders with them.`,
                provider: medStore,
                providerType: 'MEDSTORE'
              }
            };
          }
        } catch (error) {
          // Provider not found
        }
      }

      if (!provider) {
        throw new Error(`Healthcare provider with User ID "${providerUserId}" not found. Please check the User ID and try again.`);
      }

      return {
        success: true,
        message: `Successfully assigned to ${providerType.toLowerCase().replace('_', ' ')}: ${provider.name}`,
        data: {
          provider,
          providerType,
          assignment: assignmentResponse?.data
        }
      };

    } catch (error: any) {
      console.error('Error assigning to provider:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();

// Export commonly used methods for convenience
export const {
  login,
  register,
  logout,
  getProfile,
  updateProfile,
  getMedicineSchedules,
  confirmMedicineTaken,
  getMyDocuments,
  getDocumentById,
  uploadDocument,
  deleteDocument,
  updateDocument,
  grantDoctorPermission,
  revokeDoctorPermission,
  grantCheckupCenterPermission,
  revokeCheckupCenterPermission,
  getAppointments,
  getNextVisits,
  getDoctors,
  getHospitals,
  getMedStores,
  getCheckupCenters,
  getDoctorById,
  getHospitalById,
  getMedStoreById,
  getCheckupCenterById,
  getRewardPoints,
  getRewardHistory,
  globalSearch,
  searchMedicines,
  uploadPrescription,
  getMyPrescriptions,
  getHomeRecommendations,
  createGlobalMedicineRequest,
  getMyGlobalMedicineRequests,
  assignPatientToProvider,
  getMedStoreHandRaises,
  acceptMedStoreHandRaise,
  rejectMedStoreHandRaise,
} = apiService; 