import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'NOTES_DATA';

export const saveNotes = async (notes: any[]) => {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(notes));
  } catch (error) {
    console.log('Error saving data', error);
  }
};

export const loadNotes = async () => {
  try {
    const data = await AsyncStorage.getItem(KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.log('Error loading data', error);
    return [];
  }
};
