import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useUser } from '../context/UserContext';
import { useSettings } from '../context/SettingsContext';
import { api } from '../api';

export default function SettingsScreen() {
  const { user } = useUser();
  const { settings, updateSettings } = useSettings();

  const handleToggle = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    updateSettings(newSettings);
    try {
      await api.saveSettings(user.id, newSettings);
    } catch (error) {
      console.error('Settings save error:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>설정</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>알림</Text>
        <View style={styles.row}>
          <Text style={styles.label}>푸시 알림</Text>
          <Switch
            value={settings.notifications}
            onValueChange={(value) => handleToggle('notifications', value)}
          />
        </View>
        <Text style={styles.description}>포인트 적립, 일일 보상 등 알림을 받습니다.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>외관</Text>
        <View style={styles.row}>
          <Text style={styles.label}>다크 모드</Text>
          <Switch
            value={settings.darkMode}
            onValueChange={(value) => handleToggle('darkMode', value)}
          />
        </View>
        <Text style={styles.description}>어두운 색상으로 앱을 표시합니다.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>앱 정보</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>앱 버전</Text>
          <Text>1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>사용자</Text>
          <Text>{user?.username}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>포인트</Text>
          <Text style={styles.points}>{user?.points || 0} P</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  label: {
    fontSize: 16,
  },
  description: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  points: {
    color: '#2ecc71',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
