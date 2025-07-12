import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PushNotificationService } from '../services/pushNotificationService';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

interface NotificationData {
  type?: 'message' | 'follow' | 'like' | 'comment' | 'list_update';
  targetId?: string;
  senderId?: string;
  listId?: string;
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const router = useRouter();

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications();

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // Listen for notification interactions
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const registerForPushNotifications = async () => {
    try {
      // Skip push notifications on web or in Expo Go
      if (Platform.OS === 'web') {
        console.log('Push notifications are not supported on web');
        return;
      }

      const token = await PushNotificationService.registerForPushNotificationsAsync();
      
      if (token) {
        console.log('Push token registered:', token);
        setExpoPushToken(token);
        
        // Save token to database if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await PushNotificationService.savePushToken(user.id, token);
        }
      }
    } catch (error) {
      console.log('Push notification registration skipped:', error.message || error);
    }
  };

  const handleNotificationResponse = async (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as NotificationData;

    if (!data.type) return;

    switch (data.type) {
      case 'message':
        if (data.senderId) {
          router.push(`/chat/${data.senderId}`);
        }
        break;
      
      case 'follow':
        if (data.senderId) {
          router.push(`/profile/${data.senderId}`);
        }
        break;
      
      case 'like':
      case 'comment':
        if (data.listId) {
          router.push(`/list/${data.listId}`);
        }
        break;
      
      case 'list_update':
        if (data.listId) {
          router.push(`/list/${data.listId}`);
        }
        break;
      
      default:
        // Navigate to notifications page
        router.push('/notifications');
    }
  };

  const sendTestNotification = async () => {
    await PushNotificationService.scheduleLocalNotification(
      'Test Notification',
      'This is a test notification from ConnectList!',
      1,
      { type: 'test' }
    );
  };

  return {
    expoPushToken,
    notification,
    sendTestNotification,
  };
}