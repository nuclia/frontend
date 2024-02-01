export type NotificationType = 'resource-processing';

export interface NotificationData {
  title: string;
  resourceId?: string;
  resourceUrl?: string;
}

export interface NotificationUI {
  type: NotificationType;
  timestamp: string;
  unread: boolean;
  failure: boolean;
  data: NotificationData[];
}
