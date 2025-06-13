import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/authContext';
import { apiService } from '../../lib/api';
import { APP_CONFIG } from '../../lib/config';

export default function ProfileScreen() {
  const { authState, logout, refreshProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [medicineReminders, setMedicineReminders] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshProfile]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        }
      ]
    );
  };

  const MenuSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-gray-800 mb-4 px-6">{title}</Text>
      <View className="bg-white mx-6 rounded-xl shadow-sm">
        {children}
      </View>
    </View>
  );

  const MenuItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true,
    rightElement 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center p-4 border-b border-gray-100 last:border-b-0"
    >
      <View 
        className="w-10 h-10 rounded-xl items-center justify-center mr-4"
        style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
      >
        <Ionicons name={icon as any} size={20} color={APP_CONFIG.THEME_COLOR} />
      </View>
      
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-800">{title}</Text>
        {subtitle && (
          <Text className="text-sm text-gray-600 mt-1">{subtitle}</Text>
        )}
      </View>
      
      {rightElement || (showArrow && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      ))}
    </TouchableOpacity>
  );

  const ToggleMenuItem = ({ 
    icon, 
    title, 
    subtitle, 
    value, 
    onToggle 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value: boolean;
    onToggle: (value: boolean) => void;
  }) => (
    <View className="flex-row items-center p-4 border-b border-gray-100 last:border-b-0">
      <View 
        className="w-10 h-10 rounded-xl items-center justify-center mr-4"
        style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
      >
        <Ionicons name={icon as any} size={20} color={APP_CONFIG.THEME_COLOR} />
      </View>
      
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-800">{title}</Text>
        {subtitle && (
          <Text className="text-sm text-gray-600 mt-1">{subtitle}</Text>
        )}
      </View>
      
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E5E7EB', true: `${APP_CONFIG.THEME_COLOR}40` }}
        thumbColor={value ? APP_CONFIG.THEME_COLOR : '#F3F4F6'}
      />
    </View>
  );

  const user = authState.user;

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">No user data available</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="light" />
      
      {/* Header with User Info */}
      <View 
        className="px-6 pt-16 pb-8"
        style={{ backgroundColor: APP_CONFIG.THEME_COLOR }}
      >
        <View className="flex-row items-center mb-6">
          <View 
            className="w-20 h-20 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <Text className="text-white text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">{user.name}</Text>
            <Text className="text-white/80 text-base">{user.email}</Text>
            <Text className="text-white/80 text-base">{user.phone}</Text>
          </View>
        </View>

        {/* Reward Points Card */}
        <View className="bg-white/20 rounded-xl p-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white/80 text-sm">Total Reward Points</Text>
              <Text className="text-white text-2xl font-bold">{user.rewardPoints}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => {/* Navigate to rewards history */}}
              className="flex-row items-center"
            >
              <Text className="text-white font-medium mr-2">View History</Text>
              <Ionicons name="chevron-forward" size={16} color="white" />
            </TouchableOpacity>
          </View>
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
        {/* Account Section */}
        <MenuSection title="Account">
          <MenuItem
            icon="person-outline"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => router.push('/edit-profile')}
          />
          <MenuItem
            icon="location-outline"
            title="Address"
            subtitle={`${user.city}, ${user.state} - ${user.pin}`}
            onPress={() => router.push('/edit-profile')}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            title="Verification Status"
            subtitle="Account verified"
            onPress={() => {}}
            showArrow={false}
            rightElement={
              <View className="px-3 py-1 bg-green-100 rounded-full">
                <Text className="text-green-700 text-xs font-medium">Verified</Text>
              </View>
            }
          />
        </MenuSection>

        {/* Health Section */}
        <MenuSection title="Health">
          <MenuItem
            icon="people-outline"
            title="My Healthcare Providers"
            subtitle="View assigned doctors and providers"
            onPress={() => router.push('/my-doctors')}
          />
          <MenuItem
            icon="medical-outline"
            title="My Medicines"
            subtitle="View active medicine schedules"
            onPress={() => router.push('/(tabs)/medicines')}
          />
          <MenuItem
            icon="calendar-outline"
            title="Appointments"
            subtitle="Upcoming and past appointments"
            onPress={() => router.push('/(tabs)/calendar')}
          />
          <MenuItem
            icon="document-text-outline"
            title="Prescriptions"
            subtitle="View uploaded prescriptions"
            onPress={() => {/* Navigate to prescriptions */}}
          />
          <MenuItem
            icon="analytics-outline"
            title="Health Reports"
            subtitle="View your health analytics"
            onPress={() => {/* Navigate to health reports */}}
          />
        </MenuSection>

        {/* Notifications Section */}
        <MenuSection title="Notifications">
          <ToggleMenuItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Receive app notifications"
            value={notificationsEnabled}
            onToggle={setNotificationsEnabled}
          />
          <ToggleMenuItem
            icon="medical-outline"
            title="Medicine Reminders"
            subtitle="Get reminded to take medicines"
            value={medicineReminders}
            onToggle={setMedicineReminders}
          />
          <ToggleMenuItem
            icon="calendar-outline"
            title="Appointment Reminders"
            subtitle="Get reminded of appointments"
            value={appointmentReminders}
            onToggle={setAppointmentReminders}
          />
        </MenuSection>

        {/* Support Section */}
        <MenuSection title="Support">
          <MenuItem
            icon="help-circle-outline"
            title="Help & FAQ"
            subtitle="Get help and find answers"
            onPress={() => {/* Navigate to help */}}
          />
          <MenuItem
            icon="chatbubble-outline"
            title="Contact Support"
            subtitle="Get in touch with our team"
            onPress={() => {/* Navigate to contact support */}}
          />
          <MenuItem
            icon="star-outline"
            title="Rate BharatCare"
            subtitle="Share your feedback"
            onPress={() => {/* Navigate to rate app */}}
          />
          <MenuItem
            icon="share-outline"
            title="Share App"
            subtitle="Invite friends to BharatCare"
            onPress={() => {/* Share app */}}
          />
        </MenuSection>

        {/* Legal Section */}
        <MenuSection title="Legal">
          <MenuItem
            icon="document-outline"
            title="Terms of Service"
            subtitle="Read our terms"
            onPress={() => {/* Navigate to terms */}}
          />
          <MenuItem
            icon="shield-outline"
            title="Privacy Policy"
            subtitle="Your privacy matters"
            onPress={() => {/* Navigate to privacy policy */}}
          />
          <MenuItem
            icon="information-circle-outline"
            title="About"
            subtitle={`Version ${APP_CONFIG.VERSION}`}
            onPress={() => {/* Navigate to about */}}
            showArrow={false}
          />
        </MenuSection>

        {/* Logout Button */}
        <View className="px-6 mb-8">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-white rounded-xl p-4 flex-row items-center justify-center shadow-sm"
          >
            <Ionicons name="log-out-outline" size={20} color={APP_CONFIG.ERROR_COLOR} />
            <Text 
              className="ml-3 text-base font-semibold"
              style={{ color: APP_CONFIG.ERROR_COLOR }}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
} 