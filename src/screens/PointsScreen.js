import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useUser } from '../context/UserContext';
import { api } from '../api';

export default function PointsScreen() {
  const { user } = useUser();
  const [transactions, setTransactions] = useState([]);
  const [transLoading, setTransLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user, filterType]);

  const loadTransactions = async () => {
    try {
      const filters = filterType !== 'all' ? { type: filterType } : {};
      const data = await api.getPointTransactions(user.id, filters);
      setTransactions(data);
    } catch (error) {
      console.error('Load transactions error:', error);
    } finally {
      setTransLoading(false);
    }
  };

  const getFilterLabel = () => {
    switch (filterType) {
      case 'earn': return '적립';
      case 'spend': return '사용';
      default: return '전체';
    }
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDesc}>{item.description}</Text>
        <Text style={styles.transactionDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={[styles.transactionAmount, { color: item.amount > 0 ? '#2ecc71' : '#e74c3c' }]}>
        {item.amount > 0 ? `+${item.amount}` : item.amount} P
      </Text>
    </View>
  );

  if (transLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>포인트 내역</Text>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilter(true)}>
          <Text style={styles.filterButtonText}>🔍 {getFilterLabel()}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>거래 내역이 없습니다.</Text>
        }
      />

      <Modal visible={showFilter} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>필터 선택</Text>
            {['all', 'earn', 'spend'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.filterOption, filterType === type && styles.filterOptionActive]}
                onPress={() => {
                  setFilterType(type);
                  setShowFilter(false);
                }}
              >
                <Text style={[styles.filterOptionText, filterType === type && styles.filterOptionTextActive]}>
                  {type === 'all' ? '전체' : type === 'earn' ? '적립' : '사용'}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowFilter(false)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 14,
  },
  list: {
    padding: 20,
    paddingTop: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: 16,
    marginBottom: 5,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterOption: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
  },
  filterOptionActive: {
    backgroundColor: '#3498db',
  },
  filterOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  filterOptionTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 15,
    marginTop: 10,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
