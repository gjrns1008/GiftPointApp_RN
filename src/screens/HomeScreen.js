import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { RewardedAd, RewardedAdEventType, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { useUser } from '../context/UserContext';
import { api } from '../api';

const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-1993045619117041/8498468620';

const rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
  keywords: ['fashion', 'clothing'],
});

export default function HomeScreen() {
  const { user, setUser, loading } = useUser();
  const [adLoaded, setAdLoaded] = useState(false);
  const [checkinStatus, setCheckinStatus] = useState({ checkedIn: false, streak: 0 });

  useEffect(() => {
    if (user?.id) {
      loadCheckinStatus();
      loadRewardedAd();
    }
  }, [user]);

  const loadCheckinStatus = async () => {
    try {
      const status = await api.getCheckinStatus(user.id);
      setCheckinStatus(status);
    } catch (error) {
      console.error('Checkin status error:', error);
    }
  };

  const loadRewardedAd = () => {
    const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setAdLoaded(true);
    });

    const unsubscribeEarned = rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      (async () => {
        try {
          const updatedUser = await api.addPoints(user.id, 100, '광고 시청');
          setUser(updatedUser);
          Alert.alert('포인트 적립 완료!', '100 포인트가 적립되었습니다.');
          loadCheckinStatus();
        } catch (error) {
          console.error('Add points error:', error);
        }
      })();
    });

    const unsubscribeClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      setAdLoaded(false);
      rewardedAd.load();
    });

    rewardedAd.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
    };
  };

  const handleCheckin = async () => {
    if (checkinStatus.checkedIn) {
      Alert.alert('출석 완료', `오늘은 이미 출석하셨습니다! (${checkinStatus.streak}일차)`);
      return;
    }
    try {
      const result = await api.checkin(user.id);
      setUser(result.user);
      setCheckinStatus({ checkedIn: true, streak: result.streak });
      Alert.alert('출석체크 완료!', `${result.reward} 포인트가 적립되었습니다.\n${result.streak}일차 연속 출석!`);
    } catch (error) {
      console.error('Checkin error:', error);
      Alert.alert('오류', '출석체크에 실패했습니다.');
    }
  };

  const watchAd = async () => {
    if (!adLoaded) {
      Alert.alert('광고 로딩 중', '잠시 후 다시 시도해주세요.');
      return;
    }
    try {
      await rewardedAd.show();
    } catch (error) {
      console.error('Show ad error:', error);
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
    <View style={styles.container}>
      <Text style={styles.title}>GiftPoint</Text>
      <View style={styles.pointContainer}>
        <Text style={styles.pointLabel}>내 포인트</Text>
        <Text style={styles.pointValue}>{user?.points || 0} P</Text>
      </View>

      <TouchableOpacity style={[styles.adButton, checkinStatus.checkedIn && styles.disabledButton]} onPress={handleCheckin}>
        <Text style={styles.adButtonText}>
          {checkinStatus.checkedIn ? `출석 완료 (${checkinStatus.streak}일차)` : '📅 출석체크'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.adButton, !adLoaded && styles.disabledButton]} onPress={watchAd}>
        <Text style={styles.adButtonText}>🎬 광고 보고 100P 받기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  pointContainer: {
    backgroundColor: '#f0f0f0',
    padding: 30,
    borderRadius: 15,
    marginBottom: 30,
    alignItems: 'center',
  },
  pointLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  pointValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  adButton: {
    backgroundColor: '#3498db',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  adButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
