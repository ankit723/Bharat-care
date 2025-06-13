import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { apiService } from '../lib/api';
import { deleteFileFromSupabase } from '../lib/supabase';
import { MedDocument, DocumentUploadData, Doctor, CheckupCenter } from '../lib/types';
import { APP_CONFIG } from '../lib/config';

interface MedStoreHandRaise {
  id: string;
  medStoreId: string;
  medDocumentId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  medStore: {
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    state: string;
  };
}

export default function DocumentDetailsScreen() {
  const { documentId } = useLocalSearchParams<{ documentId: string }>();
  const [document, setDocument] = useState<MedDocument | null>(null);
  const [medStoreHandRaises, setMedStoreHandRaises] = useState<MedStoreHandRaise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [permissionsModalVisible, setPermissionsModalVisible] = useState(false);
  const [handRaisesModalVisible, setHandRaisesModalVisible] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [checkupCenters, setCheckupCenters] = useState<CheckupCenter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editForm, setEditForm] = useState({
    description: '',
    seekAvailability: false,
  });

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      setIsLoading(true);
      const doc = await apiService.getDocumentById(documentId);
      setDocument(doc);
      
      // Extract med store hand raises from the document if they exist
      if (doc.medStoreHandRaises) {
        setMedStoreHandRaises(doc.medStoreHandRaises);
      }
      
      setEditForm({
        description: doc.description || '',
        seekAvailability: doc.seekAvailability || false,
      });
    } catch (error) {
      console.error('Error fetching document:', error);
      Alert.alert('Error', 'Failed to load document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMedStoreHandRaises = async () => {
    try {
      const handRaises = await apiService.getMedStoreHandRaises(documentId);
      setMedStoreHandRaises(handRaises);
    } catch (error) {
      console.error('Error fetching med store hand raises:', error);
      // Don't show error to user as this is not critical
    }
  };

  const fetchProviders = async () => {
    try {
      const [doctorsResponse, centersResponse] = await Promise.all([
        apiService.getDoctors({ limit: 100 }),
        apiService.getCheckupCenters({ limit: 100 }),
      ]);
      setDoctors(doctorsResponse.data);
      setCheckupCenters(centersResponse.data);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const handleUpdateDocument = async () => {
    if (!document) return;

    try {
      setIsUpdating(true);
      const updatedDoc = await apiService.updateDocument(document.id, editForm);
      setDocument(updatedDoc.data);
      setEditModalVisible(false);
      Alert.alert('Success', 'Document updated successfully!');
    } catch (error) {
      console.error('Error updating document:', error);
      Alert.alert('Error', 'Failed to update document. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!document) return;

    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${document.fileName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteDocument(document.id);
              await deleteFileFromSupabase(document.fileUrl);
              Alert.alert('Success', 'Document deleted successfully!');
              router.back();
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Error', 'Failed to delete document. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleViewDocument = async () => {
    if (!document) return;

    try {
      await Linking.openURL(document.fileUrl);
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', 'Failed to open document. Please try again.');
    }
  };

  const handleShareDocument = async () => {
    if (!document) return;

    try {
      await Share.share({
        message: `Check out this document: ${document.fileName}`,
        url: document.fileUrl,
      });
    } catch (error) {
      console.error('Error sharing document:', error);
    }
  };

  const handleGrantDoctorPermission = async (doctorId: string) => {
    if (!document) return;

    try {
      const updatedDoc = await apiService.grantDoctorPermission(document.id, doctorId);
      setDocument(updatedDoc.data);
      Alert.alert('Success', 'Permission granted to doctor!');
    } catch (error) {
      console.error('Error granting permission:', error);
      Alert.alert('Error', 'Failed to grant permission.');
    }
  };

  const handleRevokeDoctorPermission = async (doctorId: string) => {
    if (!document) return;

    try {
      const updatedDoc = await apiService.revokeDoctorPermission(document.id, doctorId);
      setDocument(updatedDoc.data);
      Alert.alert('Success', 'Permission revoked from doctor!');
    } catch (error) {
      console.error('Error revoking permission:', error);
      Alert.alert('Error', 'Failed to revoke permission.');
    }
  };

  const handleGrantCheckupCenterPermission = async (centerId: string) => {
    if (!document) return;

    try {
      const updatedDoc = await apiService.grantCheckupCenterPermission(document.id, centerId);
      setDocument(updatedDoc.data);
      Alert.alert('Success', 'Permission granted to checkup center!');
    } catch (error) {
      console.error('Error granting permission:', error);
      Alert.alert('Error', 'Failed to grant permission.');
    }
  };

  const handleRevokeCheckupCenterPermission = async (centerId: string) => {
    if (!document) return;

    try {
      const updatedDoc = await apiService.revokeCheckupCenterPermission(document.id, centerId);
      setDocument(updatedDoc.data);
      Alert.alert('Success', 'Permission revoked from checkup center!');
    } catch (error) {
      console.error('Error revoking permission:', error);
      Alert.alert('Error', 'Failed to revoke permission.');
    }
  };

  const handleAcceptHandRaise = async (handRaise: MedStoreHandRaise) => {
    Alert.alert(
      'Accept Med Store Request',
      `Accept request from ${handRaise.medStore.name}? They will be able to contact you for medicine delivery.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await apiService.acceptMedStoreHandRaise(documentId, handRaise.medStoreId);
              await fetchMedStoreHandRaises();
              Alert.alert('Success', 'Med store request accepted!');
            } catch (error) {
              console.error('Error accepting hand raise:', error);
              Alert.alert('Error', 'Failed to accept request.');
            }
          },
        },
      ]
    );
  };

  const handleRejectHandRaise = async (handRaise: MedStoreHandRaise) => {
    Alert.alert(
      'Reject Med Store Request',
      `Reject request from ${handRaise.medStore.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.rejectMedStoreHandRaise(documentId, handRaise.medStoreId);
              await fetchMedStoreHandRaises();
              Alert.alert('Success', 'Med store request rejected.');
            } catch (error) {
              console.error('Error rejecting hand raise:', error);
              Alert.alert('Error', 'Failed to reject request.');
            }
          },
        },
      ]
    );
  };

  const openPermissionsModal = () => {
    fetchProviders();
    setPermissionsModalVisible(true);
  };

  const openHandRaisesModal = () => {
    setHandRaisesModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDocumentIcon = (documentType: string) => {
    switch (documentType) {
      case 'PRESCRIPTION':
        return 'medical';
      case 'MEDICAL_REPORT':
        return 'document-text';
      default:
        return 'document';
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCheckupCenters = checkupCenters.filter(center =>
    center.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={APP_CONFIG.THEME_COLOR} />
          <Text className="mt-4 text-gray-600">Loading document...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!document) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
          <Text className="text-lg font-semibold text-gray-600 mt-4">Document Not Found</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-blue-600 px-6 py-3 rounded-lg mt-6"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 flex-1 text-center">
            Document Details
          </Text>
          <TouchableOpacity onPress={handleShareDocument} className="p-2 -mr-2">
            <Ionicons name="share-outline" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Document Info Card */}
        <View className="bg-white mx-6 mt-6 rounded-lg p-6 shadow-sm border border-gray-100">
          <View className="flex-row items-start">
            <View className="bg-blue-100 p-4 rounded-lg mr-4">
              <Ionicons
                name={getDocumentIcon(document.documentType)}
                size={32}
                color={APP_CONFIG.THEME_COLOR}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900 mb-2">
                {document.fileName}
              </Text>
              <View className={`self-start px-3 py-1 rounded-full ${
                document.documentType === 'PRESCRIPTION' 
                  ? 'bg-green-100' 
                  : 'bg-blue-100'
              }`}>
                <Text className={`text-sm font-medium ${
                  document.documentType === 'PRESCRIPTION'
                    ? 'text-green-800'
                    : 'text-blue-800'
                }`}>
                  {document.documentType === 'PRESCRIPTION' ? 'Prescription' : 'Medical Report'}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-4 space-y-3">
            <View>
              <Text className="text-sm font-medium text-gray-700">Description</Text>
              <Text className="text-gray-900 mt-1">
                {document.description || 'No description provided'}
              </Text>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700">Uploaded</Text>
              <Text className="text-gray-900 mt-1">{formatDate(document.createdAt)}</Text>
            </View>

            {document.seekAvailability && (
              <View className="flex-row items-center">
                <Ionicons name="storefront-outline" size={16} color="#F59E0B" />
                <Text className="text-sm text-amber-600 ml-2">Available to med stores</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mx-6 mt-6 space-y-3">
          <TouchableOpacity
            onPress={handleViewDocument}
            className="bg-blue-600 py-4 rounded-lg flex-row items-center justify-center"
          >
            <Ionicons name="eye" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">View Document</Text>
          </TouchableOpacity>

          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={() => setEditModalVisible(true)}
              className="flex-1 bg-gray-600 py-3 rounded-lg flex-row items-center justify-center"
            >
              <Ionicons name="create-outline" size={18} color="white" />
              <Text className="text-white font-medium ml-2">Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={openPermissionsModal}
              className="flex-1 bg-green-600 py-3 rounded-lg flex-row items-center justify-center"
            >
              <Ionicons name="people-outline" size={18} color="white" />
              <Text className="text-white font-medium ml-2">Permissions</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleDeleteDocument}
            className="bg-red-600 py-3 rounded-lg flex-row items-center justify-center"
          >
            <Ionicons name="trash-outline" size={18} color="white" />
            <Text className="text-white font-medium ml-2">Delete Document</Text>
          </TouchableOpacity>
        </View>

        {/* Permissions Summary */}
        <View className="bg-white mx-6 mt-6 mb-6 rounded-lg p-6 shadow-sm border border-gray-100">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Access Permissions</Text>
          
          <View className="space-y-3">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Doctors ({document.permittedDoctorIds.length})
              </Text>
              {document.permittedDoctorIds.length === 0 ? (
                <Text className="text-gray-500 text-sm">No doctors have access</Text>
              ) : (
                <Text className="text-gray-900 text-sm">
                  {document.permittedDoctorIds.length} doctor{document.permittedDoctorIds.length !== 1 ? 's' : ''} can view this document
                </Text>
              )}
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Checkup Centers ({document.permittedCheckupCenterIds.length})
              </Text>
              {document.permittedCheckupCenterIds.length === 0 ? (
                <Text className="text-gray-500 text-sm">No checkup centers have access</Text>
              ) : (
                <Text className="text-gray-900 text-sm">
                  {document.permittedCheckupCenterIds.length} checkup center{document.permittedCheckupCenterIds.length !== 1 ? 's' : ''} can view this document
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Med Store Interest Section - Only for prescriptions with seekAvailability */}
        {document.documentType === 'PRESCRIPTION' && document.seekAvailability && (
          <View className="bg-white mx-6 mt-6 mb-6 rounded-lg p-6 shadow-sm border border-gray-100">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Ionicons name="storefront" size={20} color="#F59E0B" />
                <Text className="text-lg font-semibold text-gray-900 ml-2">Med Store Interest</Text>
              </View>
              {medStoreHandRaises.length > 0 && (
                <TouchableOpacity
                  onPress={openHandRaisesModal}
                  className="bg-amber-100 px-3 py-1 rounded-full"
                >
                  <Text className="text-amber-800 text-sm font-medium">
                    {medStoreHandRaises.length} request{medStoreHandRaises.length !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            <Text className="text-sm text-gray-600 mb-4">
              This prescription is available to med stores. They can express interest to fulfill your medicine order.
            </Text>

            {medStoreHandRaises.length > 0 ? (
              <TouchableOpacity
                onPress={openHandRaisesModal}
                className="bg-amber-600 py-3 rounded-lg flex-row items-center justify-center"
              >
                <Ionicons name="eye" size={18} color="white" />
                <Text className="text-white font-medium ml-2">
                  View {medStoreHandRaises.length} Request{medStoreHandRaises.length !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            ) : (
              <View className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <View className="flex-row items-center">
                  <Ionicons name="information-circle" size={16} color="#F59E0B" />
                  <Text className="text-sm text-amber-800 ml-2 font-medium">
                    Med stores can see this prescription
                  </Text>
                </View>
                <Text className="text-xs text-amber-700 mt-1">
                  Interested med stores will be able to contact you directly for medicine delivery.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="px-6 py-4 border-b border-gray-200">
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-bold text-gray-900">Edit Document</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                className="p-2"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1 px-6 py-4">
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Description</Text>
                <TextInput
                  value={editForm.description}
                  onChangeText={(text) => setEditForm({ ...editForm, description: text })}
                  placeholder="Enter a description for this document..."
                  multiline
                  numberOfLines={4}
                  className="border border-gray-300 rounded-lg p-3 text-gray-900"
                  style={{ textAlignVertical: 'top' }}
                />
              </View>

              {/* Seek Availability - Only for Prescriptions */}
              {document.documentType === 'PRESCRIPTION' && (
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700">Make Available to Med Stores</Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      Allow med stores to see this prescription for medicine orders
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setEditForm({ 
                      ...editForm, 
                      seekAvailability: !editForm.seekAvailability 
                    })}
                    className={`w-12 h-6 rounded-full ${
                      editForm.seekAvailability ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                        editForm.seekAvailability ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                      style={{ marginTop: 2 }}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          <View className="px-6 py-4 border-t border-gray-200">
            <TouchableOpacity
              onPress={handleUpdateDocument}
              disabled={isUpdating}
              className={`py-3 rounded-lg ${
                isUpdating ? 'bg-gray-300' : 'bg-blue-600'
              }`}
            >
              {isUpdating ? (
                <View className="flex-row justify-center items-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-semibold ml-2">Updating...</Text>
                </View>
              ) : (
                <Text className="text-white font-semibold text-center">Update Document</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Permissions Modal */}
      <Modal
        visible={permissionsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="px-6 py-4 border-b border-gray-200">
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-bold text-gray-900">Manage Permissions</Text>
              <TouchableOpacity
                onPress={() => setPermissionsModalVisible(false)}
                className="p-2"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="px-6 py-4 border-b border-gray-200">
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
              <Ionicons name="search" size={20} color="#6B7280" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search doctors or checkup centers..."
                className="flex-1 ml-2 text-gray-900"
              />
            </View>
          </View>

          <ScrollView className="flex-1">
            {/* Doctors Section */}
            <View className="px-6 py-4">
              <Text className="text-lg font-semibold text-gray-900 mb-3">Doctors</Text>
              {filteredDoctors.map((doctor) => (
                <View key={doctor.id} className="flex-row items-center justify-between py-3 border-b border-gray-100">
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">{doctor.name}</Text>
                    <Text className="text-sm text-gray-600">{doctor.specialization}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      if (document.permittedDoctorIds.includes(doctor.id)) {
                        handleRevokeDoctorPermission(doctor.id);
                      } else {
                        handleGrantDoctorPermission(doctor.id);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg ${
                      document.permittedDoctorIds.includes(doctor.id)
                        ? 'bg-red-100'
                        : 'bg-green-100'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        document.permittedDoctorIds.includes(doctor.id)
                          ? 'text-red-700'
                          : 'text-green-700'
                      }`}
                    >
                      {document.permittedDoctorIds.includes(doctor.id) ? 'Revoke' : 'Grant'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Checkup Centers Section */}
            <View className="px-6 py-4">
              <Text className="text-lg font-semibold text-gray-900 mb-3">Checkup Centers</Text>
              {filteredCheckupCenters.map((center) => (
                <View key={center.id} className="flex-row items-center justify-between py-3 border-b border-gray-100">
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">{center.name}</Text>
                    <Text className="text-sm text-gray-600">{center.city}, {center.state}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      if (document.permittedCheckupCenterIds.includes(center.id)) {
                        handleRevokeCheckupCenterPermission(center.id);
                      } else {
                        handleGrantCheckupCenterPermission(center.id);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg ${
                      document.permittedCheckupCenterIds.includes(center.id)
                        ? 'bg-red-100'
                        : 'bg-green-100'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        document.permittedCheckupCenterIds.includes(center.id)
                          ? 'text-red-700'
                          : 'text-green-700'
                      }`}
                    >
                      {document.permittedCheckupCenterIds.includes(center.id) ? 'Revoke' : 'Grant'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Med Store Hand Raises Modal */}
      <Modal
        visible={handRaisesModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="px-6 py-4 border-b border-gray-200">
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-bold text-gray-900">Med Store Requests</Text>
              <TouchableOpacity
                onPress={() => setHandRaisesModalVisible(false)}
                className="p-2"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1">
            {medStoreHandRaises.length === 0 ? (
              <View className="flex-1 justify-center items-center py-20">
                <Ionicons name="storefront-outline" size={64} color="#9CA3AF" />
                <Text className="text-lg font-semibold text-gray-600 mt-4">No Requests Yet</Text>
                <Text className="text-gray-500 text-center mt-2 px-8">
                  Med stores haven't expressed interest in this prescription yet.
                </Text>
              </View>
            ) : (
              <View className="px-6 py-4">
                <Text className="text-sm text-gray-600 mb-4">
                  {medStoreHandRaises.length} med store{medStoreHandRaises.length !== 1 ? 's have' : ' has'} expressed interest in fulfilling this prescription.
                </Text>
                
                {medStoreHandRaises.map((handRaise) => (
                  <View key={handRaise.id} className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-100">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-900 mb-1">
                          {handRaise.medStore.name}
                        </Text>
                        <Text className="text-sm text-gray-600 mb-2">
                          {handRaise.medStore.city}, {handRaise.medStore.state}
                        </Text>
                        <View className="flex-row items-center mb-2">
                          <Ionicons name="mail-outline" size={14} color="#6B7280" />
                          <Text className="text-xs text-gray-500 ml-1">{handRaise.medStore.email}</Text>
                        </View>
                        <View className="flex-row items-center mb-3">
                          <Ionicons name="call-outline" size={14} color="#6B7280" />
                          <Text className="text-xs text-gray-500 ml-1">{handRaise.medStore.phone}</Text>
                        </View>
                        <View className="flex-row items-center">
                          <View className={`px-2 py-1 rounded-full ${
                            handRaise.status === 'PENDING' 
                              ? 'bg-yellow-100' 
                              : handRaise.status === 'ACCEPTED'
                              ? 'bg-green-100'
                              : 'bg-red-100'
                          }`}>
                            <Text className={`text-xs font-medium ${
                              handRaise.status === 'PENDING'
                                ? 'text-yellow-800'
                                : handRaise.status === 'ACCEPTED'
                                ? 'text-green-800'
                                : 'text-red-800'
                            }`}>
                              {handRaise.status}
                            </Text>
                          </View>
                          <Text className="text-xs text-gray-500 ml-2">
                            {new Date(handRaise.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      
                      {handRaise.status === 'PENDING' && (
                        <View className="flex-row space-x-2 ml-3">
                          <TouchableOpacity
                            onPress={() => handleAcceptHandRaise(handRaise)}
                            className="bg-green-600 px-3 py-2 rounded-lg"
                          >
                            <Text className="text-white text-xs font-medium">Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleRejectHandRaise(handRaise)}
                            className="bg-red-600 px-3 py-2 rounded-lg"
                          >
                            <Text className="text-white text-xs font-medium">Reject</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
} 