import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/authContext';
import { apiService } from '../lib/api';
import { APP_CONFIG } from '../lib/config';

export default function EditProfileScreen() {
  const { authState, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: authState.user?.name || '',
    email: authState.user?.email || '',
    phone: authState.user?.phone || '',
    addressLine: authState.user?.addressLine || '',
    city: authState.user?.city || '',
    state: authState.user?.state || '',
    pin: authState.user?.pin || '',
    country: authState.user?.country || '',
  });

  const handleUpdate = async () => {
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!formData.name || !formData.email || !formData.phone) {
        Alert.alert('Error', 'Name, email, and phone are required');
        return;
      }

      const updatedUser = await apiService.updateProfile(formData);
      updateUser(formData);
      
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const InputField = ({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    keyboardType = 'default',
    required = false 
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    keyboardType?: any;
    required?: boolean;
  }) => (
    <View className="mb-4">
      <Text className="text-base font-medium text-gray-700 mb-2">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );

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
          <Text className="text-white text-xl font-bold flex-1">Edit Profile</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="py-6">
          <InputField
            label="Full Name"
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            placeholder="Enter your full name"
            required
          />

          <InputField
            label="Email"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
            placeholder="Enter your email"
            keyboardType="email-address"
            required
          />

          <InputField
            label="Phone Number"
            value={formData.phone}
            onChangeText={(text) => handleInputChange('phone', text)}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            required
          />

          <InputField
            label="Address"
            value={formData.addressLine}
            onChangeText={(text) => handleInputChange('addressLine', text)}
            placeholder="Enter your address"
          />

          <View className="flex-row space-x-3 mb-4">
            <View className="flex-1">
              <InputField
                label="City"
                value={formData.city}
                onChangeText={(text) => handleInputChange('city', text)}
                placeholder="City"
              />
            </View>
            <View className="flex-1">
              <InputField
                label="State"
                value={formData.state}
                onChangeText={(text) => handleInputChange('state', text)}
                placeholder="State"
              />
            </View>
          </View>

          <View className="flex-row space-x-3 mb-6">
            <View className="flex-1">
              <InputField
                label="PIN Code"
                value={formData.pin}
                onChangeText={(text) => handleInputChange('pin', text)}
                placeholder="PIN Code"
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <InputField
                label="Country"
                value={formData.country}
                onChangeText={(text) => handleInputChange('country', text)}
                placeholder="Country"
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleUpdate}
            disabled={isLoading}
            className="rounded-xl p-4 items-center justify-center"
            style={{ backgroundColor: APP_CONFIG.THEME_COLOR }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-lg">Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
} 