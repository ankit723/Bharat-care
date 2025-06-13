import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/authContext';
import { apiService } from '../../lib/api';
import { APP_CONFIG } from '../../lib/config';
import { 
  MedicineSchedule, 
  MedicineItem,
  MedicineReminder,
} from '../../lib/types';

export default function MedicinesScreen() {
  const { authState } = useAuth();
  const [schedules, setSchedules] = useState<MedicineSchedule[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<MedicineReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'active' | 'history'>('active');

  const fetchMedicineData = useCallback(async () => {
    try {
      setIsLoading(true);
      const schedulesData = await apiService.getMedicineSchedules();
      
      setSchedules(schedulesData || []);
      // TODO: Fetch upcoming reminders from notification service
      setUpcomingReminders([]);
    } catch (error) {
      console.error('Error fetching medicine data:', error);
      Alert.alert('Error', 'Failed to load medicine schedules');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMedicineData();
    setRefreshing(false);
  }, [fetchMedicineData]);

  useEffect(() => {
    fetchMedicineData();
  }, [fetchMedicineData]);

  const getActiveSchedules = () => {
    const now = new Date();
    return schedules.filter(schedule => {
      const endDate = new Date(schedule.startDate);
      endDate.setDate(endDate.getDate() + schedule.numberOfDays);
      return endDate > now;
    });
  };

  const getCompletedSchedules = () => {
    const now = new Date();
    return schedules.filter(schedule => {
      const endDate = new Date(schedule.startDate);
      endDate.setDate(endDate.getDate() + schedule.numberOfDays);
      return endDate <= now;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
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

  const ScheduleCard = ({ schedule }: { schedule: MedicineSchedule }) => {
    const isActive = selectedTab === 'active';
    const daysRemaining = getDaysRemaining(schedule);
    
    return (
      <TouchableOpacity
        onPress={() => {
          // Navigate to schedule details
          router.push(`/medicine-details?id=${schedule.id}`);
        }}
        className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100"
      >
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800 mb-1">
              {schedule.items.length === 1 
                ? schedule.items[0].medicineName 
                : `${schedule.items.length} Medicines`
              }
            </Text>
            <Text className="text-sm text-gray-600">
              {schedule.schedulerType === 'DOCTOR' ? 'Prescribed by Doctor' : 'MedStore Recommendation'}
            </Text>
          </View>
          
          <View className={`px-3 py-1 rounded-full ${
            isActive 
              ? 'bg-green-100' 
              : 'bg-gray-100'
          }`}>
            <Text className={`text-xs font-medium ${
              isActive ? 'text-green-700' : 'text-gray-600'
            }`}>
              {isActive ? 'Active' : 'Completed'}
            </Text>
          </View>
        </View>

        {/* Medicine items preview */}
        <View className="mb-3">
          {schedule.items.slice(0, 2).map((item, index) => (
            <View key={item.id} className="flex-row items-center py-1">
              <View 
                className="w-2 h-2 rounded-full mr-3"
                style={{ backgroundColor: APP_CONFIG.THEME_COLOR }}
              />
              <Text className="text-sm text-gray-700 flex-1">
                {item.medicineName} - {item.dosage}
              </Text>
              <Text className="text-xs text-gray-500">
                {item.timesPerDay}x daily
              </Text>
            </View>
          ))}
          {schedule.items.length > 2 && (
            <Text className="text-xs text-gray-500 ml-5">
              +{schedule.items.length - 2} more medicines
            </Text>
          )}
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
            <Text className="text-sm text-gray-500 ml-1">
              Started {formatDate(schedule.startDate)}
            </Text>
          </View>
          
          {isActive && (
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={14} color={APP_CONFIG.THEME_COLOR} />
              <Text 
                className="text-sm font-medium ml-1"
                style={{ color: APP_CONFIG.THEME_COLOR }}
              >
                {daysRemaining} days left
              </Text>
            </View>
          )}
        </View>

        {schedule.notes && (
          <View className="mt-3 pt-3 border-t border-gray-100">
            <Text className="text-sm text-gray-600 italic">
              "{schedule.notes}"
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const UpcomingReminderCard = ({ reminder }: { reminder: MedicineReminder }) => (
    <View className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 mr-4" style={{ width: 240 }}>
      <View className="flex-row items-center justify-between mb-2">
        <View 
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: APP_CONFIG.THEME_COLOR }}
        >
          <Ionicons name="medical" size={20} color="white" />
        </View>
        <Text className="text-xs text-gray-600">
          {new Date(reminder.scheduledTime).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      
      <Text className="text-base font-semibold text-gray-800 mb-1">
        {reminder.medicineName}
      </Text>
      <Text className="text-sm text-gray-600">
        {reminder.dosage}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color={APP_CONFIG.THEME_COLOR} />
        <Text className="mt-4 text-gray-600">Loading medicines...</Text>
      </View>
    );
  }

  const activeSchedules = getActiveSchedules();
  const completedSchedules = getCompletedSchedules();
  const currentSchedules = selectedTab === 'active' ? activeSchedules : completedSchedules;

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View 
        className="px-6 pt-16 pb-6"
        style={{ backgroundColor: APP_CONFIG.THEME_COLOR }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-2xl font-bold">My Medicines</Text>
            <Text className="text-white/80 text-base">
              {activeSchedules.length} active schedule{activeSchedules.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => {
              // Navigate to add medicine or global medicine search
              router.push('/(tabs)/search');
            }}
            className="w-12 h-12 bg-white/20 rounded-full items-center justify-center"
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

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
        {/* Today's Reminders */}
        {upcomingReminders.length > 0 && (
          <View className="mb-6">
            <View className="px-6 mb-4">
              <Text className="text-lg font-semibold text-gray-800">Today's Reminders</Text>
              <Text className="text-sm text-gray-600">Upcoming doses for today</Text>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 24, paddingRight: 6 }}
            >
              {upcomingReminders.map((reminder) => (
                <UpcomingReminderCard key={reminder.id} reminder={reminder} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick Stats */}
        <View className="px-6 mb-6">
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text 
                  className="text-2xl font-bold"
                  style={{ color: APP_CONFIG.THEME_COLOR }}
                >
                  {activeSchedules.length}
                </Text>
                <Text className="text-sm text-gray-600">Active</Text>
              </View>
              <View className="items-center">
                <Text 
                  className="text-2xl font-bold"
                  style={{ color: APP_CONFIG.SUCCESS_COLOR }}
                >
                  {completedSchedules.length}
                </Text>
                <Text className="text-sm text-gray-600">Completed</Text>
              </View>
              <View className="items-center">
                <Text 
                  className="text-2xl font-bold"
                  style={{ color: APP_CONFIG.WARNING_COLOR }}
                >
                  {schedules.reduce((total, schedule) => total + schedule.items.length, 0)}
                </Text>
                <Text className="text-sm text-gray-600">Total Medicines</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tab Selector */}
        <View className="px-6 mb-4">
          <View className="bg-gray-100 rounded-xl p-1 flex-row">
            <TouchableOpacity
              onPress={() => setSelectedTab('active')}
              className={`flex-1 py-3 rounded-lg items-center ${
                selectedTab === 'active' ? 'bg-white shadow-sm' : ''
              }`}
            >
              <Text className={`font-medium ${
                selectedTab === 'active' ? 'text-gray-800' : 'text-gray-600'
              }`}>
                Active ({activeSchedules.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedTab('history')}
              className={`flex-1 py-3 rounded-lg items-center ${
                selectedTab === 'history' ? 'bg-white shadow-sm' : ''
              }`}
            >
              <Text className={`font-medium ${
                selectedTab === 'history' ? 'text-gray-800' : 'text-gray-600'
              }`}>
                History ({completedSchedules.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Medicine Schedules */}
        <View className="px-6 pb-8">
          {currentSchedules.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <View 
                className="w-16 h-16 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
              >
                <Ionicons 
                  name="medical-outline" 
                  size={32} 
                  color={APP_CONFIG.THEME_COLOR} 
                />
              </View>
              <Text className="text-lg font-semibold text-gray-800 mb-2">
                {selectedTab === 'active' ? 'No Active Medicines' : 'No Medicine History'}
              </Text>
              <Text className="text-gray-600 text-center mb-4">
                {selectedTab === 'active' 
                  ? 'You don\'t have any active medicine schedules.'
                  : 'You haven\'t completed any medicine schedules yet.'
                }
              </Text>
              {selectedTab === 'active' && (
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/search')}
                  className="px-6 py-3 rounded-xl"
                  style={{ backgroundColor: APP_CONFIG.THEME_COLOR }}
                >
                  <Text className="text-white font-semibold">Find Medicines</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            currentSchedules.map((schedule) => (
              <ScheduleCard key={schedule.id} schedule={schedule} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
} 