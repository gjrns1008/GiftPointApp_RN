import axios from 'axios';

const API_URL = 'http://10.0.2.2:3000/api';

export const api = {
  getUser: async (username) => {
    const response = await axios.get(`${API_URL}/users/${username}`);
    return response.data;
  },
  addPoints: async (userId, amount, description) => {
    const response = await axios.post(`${API_URL}/points/add`, {
      user_id: userId,
      amount,
      description
    });
    return response.data;
  },
  getPointTransactions: async (userId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    const response = await axios.get(`${API_URL}/points/${userId}/filter?${params.toString()}`);
    return response.data;
  },
  getGiftcards: async () => {
    const response = await axios.get(`${API_URL}/giftcards`);
    return response.data;
  },
  purchaseGiftcard: async (userId, giftcardId, giftcardName, price) => {
    const response = await axios.post(`${API_URL}/giftcards/purchase`, {
      user_id: userId,
      giftcard_id: giftcardId,
      giftcard_name: giftcardName,
      price
    });
    return response.data;
  },
  getPurchases: async (userId) => {
    const response = await axios.get(`${API_URL}/purchases/${userId}`);
    return response.data;
  },
  // 출석체크
  checkin: async (userId) => {
    const response = await axios.post(`${API_URL}/checkin`, { user_id: userId });
    return response.data;
  },
  getCheckinStatus: async (userId) => {
    const response = await axios.get(`${API_URL}/checkin/${userId}`);
    return response.data;
  },
  // 리더보드
  getLeaderboard: async () => {
    const response = await axios.get(`${API_URL}/leaderboard`);
    return response.data;
  },
  // 업적
  getAchievements: async (userId) => {
    const response = await axios.get(`${API_URL}/achievements/${userId}`);
    return response.data;
  },
  checkAchievements: async (userId) => {
    const response = await axios.post(`${API_URL}/achievements/check`, { user_id: userId });
    return response.data;
  },
  // 친구 초대
  generateReferralCode: async (userId) => {
    const response = await axios.post(`${API_URL}/referral/generate`, { user_id: userId });
    return response.data;
  },
  registerReferral: async (userId, referralCode) => {
    const response = await axios.post(`${API_URL}/referral/register`, { user_id: userId, referral_code: referralCode });
    return response.data;
  },
  getReferrals: async (userId) => {
    const response = await axios.get(`${API_URL}/referrals/${userId}`);
    return response.data;
  },
  // 설정
  getSettings: async (userId) => {
    const response = await axios.get(`${API_URL}/settings/${userId}`);
    return response.data;
  },
  saveSettings: async (userId, settings) => {
    const response = await axios.post(`${API_URL}/settings/${userId}`, settings);
    return response.data;
  }
};