import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      let username = await AsyncStorage.getItem('username');
      if (!username) {
        username = 'user_' + Date.now();
        await AsyncStorage.setItem('username', username);
      }
      const userData = await api.getUser(username);
      setUser(userData);
    } catch (error) {
      // API 실패 시 로컬 모드로 작동
      const localUser = {
        id: username || 'local_user',
        username: username || 'local_user',
        points: 0
      };
      setUser(localUser);
      console.log('API unavailable, using local mode');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}