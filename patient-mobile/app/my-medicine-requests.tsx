import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/authContext';
import { apiService } from '../lib/api';
import { APP_CONFIG } from '../lib/config';
import { GlobalMedicineRequest } from '../lib/types';

export default function MyMedicineRequestsScreen() {
  const { authState } = useAuth();
  const [requests, setRequests] = useState<GlobalMedicineRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await apiService.getMyGlobalMedicineRequests();
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchRequests();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#F59E0B';
      case 'quoted':
        return '#3B82F6';
      case 'accepted':
        return '#10B981';
      case 'delivered':
        return '#059669';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'time-outline';
      case 'quoted':
        return 'document-text-outline';
      case 'accepted':
        return 'checkmark-circle-outline';
      case 'delivered':
        return 'checkmark-done-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color={APP_CONFIG.THEME_COLOR} />
        <Text className="text-gray-600 mt-4">Loading your requests...</Text>
      </View>
    );
  }

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
            <Text className="text-white text-xl font-bold">My Medicine Requests</Text>
            <Text className="text-white/80 text-sm">{requests.length} requests</Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/global-medicine')}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={APP_CONFIG.THEME_COLOR}
          />
        }
      >
        {requests.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6 py-20">
            <View 
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
            >
              <Ionicons name="medical-outline" size={40} color={APP_CONFIG.THEME_COLOR} />
            </View>
            <Text className="text-xl font-semibold text-gray-800 mb-2">No Requests Yet</Text>
            <Text className="text-gray-600 text-center mb-6">
              Upload your first prescription to get medicine quotes from nearby stores
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/global-medicine')}
              className="rounded-xl py-3 px-6"
              style={{ backgroundColor: APP_CONFIG.THEME_COLOR }}
            >
              <Text className="text-white font-semibold">Upload Prescription</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="px-6 py-6 space-y-4">
            {requests.map((request) => (
              <TouchableOpacity
                key={request.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                onPress={() => {
                  // Navigate to request details if needed
                  console.log('Request details:', request);
                }}
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <Ionicons 
                        name={getStatusIcon(request.status)} 
                        size={20} 
                        color={getStatusColor(request.status)} 
                      />
                      <Text 
                        className="ml-2 font-semibold capitalize"
                        style={{ color: getStatusColor(request.status) }}
                      >
                        {request.status}
                      </Text>
                    </View>
                    <Text className="text-sm text-gray-600">
                      Requested on {formatDate(request.createdAt)}
                    </Text>
                  </View>
                  
                  {request.prescriptionImageUrl && (
                    <Image
                      source={{ uri: request.prescriptionImageUrl }}
                      className="w-16 h-16 rounded-lg"
                      resizeMode="cover"
                    />
                  )}
                </View>

                {request.notes && (
                  <View className="mb-3">
                    <Text className="text-sm font-medium text-gray-800 mb-1">Notes:</Text>
                    <Text className="text-sm text-gray-600">{request.notes}</Text>
                  </View>
                )}

                <View className="mb-3">
                  <Text className="text-sm font-medium text-gray-800 mb-1">Delivery Address:</Text>
                  <Text className="text-sm text-gray-600">{request.deliveryAddress}</Text>
                </View>

                {request.quotes && request.quotes.length > 0 && (
                  <View className="border-t border-gray-100 pt-3">
                    <Text className="text-sm font-medium text-gray-800 mb-2">
                      {request.quotes.length} Quote{request.quotes.length > 1 ? 's' : ''} Received
                    </Text>
                    <View className="flex-row items-center">
                      <Ionicons name="pricetag-outline" size={16} color="#10B981" />
                      <Text className="text-sm text-green-600 ml-1">
                        Best Price: ₹{Math.min(...request.quotes.map(q => q.totalAmount))}
                      </Text>
                    </View>
                  </View>
                )}

                <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <Text className="text-xs text-gray-500">
                    ID: {request.id.slice(-8)}
                  </Text>
                  <View className="flex-row items-center">
                    <Text className="text-xs text-gray-500 mr-1">View Details</Text>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
} 