export type NotificationType = 'resource_written' | 'resource_processed' | 'resource_indexed';
export type NotificationOperation = 'created' | 'modified' | 'deleted';

export interface BaseNotificationData {
  resource_uuid: string;
  seqid: number;
}

export interface ResourceWrittenData extends BaseNotificationData {
  operation: NotificationOperation;
  error: boolean;
}

export interface ResourceProcessedData extends BaseNotificationData {
  ingestion_succeeded: boolean;
  processing_errors: boolean;
}

export interface NotificationMessage {
  type: NotificationType;
  data: BaseNotificationData | ResourceWrittenData | ResourceProcessedData;
}
