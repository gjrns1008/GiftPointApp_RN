import React, { createContext, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false
  });

  const updateSettings = async (newSettings) => {
    setSettings(newSettings);
    await AsyncStorage.setItem('settings', JSON.stringify(newSettings));
  };

  const loadSettings = async () => {
    const stored = await AsyncStorage.getItem('settings');
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loadSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
