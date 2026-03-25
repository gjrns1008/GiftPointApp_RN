import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Share } from 'react-native';
import { useUser } from '../context/UserContext';
import { api } from '../api';

export default function ProfileScreen() {
  const { user, loading } = useUser();
  const [purchases, setPurchases] = useState([]);
  const [purchLoading, setPurchLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    if (user) {
      loadPurchases();
      loadReferralCode();
    }
  }, [user]);

  const loadPurchases = async () => {
    try {
      const data = await api.getPurchases(user.id);
      setPurchases(data);
    } catch (error) {
      console.error('Load purchases error:', error);
    } finally {
      setPurchLoading(false);
    }
  };

  const loadReferralCode = async () => {
    try {
      const data = await api.generateReferralCode(user.id);
      setReferralCode(data.referralCode);
    } catch (error) {
      console.error('Load referral code error:', error);
    }
  };

  const shareReferralCode = async () => {
    try {
      await Share.share({
        message: `GiftPoint 앱에서 함께 포인트 적립하세요! 내 추천 코드: ${referralCode}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const renderPurchase = ({ item }) => (
    <View style={styles.purchaseItem}>
      <View style={styles.purchaseInfo}>
        <Text style={styles.purchaseName}>{item.giftcard_name}</Text>
        <Text style={styles.purchaseDate}>{new Date(item.purchase_date).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.purchasePrice}>-{item.price} P</Text>
    </View>
  );

  if (loading || purchLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>내 프로필</Text>

      <View style={styles.userInfo}>
        <Text style={styles.username}>{user?.username}</Text>
        <Text style={styles.userPoints}>{user?.points || 0} P</Text>
      </View>

      {referralCode && (
        <TouchableOpacity style={styles.referralBox} onPress={shareReferralCode}>
          <Text style={styles.referralLabel}>나의 추천 코드</Text>
          <Text style={styles.referralCode}>{referralCode}</Text>
          <Text style={styles.shareHint}> tap to share</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.subtitle}>구매 내역 ({purchases.length})</Text>
      {purchases.length === 0 ? (
        <Text style={styles.emptyText}>구매 내역이 없습니다.</Text>
      ) : (
        <FlatList
          data={purchases}
          renderItem={renderPurchase}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    paddingBottom: 10,
  },
  userInfo: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 10,
  },
  username: {
    fontSize: 18,
    marginBottom: 10,
  },
  userPoints: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  referralBox: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#3498db',
    borderRadius: 10,
    alignItems: 'center',
  },
  referralLabel: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 5,
  },
  referralCode: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  shareHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginTop: 5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 40,
  },
  list: {
    paddingHorizontal: 20,
  },
  purchaseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  purchaseInfo: {
    flex: 1,
  },
  purchaseName: {
    fontSize: 16,
    marginBottom: 5,
  },
  purchaseDate: {
    fontSize: 12,
    color: '#666',
  },
  purchasePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
});
