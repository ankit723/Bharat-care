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
  getAppointments,
  getNextVisits,
  getDoctors,
  getHospitals,
  getMedStores,
  getCheckupCenters,
  getDoctorById,
  getRewardPoints,
  getRewardHistory,
  globalSearch,
  searchMedicines,
  uploadPrescription,
  getMyPrescriptions,
  getHomeRecommendations,
  createGlobalMedicineRequest,
  getMyGlobalMedicineRequests,
} = apiService; 