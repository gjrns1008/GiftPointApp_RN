import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { useUser } from '../context/UserContext';
import { api } from '../api';

export default function MarketScreen() {
  const { user, setUser, loading } = useUser();
  const [giftcards, setGiftcards] = useState([]);
  const [giftLoading, setGiftLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    loadGiftcards();
  }, []);

  const loadGiftcards = async () => {
    try {
      const data = await api.getGiftcards();
      if (data && Array.isArray(data.cards)) {
        setGiftcards(data.cards.map((card, index) => ({
          id: card.id || `card_${index}`,
          name: card.name || card.title || '기프트카드',
          price: card.price || card.point_price || 0,
          image: card.image_url || 'https://via.placeholder.com/150',
          description: card.description || `${card.name || '기프트카드'}입니다.`
        })));
      } else {
        setGiftcards(getMockGiftcards());
      }
    } catch (error) {
      console.log('Giftcards API failed, using mock data');
      setGiftcards(getMockGiftcards());
    } finally {
      setGiftLoading(false);
    }
  };

  const getMockGiftcards = () => [
    { id: '1', name: '스타벅스 아메리카노', price: 500, image: 'https://via.placeholder.com/150', description: '스타벅스에서 아메리카노 1잔을 교환할 수 있는 기프트카드입니다.' },
    { id: '2', name: 'CU 1000원 상품권', price: 1000, image: 'https://via.placeholder.com/150', description: 'CU 편의점에서 1000원 상당의 상품과 교환할 수 있습니다.' },
    { id: '3', name: '배달의민족 2000원 쿠폰', price: 2000, image: 'https://via.placeholder.com/150', description: '배달의민족 주문 시 2000원 할인받을 수 있는 쿠폰입니다.' },
    { id: '4', name: 'GS25 5000원 상품권', price: 5000, image: 'https://via.placeholder.com/150', description: 'GS25 편의점에서 5000원 상당의 상품과 교환할 수 있습니다.' },
  ];

  const purchaseGiftcard = async () => {
    if (!user || !selectedCard) return;

    if ((user.points || 0) < selectedCard.price) {
      Alert.alert('포인트 부족', '포인트가 부족합니다. 광고를 보고 포인트를 적립하세요!');
      return;
    }

    Alert.alert(
      '구매 확인',
      `${selectedCard.name}을(를) ${selectedCard.price} 포인트로 구매하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '구매',
          onPress: async () => {
            try {
              const result = await api.purchaseGiftcard(user.id, selectedCard.id, selectedCard.name, selectedCard.price);
              if (result && result.user) {
                setUser(result.user);
              }
              Alert.alert('구매 완료!', `${selectedCard.name}이(가) 구매되었습니다.`);
              setSelectedCard(null);
            } catch (error) {
              Alert.alert('구매 오류', '구매 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  const renderGiftcard = ({ item }) => (
    <TouchableOpacity style={styles.giftcardItem} onPress={() => setSelectedCard(item)}>
      <Image source={{ uri: item.image }} style={styles.giftcardImage} />
      <View style={styles.giftcardInfo}>
        <Text style={styles.giftcardName}>{item.name}</Text>
        <Text style={styles.giftcardPrice}>{item.price} P</Text>
      </View>
      <TouchableOpacity
        style={[styles.purchaseButton, user?.points < item.price && styles.disabledButton]}
        onPress={() => {
          setSelectedCard(item);
        }}
        disabled={user?.points < item.price}
      >
        <Text style={styles.purchaseButtonText}>구매</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading || giftLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>기프티콘 마켓</Text>
      <FlatList
        data={giftcards}
        renderItem={renderGiftcard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      <Modal visible={!!selectedCard} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCard && (
              <ScrollView>
                <Image source={{ uri: selectedCard.image }} style={styles.detailImage} />
                <Text style={styles.detailName}>{selectedCard.name}</Text>
                <Text style={styles.detailPrice}>{selectedCard.price} P</Text>
                <Text style={styles.detailDescription}>{selectedCard.description}</Text>

                <View style={styles.detailInfo}>
                  <Text style={styles.infoLabel}>사용 방법</Text>
                  <Text style={styles.infoText}>1. 마이페이지 > 구매내역에서 코드를 확인하세요</Text>
                  <Text style={styles.infoText}>2. 해당 매장에서 코드를 제시하세요</Text>
                  <Text style={styles.infoText}>3. 할인 또는 상품으로 교환하세요</Text>
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedCard(null)}>
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.buyButton, user?.points < selectedCard.price && styles.disabledButton]}
                    onPress={purchaseGiftcard}
                  >
                    <Text style={styles.buyButtonText}>구매하기</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    paddingBottom: 10,
  },
  list: {
    padding: 20,
  },
  giftcardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 15,
  },
  giftcardImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  giftcardInfo: {
    flex: 1,
  },
  giftcardName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  giftcardPrice: {
    fontSize: 14,
    color: '#e74c3c',
  },
  purchaseButton: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  purchaseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
    maxHeight: '80%',
  },
  detailImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  detailName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detailPrice: {
    fontSize: 20,
    color: '#e74c3c',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  detailDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  detailInfo: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#eee',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyButton: {
    flex: 1,
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
