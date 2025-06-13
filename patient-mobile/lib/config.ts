// Configuration constants for the BharatCare Patient App

export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://192.168.1.10:9001/api' // Development
    : 'https://your-production-api.com/api', // Production
  TIMEOUT: 30000,
};

export const SUPABASE_CONFIG = {
  URL: 'your-supabase-url',
  ANON_KEY: 'your-supabase-anon-key',
  BUCKET_NAME: 'documents',
};

export const APP_CONFIG = {
  APP_NAME: 'BharatCare Patient',
  VERSION: '1.0.0',
  THEME_COLOR: '#10B981', // Primary green color from the design
  SECONDARY_COLOR: '#059669',
  ACCENT_COLOR: '#34D399',
  ERROR_COLOR: '#EF4444',
  WARNING_COLOR: '#F59E0B',
  SUCCESS_COLOR: '#10B981',
};

export const NOTIFICATION_CONFIG = {
  MEDICINE_CHANNEL_ID: 'medicine-reminders',
  APPOINTMENT_CHANNEL_ID: 'appointment-reminders',
  ALARM_SOUND: 'alarm.wav',
  VIBRATION_PATTERN: [0, 250, 250, 250],
  GRACE_PERIOD_MINUTES: 30,
  REWARD_POINTS_PER_MEDICINE: 5,
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  SETTINGS: 'app_settings',
  OFFLINE_DATA: 'offline_data',
};

export const SCREEN_NAMES = {
  HOME: 'Home',
  PROFILE: 'Profile',
  MEDICINES: 'Medicines',
  APPOINTMENTS: 'Appointments',
  CALENDAR: 'Calendar',
  SEARCH: 'Search',
  LOGIN: 'Login',
  REGISTER: 'Register',
  ALARM: 'Alarm',
  DOCTOR_DETAILS: 'DoctorDetails',
  GLOBAL_MEDICINE: 'GlobalMedicine',
} as const;

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh',
  LOGOUT: '/auth/logout',
  CURRENT_USER: '/auth/me',
  
  // Patient endpoints
  PATIENT_PROFILE: '/patients/profile',
  UPDATE_PROFILE: '/patients/update',
  
  // Medicine schedule endpoints
  MEDICINE_SCHEDULES: '/medicine-schedules/patient',
  CONFIRM_MEDICINE: '/medicine-schedules/confirm',
  
  // Appointment endpoints
  APPOINTMENTS: '/appointments',
  NEXT_VISITS: '/appointments/next-visits',
  
  // Healthcare provider endpoints
  DOCTORS: '/doctors',
  HOSPITALS: '/hospitals',
  MEDSTORES: '/medstores',
  CHECKUP_CENTERS: '/checkup-centers',
  
  // Reward endpoints
  REWARD_POINTS: '/rewards/points',
  REWARD_HISTORY: '/rewards/history',
  
  // Search endpoints
  GLOBAL_SEARCH: '/search/global',
  MEDICINE_SEARCH: '/search/medicines',
  
  // Prescription endpoints
  UPLOAD_PRESCRIPTION: '/prescriptions/upload',
  MY_PRESCRIPTIONS: '/prescriptions/my',
} as const; 