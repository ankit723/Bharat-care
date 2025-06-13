import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Vibration,
  BackHandler,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../lib/authContext';
import { notificationService } from '../lib/notificationService';
import { APP_CONFIG, NOTIFICATION_CONFIG } from '../lib/config';
import { AlarmData, MedicineReminder, Appointment } from '../lib/types';

export default function AlarmScreen() {
  const { authState } = useAuth();
  const params = useLocalSearchParams();
  const [alarmData, setAlarmData] = useState<AlarmData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [gracePeriodRemaining, setGracePeriodRemaining] = useState<number>(0);

  useEffect(() => {
    loadAlarmData();
    
    // Prevent back button from dismissing alarm
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    
    // Start vibration pattern
    Vibration.vibrate(NOTIFICATION_CONFIG.VIBRATION_PATTERN, true);
    
    // Haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    return () => {
      backHandler.remove();
      Vibration.cancel();
    };
  }, []);

  useEffect(() => {
    if (alarmData && alarmData.type === 'MEDICINE') {
      // Start grace period countdown
      const gracePeriodMs = NOTIFICATION_CONFIG.GRACE_PERIOD_MINUTES * 60 * 1000;
      setGracePeriodRemaining(gracePeriodMs);
      
      const interval = setInterval(() => {
        setGracePeriodRemaining(prev => {
          if (prev <= 1000) {
            clearInterval(interval);
            handleMissedMedicine();
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [alarmData]);

  const loadAlarmData = async () => {
    try {
      // Try to get alarm data from params first, then from storage
      if (params.alarmData) {
        const data = JSON.parse(params.alarmData as string) as AlarmData;
        setAlarmData(data);
      } else {
        const storedAlarm = await AsyncStorage.getItem('current_alarm');
        if (storedAlarm) {
          const data = JSON.parse(storedAlarm) as AlarmData;
          setAlarmData(data);
        } else {
          // No alarm data found, go back
          router.back();
          return;
        }
      }
    } catch (error) {
      console.error('Error loading alarm data:', error);
      Alert.alert('Error', 'Failed to load alarm data');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmMedicine = async () => {
    if (!alarmData || alarmData.type !== 'MEDICINE') return;
    
    setIsConfirming(true);
    try {
      const medicineReminder = alarmData.data as MedicineReminder;
      const pointsAwarded = await notificationService.confirmMedicine(medicineReminder.medicineItemId);
      
      Alert.alert(
        'Medicine Confirmed! 🎉',
        `Great job! You earned ${pointsAwarded} reward points for taking your medicine on time.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error confirming medicine:', error);
      Alert.alert(
        'Error',
        'Failed to confirm medicine. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsConfirming(false);
    }
  };

  const handleMissedMedicine = () => {
    Alert.alert(
      'Medicine Missed ⏰',
      'You missed the 30-minute window to take your medicine. No reward points will be awarded.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleDismissAlarm = () => {
    if (alarmData?.type === 'APPOINTMENT') {
      // Appointments can be dismissed immediately
      notificationService.stopAlarm();
      router.back();
    } else {
      // Medicine alarms require confirmation or missing
      Alert.alert(
        'Confirm Action',
        'Are you sure you want to dismiss this medicine reminder? You will not receive reward points.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Dismiss', 
            style: 'destructive',
            onPress: () => {
              notificationService.stopAlarm();
              router.back();
            }
          }
        ]
      );
    }
  };

  const formatGracePeriod = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-red-500">
        <ActivityIndicator size="large" color="white" />
        <Text className="text-white text-lg mt-4">Loading alarm...</Text>
      </View>
    );
  }

  if (!alarmData) {
    return (
      <View className="flex-1 justify-center items-center bg-red-500">
        <Text className="text-white text-xl">No alarm data found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 px-6 py-3 bg-white rounded-xl"
        >
          <Text className="text-red-500 font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isMedicineAlarm = alarmData.type === 'MEDICINE';
  const medicineData = isMedicineAlarm ? alarmData.data as MedicineReminder : null;
  const appointmentData = !isMedicineAlarm ? alarmData.data as Appointment : null;

  return (
    <View 
      className="flex-1"
      style={{ 
        backgroundColor: isMedicineAlarm ? APP_CONFIG.THEME_COLOR : APP_CONFIG.WARNING_COLOR 
      }}
    >
      <StatusBar style="light" />
      
      {/* Alarm Icon */}
      <View className="flex-1 justify-center items-center px-8">
        <View className="items-center mb-8">
          <View className="w-32 h-32 bg-white/20 rounded-full items-center justify-center mb-6">
            <Ionicons 
              name={isMedicineAlarm ? "medical" : "calendar"} 
              size={60} 
              color="white" 
            />
          </View>
          
          <Text className="text-white text-3xl font-bold text-center mb-2">
            {alarmData.title}
          </Text>
          
          <Text className="text-white/90 text-lg text-center mb-4">
            {alarmData.subtitle}
          </Text>
          
          <Text className="text-white/80 text-base text-center">
            {alarmData.time}
          </Text>
        </View>

        {/* Medicine specific details */}
        {isMedicineAlarm && medicineData && (
          <View className="bg-white/20 rounded-xl p-6 mb-8 w-full">
            <Text className="text-white font-semibold text-lg mb-3">Medicine Details</Text>
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-white/80">Dosage:</Text>
                <Text className="text-white font-medium">{medicineData.dosage}</Text>
              </View>
              {medicineData.notes && (
                <View className="flex-row justify-between">
                  <Text className="text-white/80">Notes:</Text>
                  <Text className="text-white font-medium flex-1 text-right ml-4">
                    {medicineData.notes}
                  </Text>
                </View>
              )}
              <View className="flex-row justify-between">
                <Text className="text-white/80">Reward Points:</Text>
                <Text className="text-white font-bold">
                  +{NOTIFICATION_CONFIG.REWARD_POINTS_PER_MEDICINE} points
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Grace period countdown for medicine */}
        {isMedicineAlarm && gracePeriodRemaining > 0 && (
          <View className="bg-white/20 rounded-xl p-4 mb-8 w-full">
            <Text className="text-white/80 text-center text-sm mb-1">
              Grace period remaining
            </Text>
            <Text className="text-white text-2xl font-bold text-center">
              {formatGracePeriod(gracePeriodRemaining)}
            </Text>
          </View>
        )}

        {/* Appointment specific details */}
        {!isMedicineAlarm && appointmentData && (
          <View className="bg-white/20 rounded-xl p-6 mb-8 w-full">
            <Text className="text-white font-semibold text-lg mb-3">Appointment Details</Text>
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-white/80">Date:</Text>
                <Text className="text-white font-medium">{appointmentData.appointmentDate}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-white/80">Time:</Text>
                <Text className="text-white font-medium">{appointmentData.appointmentTime}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-white/80">Type:</Text>
                <Text className="text-white font-medium">{appointmentData.providerType}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View className="px-8 pb-12">
        {isMedicineAlarm ? (
          <View className="space-y-4">
            <TouchableOpacity
              onPress={handleConfirmMedicine}
              disabled={isConfirming || gracePeriodRemaining <= 0}
              className="bg-white rounded-xl py-4 items-center justify-center"
              style={{ 
                opacity: (isConfirming || gracePeriodRemaining <= 0) ? 0.6 : 1 
              }}
            >
              {isConfirming ? (
                <ActivityIndicator color={APP_CONFIG.THEME_COLOR} />
              ) : (
                <>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={24} 
                    color={APP_CONFIG.THEME_COLOR} 
                  />
                  <Text 
                    className="text-xl font-bold mt-2"
                    style={{ color: APP_CONFIG.THEME_COLOR }}
                  >
                    I Took My Medicine
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleDismissAlarm}
              className="bg-white/20 border border-white/40 rounded-xl py-4 items-center justify-center"
            >
              <Text className="text-white text-lg font-semibold">
                Dismiss Reminder
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleDismissAlarm}
            className="bg-white rounded-xl py-4 items-center justify-center"
          >
            <Ionicons 
              name="checkmark-circle" 
              size={24} 
              color={APP_CONFIG.WARNING_COLOR} 
            />
            <Text 
              className="text-xl font-bold mt-2"
              style={{ color: APP_CONFIG.WARNING_COLOR }}
            >
              Acknowledge Reminder
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
} 