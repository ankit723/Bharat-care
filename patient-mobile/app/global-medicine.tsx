import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../lib/authContext';
import { apiService } from '../lib/api';
import { APP_CONFIG } from '../lib/config';

export default function GlobalMedicineScreen() {
  const { authState } = useAuth();
  const [prescriptionImage, setPrescriptionImage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload prescription.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPrescriptionImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPrescriptionImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const uploadPrescription = async () => {
    if (!prescriptionImage) {
      Alert.alert('Error', 'Please select a prescription image first.');
      return;
    }

    if (!deliveryAddress.trim()) {
      Alert.alert('Error', 'Please enter your delivery address.');
      return;
    }

    setIsUploading(true);
    try {
      // First upload the prescription image
      const uploadResult = await apiService.uploadPrescription(prescriptionImage, notes);
      
      // Then create a global medicine request
      const requestData = {
        prescriptionImageUrl: uploadResult.data.fileUrl,
        notes: notes.trim() || undefined,
        deliveryAddress: deliveryAddress.trim(),
      };

      await apiService.createGlobalMedicineRequest(requestData);

      Alert.alert(
        'Success! 🎉',
        'Your prescription has been uploaded successfully. Medical stores will review it and provide quotes.',
        [
          {
            text: 'View My Requests',
            onPress: () => router.push('/my-medicine-requests'),
          },
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );

      // Reset form
      setPrescriptionImage(null);
      setNotes('');
      setDeliveryAddress('');
    } catch (error: any) {
      console.error('Error uploading prescription:', error);
      Alert.alert(
        'Upload Failed',
        error.response?.data?.error || 'Failed to upload prescription. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUploading(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add your prescription',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

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
            <Text className="text-white text-xl font-bold">Global Medicine</Text>
            <Text className="text-white/80 text-sm">Upload prescription & get quotes</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* How it works */}
        <View className="px-6 py-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">How it works</Text>
          <View className="space-y-3">
            <View className="flex-row items-start">
              <View 
                className="w-8 h-8 rounded-full items-center justify-center mr-3 mt-1"
                style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
              >
                <Text className="text-sm font-bold" style={{ color: APP_CONFIG.THEME_COLOR }}>1</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-800">Upload Prescription</Text>
                <Text className="text-sm text-gray-600">Take a photo or upload your prescription</Text>
              </View>
            </View>
            
            <View className="flex-row items-start">
              <View 
                className="w-8 h-8 rounded-full items-center justify-center mr-3 mt-1"
                style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
              >
                <Text className="text-sm font-bold" style={{ color: APP_CONFIG.THEME_COLOR }}>2</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-800">Get Quotes</Text>
                <Text className="text-sm text-gray-600">Medical stores will provide competitive quotes</Text>
              </View>
            </View>
            
            <View className="flex-row items-start">
              <View 
                className="w-8 h-8 rounded-full items-center justify-center mr-3 mt-1"
                style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
              >
                <Text className="text-sm font-bold" style={{ color: APP_CONFIG.THEME_COLOR }}>3</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-800">Choose & Order</Text>
                <Text className="text-sm text-gray-600">Select the best quote and get medicines delivered</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Upload Section */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Upload Prescription</Text>
          
          {/* Image Upload */}
          <TouchableOpacity
            onPress={showImageOptions}
            className="bg-white rounded-xl p-6 mb-4 border-2 border-dashed border-gray-300 items-center"
          >
            {prescriptionImage ? (
              <View className="items-center">
                <Image
                  source={{ uri: prescriptionImage }}
                  className="w-32 h-32 rounded-lg mb-3"
                  resizeMode="cover"
                />
                <Text className="text-sm text-gray-600 mb-2">Prescription uploaded</Text>
                <Text className="text-xs text-blue-600">Tap to change</Text>
              </View>
            ) : (
              <View className="items-center">
                <View 
                  className="w-16 h-16 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
                >
                  <Ionicons name="camera" size={32} color={APP_CONFIG.THEME_COLOR} />
                </View>
                <Text className="text-base font-medium text-gray-800 mb-1">Add Prescription</Text>
                <Text className="text-sm text-gray-600 text-center">
                  Take a photo or choose from gallery
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Notes */}
          <View className="mb-4">
            <Text className="text-base font-medium text-gray-800 mb-2">Additional Notes (Optional)</Text>
            <TextInput
              className="bg-white rounded-xl p-4 text-base text-gray-800 border border-gray-200"
              placeholder="Any specific requirements or notes..."
              placeholderTextColor="#9CA3AF"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Delivery Address */}
          <View className="mb-6">
            <Text className="text-base font-medium text-gray-800 mb-2">Delivery Address *</Text>
            <TextInput
              className="bg-white rounded-xl p-4 text-base text-gray-800 border border-gray-200"
              placeholder="Enter your complete delivery address..."
              placeholderTextColor="#9CA3AF"
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Upload Button */}
          <TouchableOpacity
            onPress={uploadPrescription}
            disabled={isUploading || !prescriptionImage || !deliveryAddress.trim()}
            className="rounded-xl py-4 items-center justify-center"
            style={{ 
              backgroundColor: (!prescriptionImage || !deliveryAddress.trim() || isUploading) 
                ? '#D1D5DB' 
                : APP_CONFIG.THEME_COLOR 
            }}
          >
            {isUploading ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-semibold ml-2">Uploading...</Text>
              </View>
            ) : (
              <Text className="text-white text-lg font-semibold">Upload Prescription</Text>
            )}
          </TouchableOpacity>

          {/* Info */}
          <View className="mt-4 p-4 bg-blue-50 rounded-xl">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <View className="flex-1 ml-2">
                <Text className="text-sm font-medium text-blue-800">Important</Text>
                <Text className="text-sm text-blue-700 mt-1">
                  Make sure your prescription is clear and readable. Include doctor's name, date, and all medicine details.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
} 