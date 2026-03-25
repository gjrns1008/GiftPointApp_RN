import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useUser } from '../context/UserContext';
import { api } from '../api';

export default function AchievementScreen() {
  const { user } = useUser();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, [user]);

  const loadAchievements = async () => {
    try {
      const data = await api.getAchievements(user.id);
      setAchievements(data);
    } catch (error) {
      console.error('Achievements error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const achievedCount = achievements.filter(a => a.achieved).length;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>업적</Text>
      <Text style={styles.subtitle}>{achievedCount}/{achievements.length} 달성</Text>

      <View style={styles.grid}>
        {achievements.map((achievement) => (
          <View
            key={achievement.id}
            style={[
              styles.card,
              achievement.achieved ? styles.achievedCard : styles.lockedCard
            ]}
          >
            <Text style={styles.icon}>{achievement.icon}</Text>
            <Text style={styles.name}>{achievement.name}</Text>
            <Text style={styles.description}>{achievement.description}</Text>
            {achievement.achieved && <Text style={styles.badge}>달성!</Text>}
          </View>
        ))}
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
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  achievedCard: {
    borderWidth: 2,
    borderColor: '#2ecc71',
  },
  lockedCard: {
    opacity: 0.6,
  },
  icon: {
    fontSize: 40,
    marginBottom: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  badge: {
    marginTop: 8,
    color: '#2ecc71',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
