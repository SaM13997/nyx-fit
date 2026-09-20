export type NotificationPermissionState =
  | "granted"
  | "denied"
  | "default"
  | "unsupported";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return "unsupported";
  try {
    const result = await Notification.requestPermission();
    return result === "granted" || result === "denied" || result === "default"
      ? result
      : getNotificationPermission();
  } catch {
    return getNotificationPermission();
  }
}

export type SystemNotificationOptions = {
  body?: string;
  tag?: string;
  data?: Record<string, unknown>;
};

const DEFAULT_NOTIFICATION_ICON = "/favicon.ico";

export async function showSystemNotification(
  title: string,
  options: SystemNotificationOptions = {},
): Promise<boolean> {
  if (getNotificationPermission() !== "granted") return false;

  const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
    icon: DEFAULT_NOTIFICATION_ICON,
    badge: DEFAULT_NOTIFICATION_ICON,
    vibrate: [500, 200, 500],
    ...options,
  };

  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.active) {
        await registration.showNotification(title, notificationOptions);
        return true;
      }
    } catch (error) {
      console.warn("[notifications] service worker notification failed", error);
    }
  }

  try {
    new Notification(title, notificationOptions);
    return true;
  } catch (error) {
    console.warn("[notifications] failed to show notification", error);
    return false;
  }
}
