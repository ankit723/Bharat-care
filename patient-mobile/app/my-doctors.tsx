import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/authContext';
import { apiService } from '../lib/api';
import { APP_CONFIG } from '../lib/config';

interface Doctor {
  id: string;
  userId: string;
  name: string;
  specialization: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  verificationStatus: string;
}

export default function MyDoctorsScreen() {
  const { authState } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [checkupCenters, setCheckupCenters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPatientProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const profile = await apiService.getProfile();
      
      setDoctors(profile.doctors || []);
      setHospitals(profile.hospitals || []);
      setCheckupCenters(profile.checkupCenters || []);
    } catch (error) {
      console.error('Error fetching patient profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPatientProfile();
    setRefreshing(false);
  }, [fetchPatientProfile]);

  useEffect(() => {
    fetchPatientProfile();
  }, [fetchPatientProfile]);

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const DoctorCard = ({ doctor }: { doctor: Doctor }) => (
    <TouchableOpacity
      onPress={() => {
        // Navigate to doctor details
        router.push(`/doctor-details?id=${doctor.id}`);
      }}
      className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-4">
          <Text className="text-lg font-semibold text-gray-800 mb-1">
            Dr. {doctor.name}
          </Text>
          <Text className="text-sm text-gray-600 mb-2">
            {doctor.specialization}
          </Text>
          <View className="flex-row items-center mb-1">
            <Ionicons name="location-outline" size={14} color="#9CA3AF" />
            <Text className="text-sm text-gray-500 ml-1">
              {doctor.city}, {doctor.state}
            </Text>
          </View>
        </View>
        
        <View className={`px-3 py-1 rounded-full ${
          doctor.verificationStatus === 'VERIFIED' 
            ? 'bg-green-100' 
            : 'bg-yellow-100'
        }`}>
          <Text className={`text-xs font-medium ${
            doctor.verificationStatus === 'VERIFIED'
              ? 'text-green-700' 
              : 'text-yellow-700'
          }`}>
            {doctor.verificationStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
        <TouchableOpacity
          onPress={() => handleCall(doctor.phone)}
          className="flex-row items-center px-4 py-2 rounded-lg"
          style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
        >
          <Ionicons name="call-outline" size={16} color={APP_CONFIG.THEME_COLOR} />
          <Text 
            className="ml-2 text-sm font-medium"
            style={{ color: APP_CONFIG.THEME_COLOR }}
          >
            Call
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleEmail(doctor.email)}
          className="flex-row items-center px-4 py-2 rounded-lg bg-gray-100"
        >
          <Ionicons name="mail-outline" size={16} color="#6B7280" />
          <Text className="ml-2 text-sm font-medium text-gray-600">
            Email
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            // Navigate to doctor details
            router.push(`/doctor-details?id=${doctor.id}`);
          }}
          className="flex-row items-center px-4 py-2 rounded-lg bg-blue-100"
        >
          <Ionicons name="information-circle-outline" size={16} color="#3B82F6" />
          <Text className="ml-2 text-sm font-medium text-blue-600">
            Details
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const ProviderCard = ({ provider, type }: { provider: any; type: 'hospital' | 'checkup' }) => (
    <TouchableOpacity
      className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-4">
          <Text className="text-lg font-semibold text-gray-800 mb-1">
            {provider.name}
          </Text>
          <Text className="text-sm text-gray-600 mb-2">
            {type === 'hospital' ? 'Hospital' : 'Checkup Center'}
          </Text>
          <View className="flex-row items-center mb-1">
            <Ionicons name="location-outline" size={14} color="#9CA3AF" />
            <Text className="text-sm text-gray-500 ml-1">
              {provider.city}, {provider.state}
            </Text>
          </View>
        </View>
        
        <View className={`px-3 py-1 rounded-full ${
          provider.verificationStatus === 'VERIFIED' 
            ? 'bg-green-100' 
            : 'bg-yellow-100'
        }`}>
          <Text className={`text-xs font-medium ${
            provider.verificationStatus === 'VERIFIED'
              ? 'text-green-700' 
              : 'text-yellow-700'
          }`}>
            {provider.verificationStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
        <TouchableOpacity
          onPress={() => handleCall(provider.phone)}
          className="flex-row items-center px-4 py-2 rounded-lg"
          style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
        >
          <Ionicons name="call-outline" size={16} color={APP_CONFIG.THEME_COLOR} />
          <Text 
            className="ml-2 text-sm font-medium"
            style={{ color: APP_CONFIG.THEME_COLOR }}
          >
            Call
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleEmail(provider.email)}
          className="flex-row items-center px-4 py-2 rounded-lg bg-gray-100"
        >
          <Ionicons name="mail-outline" size={16} color="#6B7280" />
          <Text className="ml-2 text-sm font-medium text-gray-600">
            Email
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color={APP_CONFIG.THEME_COLOR} />
        <Text className="mt-4 text-gray-600">Loading your healthcare providers...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="light" />
      
      {/* Header */}
      <View 
        className="px-6 pt-16 pb-6"
        style={{ backgroundColor: APP_CONFIG.THEME_COLOR }}
      >
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 p-2 rounded-full"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold flex-1">My Healthcare Providers</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={APP_CONFIG.THEME_COLOR}
            colors={[APP_CONFIG.THEME_COLOR]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="py-6">
          {/* Doctors Section */}
          {doctors.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-800 mb-4">
                My Doctors ({doctors.length})
              </Text>
              {doctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </View>
          )}

          {/* Hospitals Section */}
          {hospitals.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-800 mb-4">
                My Hospitals ({hospitals.length})
              </Text>
              {hospitals.map((hospital) => (
                <ProviderCard key={hospital.id} provider={hospital} type="hospital" />
              ))}
            </View>
          )}

          {/* Checkup Centers Section */}
          {checkupCenters.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-800 mb-4">
                My Checkup Centers ({checkupCenters.length})
              </Text>
              {checkupCenters.map((center) => (
                <ProviderCard key={center.id} provider={center} type="checkup" />
              ))}
            </View>
          )}

          {/* Empty State */}
          {doctors.length === 0 && hospitals.length === 0 && checkupCenters.length === 0 && (
            <View className="flex-1 justify-center items-center py-20">
              <View 
                className="w-20 h-20 rounded-full items-center justify-center mb-6"
                style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
              >
                <Ionicons name="medical-outline" size={32} color={APP_CONFIG.THEME_COLOR} />
              </View>
              <Text className="text-xl font-semibold text-gray-800 mb-2">
                No Healthcare Providers
              </Text>
              <Text className="text-gray-600 text-center px-8 mb-6">
                You haven't been assigned to any doctors or healthcare providers yet.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/search')}
                className="px-6 py-3 rounded-xl"
                style={{ backgroundColor: APP_CONFIG.THEME_COLOR }}
              >
                <Text className="text-white font-semibold">Find Healthcare Providers</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
} 