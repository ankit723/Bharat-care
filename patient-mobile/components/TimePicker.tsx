import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_CONFIG } from '../lib/config';

interface TimePickerProps {
  visible: boolean;
  onClose: () => void;
  onTimeSelect: (time: string) => void;
  selectedTime?: string;
  title?: string;
}

export default function TimePicker({
  visible,
  onClose,
  onTimeSelect,
  selectedTime,
  title = 'Select Time',
}: TimePickerProps) {
  const [tempHour, setTempHour] = useState(
    selectedTime ? parseInt(selectedTime.split(':')[0]) : 9
  );
  const [tempMinute, setTempMinute] = useState(
    selectedTime ? parseInt(selectedTime.split(':')[1]) : 0
  );

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const formatDisplayTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const handleConfirm = () => {
    const timeString = formatTime(tempHour, tempMinute);
    onTimeSelect(timeString);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl">
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-gray-100">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-gray-600 text-lg">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-800">{title}</Text>
            <TouchableOpacity onPress={handleConfirm}>
              <Text 
                className="text-lg font-semibold"
                style={{ color: APP_CONFIG.THEME_COLOR }}
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>

          {/* Time Display */}
          <View className="items-center py-6 border-b border-gray-100">
            <Text className="text-4xl font-light text-gray-800 mb-2">
              {formatDisplayTime(tempHour, tempMinute)}
            </Text>
            <Text className="text-sm text-gray-600">
              {formatTime(tempHour, tempMinute)} (24-hour format)
            </Text>
          </View>

          {/* Time Picker */}
          <View className="flex-row h-64">
            {/* Hours */}
            <View className="flex-1 border-r border-gray-100">
              <Text className="text-center py-3 text-sm font-medium text-gray-600 border-b border-gray-100">
                Hour
              </Text>
              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 8 }}
              >
                {hours.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    onPress={() => setTempHour(hour)}
                    className={`py-3 mx-4 rounded-lg ${
                      tempHour === hour 
                        ? 'bg-blue-50' 
                        : ''
                    }`}
                    style={{
                      backgroundColor: tempHour === hour ? `${APP_CONFIG.THEME_COLOR}15` : 'transparent'
                    }}
                  >
                    <Text 
                      className={`text-center text-lg ${
                        tempHour === hour 
                          ? 'font-semibold' 
                          : 'text-gray-600'
                      }`}
                      style={{
                        color: tempHour === hour ? APP_CONFIG.THEME_COLOR : '#6B7280'
                      }}
                    >
                      {hour.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Minutes */}
            <View className="flex-1">
              <Text className="text-center py-3 text-sm font-medium text-gray-600 border-b border-gray-100">
                Minute
              </Text>
              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 8 }}
              >
                {minutes.filter(m => m % 5 === 0).map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    onPress={() => setTempMinute(minute)}
                    className={`py-3 mx-4 rounded-lg ${
                      tempMinute === minute 
                        ? 'bg-blue-50' 
                        : ''
                    }`}
                    style={{
                      backgroundColor: tempMinute === minute ? `${APP_CONFIG.THEME_COLOR}15` : 'transparent'
                    }}
                  >
                    <Text 
                      className={`text-center text-lg ${
                        tempMinute === minute 
                          ? 'font-semibold' 
                          : 'text-gray-600'
                      }`}
                      style={{
                        color: tempMinute === minute ? APP_CONFIG.THEME_COLOR : '#6B7280'
                      }}
                    >
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Quick Time Options */}
          <View className="p-6">
            <Text className="text-sm font-medium text-gray-600 mb-3">Quick Select</Text>
            <View className="flex-row flex-wrap gap-2">
              {[
                { label: 'Morning', time: '08:00' },
                { label: 'Afternoon', time: '14:00' },
                { label: 'Evening', time: '18:00' },
                { label: 'Night', time: '22:00' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.label}
                  onPress={() => {
                    const [hour, minute] = option.time.split(':').map(Number);
                    setTempHour(hour);
                    setTempMinute(minute);
                  }}
                  className="px-4 py-2 rounded-full border border-gray-200"
                >
                  <Text className="text-sm text-gray-700">{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
} 