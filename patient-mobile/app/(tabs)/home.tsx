import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/authContext';
import { apiService } from '../../lib/api';
import { APP_CONFIG } from '../../lib/config';
import { 
  HomeRecommendations, 
  Doctor, 
  MedStore, 
  Hospital, 
  CheckupCenter,
  MedicineReminder,
  Appointment 
} from '../../lib/types';

export default function HomeScreen() {
  const { authState, refreshProfile } = useAuth();
  const [recommendations, setRecommendations] = useState<HomeRecommendations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHomeData = useCallback(async () => {
    try {
      setIsLoading(true);
      // In a real app, you'd have specific endpoints for home recommendations
      const [doctorsRes, hospitalsRes, medStoresRes] = await Promise.all([
        apiService.getDoctors({ limit: 5 }),
        apiService.getHospitals({ limit: 3 }),
        apiService.getMedStores({ limit: 3 }),
      ]);

      setRecommendations({
        doctors: doctorsRes.data || [],
        hospitals: hospitalsRes.data || [],
        medStores: medStoresRes.data || [],
        checkupCenters: [], // Would be fetched from API
        upcomingReminders: [], // Would be fetched from notification service
        todayAppointments: [], // Would be fetched from API
      });
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchHomeData(),
      refreshProfile(),
    ]);
    setRefreshing(false);
  }, [fetchHomeData, refreshProfile]);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const handleCallDoctor = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to make phone call');
    });
  };

  const ProviderCard = ({ 
    provider, 
    type, 
    onPress 
  }: { 
    provider: Doctor | Hospital | MedStore | CheckupCenter; 
    type: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="mr-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100"
      style={{ width: 240 }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View 
          className="w-12 h-12 rounded-xl items-center justify-center"
          style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
        >
          <Ionicons 
            name={
              type === 'doctor' ? 'person' : 
              type === 'hospital' ? 'business' : 
              type === 'medstore' ? 'medical' : 'clipboard'
            } 
            size={24} 
            color={APP_CONFIG.THEME_COLOR} 
          />
        </View>
        {type === 'doctor' && (
          <TouchableOpacity
            onPress={() => handleCallDoctor((provider as Doctor).phone)}
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
          >
            <Ionicons name="call" size={16} color={APP_CONFIG.THEME_COLOR} />
          </TouchableOpacity>
        )}
      </View>
      
      <Text className="text-lg font-semibold text-gray-800 mb-1" numberOfLines={1}>
        {provider.name}
      </Text>
      
      {type === 'doctor' && (
        <Text className="text-sm text-gray-600 mb-2" numberOfLines={1}>
          {(provider as Doctor).specialization}
        </Text>
      )}
      
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name="location" size={14} color="#9CA3AF" />
          <Text className="text-sm text-gray-500 ml-1" numberOfLines={1}>
            {provider.city}, {provider.state}
          </Text>
        </View>
        <View 
          className="px-2 py-1 rounded-full"
          style={{ backgroundColor: `${APP_CONFIG.SUCCESS_COLOR}15` }}
        >
          <Text 
            className="text-xs font-medium"
            style={{ color: APP_CONFIG.SUCCESS_COLOR }}
          >
            Verified
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const QuickActionCard = ({ 
    title, 
    subtitle, 
    icon, 
    color, 
    onPress 
  }: {
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 p-4 rounded-xl mr-3"
      style={{ backgroundColor: `${color}15` }}
    >
      <View 
        className="w-10 h-10 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: `${color}25` }}
      >
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text className="text-base font-semibold text-gray-800 mb-1">
        {title}
      </Text>
      <Text className="text-sm text-gray-600">
        {subtitle}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color={APP_CONFIG.THEME_COLOR} />
        <Text className="mt-4 text-gray-600">Loading recommendations...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      <ScrollView
        className="flex-1"
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
        {/* Header */}
        <View 
          className="px-6 pt-16 pb-6"
          style={{ backgroundColor: APP_CONFIG.THEME_COLOR }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white text-lg font-medium">
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}
              </Text>
              <Text className="text-white text-2xl font-bold">
                {authState.user?.name || 'Patient'}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/profile')}
              className="w-12 h-12 bg-white/20 rounded-full items-center justify-center"
            >
              <Ionicons name="person" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Reward Points */}
          <View className="bg-white/20 rounded-xl p-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white/80 text-sm">Reward Points</Text>
                <Text className="text-white text-2xl font-bold">
                  {authState.user?.rewardPoints || 0}
                </Text>
              </View>
              <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                <Ionicons name="gift" size={24} color="white" />
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 -mt-6 mb-6">
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</Text>
            <View className="flex-row">
              <QuickActionCard
                title="Global Medicine"
                subtitle="Upload prescription"
                icon="document-text"
                color={APP_CONFIG.THEME_COLOR}
                onPress={() => router.push('/global-medicine')}
              />
              <QuickActionCard
                title="Emergency"
                subtitle="24/7 support"
                icon="medical"
                color={APP_CONFIG.ERROR_COLOR}
                onPress={() => Linking.openURL('tel:108')}
              />
            </View>
          </View>
        </View>

        {/* Today's Schedule */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-800">Today's Schedule</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/calendar')}>
              <Text style={{ color: APP_CONFIG.THEME_COLOR }} className="font-medium">
                View All
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Placeholder for medicine reminders and appointments */}
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <View className="flex-row items-center">
              <View 
                className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
              >
                <Ionicons name="medical" size={24} color={APP_CONFIG.THEME_COLOR} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-800">
                  No medicines scheduled for today
                </Text>
                <Text className="text-sm text-gray-600">
                  Check your medicine schedule
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recommended Doctors */}
        {recommendations?.doctors && recommendations.doctors.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between px-6 mb-4">
              <Text className="text-lg font-semibold text-gray-800">Top Doctors</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                <Text style={{ color: APP_CONFIG.THEME_COLOR }} className="font-medium">
                  View All
                </Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 24, paddingRight: 6 }}
            >
              {recommendations.doctors.map((doctor) => (
                <ProviderCard
                  key={doctor.id}
                  provider={doctor}
                  type="doctor"
                  onPress={() => router.push(`/doctor-details?id=${doctor.id}`)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recommended Hospitals */}
        {recommendations?.hospitals && recommendations.hospitals.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between px-6 mb-4">
              <Text className="text-lg font-semibold text-gray-800">Nearby Hospitals</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                <Text style={{ color: APP_CONFIG.THEME_COLOR }} className="font-medium">
                  View All
                </Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 24, paddingRight: 6 }}
            >
              {recommendations.hospitals.map((hospital) => (
                <ProviderCard
                  key={hospital.id}
                  provider={hospital}
                  type="hospital"
                  onPress={() => {/* Navigate to hospital details */}}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recommended MedStores */}
        {recommendations?.medStores && recommendations.medStores.length > 0 && (
          <View className="mb-8">
            <View className="flex-row items-center justify-between px-6 mb-4">
              <Text className="text-lg font-semibold text-gray-800">Medical Stores</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                <Text style={{ color: APP_CONFIG.THEME_COLOR }} className="font-medium">
                  View All
                </Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 24, paddingRight: 6 }}
            >
              {recommendations.medStores.map((store) => (
                <ProviderCard
                  key={store.id}
                  provider={store}
                  type="medstore"
                  onPress={() => {/* Navigate to medstore details */}}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
} 