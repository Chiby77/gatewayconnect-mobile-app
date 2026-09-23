import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from './supabase';

export async function registerForPushNotificationsAsync(userId: string) {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      const pushTokenString = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
      
      console.log('Expo Push Token:', pushTokenString);
      
      // Save the token to Supabase push_tokens table
      const { error } = await supabase.from('push_tokens').upsert({
        user_id: userId,
        token: pushTokenString,
        device_type: Platform.OS,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'token' // Ensure unique tokens
      });

      if (error) {
        console.error('Error saving push token to DB:', error);
      }

      return pushTokenString;
    } catch (e: unknown) {
      console.error('Error fetching Expo Push Token:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }
}
