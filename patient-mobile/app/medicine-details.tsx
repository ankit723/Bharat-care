import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/authContext';
import { apiService } from '../lib/api';
import { APP_CONFIG } from '../lib/config';
import { MedicineSchedule } from '../lib/types';

export default function MedicineDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { authState } = useAuth();
  const [schedule, setSchedule] = useState<MedicineSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      Alert.alert('Error', 'Invalid medicine schedule ID');
      router.back();
      return;
    }
    fetchScheduleDetails();
  }, [id]);

  const fetchScheduleDetails = async () => {
    try {
      setIsLoading(true);
      // Since we don't have a specific endpoint for individual schedules,
      // we'll get all schedules and filter by ID
      const schedules = await apiService.getMedicineSchedules();
      const foundSchedule = schedules.find((s: MedicineSchedule) => s.id === id);
      
      if (foundSchedule) {
        setSchedule(foundSchedule);
      } else {
        Alert.alert('Error', 'Medicine schedule not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching schedule details:', error);
      Alert.alert('Error', 'Failed to load medicine schedule details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (schedule: MedicineSchedule) => {
    const now = new Date();
    const endDate = new Date(schedule.startDate);
    endDate.setDate(endDate.getDate() + schedule.numberOfDays);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const isScheduleActive = (schedule: MedicineSchedule) => {
    const now = new Date();
    const endDate = new Date(schedule.startDate);
    endDate.setDate(endDate.getDate() + schedule.numberOfDays);
    return endDate > now;
  };

  const getNextDoseTime = (item: any) => {
    // This is a simplified calculation - in a real app, you'd track actual dose times
    const now = new Date();
    const hoursInDay = 24;
    const intervalHours = hoursInDay / item.timesPerDay;
    const nextHour = Math.ceil(now.getHours() / intervalHours) * intervalHours;
    const nextDose = new Date(now);
    nextDose.setHours(nextHour % 24, 0, 0, 0);
    if (nextHour >= 24) {
      nextDose.setDate(nextDose.getDate() + 1);
    }
    return nextDose;
  };

  const handleConfirmMedicine = async (itemId: string) => {
    try {
      const result = await apiService.confirmMedicineTaken(itemId, new Date());
      Alert.alert(
        'Medicine Confirmed!', 
        `You earned ${result.pointsAwarded} reward points!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error confirming medicine:', error);
      Alert.alert('Error', 'Failed to confirm medicine. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color={APP_CONFIG.THEME_COLOR} />
        <Text className="mt-4 text-gray-600">Loading medicine details...</Text>
      </View>
    );
  }

  if (!schedule) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Medicine schedule not found</Text>
      </View>
    );
  }

  const isActive = isScheduleActive(schedule);
  const daysRemaining = getDaysRemaining(schedule);

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
          <Text className="text-white text-xl font-bold flex-1">Medicine Schedule</Text>
        </View>
        
        {/* Schedule Status */}
        <View className="bg-white/20 rounded-xl p-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white/80 text-sm">Schedule Status</Text>
            <View className={`px-3 py-1 rounded-full ${
              isActive ? 'bg-green-500' : 'bg-gray-500'
            }`}>
              <Text className="text-white text-xs font-medium">
                {isActive ? 'Active' : 'Completed'}
              </Text>
            </View>
          </View>
          {isActive && (
            <Text className="text-white text-lg font-semibold">
              {daysRemaining} days remaining
            </Text>
          )}
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Schedule Info */}
        <View className="px-6 py-6">
          <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
            <Text className="text-lg font-semibold text-gray-800 mb-4">Schedule Information</Text>
            
            <View className="space-y-3">
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <View className="ml-3">
                  <Text className="text-sm text-gray-600">Start Date</Text>
                  <Text className="text-base font-medium text-gray-800">
                    {formatDate(schedule.startDate)}
                  </Text>
                </View>
              </View>
              
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={20} color="#6B7280" />
                <View className="ml-3">
                  <Text className="text-sm text-gray-600">Duration</Text>
                  <Text className="text-base font-medium text-gray-800">
                    {schedule.numberOfDays} days
                  </Text>
                </View>
              </View>
              
              <View className="flex-row items-center">
                <Ionicons name="person-outline" size={20} color="#6B7280" />
                <View className="ml-3">
                  <Text className="text-sm text-gray-600">Prescribed by</Text>
                  <Text className="text-base font-medium text-gray-800">
                    {schedule.schedulerType === 'DOCTOR' ? 'Doctor' : 'MedStore'}
                  </Text>
                </View>
              </View>
            </View>
            
            {schedule.notes && (
              <View className="mt-4 pt-4 border-t border-gray-100">
                <Text className="text-sm text-gray-600 mb-2">Schedule Notes</Text>
                <Text className="text-base text-gray-800 italic">"{schedule.notes}"</Text>
              </View>
            )}
          </View>

          {/* Medicine Items */}
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Medicines ({schedule.items.length})
          </Text>
          
          {schedule.items.map((item, index) => (
            <View key={item.id} className="bg-white rounded-xl p-4 mb-4 shadow-sm">
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1 mr-4">
                  <Text className="text-lg font-semibold text-gray-800 mb-1">
                    {item.medicineName}
                  </Text>
                  <Text className="text-sm text-gray-600 mb-2">
                    Dosage: {item.dosage}
                  </Text>
                </View>
                <View className="items-center">
                  <Text className="text-sm text-gray-600">Times per day</Text>
                  <Text 
                    className="text-xl font-bold"
                    style={{ color: APP_CONFIG.THEME_COLOR }}
                  >
                    {item.timesPerDay}
                  </Text>
                </View>
              </View>

              {/* Dosing Schedule */}
              <View className="mb-3">
                <Text className="text-sm font-medium text-gray-700 mb-2">Dosing Schedule</Text>
                <View className="flex-row items-center">
                  <Ionicons name="alarm-outline" size={16} color="#6B7280" />
                  <Text className="text-sm text-gray-600 ml-2">
                    Every {Math.round(24 / item.timesPerDay)} hours
                    {item.gapBetweenDays > 0 && `, with ${item.gapBetweenDays} day gap`}
                  </Text>
                </View>
              </View>

              {/* Next Dose (only for active schedules) */}
              {isActive && (
                <View className="mb-3">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Next Dose</Text>
                  <Text 
                    className="text-sm font-semibold"
                    style={{ color: APP_CONFIG.THEME_COLOR }}
                  >
                    {getNextDoseTime(item).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              )}

              {/* Item Notes */}
              {item.notes && (
                <View className="mb-3 p-3 bg-blue-50 rounded-lg">
                  <Text className="text-sm font-medium text-blue-800 mb-1">Special Instructions</Text>
                  <Text className="text-sm text-blue-700">"{item.notes}"</Text>
                </View>
              )}

              {/* Confirm Button (only for active schedules) */}
              {isActive && (
                <TouchableOpacity
                  onPress={() => handleConfirmMedicine(item.id)}
                  className="mt-3 p-3 rounded-lg"
                  style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
                >
                  <View className="flex-row items-center justify-center">
                    <Ionicons name="checkmark-circle" size={20} color={APP_CONFIG.THEME_COLOR} />
                    <Text 
                      className="ml-2 font-semibold"
                      style={{ color: APP_CONFIG.THEME_COLOR }}
                    >
                      Mark as Taken
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
} 