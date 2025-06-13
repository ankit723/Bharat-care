import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/authContext';
import { APP_CONFIG } from '../../lib/config';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    pin: '',
    country: 'India',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Please enter your name';
    if (!formData.email.trim()) return 'Please enter your email';
    if (!formData.password) return 'Please enter a password';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    if (!formData.phone.trim()) return 'Please enter your phone number';
    if (!formData.addressLine.trim()) return 'Please enter your address';
    if (!formData.city.trim()) return 'Please enter your city';
    if (!formData.state.trim()) return 'Please enter your state';
    if (!formData.pin.trim()) return 'Please enter your PIN code';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return 'Please enter a valid email';
    
    // Phone validation (basic)
    if (formData.phone.length < 10) return 'Please enter a valid phone number';
    
    return null;
  };

  const handleRegister = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    setIsLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.error || 'Failed to create account. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-white" 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="pt-16 pb-6 px-6">
          <View className="items-center mb-6">
            <View 
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: APP_CONFIG.THEME_COLOR }}
            >
              <Ionicons name="person-add" size={40} color="white" />
            </View>
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              Create Account
            </Text>
            <Text className="text-gray-600 text-center text-base">
              Join BharatCare for better healthcare
            </Text>
          </View>
        </View>

        {/* Registration Form */}
        <View className="flex-1 px-6">
          {/* Personal Information */}
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Personal Information
          </Text>
          
          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-medium mb-2">Full Name</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
              autoCapitalize="words"
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-medium mb-2">Email Address</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-medium mb-2">Phone Number</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
              placeholder="Enter your phone number"
              placeholderTextColor="#9CA3AF"
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          {/* Security */}
          <Text className="text-lg font-semibold text-gray-800 mb-4 mt-6">
            Security
          </Text>

          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-medium mb-2">Password</Text>
            <View className="relative">
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base pr-12"
                placeholder="Create a password"
                placeholderTextColor="#9CA3AF"
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 16, top: 12 }}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-gray-700 text-sm font-medium mb-2">Confirm Password</Text>
            <View className="relative">
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base pr-12"
                placeholder="Confirm your password"
                placeholderTextColor="#9CA3AF"
                value={formData.confirmPassword}
                onChangeText={(value) => updateField('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: 16, top: 12 }}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Address Information */}
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Address Information
          </Text>

          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-medium mb-2">Address</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
              placeholder="Enter your address"
              placeholderTextColor="#9CA3AF"
              value={formData.addressLine}
              onChangeText={(value) => updateField('addressLine', value)}
              multiline
              numberOfLines={2}
            />
          </View>

          <View className="flex-row space-x-4 mb-4">
            <View className="flex-1">
              <Text className="text-gray-700 text-sm font-medium mb-2">City</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                placeholder="City"
                placeholderTextColor="#9CA3AF"
                value={formData.city}
                onChangeText={(value) => updateField('city', value)}
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-700 text-sm font-medium mb-2">State</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
                placeholder="State"
                placeholderTextColor="#9CA3AF"
                value={formData.state}
                onChangeText={(value) => updateField('state', value)}
              />
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-gray-700 text-sm font-medium mb-2">PIN Code</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base"
              placeholder="Enter PIN code"
              placeholderTextColor="#9CA3AF"
              value={formData.pin}
              onChangeText={(value) => updateField('pin', value)}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>

          {/* Register Button */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={isLoading}
            className="rounded-xl py-4 mb-6 items-center justify-center"
            style={{ 
              backgroundColor: APP_CONFIG.THEME_COLOR,
              opacity: isLoading ? 0.8 : 1,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white text-lg font-semibold">
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <View className="flex-row justify-center items-center mb-6">
            <Text className="text-gray-600 text-base">
              Already have an account? 
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity className="ml-2">
                <Text 
                  className="text-base font-semibold"
                  style={{ color: APP_CONFIG.THEME_COLOR }}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Footer */}
        <View className="px-6 pb-8">
          <Text className="text-center text-gray-500 text-sm">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 