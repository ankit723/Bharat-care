import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { apiService } from '../../lib/api';
import { uploadFileToSupabase, deleteFileFromSupabase } from '../../lib/supabase';
import { MedDocument, DocumentUploadData } from '../../lib/types';
import { APP_CONFIG } from '../../lib/config';

const { width } = Dimensions.get('window');

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<MedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PRESCRIPTION' | 'MEDICAL_REPORT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [uploadForm, setUploadForm] = useState({
    documentType: 'PRESCRIPTION' as 'PRESCRIPTION' | 'MEDICAL_REPORT',
    description: '',
    seekAvailability: false,
  });

  const fetchDocuments = useCallback(async () => {
    try {
      const params = selectedFilter !== 'ALL' ? { documentType: selectedFilter } : {};
      const docs = await apiService.getMyDocuments(params);
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      Alert.alert('Error', 'Failed to load documents. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUploadDocument = async () => {
    Alert.alert(
      'Select Document Source',
      'Choose how you want to add your document',
      [
        { text: 'Camera', onPress: () => pickImageFromCamera() },
        { text: 'Gallery', onPress: () => pickImageFromGallery() },
        { text: 'Files', onPress: () => pickDocumentFromFiles() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const pickImageFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      processSelectedFile({
        uri: result.assets[0].uri,
        name: `document_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
    }
  };

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery permission is required to select photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      processSelectedFile({
        uri: result.assets[0].uri,
        name: `document_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
    }
  };

  const pickDocumentFromFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        processSelectedFile({
          uri: result.assets[0].uri,
          name: result.assets[0].name,
          type: result.assets[0].mimeType || 'application/pdf',
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document. Please try again.');
    }
  };

  const processSelectedFile = (file: { uri: string; name: string; type: string }) => {
    setSelectedFile(file);
    setUploadModalVisible(true);
  };

  const submitUpload = async () => {
    if (!selectedFile || !uploadForm.description.trim()) {
      Alert.alert('Error', 'Please provide a description for the document.');
      return;
    }

    setIsUploading(true);
    try {
      console.log('Starting document upload process...');
      
      // Upload file to Supabase
      const { fileUrl, fileName } = await uploadFileToSupabase(selectedFile);
      console.log('File uploaded successfully:', { fileUrl, fileName });

      // Create document record
      const documentData: DocumentUploadData = {
        fileName,
        fileUrl,
        documentType: uploadForm.documentType,
        description: uploadForm.description,
        seekAvailability: uploadForm.seekAvailability,
      };

      console.log('Creating document record:', documentData);
      await apiService.uploadDocument(documentData);
      console.log('Document record created successfully');

      Alert.alert('Success', 'Document uploaded successfully!');
      setUploadModalVisible(false);
      setSelectedFile(null);
      setUploadForm({
        documentType: 'PRESCRIPTION',
        description: '',
        seekAvailability: false,
      });
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      
      let errorMessage = 'Failed to upload document. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.';
        } else if (error.message.includes('Upload failed')) {
          errorMessage = 'File upload failed. Please try again with a different file.';
        } else if (error.message.includes('Unauthorized')) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else {
          errorMessage = `Upload failed: ${error.message}`;
        }
      }
      
      Alert.alert('Upload Error', errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (document: MedDocument) => {
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
              fetchDocuments();
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Error', 'Failed to delete document. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDocumentPress = (document: MedDocument) => {
    router.push({
      pathname: '/document-details',
      params: { documentId: document.id },
    });
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesFilter = selectedFilter === 'ALL' || doc.documentType === selectedFilter;
    const matchesSearch = searchTerm === '' || 
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={APP_CONFIG.THEME_COLOR} />
          <Text className="mt-4 text-gray-600">Loading documents...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-gray-900">My Documents</Text>
            <Text className="text-sm text-gray-600 mt-1">
              {documents.length} document{documents.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleUploadDocument}
            className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-semibold ml-1">Upload</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="mt-4">
          <View className="relative">
            <Ionicons 
              name="search" 
              size={20} 
              color="#9CA3AF" 
              style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}
            />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search documents..."
              className="bg-gray-100 rounded-lg pl-10 pr-4 py-3 text-gray-900"
            />
          </View>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row mt-4 bg-gray-100 rounded-lg p-1">
          {(['ALL', 'PRESCRIPTION', 'MEDICAL_REPORT'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setSelectedFilter(filter)}
              className={`flex-1 py-2 px-3 rounded-md ${
                selectedFilter === filter ? 'bg-white shadow-sm' : ''
              }`}
            >
              <Text
                className={`text-center text-sm font-medium ${
                  selectedFilter === filter ? 'text-gray-900' : 'text-gray-600'
                }`}
              >
                {filter === 'ALL' ? 'All' : filter === 'PRESCRIPTION' ? 'Prescriptions' : 'Reports'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Documents List */}
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredDocuments.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
            <Text className="text-lg font-semibold text-gray-600 mt-4">No Documents Found</Text>
            <Text className="text-gray-500 text-center mt-2 px-8">
              {searchTerm ? 
                `No documents match "${searchTerm}"` :
                selectedFilter === 'ALL'
                  ? 'Upload your first medical document to get started'
                  : `No ${selectedFilter.toLowerCase().replace('_', ' ')}s found`}
            </Text>
            <TouchableOpacity
              onPress={handleUploadDocument}
              className="bg-blue-600 px-6 py-3 rounded-lg mt-6"
            >
              <Text className="text-white font-semibold">Upload Document</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="px-6 py-4">
            {filteredDocuments.map((document) => (
              <TouchableOpacity
                key={document.id}
                onPress={() => handleDocumentPress(document)}
                className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-100"
              >
                <View className="flex-row items-start">
                  <View className="bg-blue-100 p-3 rounded-lg mr-3">
                    <Ionicons
                      name={getDocumentIcon(document.documentType)}
                      size={24}
                      color={APP_CONFIG.THEME_COLOR}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900 mb-1">
                      {document.fileName}
                    </Text>
                    <Text className="text-sm text-gray-600 mb-2">
                      {document.description || 'No description'}
                    </Text>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View className={`px-2 py-1 rounded-full ${
                          document.documentType === 'PRESCRIPTION' 
                            ? 'bg-green-100' 
                            : 'bg-blue-100'
                        }`}>
                          <Text className={`text-xs font-medium ${
                            document.documentType === 'PRESCRIPTION'
                              ? 'text-green-800'
                              : 'text-blue-800'
                          }`}>
                            {document.documentType === 'PRESCRIPTION' ? 'Prescription' : 'Report'}
                          </Text>
                        </View>
                        <Text className="text-xs text-gray-500 ml-2">
                          {formatDate(document.createdAt)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteDocument(document);
                        }}
                        className="p-2"
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                    {document.seekAvailability && (
                      <View className="flex-row items-center mt-2">
                        <Ionicons name="storefront-outline" size={14} color="#F59E0B" />
                        <Text className="text-xs text-amber-600 ml-1">Available to med stores</Text>
                      </View>
                    )}
                    {(document.permittedDoctorIds.length > 0 || document.permittedCheckupCenterIds.length > 0) && (
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="people-outline" size={14} color="#10B981" />
                        <Text className="text-xs text-green-600 ml-1">
                          Shared with {document.permittedDoctorIds.length + document.permittedCheckupCenterIds.length} provider(s)
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Upload Modal */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="px-6 py-4 border-b border-gray-200">
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-bold text-gray-900">Upload Document</Text>
              <TouchableOpacity
                onPress={() => {
                  setUploadModalVisible(false);
                  setSelectedFile(null);
                }}
                className="p-2"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1 px-6 py-4">
            <View className="space-y-4">
              {/* Selected File Info */}
              {selectedFile && (
                <View className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <View className="flex-row items-center">
                    <Ionicons name="document" size={20} color="#3B82F6" />
                    <Text className="ml-2 font-medium text-blue-900">{selectedFile.name}</Text>
                  </View>
                  <Text className="text-sm text-blue-700 mt-1">Ready to upload</Text>
                </View>
              )}

              {/* Document Type */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Document Type</Text>
                <View className="flex-row space-x-3">
                  {(['PRESCRIPTION', 'MEDICAL_REPORT'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setUploadForm({ ...uploadForm, documentType: type })}
                      className={`flex-1 p-3 rounded-lg border ${
                        uploadForm.documentType === type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <Text
                        className={`text-center font-medium ${
                          uploadForm.documentType === type ? 'text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        {type === 'PRESCRIPTION' ? 'Prescription' : 'Medical Report'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Description */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Description *</Text>
                <TextInput
                  value={uploadForm.description}
                  onChangeText={(text) => setUploadForm({ ...uploadForm, description: text })}
                  placeholder="Enter a description for this document..."
                  multiline
                  numberOfLines={3}
                  className="border border-gray-300 rounded-lg p-3 text-gray-900"
                  style={{ textAlignVertical: 'top' }}
                />
              </View>

              {/* Seek Availability - Only for Prescriptions */}
              {uploadForm.documentType === 'PRESCRIPTION' && (
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-700">Make Available to Med Stores</Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      Allow med stores to see this prescription for medicine orders
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setUploadForm({ 
                      ...uploadForm, 
                      seekAvailability: !uploadForm.seekAvailability 
                    })}
                    className={`w-12 h-6 rounded-full ${
                      uploadForm.seekAvailability ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                        uploadForm.seekAvailability ? 'translate-x-6' : 'translate-x-0.5'
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
              onPress={submitUpload}
              disabled={isUploading || !uploadForm.description.trim() || !selectedFile}
              className={`py-3 rounded-lg ${
                isUploading || !uploadForm.description.trim() || !selectedFile
                  ? 'bg-gray-300'
                  : 'bg-blue-600'
              }`}
            >
              {isUploading ? (
                <View className="flex-row justify-center items-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-semibold ml-2">Uploading...</Text>
                </View>
              ) : (
                <Text className="text-white font-semibold text-center">Upload Document</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
} 