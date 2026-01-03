import { configureStore } from '@reduxjs/toolkit';
import calendarReducer from './calendarSlice';
import remindersReducer from './remindersSlice';
import homeReducer from './homeSlice';
import profileReducer from './profileSlice';

export const store = configureStore({
  reducer: {
    calendar: calendarReducer,
    reminders: remindersReducer,
    home: homeReducer,
    profile: profileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

