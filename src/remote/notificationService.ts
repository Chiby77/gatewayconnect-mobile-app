import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from './supabase';

export interface PushTokenRegistration {
  token: string;
}

export async function registerForPushNotificationsAsync(): Promise<PushTokenRegistration | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#193B37',
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
      return null;
    }
    
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
    } catch (e) {
      console.log('Error getting push token:', e);
      return null;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token ? { token } : null;
}

export async function syncPushTokenToSupabase(userId: string, expoPushToken: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  
  try {
    const { error } = await supabase
      .from('user_push_tokens')
      .upsert(
        { user_id: userId, expo_push_token: expoPushToken, updated_at: new Date().toISOString() },
        { onConflict: 'user_id, expo_push_token' }
      );
      
    if (error) {
      console.error('Error syncing push token to Supabase:', error);
    }
  } catch (err) {
    console.error('Failed to sync push token:', err);
  }
}

export async function removePushTokenFromSupabase(userId: string, expoPushToken: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  
  try {
    const { error } = await supabase
      .from('user_push_tokens')
      .delete()
      .match({ user_id: userId, expo_push_token: expoPushToken });
      
    if (error) {
      console.error('Error removing push token from Supabase:', error);
    }
  } catch (err) {
    console.error('Failed to remove push token:', err);
  }
}
