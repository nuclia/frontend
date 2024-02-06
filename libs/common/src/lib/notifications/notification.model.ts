import { NotificationOperation } from '@nuclia/core';

export type NotificationType = 'resource';

export interface NotificationData {
  title: string;
  resourceId?: string;
  resourceUrl?: string;
}

export interface NotificationUI {
  type: NotificationType;
  operation: NotificationOperation;
  timestamp: string;
  unread: boolean;
  failure: boolean;
  data: NotificationData[];
}
