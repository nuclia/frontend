import { buildEmailBody, textToHtml } from './email-body.utils';

const P = 'margin: 0 0 16px;text-align: justify';
const H1 = 'margin: 0 0 32px; font-size: 28px; line-height: 32px; color: #000000; font-weight: 600;';

describe('textToHtml', () => {
  it('should wrap paragraphs and convert single line breaks', () => {
    expect(textToHtml('Hello\nthere\n\nBye')).toBe(`<p style="${P}">Hello<br>there</p><p style="${P}">Bye</p>`);
  });

  it('should normalize windows line endings and trim', () => {
    expect(textToHtml('\r\nOne\r\n\r\nTwo\r\n')).toBe(`<p style="${P}">One</p><p style="${P}">Two</p>`);
  });

  it('should escape html characters but keep quotes and template syntax', () => {
    expect(textToHtml('<b>Hi</b> {{ user_name | default("there") }} & co')).toBe(
      `<p style="${P}">&lt;b&gt;Hi&lt;/b&gt; {{ user_name | default("there") }} &amp; co</p>`,
    );
  });
});

describe('buildEmailBody', () => {
  it('should prepend the title as an h1 using the transactional email style', () => {
    expect(buildEmailBody('Your trial ends soon', 'Body')).toBe(
      `<h1 style="${H1}">Your trial ends soon</h1><p style="${P}">Body</p>`,
    );
  });

  it('should escape the title and keep template syntax', () => {
    expect(buildEmailBody('Hi {{ user_name | title }} <3 & co', 'Body')).toContain(
      '>Hi {{ user_name | title }} &lt;3 &amp; co</h1>',
    );
  });

  it('should only render the paragraphs when the title is empty', () => {
    expect(buildEmailBody('   ', 'Body')).toBe(`<p style="${P}">Body</p>`);
  });

  it('should collapse line breaks in the title', () => {
    expect(buildEmailBody('One\n  two', 'Body')).toContain('>One two</h1>');
  });
});
