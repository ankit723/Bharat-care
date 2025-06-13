import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/authContext';
import { apiService } from '../../lib/api';
import { APP_CONFIG } from '../../lib/config';

interface NextVisit {
  id: string;
  nextVisit: string;
  doctor?: {
    id: string;
    name: string;
    specialization: string;
  };
  checkupCenter?: {
    id: string;
    name: string;
  };
}

export default function CalendarScreen() {
  const { authState } = useAuth();
  const [nextVisits, setNextVisits] = useState<NextVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminUserId, setAdminUserId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const profile = await apiService.getProfile();
      
      const allVisits: NextVisit[] = [];
      
      // Add doctor visits - use type assertion since the API includes these properties
      const profileWithVisits = profile as any;
      if (profileWithVisits.doctorNextVisit && Array.isArray(profileWithVisits.doctorNextVisit)) {
        profileWithVisits.doctorNextVisit.forEach((visit: any) => {
          allVisits.push({
            id: visit.id,
            nextVisit: visit.nextVisit,
            doctor: visit.doctor,
          });
        });
      }
      
      // Add checkup center visits
      if (profileWithVisits.checkupCenterNextVisit && Array.isArray(profileWithVisits.checkupCenterNextVisit)) {
        profileWithVisits.checkupCenterNextVisit.forEach((visit: any) => {
          allVisits.push({
            id: visit.id,
            nextVisit: visit.nextVisit,
            checkupCenter: visit.checkupCenter,
          });
        });
      }
      
      // Sort by date
      allVisits.sort((a, b) => new Date(a.nextVisit).getTime() - new Date(b.nextVisit).getTime());
      
      setNextVisits(allVisits);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysUntil = (dateString: string) => {
    const now = new Date();
    const visitDate = new Date(dateString);
    const diffTime = visitDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Past';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  };

  const handleCall = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Info', 'Phone number not available');
    }
  };

  const getUpcomingVisits = () => {
    const now = new Date();
    return nextVisits.filter(visit => new Date(visit.nextVisit) >= now);
  };

  const getPastVisits = () => {
    const now = new Date();
    return nextVisits.filter(visit => new Date(visit.nextVisit) < now);
  };

  const AppointmentCard = ({ visit }: { visit: NextVisit }) => {
    const isUpcoming = new Date(visit.nextVisit) >= new Date();
    const daysUntil = getDaysUntil(visit.nextVisit);
    
    return (
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <View 
                className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
              >
                <Ionicons 
                  name={visit.doctor ? "medical" : "business"} 
                  size={20} 
                  color={APP_CONFIG.THEME_COLOR} 
                />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-800">
                  {visit.doctor ? visit.doctor.name : visit.checkupCenter?.name}
                </Text>
                <Text className="text-sm text-gray-600">
                  {visit.doctor ? visit.doctor.specialization : 'Checkup Center'}
                </Text>
              </View>
            </View>
          </View>
          
          <View className={`px-3 py-1 rounded-full ${
            isUpcoming 
              ? daysUntil === 'Today' 
                ? 'bg-red-100' 
                : 'bg-blue-100'
              : 'bg-gray-100'
          }`}>
            <Text className={`text-xs font-medium ${
              isUpcoming 
                ? daysUntil === 'Today' 
                  ? 'text-red-700' 
                  : 'text-blue-700'
                : 'text-gray-600'
            }`}>
              {daysUntil}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center mb-3">
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text className="text-sm text-gray-600 ml-2">
            {formatDate(visit.nextVisit)}
          </Text>
        </View>

        <View className="flex-row items-center mb-3">
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text className="text-sm text-gray-600 ml-2">
            {formatTime(visit.nextVisit)}
          </Text>
        </View>

        {isUpcoming && (
          <View className="flex-row space-x-2 mt-3">
            <TouchableOpacity
              onPress={() => handleCall('tel:+919876543210')} // You'd get this from the provider data
              className="flex-1 bg-green-50 p-3 rounded-lg"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="call" size={16} color="#059669" />
                <Text className="ml-2 text-green-700 font-medium text-sm">Call</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-1 p-3 rounded-lg"
              style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="location" size={16} color={APP_CONFIG.THEME_COLOR} />
                <Text className="ml-2 font-medium text-sm" style={{ color: APP_CONFIG.THEME_COLOR }}>
                  Directions
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const handleAssignToAdmin = async () => {
    if (!adminUserId.trim()) {
      Alert.alert('Error', 'Please enter a healthcare provider user ID');
      return;
    }

    setIsAssigning(true);
    try {
      // Call API to assign patient to healthcare provider
      const response = await apiService.assignPatientToProvider(adminUserId.trim());
      
      Alert.alert(
        'Success! 🎉',
        response.message || 'You have been successfully assigned to the healthcare provider. They can now manage your appointments and medical records.',
        [{ text: 'OK', onPress: () => {
          setShowAssignModal(false);
          setAdminUserId('');
        }}]
      );
    } catch (error: any) {
      console.error('Error assigning to healthcare provider:', error);
      Alert.alert(
        'Assignment Failed',
        error.response?.data?.error || 'Failed to assign to healthcare provider. Please check the user ID and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color={APP_CONFIG.THEME_COLOR} />
        <Text className="mt-4 text-gray-600">Loading appointments...</Text>
      </View>
    );
  }

  const upcomingVisits = getUpcomingVisits();
  const pastVisits = getPastVisits();

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="light" />
      
      {/* Header */}
      <View 
        className="px-6 pt-16 pb-6"
        style={{ backgroundColor: APP_CONFIG.THEME_COLOR }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-2xl font-bold">My Appointments</Text>
            <Text className="text-white/80 text-base">
              {upcomingVisits.length} upcoming appointment{upcomingVisits.length !== 1 ? 's' : ''}
            </Text>
          </View>
          {/* <TouchableOpacity 
            className="w-12 h-12 bg-white/20 rounded-full items-center justify-center"
            onPress={() => setShowAssignModal(true)}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity> */}
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
        {upcomingVisits.length === 0 && pastVisits.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <View 
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: `${APP_CONFIG.THEME_COLOR}15` }}
            >
              <Ionicons name="calendar-outline" size={40} color={APP_CONFIG.THEME_COLOR} />
            </View>
            <Text className="text-xl font-semibold text-gray-800 mb-2">No Appointments</Text>
            <Text className="text-gray-600 text-center px-8">
              You don't have any scheduled appointments yet. Check back later or contact your healthcare providers.
            </Text>
          </View>
        ) : (
          <View className="px-6">
            {/* Upcoming Appointments */}
            {upcomingVisits.length > 0 && (
              <View className="py-6">
                <Text className="text-lg font-semibold text-gray-800 mb-4">
                  Upcoming Appointments ({upcomingVisits.length})
                </Text>
                {upcomingVisits.map((visit) => (
                  <AppointmentCard key={visit.id} visit={visit} />
                ))}
              </View>
            )}

            {/* Past Appointments */}
            {pastVisits.length > 0 && (
              <View className="py-6">
                <Text className="text-lg font-semibold text-gray-800 mb-4">
                  Past Appointments ({pastVisits.length})
                </Text>
                {pastVisits.slice(0, 5).map((visit) => (
                  <AppointmentCard key={visit.id} visit={visit} />
                ))}
                {pastVisits.length > 5 && (
                  <TouchableOpacity className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <Text className="text-center text-gray-600">
                      + {pastVisits.length - 5} more past appointments
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Assign to Healthcare Provider Modal */}
      <Modal
        visible={showAssignModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-gray-800">Assign to Healthcare Provider</Text>
              <TouchableOpacity
                onPress={() => setShowAssignModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="mb-6">
              <Text className="text-base text-gray-700 mb-4">
                Enter the User ID of the healthcare provider (doctor, checkup center, or med store) who will manage your appointments and medical records:
              </Text>
              
              <View className="border border-gray-300 rounded-xl p-4 mb-4">
                <TextInput
                  value={adminUserId}
                  onChangeText={setAdminUserId}
                  placeholder="Enter provider user ID (e.g., SMITH123)"
                  className="text-base text-gray-800"
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>

              <Text className="text-sm text-gray-500 mb-6">
                💡 You can find the provider's User ID on their detail page by tapping the copy button next to their User ID.
              </Text>
            </View>

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setShowAssignModal(false)}
                className="flex-1 bg-gray-100 p-4 rounded-xl"
              >
                <Text className="text-center text-gray-700 font-semibold">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleAssignToAdmin}
                disabled={isAssigning || !adminUserId.trim()}
                className="flex-1 p-4 rounded-xl"
                style={{ 
                  backgroundColor: (!adminUserId.trim() || isAssigning) ? '#D1D5DB' : APP_CONFIG.THEME_COLOR 
                }}
              >
                {isAssigning ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center text-white font-semibold">Assign</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
} 