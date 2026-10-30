import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmailPreviewComponent } from './email-preview.component';

describe('EmailPreviewComponent', () => {
  let fixture: ComponentFixture<EmailPreviewComponent>;
  const el = (): HTMLElement => fixture.nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EmailPreviewComponent] }).compileComponents();
    fixture = TestBed.createComponent(EmailPreviewComponent);
  });

  it('should render the title and one paragraph per block with line breaks', async () => {
    fixture.componentRef.setInput('title', 'Your trial  ends soon');
    fixture.componentRef.setInput('text', 'Hello\nthere\n\nBye');
    await fixture.whenStable();

    expect(el().querySelector('h1')?.textContent?.trim()).toBe('Your trial ends soon');
    const paragraphs = Array.from(el().querySelectorAll('p')).slice(0, 2);
    expect(paragraphs.map((paragraph) => paragraph.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'Hello there',
      'Bye',
    ]);
    expect(paragraphs[0].querySelectorAll('br')).toHaveLength(1);
  });

  it('should display markup typed by the user as text instead of interpreting it', async () => {
    fixture.componentRef.setInput('title', '<img src=x onerror=alert(1)>');
    fixture.componentRef.setInput('text', '<script>alert(1)</script> <b>bold</b>');
    await fixture.whenStable();

    expect(el().querySelector('h1')?.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(el().querySelector('script')).toBeNull();
    expect(el().querySelector('b')).toBeNull();
    expect(el().querySelector('h1 img')).toBeNull();
    expect(el().textContent).toContain('<script>alert(1)</script> <b>bold</b>');
  });

  it('should not render a title when it is blank', async () => {
    fixture.componentRef.setInput('title', '   ');
    fixture.componentRef.setInput('text', 'Body');
    await fixture.whenStable();

    expect(el().querySelector('h1')).toBeNull();
  });
});
