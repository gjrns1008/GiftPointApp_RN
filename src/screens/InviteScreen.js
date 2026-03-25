import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Share, ActivityIndicator } from 'react-native';
import { useUser } from '../context/UserContext';
import { api } from '../api';

export default function InviteScreen() {
  const { user, setUser } = useUser();
  const [referralCode, setReferralCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const codeData = await api.generateReferralCode(user.id);
      setReferralCode(codeData.referralCode);
      const referralsData = await api.getReferrals(user.id);
      setReferrals(referralsData);
    } catch (error) {
      console.error('Invite error:', error);
    } finally {
      setLoading(false);
    }
  };

  const shareCode = async () => {
    try {
      await Share.share({
        message: `GiftPoint 앱에서 함께 포인트 적립하세요! 내 추천 코드: ${referralCode}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const registerReferral = async () => {
    if (!inputCode.trim()) {
      Alert.alert('오류', '추천 코드를 입력해주세요.');
      return;
    }
    try {
      const result = await api.registerReferral(user.id, inputCode.trim());
      setUser(result.user);
      Alert.alert('추천 코드 등록 완료!', `500 포인트가 적립되었습니다.`);
      setInputCode('');
      loadData();
    } catch (error) {
      Alert.alert('오류', error.response?.data?.error || '추천 코드 등록에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>친구 초대</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>나의 추천 코드</Text>
        <View style={styles.codeBox}>
          <Text style={styles.code}>{referralCode}</Text>
        </View>
        <TouchableOpacity style={styles.shareButton} onPress={shareCode}>
          <Text style={styles.shareButtonText}>공유하기</Text>
        </TouchableOpacity>
        <Text style={styles.info}>친구를 초대하면 500P, 친구도 200P 적립!</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>추천 코드 입력</Text>
        <TextInput
          style={styles.input}
          value={inputCode}
          onChangeText={setInputCode}
          placeholder="추천 코드를 입력하세요"
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.registerButton} onPress={registerReferral}>
          <Text style={styles.registerButtonText}>코드 등록</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>초대 내역 ({referrals.length}명)</Text>
        {referrals.length === 0 ? (
          <Text style={styles.emptyText}>아직 초대한 친구가 없습니다.</Text>
        ) : (
          referrals.map((ref, index) => (
            <View key={index} style={styles.referralRow}>
              <Text>{ref.username}</Text>
              <Text style={styles.referralPoints}>+200P</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  codeBox: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  code: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 3,
    color: '#3498db',
  },
  shareButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  info: {
    textAlign: 'center',
    color: '#666',
    marginTop: 10,
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  registerButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  referralRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  referralPoints: {
    color: '#2ecc71',
    fontWeight: 'bold',
  },
});
