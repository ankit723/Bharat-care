import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/authContext';
import { apiService } from '../../lib/api';
import { APP_CONFIG } from '../../lib/config';
import { 
  Doctor, 
  Hospital, 
  MedStore, 
  CheckupCenter,
  SearchFilters,
} from '../../lib/types';

type ProviderType = 'DOCTOR' | 'HOSPITAL' | 'MEDSTORE' | 'CHECKUP_CENTER';

export default function SearchScreen() {
  const { authState } = useAuth();
  const [selectedType, setSelectedType] = useState<ProviderType>('DOCTOR');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const searchProviders = useCallback(async (query: string = searchQuery, type: ProviderType = selectedType) => {
    try {
      setIsLoading(true);
      let response;
      
      const searchParams = { 
        search: query.trim() || undefined,
        limit: 20,
      };

      switch (type) {
        case 'DOCTOR':
          response = await apiService.getDoctors(searchParams);
          break;
        case 'HOSPITAL':
          response = await apiService.getHospitals(searchParams);
          break;
        case 'MEDSTORE':
          response = await apiService.getMedStores(searchParams);
          break;
        case 'CHECKUP_CENTER':
          response = await apiService.getCheckupCenters(searchParams);
          break;
        default:
          response = { data: [] };
      }

      setSearchResults(response.data || []);
      setHasSearched(true);
    } catch (error) {
      console.error('Error searching providers:', error);
      Alert.alert('Error', 'Failed to search providers');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedType]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await searchProviders();
    setRefreshing(false);
  }, [searchProviders]);

  useEffect(() => {
    // Auto-search when type changes or on initial load
    searchProviders('', selectedType);
  }, [selectedType]);

  const handleSearch = () => {
    if (searchQuery.trim() || !hasSearched) {
      searchProviders();
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to make phone call');
    });
  };

  const getProviderIcon = (type: ProviderType) => {
    switch (type) {
      case 'DOCTOR': return 'person';
      case 'HOSPITAL': return 'business';
      case 'MEDSTORE': return 'medical';
      case 'CHECKUP_CENTER': return 'clipboard';
      default: return 'search';
    }
  };

  const getProviderTitle = (type: ProviderType) => {
    switch (type) {
      case 'DOCTOR': return 'Doctors';
      case 'HOSPITAL': return 'Hospitals';
      case 'MEDSTORE': return 'Medical Stores';
      case 'CHECKUP_CENTER': return 'Checkup Centers';
      default: return 'Search';
    }
  };

  const TypeSelector = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      className="mb-6"
      contentContainerStyle={{ paddingHorizontal: 24 }}
    >
      {(['DOCTOR', 'HOSPITAL', 'MEDSTORE', 'CHECKUP_CENTER'] as ProviderType[]).map((type) => (
        <TouchableOpacity
          key={type}
          onPress={() => setSelectedType(type)}
          className={`mr-4 px-6 py-3 rounded-xl flex-row items-center ${
            selectedType === type 
              ? 'shadow-sm' 
              : 'bg-gray-100'
          }`}
          style={{
            backgroundColor: selectedType === type ? APP_CONFIG.THEME_COLOR : undefined,
          }}
        >
          <Ionicons 
            name={getProviderIcon(type) as any} 
            size={20} 
            color={selectedType === type ? 'white' : '#6B7280'} 
          />
          <Text className={`ml-2 font-medium ${
            selectedType === type ? 'text-white' : 'text-gray-600'
          }`}>
            {getProviderTitle(type)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const ProviderCard = ({ provider, type }: { provider: any; type: ProviderType }) => (
    <TouchableOpacity
      onPress={() => {
        if (type === 'DOCTOR') {
          router.push(`/doctor-details?id=${provider.id}`);
        }
        // Add navigation for other provider types
      }}
      className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-800 mb-1">
            {provider.name}
          </Text>
          {type === 'DOCTOR' && provider.specialization && (
            <Text className="text-sm text-gray-600 mb-2">
              {provider.specialization}
            </Text>
          )}
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={14} color="#9CA3AF" />
            <Text className="text-sm text-gray-500 ml-1">
              {provider.city}, {provider.state}
            </Text>
          </View>
        </View>
        
        <View className="items-end">
          <View 
            className={`px-3 py-1 rounded-full mb-2 ${
              provider.verificationStatus === 'VERIFIED' 
                ? 'bg-green-100' 
                : provider.verificationStatus === 'PENDING'
                ? 'bg-yellow-100'
                : 'bg-red-100'
            }`}
          >
            <Text className={`text-xs font-medium ${
              provider.verificationStatus === 'VERIFIED' 
                ? 'text-green-700' 
                : provider.verificationStatus === 'PENDING'
                ? 'text-yellow-700'
                : 'text-red-700'
            }`}>
              {provider.verificationStatus === 'VERIFIED' ? 'Verified' : provider.verificationStatus}
            </Text>
          </View>
          
          {provider.rating && (
            <View className="flex-row items-center">
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text className="text-sm font-medium text-gray-700 ml-1">
                {provider.rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
        <View className="flex-row items-center">
          <Ionicons name="mail-outline" size={14} color="#9CA3AF" />
          <Text className="text-sm text-gray-500 ml-1" numberOfLines={1}>
            {provider.email}
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={() => handleCall(provider.phone)}
          className="flex-row items-center px-4 py-2 rounded-lg"
          style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
        >
          <Ionicons name="call" size={16} color={APP_CONFIG.THEME_COLOR} />
          <Text 
            className="ml-2 font-medium"
            style={{ color: APP_CONFIG.THEME_COLOR }}
          >
            Call
          </Text>
        </TouchableOpacity>
      </View>

      {provider.addressLine && (
        <View className="mt-3 pt-3 border-t border-gray-100">
          <View className="flex-row items-start">
            <Ionicons name="home-outline" size={14} color="#9CA3AF" />
            <Text className="text-sm text-gray-600 ml-2 flex-1">
              {provider.addressLine}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const QuickActionCard = ({ 
    title, 
    subtitle, 
    icon, 
    color, 
    onPress 
  }: {
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 p-4 rounded-xl mr-3"
      style={{ backgroundColor: `${color}15` }}
    >
      <View 
        className="w-10 h-10 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: `${color}25` }}
      >
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text className="text-base font-semibold text-gray-800 mb-1">
        {title}
      </Text>
      <Text className="text-sm text-gray-600">
        {subtitle}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View 
        className="px-6 pt-16 pb-6"
        style={{ backgroundColor: APP_CONFIG.THEME_COLOR }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-2xl font-bold">Search</Text>
          <TouchableOpacity 
            onPress={() => router.push('/global-medicine')}
            className="w-12 h-12 bg-white/20 rounded-full items-center justify-center"
          >
            <Ionicons name="document-text" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="bg-white rounded-xl flex-row items-center px-4 py-3">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-base text-gray-800"
            placeholder={`Search ${getProviderTitle(selectedType).toLowerCase()}...`}
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                searchProviders('', selectedType);
              }}
              className="ml-2"
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
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
        {/* Quick Actions */}
        <View className="px-6 mb-6 mt-4">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</Text>
          <View className="flex-row">
            <QuickActionCard
              title="Global Medicine"
              subtitle="Upload prescription"
              icon="document-text"
              color={APP_CONFIG.THEME_COLOR}
              onPress={() => router.push('/global-medicine')}
            />
            <QuickActionCard
              title="Emergency"
              subtitle="24/7 support"
              icon="medical"
              color={APP_CONFIG.ERROR_COLOR}
              onPress={() => Linking.openURL('tel:108')}
            />
          </View>
        </View>

        {/* Provider Type Selector */}
        <TypeSelector />

        {/* Search Results */}
        <View className="px-6 pb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-800">
              {getProviderTitle(selectedType)}
              {hasSearched && ` (${searchResults.length})`}
            </Text>
            
            {searchQuery.trim() && (
              <TouchableOpacity
                onPress={handleSearch}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: APP_CONFIG.THEME_COLOR }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-medium">Search</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {isLoading && !refreshing ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color={APP_CONFIG.THEME_COLOR} />
              <Text className="mt-4 text-gray-600">Searching...</Text>
            </View>
          ) : searchResults.length === 0 && hasSearched ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <View 
                className="w-16 h-16 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
              >
                <Ionicons 
                  name="search-outline" 
                  size={32} 
                  color={APP_CONFIG.THEME_COLOR} 
                />
              </View>
              <Text className="text-lg font-semibold text-gray-800 mb-2">
                No {getProviderTitle(selectedType)} Found
              </Text>
              <Text className="text-gray-600 text-center mb-4">
                {searchQuery.trim() 
                  ? `No results found for "${searchQuery}"`
                  : `No ${getProviderTitle(selectedType).toLowerCase()} available in your area`
                }
              </Text>
              {searchQuery.trim() && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    searchProviders('', selectedType);
                  }}
                  className="px-6 py-3 rounded-xl"
                  style={{ backgroundColor: APP_CONFIG.THEME_COLOR }}
                >
                  <Text className="text-white font-semibold">Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            searchResults.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                type={selectedType}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
} 