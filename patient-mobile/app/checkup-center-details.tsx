import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/authContext';
import { apiService } from '../lib/api';
import { APP_CONFIG } from '../lib/config';
import { CheckupCenter } from '../lib/types';

export default function CheckupCenterDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { authState } = useAuth();
  const [checkupCenter, setCheckupCenter] = useState<CheckupCenter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      Alert.alert('Error', 'Invalid checkup center ID');
      router.back();
      return;
    }
    fetchCheckupCenterDetails();
  }, [id]);

  const fetchCheckupCenterDetails = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getCheckupCenterById(id!);
      setCheckupCenter(response);
    } catch (error) {
      console.error('Error fetching checkup center details:', error);
      Alert.alert('Error', 'Failed to load checkup center details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to make phone call');
    });
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Error', 'Unable to open email client');
    });
  };

  const handleShare = async () => {
    if (!checkupCenter) return;
    
    try {
      await Share.share({
        message: `Check out ${checkupCenter.name} Checkup Center\nUser ID: ${checkupCenter.userId}\nPhone: ${checkupCenter.phone}\nEmail: ${checkupCenter.email}\nLocation: ${checkupCenter.city}, ${checkupCenter.state}`,
        title: `${checkupCenter.name} - Checkup Center Details`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    Alert.alert('Copied', `${label} copied to clipboard: ${text}`);
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return { bg: 'bg-green-100', text: 'text-green-700', color: '#10B981' };
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', color: '#F59E0B' };
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-700', color: '#EF4444' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', color: '#6B7280' };
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color={APP_CONFIG.THEME_COLOR} />
        <Text className="mt-4 text-gray-600">Loading checkup center details...</Text>
      </View>
    );
  }

  if (!checkupCenter) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Checkup center not found</Text>
      </View>
    );
  }

  const verificationStatus = getVerificationStatusColor(checkupCenter.verificationStatus);

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="light" />
      
      {/* Header */}
      <View 
        className="px-6 pt-16 pb-6"
        style={{ backgroundColor: APP_CONFIG.THEME_COLOR }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View className="flex-1 ml-4">
            <Text className="text-white text-xl font-bold">Checkup Center Details</Text>
            <Text className="text-white/80 text-sm">Complete information</Text>
          </View>

          <TouchableOpacity
            onPress={handleShare}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          >
            <Ionicons name="share-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Checkup Center Profile Card */}
        <View className="px-6 py-6">
          <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            {/* Center Name */}
            <View className="items-center mb-6">
              <View 
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
              >
                <Ionicons name="fitness" size={40} color={APP_CONFIG.THEME_COLOR} />
              </View>
              
              <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
                {checkupCenter.name}
              </Text>
              
              <Text className="text-lg text-gray-600 text-center mb-3">
                Checkup Center
              </Text>

              {/* Verification Status */}
              <View className={`px-4 py-2 rounded-full ${verificationStatus.bg}`}>
                <View className="flex-row items-center">
                  <Ionicons 
                    name={checkupCenter.verificationStatus === 'VERIFIED' ? 'checkmark-circle' : 'time'} 
                    size={16} 
                    color={verificationStatus.color} 
                  />
                  <Text className={`ml-2 font-medium capitalize ${verificationStatus.text}`}>
                    {checkupCenter.verificationStatus?.toLowerCase() || 'Unknown'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View className="flex-row space-x-3 mb-6">
              <TouchableOpacity
                onPress={() => handleCall(checkupCenter.phone)}
                className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
                style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
              >
                <Ionicons name="call" size={20} color={APP_CONFIG.THEME_COLOR} />
                <Text 
                  className="ml-2 font-semibold"
                  style={{ color: APP_CONFIG.THEME_COLOR }}
                >
                  Call
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleEmail(checkupCenter.email)}
                className="flex-1 flex-row items-center justify-center py-3 rounded-xl bg-blue-50"
              >
                <Ionicons name="mail" size={20} color="#3B82F6" />
                <Text className="ml-2 font-semibold text-blue-600">Email</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center py-3 rounded-xl bg-green-50"
              >
                <Ionicons name="calendar" size={20} color="#10B981" />
                <Text className="ml-2 font-semibold text-green-600">Book</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Contact Information</Text>
          
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
            {/* User ID */}
            <TouchableOpacity
              onPress={() => copyToClipboard(checkupCenter.userId, 'User ID')}
              className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="finger-print-outline" size={20} color="#6B7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-gray-600">User ID</Text>
                  <Text className="text-base font-medium text-gray-800">{checkupCenter.userId}</Text>
                </View>
              </View>
              <Ionicons name="copy-outline" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Phone */}
            <TouchableOpacity
              onPress={() => handleCall(checkupCenter.phone)}
              className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="call-outline" size={20} color="#6B7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-gray-600">Phone</Text>
                  <Text className="text-base font-medium text-gray-800">{checkupCenter.phone}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Email */}
            <TouchableOpacity
              onPress={() => handleEmail(checkupCenter.email)}
              className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-gray-600">Email</Text>
                  <Text className="text-base font-medium text-gray-800">{checkupCenter.email}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Address Information */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Address</Text>
          
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <View className="flex-row items-start">
              <Ionicons name="location-outline" size={20} color="#6B7280" className="mt-1" />
              <View className="ml-3 flex-1">
                <Text className="text-base text-gray-800 leading-6">
                  {checkupCenter.addressLine}
                  {checkupCenter.addressLine && (checkupCenter.city || checkupCenter.state) && ', '}
                  {checkupCenter.city}
                  {checkupCenter.city && checkupCenter.state && ', '}
                  {checkupCenter.state}
                  {(checkupCenter.city || checkupCenter.state) && checkupCenter.pin && ' - '}
                  {checkupCenter.pin}
                  {(checkupCenter.addressLine || checkupCenter.city || checkupCenter.state || checkupCenter.pin) && checkupCenter.country && ', '}
                  {checkupCenter.country}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Services */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Services</Text>
          
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <View className="space-y-4">
              <View className="flex-row items-center p-3 bg-gray-50 rounded-lg">
                <View 
                  className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                  style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
                >
                  <Ionicons name="heart-outline" size={20} color={APP_CONFIG.THEME_COLOR} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-800">Health Checkups</Text>
                  <Text className="text-sm text-gray-600">Comprehensive health examinations</Text>
                </View>
              </View>

              <View className="flex-row items-center p-3 bg-gray-50 rounded-lg">
                <View 
                  className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                  style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
                >
                  <Ionicons name="analytics-outline" size={20} color={APP_CONFIG.THEME_COLOR} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-800">Lab Tests</Text>
                  <Text className="text-sm text-gray-600">Blood tests, urine tests, and more</Text>
                </View>
              </View>

              <View className="flex-row items-center p-3 bg-gray-50 rounded-lg">
                <View 
                  className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                  style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
                >
                  <Ionicons name="scan-outline" size={20} color={APP_CONFIG.THEME_COLOR} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-800">Imaging Services</Text>
                  <Text className="text-sm text-gray-600">X-ray, ultrasound, and CT scans</Text>
                </View>
              </View>

              <View className="flex-row items-center p-3 bg-gray-50 rounded-lg">
                <View 
                  className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                  style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
                >
                  <Ionicons name="document-text-outline" size={20} color={APP_CONFIG.THEME_COLOR} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-800">Health Reports</Text>
                  <Text className="text-sm text-gray-600">Digital reports and consultations</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Center Statistics */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Center Information</Text>
          
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <View className="space-y-4">
              {/* Reward Points */}
              <View className="flex-row items-center">
                <Ionicons name="star-outline" size={20} color="#6B7280" />
                <View className="ml-3">
                  <Text className="text-sm text-gray-600">Reward Points</Text>
                  <Text className="text-xl font-bold text-gray-800">
                    {checkupCenter.rewardPoints || 0}
                  </Text>
                </View>
              </View>

              {/* Raised Hands Count */}
              {checkupCenter.raisedHands && (
                <View className="flex-row items-center">
                  <Ionicons name="hand-right-outline" size={20} color="#6B7280" />
                  <View className="ml-3">
                    <Text className="text-sm text-gray-600">Active Requests</Text>
                    <Text className="text-xl font-bold text-gray-800">
                      {checkupCenter.raisedHands.length}
                    </Text>
                  </View>
                </View>
              )}

              {/* Center Type */}
              <View className="flex-row items-center">
                <Ionicons name="business-outline" size={20} color="#6B7280" />
                <View className="ml-3">
                  <Text className="text-sm text-gray-600">Center Type</Text>
                  <Text className="text-base font-medium text-gray-800">
                    Diagnostic & Health Checkup Center
                  </Text>
                </View>
              </View>

              {/* Operating Hours */}
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={20} color="#6B7280" />
                <View className="ml-3">
                  <Text className="text-sm text-gray-600">Operating Hours</Text>
                  <Text className="text-base font-medium text-gray-800">
                    Mon - Sat: 8:00 AM - 8:00 PM
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions Section */}
        <View className="px-6 pb-8">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</Text>
          
          <View className="space-y-3">
            <TouchableOpacity
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View 
                    className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                    style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
                  >
                    <Ionicons name="calendar" size={24} color={APP_CONFIG.THEME_COLOR} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-800">Book Appointment</Text>
                    <Text className="text-sm text-gray-600">Schedule your health checkup</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View 
                    className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                    style={{ backgroundColor: '#3B82F615' }}
                  >
                    <Ionicons name="document-text" size={24} color="#3B82F6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-800">View Test Packages</Text>
                    <Text className="text-sm text-gray-600">Browse available health packages</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View 
                    className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                    style={{ backgroundColor: '#10B98115' }}
                  >
                    <Ionicons name="location" size={24} color="#10B981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-800">Get Directions</Text>
                    <Text className="text-sm text-gray-600">Navigate to the center</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
} 