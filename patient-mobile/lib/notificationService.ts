import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  NOTIFICATION_CONFIG, 
  STORAGE_KEYS,
  APP_CONFIG 
} from './config';
import {
  MedicineReminder,
  Appointment,
  NotificationConfig,
  AlarmData,
} from './types';
import { apiService } from './api';

const BACKGROUND_FETCH_TASK = 'background-fetch-medicine-check';
const ALARM_SOUND_URI = require('../assets/sounds/alarm.wav');

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  private sound: Audio.Sound | null = null;
  private isAlarmPlaying = false;

  constructor() {
    this.initializeService();
  }

  async initializeService() {
    await this.requestPermissions();
    await this.createNotificationChannels();
    await this.registerBackgroundTask();
    await this.loadAlarmSound();
  }

  async requestPermissions() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: NOTIFICATION_CONFIG.VIBRATION_PATTERN,
        lightColor: APP_CONFIG.THEME_COLOR,
      });
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notification permissions not granted');
    }

    // Request background app refresh permissions
    const backgroundStatus = await BackgroundFetch.requestPermissionsAsync();
    if (backgroundStatus.status !== 'granted') {
      console.warn('Background fetch permissions not granted');
    }
  }

  async createNotificationChannels() {
    if (Platform.OS === 'android') {
      // Medicine reminder channel
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CONFIG.MEDICINE_CHANNEL_ID, {
        name: 'Medicine Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: NOTIFICATION_CONFIG.VIBRATION_PATTERN,
        lightColor: APP_CONFIG.THEME_COLOR,
        sound: 'alarm.wav',
        enableLights: true,
        enableVibrate: true,
      });

      // Appointment reminder channel
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CONFIG.APPOINTMENT_CHANNEL_ID, {
        name: 'Appointment Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: NOTIFICATION_CONFIG.VIBRATION_PATTERN,
        lightColor: APP_CONFIG.THEME_COLOR,
        sound: 'alarm.wav',
        enableLights: true,
        enableVibrate: true,
      });
    }
  }

  async loadAlarmSound() {
    try {
      const { sound } = await Audio.Sound.createAsync(ALARM_SOUND_URI);
      this.sound = sound;
      await this.sound.setIsLoopingAsync(true);
    } catch (error) {
      console.error('Error loading alarm sound:', error);
    }
  }

  async scheduleMedicineReminder(reminder: MedicineReminder): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Medicine Time!',
        body: `Time to take ${reminder.medicineName} - ${reminder.dosage}`,
        sound: 'alarm.wav',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: NOTIFICATION_CONFIG.VIBRATION_PATTERN,
        data: {
          type: 'MEDICINE',
          reminderId: reminder.id,
          medicineItemId: reminder.medicineItemId,
          medicineName: reminder.medicineName,
          dosage: reminder.dosage,
          notes: reminder.notes,
        },
      },
      trigger: {
        date: reminder.scheduledTime,
        channelId: NOTIFICATION_CONFIG.MEDICINE_CHANNEL_ID,
      },
    });

    return notificationId;
  }

  async scheduleAppointmentReminder(appointment: Appointment): Promise<string> {
    const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📅 Appointment Reminder',
        body: `You have an appointment at ${appointment.appointmentTime}`,
        sound: 'alarm.wav',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: NOTIFICATION_CONFIG.VIBRATION_PATTERN,
        data: {
          type: 'APPOINTMENT',
          appointmentId: appointment.id,
          providerId: appointment.providerId,
          providerType: appointment.providerType,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
        },
      },
      trigger: {
        date: appointmentDateTime,
        channelId: NOTIFICATION_CONFIG.APPOINTMENT_CHANNEL_ID,
      },
    });

    return notificationId;
  }

  async cancelNotification(notificationId: string) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async triggerFullScreenAlarm(alarmData: AlarmData) {
    this.isAlarmPlaying = true;
    
    // Store alarm data for the alarm screen
    await AsyncStorage.setItem('current_alarm', JSON.stringify(alarmData));
    
    // Play alarm sound
    await this.playAlarmSound();
    
    // Trigger haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    
    // Show full-screen notification
    await Notifications.presentNotificationAsync({
      title: alarmData.title,
      body: alarmData.subtitle,
      sound: 'alarm.wav',
      priority: Notifications.AndroidNotificationPriority.HIGH,
      vibrate: NOTIFICATION_CONFIG.VIBRATION_PATTERN,
      data: {
        fullScreen: true,
        ...alarmData,
      },
    });

    // Set timeout for grace period
    setTimeout(() => {
      if (this.isAlarmPlaying) {
        this.stopAlarm();
      }
    }, NOTIFICATION_CONFIG.GRACE_PERIOD_MINUTES * 60 * 1000);
  }

  async playAlarmSound() {
    try {
      if (this.sound) {
        await this.sound.setPositionAsync(0);
        await this.sound.playAsync();
      }
    } catch (error) {
      console.error('Error playing alarm sound:', error);
    }
  }

  async stopAlarm() {
    this.isAlarmPlaying = false;
    
    try {
      if (this.sound) {
        await this.sound.stopAsync();
      }
    } catch (error) {
      console.error('Error stopping alarm sound:', error);
    }
    
    // Clear current alarm data
    await AsyncStorage.removeItem('current_alarm');
  }

  async confirmMedicine(medicineItemId: string): Promise<number> {
    try {
      const response = await apiService.confirmMedicineTaken(medicineItemId, new Date());
      await this.stopAlarm();
      
      // Show success notification
      await Notifications.presentNotificationAsync({
        title: '✅ Medicine Confirmed',
        body: `You earned ${response.data.pointsAwarded} reward points!`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.LOW,
      });

      return response.data.pointsAwarded;
    } catch (error) {
      console.error('Error confirming medicine:', error);
      throw error;
    }
  }

  async registerBackgroundTask() {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
    } catch (error) {
      console.error('Error registering background task:', error);
    }
  }

  async syncMedicineSchedules() {
    try {
      // This will be called by the background task
      const response = await apiService.getMedicineSchedules();
      const schedules = response.data;
      
      // Process schedules and create reminders
      const now = new Date();
      const upcomingReminders: MedicineReminder[] = [];
      
      schedules.forEach(schedule => {
        schedule.items.forEach(item => {
          // Calculate next reminder times based on schedule
          const startDate = new Date(schedule.startDate);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + schedule.numberOfDays);
          
          if (now < endDate) {
            // Create reminders for today and tomorrow
            for (let day = 0; day < 2; day++) {
              const reminderDate = new Date(now);
              reminderDate.setDate(reminderDate.getDate() + day);
              
              // Create reminders based on timesPerDay
              for (let timeIndex = 0; timeIndex < item.timesPerDay; timeIndex++) {
                const reminderTime = new Date(reminderDate);
                
                // Distribute times throughout the day (e.g., 8 AM, 2 PM, 8 PM for 3 times per day)
                const hourGap = Math.floor(16 / item.timesPerDay); // 16 hours from 6 AM to 10 PM
                reminderTime.setHours(6 + (timeIndex * hourGap), 0, 0, 0);
                
                if (reminderTime > now) {
                  upcomingReminders.push({
                    id: `${item.id}-${day}-${timeIndex}`,
                    medicineItemId: item.id,
                    medicineName: item.medicineName,
                    dosage: item.dosage,
                    scheduledTime: reminderTime,
                    isCompleted: false,
                    pointsAwarded: NOTIFICATION_CONFIG.REWARD_POINTS_PER_MEDICINE,
                    scheduleDate: reminderDate,
                    notes: item.notes,
                  });
                }
              }
            }
          }
        });
      });
      
      // Schedule notifications for upcoming reminders
      for (const reminder of upcomingReminders) {
        await this.scheduleMedicineReminder(reminder);
      }
      
      // Store reminders for local access
      await AsyncStorage.setItem('upcoming_reminders', JSON.stringify(upcomingReminders));
      
    } catch (error) {
      console.error('Error syncing medicine schedules:', error);
    }
  }

  async isGracePeriodActive(scheduledTime: Date): Promise<boolean> {
    const now = new Date();
    const gracePeriodEnd = new Date(scheduledTime);
    gracePeriodEnd.setMinutes(gracePeriodEnd.getMinutes() + NOTIFICATION_CONFIG.GRACE_PERIOD_MINUTES);
    
    return now <= gracePeriodEnd;
  }

  async getNotificationStatus() {
    const permissions = await Notifications.getPermissionsAsync();
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    return {
      hasPermissions: permissions.granted,
      scheduledCount: scheduledNotifications.length,
      canScheduleExact: Platform.OS === 'android' ? true : permissions.ios?.allowsAlert,
    };
  }
}

// Background task definition
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const notificationService = new NotificationService();
    await notificationService.syncMedicineSchedules();
    
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background fetch error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Create and export singleton instance
export const notificationService = new NotificationService();

export default NotificationService; 