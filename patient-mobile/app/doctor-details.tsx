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
import { Doctor } from '../lib/types';

export default function DoctorDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { authState } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      Alert.alert('Error', 'Invalid doctor ID');
      router.back();
      return;
    }
    fetchDoctorDetails();
  }, [id]);

  const fetchDoctorDetails = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getDoctorById(id!);
      setDoctor(response);
    } catch (error) {
      console.error('Error fetching doctor details:', error);
      Alert.alert('Error', 'Failed to load doctor details');
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
    if (!doctor) return;
    
    try {
      await Share.share({
        message: `Check out Dr. ${doctor.name} - ${doctor.specialization}\nUser ID: ${doctor.userId}\nPhone: ${doctor.phone}\nEmail: ${doctor.email}`,
        title: `Dr. ${doctor.name} - Contact Details`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    // In a real app, you'd use Clipboard from @react-native-clipboard/clipboard
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
        <Text className="mt-4 text-gray-600">Loading doctor details...</Text>
      </View>
    );
  }

  if (!doctor) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Doctor not found</Text>
      </View>
    );
  }

  const verificationStatus = getVerificationStatusColor(doctor.verificationStatus);

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
            <Text className="text-white text-xl font-bold">Doctor Details</Text>
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
        {/* Doctor Profile Card */}
        <View className="px-6 py-6">
          <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            {/* Doctor Name and Specialization */}
            <View className="items-center mb-6">
              <View 
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
              >
                <Ionicons name="person" size={40} color={APP_CONFIG.THEME_COLOR} />
              </View>
              
              <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
                Dr. {doctor.name}
              </Text>
              
              <Text className="text-lg text-gray-600 text-center mb-3">
                {doctor.specialization}
              </Text>

              {/* Verification Status */}
              <View className={`px-4 py-2 rounded-full ${verificationStatus.bg}`}>
                <View className="flex-row items-center">
                  <Ionicons 
                    name={doctor.verificationStatus === 'VERIFIED' ? 'checkmark-circle' : 'time'} 
                    size={16} 
                    color={verificationStatus.color} 
                  />
                  <Text className={`ml-2 font-medium capitalize ${verificationStatus.text}`}>
                    {doctor.verificationStatus?.toLowerCase() || 'Unknown'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View className="flex-row space-x-3 mb-6">
              <TouchableOpacity
                onPress={() => handleCall(doctor.phone)}
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
                onPress={() => handleEmail(doctor.email)}
                className="flex-1 flex-row items-center justify-center py-3 rounded-xl bg-blue-50"
              >
                <Ionicons name="mail" size={20} color="#3B82F6" />
                <Text className="ml-2 font-semibold text-blue-600">Email</Text>
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
              onPress={() => copyToClipboard(doctor.userId, 'User ID')}
              className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="finger-print-outline" size={20} color="#6B7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-gray-600">User ID</Text>
                  <Text className="text-base font-medium text-gray-800">{doctor.userId}</Text>
                </View>
              </View>
              <Ionicons name="copy-outline" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Phone */}
            <TouchableOpacity
              onPress={() => handleCall(doctor.phone)}
              className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="call-outline" size={20} color="#6B7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-gray-600">Phone</Text>
                  <Text className="text-base font-medium text-gray-800">{doctor.phone}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Email */}
            <TouchableOpacity
              onPress={() => handleEmail(doctor.email)}
              className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-gray-600">Email</Text>
                  <Text className="text-base font-medium text-gray-800">{doctor.email}</Text>
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
                  {doctor.addressLine}
                  {doctor.addressLine && (doctor.city || doctor.state) && ', '}
                  {doctor.city}
                  {doctor.city && doctor.state && ', '}
                  {doctor.state}
                  {(doctor.city || doctor.state) && doctor.pin && ' - '}
                  {doctor.pin}
                  {(doctor.addressLine || doctor.city || doctor.state || doctor.pin) && doctor.country && ', '}
                  {doctor.country}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Clinic Information */}
        {doctor.clinic && (
          <View className="px-6 pb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-4">Clinic Information</Text>
            
            <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center mb-3">
                <Ionicons name="business-outline" size={20} color="#6B7280" />
                <Text className="ml-3 text-base font-medium text-gray-800">
                  {doctor.clinic.name}
                </Text>
              </View>
              
              {doctor.clinic.phone && (
                <TouchableOpacity
                  onPress={() => handleCall(doctor.clinic.phone)}
                  className="flex-row items-center mb-2"
                >
                  <Ionicons name="call-outline" size={16} color="#6B7280" />
                  <Text className="ml-3 text-sm text-gray-600">{doctor.clinic.phone}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Hospitals */}
        {doctor.hospitals && doctor.hospitals.length > 0 && (
          <View className="px-6 pb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Associated Hospitals ({doctor.hospitals.length})
            </Text>
            
            <View className="space-y-3">
              {doctor.hospitals.map((hospital, index) => (
                <TouchableOpacity
                  key={hospital.id}
                  onPress={() => router.push(`/hospital-details?id=${hospital.id}`)}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-base font-medium text-gray-800 mb-1">
                        {hospital.name}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        {hospital.city}, {hospital.state}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Patients Count */}
        {doctor.patients && (
          <View className="px-6 pb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-4">Practice Statistics</Text>
            
            <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={20} color="#6B7280" />
                <View className="ml-3">
                  <Text className="text-sm text-gray-600">Total Patients</Text>
                  <Text className="text-xl font-bold text-gray-800">
                    {doctor.patients.length}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Reviews */}
        {doctor.reviews && doctor.reviews.length > 0 && (
          <View className="px-6 pb-8">
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Recent Reviews ({doctor.reviews.length})
            </Text>
            
            <View className="space-y-3">
              {doctor.reviews.slice(0, 3).map((review, index) => (
                <View key={review.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <View className="flex-row items-center mb-2">
                    <View className="flex-row">
                      {[...Array(5)].map((_, i) => (
                        <Ionicons
                          key={i}
                          name={i < review.rating ? "star" : "star-outline"}
                          size={16}
                          color="#F59E0B"
                        />
                      ))}
                    </View>
                    <Text className="ml-2 text-sm text-gray-600">
                      by {review.patient?.name || 'Anonymous'}
                    </Text>
                  </View>
                  {review.comment && (
                    <Text className="text-sm text-gray-700 italic">
                      "{review.comment}"
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
} 