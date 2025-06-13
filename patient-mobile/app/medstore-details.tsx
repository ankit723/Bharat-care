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
import { MedStore } from '../lib/types';

export default function MedStoreDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { authState } = useAuth();
  const [medStore, setMedStore] = useState<MedStore | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      Alert.alert('Error', 'Invalid medical store ID');
      router.back();
      return;
    }
    fetchMedStoreDetails();
  }, [id]);

  const fetchMedStoreDetails = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getMedStoreById(id!);
      setMedStore(response);
    } catch (error) {
      console.error('Error fetching med store details:', error);
      Alert.alert('Error', 'Failed to load medical store details');
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
    if (!medStore) return;
    
    try {
      await Share.share({
        message: `Check out ${medStore.name} Medical Store\nUser ID: ${medStore.userId}\nPhone: ${medStore.phone}\nEmail: ${medStore.email}\nLocation: ${medStore.city}, ${medStore.state}`,
        title: `${medStore.name} - Medical Store Details`,
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
        <Text className="mt-4 text-gray-600">Loading medical store details...</Text>
      </View>
    );
  }

  if (!medStore) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Medical store not found</Text>
      </View>
    );
  }

  const verificationStatus = getVerificationStatusColor(medStore.verificationStatus);

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
            <Text className="text-white text-xl font-bold">Medical Store Details</Text>
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
        {/* Med Store Profile Card */}
        <View className="px-6 py-6">
          <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            {/* Store Name */}
            <View className="items-center mb-6">
              <View 
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
              >
                <Ionicons name="medical" size={40} color={APP_CONFIG.THEME_COLOR} />
              </View>
              
              <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
                {medStore.name}
              </Text>
              
              <Text className="text-lg text-gray-600 text-center mb-3">
                Medical Store
              </Text>

              {/* Verification Status */}
              <View className={`px-4 py-2 rounded-full ${verificationStatus.bg}`}>
                <View className="flex-row items-center">
                  <Ionicons 
                    name={medStore.verificationStatus === 'VERIFIED' ? 'checkmark-circle' : 'time'} 
                    size={16} 
                    color={verificationStatus.color} 
                  />
                  <Text className={`ml-2 font-medium capitalize ${verificationStatus.text}`}>
                    {medStore.verificationStatus?.toLowerCase() || 'Unknown'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View className="flex-row space-x-3 mb-6">
              <TouchableOpacity
                onPress={() => handleCall(medStore.phone)}
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
                onPress={() => handleEmail(medStore.email)}
                className="flex-1 flex-row items-center justify-center py-3 rounded-xl bg-blue-50"
              >
                <Ionicons name="mail" size={20} color="#3B82F6" />
                <Text className="ml-2 font-semibold text-blue-600">Email</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/global-medicine')}
                className="flex-1 flex-row items-center justify-center py-3 rounded-xl bg-purple-50"
              >
                <Ionicons name="document-text" size={20} color="#8B5CF6" />
                <Text className="ml-2 font-semibold text-purple-600">Order</Text>
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
              onPress={() => copyToClipboard(medStore.userId, 'User ID')}
              className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="finger-print-outline" size={20} color="#6B7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-gray-600">User ID</Text>
                  <Text className="text-base font-medium text-gray-800">{medStore.userId}</Text>
                </View>
              </View>
              <Ionicons name="copy-outline" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Phone */}
            <TouchableOpacity
              onPress={() => handleCall(medStore.phone)}
              className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="call-outline" size={20} color="#6B7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-gray-600">Phone</Text>
                  <Text className="text-base font-medium text-gray-800">{medStore.phone}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Email */}
            <TouchableOpacity
              onPress={() => handleEmail(medStore.email)}
              className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-gray-600">Email</Text>
                  <Text className="text-base font-medium text-gray-800">{medStore.email}</Text>
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
                  {medStore.addressLine}
                  {medStore.addressLine && (medStore.city || medStore.state) && ', '}
                  {medStore.city}
                  {medStore.city && medStore.state && ', '}
                  {medStore.state}
                  {(medStore.city || medStore.state) && medStore.pin && ' - '}
                  {medStore.pin}
                  {(medStore.addressLine || medStore.city || medStore.state || medStore.pin) && medStore.country && ', '}
                  {medStore.country}
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
              <TouchableOpacity
                onPress={() => router.push('/global-medicine')}
                className="flex-row items-center p-3 bg-gray-50 rounded-lg"
              >
                <View 
                  className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                  style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
                >
                  <Ionicons name="document-text-outline" size={20} color={APP_CONFIG.THEME_COLOR} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-800">Prescription Upload</Text>
                  <Text className="text-sm text-gray-600">Upload prescription and get quotes</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>

              <View className="flex-row items-center p-3 bg-gray-50 rounded-lg">
                <View 
                  className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                  style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
                >
                  <Ionicons name="car-outline" size={20} color={APP_CONFIG.THEME_COLOR} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-800">Home Delivery</Text>
                  <Text className="text-sm text-gray-600">Medicines delivered to your doorstep</Text>
                </View>
              </View>

              <View className="flex-row items-center p-3 bg-gray-50 rounded-lg">
                <View 
                  className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                  style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
                >
                  <Ionicons name="time-outline" size={20} color={APP_CONFIG.THEME_COLOR} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-800">24/7 Service</Text>
                  <Text className="text-sm text-gray-600">Emergency medicine availability</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Store Statistics */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Store Information</Text>
          
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <View className="space-y-4">
              {/* Reward Points */}
              <View className="flex-row items-center">
                <Ionicons name="star-outline" size={20} color="#6B7280" />
                <View className="ml-3">
                  <Text className="text-sm text-gray-600">Reward Points</Text>
                  <Text className="text-xl font-bold text-gray-800">
                    {medStore.rewardPoints || 0}
                  </Text>
                </View>
              </View>

              {/* Raised Hands Count */}
              {medStore.raisedHands && (
                <View className="flex-row items-center">
                  <Ionicons name="hand-right-outline" size={20} color="#6B7280" />
                  <View className="ml-3">
                    <Text className="text-sm text-gray-600">Active Prescription Requests</Text>
                    <Text className="text-xl font-bold text-gray-800">
                      {medStore.raisedHands.length}
                    </Text>
                  </View>
                </View>
              )}

              {/* Store Type */}
              <View className="flex-row items-center">
                <Ionicons name="storefront-outline" size={20} color="#6B7280" />
                <View className="ml-3">
                  <Text className="text-sm text-gray-600">Store Type</Text>
                  <Text className="text-base font-medium text-gray-800">
                    Medical Store & Pharmacy
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Order Section */}
        <View className="px-6 pb-8">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</Text>
          
          <View className="space-y-3">
            <TouchableOpacity
              onPress={() => router.push('/global-medicine')}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View 
                    className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                    style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
                  >
                    <Ionicons name="camera" size={24} color={APP_CONFIG.THEME_COLOR} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-800">Upload Prescription</Text>
                    <Text className="text-sm text-gray-600">Get instant quotes for your medicines</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/my-medicine-requests')}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View 
                    className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                    style={{ backgroundColor: '#3B82F615' }}
                  >
                    <Ionicons name="list" size={24} color="#3B82F6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-800">My Orders</Text>
                    <Text className="text-sm text-gray-600">Track your medicine orders</Text>
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