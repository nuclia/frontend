import { SENDER_NAME_MAX_LENGTH, validateSenderName } from './sender-name.utils';

describe('validateSenderName', () => {
  it.each(['', '   ', 'Nuclia Team', 'Nuclia, Support & Sales', 'Équipe Nuclia ✉', 'x'.repeat(SENDER_NAME_MAX_LENGTH)])(
    'should accept %j',
    (name) => {
      expect(validateSenderName(name)).toBeNull();
    },
  );

  it('should ignore surrounding whitespace when checking the length', () => {
    expect(validateSenderName(` ${'x'.repeat(SENDER_NAME_MAX_LENGTH)} `)).toBeNull();
    expect(validateSenderName('x'.repeat(SENDER_NAME_MAX_LENGTH + 1))).not.toBeNull();
  });

  it('should count characters outside the BMP once', () => {
    expect(validateSenderName('✉'.repeat(SENDER_NAME_MAX_LENGTH))).toBeNull();
    expect(validateSenderName('😀'.repeat(SENDER_NAME_MAX_LENGTH))).toBeNull();
  });

  it.each([
    'ceo@example.com',
    'Name <ceo@example.com>',
    'Evil\r\nBcc: victim@example.com',
    'tab\tinside',
    'zero\u200bwidth',
    'bidi\u202eoverride',
    'ideographic\u3000space',
  ])('should reject %j', (name) => {
    expect(validateSenderName(name)).not.toBeNull();
  });
});
