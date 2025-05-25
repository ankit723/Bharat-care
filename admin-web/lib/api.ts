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
        window.location.href = '/login';
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
    apiClient.post('/doctors/remove-patient', { doctorId, patientId })
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
    apiClient.post(`/clinics/${clinicId}/remove-doctor`),

  assignCompounder: (clinicId: string, compounderId: string): Promise<AxiosResponse> => 
    apiClient.post(`/clinics/${clinicId}/assign-compounder`, { compounderId }),

  removeCompounder: (clinicId: string): Promise<AxiosResponse> => 
    apiClient.post(`/clinics/${clinicId}/remove-compounder`)
}

// Compounders API
export const compoundersApi = {
  getAll: (params?: any): Promise<AxiosResponse> => 
    apiClient.get('/compounders', { params }),
  
  getById: (id: string): Promise<AxiosResponse> => 
    apiClient.get(`/compounders/${id}`),
  
  create: (compounderData: any): Promise<AxiosResponse> => 
    apiClient.post('/compounders', compounderData),
  
  update: (id: string, compounderData: any): Promise<AxiosResponse> => 
    apiClient.put(`/compounders/${id}`, compounderData),
  
  delete: (id: string): Promise<AxiosResponse> => 
    apiClient.delete(`/compounders/${id}`),

  assignToHospital: (compounderId: string, hospitalId: string): Promise<AxiosResponse> => 
    apiClient.post('/compounders/assign-hospital', { compounderId, hospitalId }),

  assignToClinic: (compounderId: string, clinicId: string): Promise<AxiosResponse> => 
    apiClient.post('/compounders/assign-clinic', { compounderId, clinicId }),

  assignToMedStore: (compounderId: string, medStoreId: string): Promise<AxiosResponse> => 
    apiClient.post('/compounders/assign-medstore', { compounderId, medStoreId }),

  removeFromClinic: (compounderId: string): Promise<AxiosResponse> => 
    apiClient.post('/compounders/remove-clinic', { compounderId }),

  removeFromMedStore: (compounderId: string): Promise<AxiosResponse> => 
    apiClient.post('/compounders/remove-medstore', { compounderId })
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
    apiClient.delete(`/medstores/${id}`)
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

// Export the raw axios instance for custom calls
export default apiClient; 