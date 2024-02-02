import { NotificationTypePipe } from './notification-type.pipe';

describe('NotificationTypePipe', () => {
  const pipe = new NotificationTypePipe();

  it('return processing translation keys when type is resource-processing', () => {
    expect(pipe.transform('resource-processing', false)).toBe('notification.type.processing-completed');
    expect(pipe.transform('resource-processing', true)).toBe('notification.type.processing-failed');
  });
});
