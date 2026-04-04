import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useUser } from '../context/UserContext';
import { api } from '../api';

export default function LeaderboardScreen() {
  const { user } = useUser();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadLeaderboard();
    }
  }, [user]);

  const loadLeaderboard = async () => {
    try {
      const data = await api.getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Leaderboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankStyle = (index) => {
    if (index === 0) return { backgroundColor: '#FFD700' };
    if (index === 1) return { backgroundColor: '#C0C0C0' };
    if (index === 2) return { backgroundColor: '#CD7F32' };
    return {};
  };

  const getRankEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
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
      <Text style={styles.title}>리더보드</Text>

      {leaderboard.map((entry, index) => (
        <View
          key={entry.id}
          style={[
            styles.row,
            entry.id === user?.id && styles.myRow,
            getRankStyle(index)
          ]}
        >
          <Text style={styles.rank}>{getRankEmoji(index)}</Text>
          <Text style={styles.username}>{entry.username}</Text>
          <Text style={styles.points}>{entry.points} P</Text>
        </View>
      ))}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  myRow: {
    borderWidth: 2,
    borderColor: '#3498db',
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 50,
    textAlign: 'center',
  },
  username: {
    flex: 1,
    fontSize: 16,
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
});
