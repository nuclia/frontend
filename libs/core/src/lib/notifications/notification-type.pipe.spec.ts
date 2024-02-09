import { NotificationTypePipe } from './notification-type.pipe';
import { NotificationUI } from './notification.model';

describe('NotificationTypePipe', () => {
  const pipe = new NotificationTypePipe();

  describe('resource notifications', () => {
    const baseNotification: NotificationUI = {
      type: 'resource',
      operation: 'created',
      unread: true,
      timestamp: new Date().toISOString(),
      failure: false,
      data: [],
    };

    it('return creation translation keys when operation is created', () => {
      expect(pipe.transform({ ...baseNotification })).toBe('notification.type.creation-completed');
      expect(pipe.transform({ ...baseNotification, failure: true })).toBe('notification.type.creation-failed');
    });

    it('return modification translation keys when operation is modified', () => {
      expect(pipe.transform({ ...baseNotification, operation: 'modified' })).toBe(
        'notification.type.modification-completed',
      );
      expect(pipe.transform({ ...baseNotification, operation: 'modified', failure: true })).toBe(
        'notification.type.modification-failed',
      );
    });

    it('return deletion translation keys when operation is deleted', () => {
      expect(pipe.transform({ ...baseNotification, operation: 'deleted' })).toBe(
        'notification.type.deletion-completed',
      );
      expect(pipe.transform({ ...baseNotification, operation: 'deleted', failure: true })).toBe(
        'notification.type.deletion-failed',
      );
    });
  });
});
