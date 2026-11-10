import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { BrnTooltip } from '@spartan-ng/brain/tooltip';
import { UiOptionWithDescription } from './option-with-description.component';

describe('UiOptionWithDescription', () => {
  let resizeCallback: () => void;

  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resizeCallback = callback;
        }
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  function render(inputs: { label: string; description?: string }) {
    const fixture = TestBed.createComponent(UiOptionWithDescription);
    fixture.componentRef.setInput('label', inputs.label);
    fixture.componentRef.setInput('description', inputs.description);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('should enable the tooltip only on the lines that are truncated', async () => {
    const fixture = TestBed.createComponent(UiOptionWithDescription);
    fixture.componentRef.setInput('label', 'default');
    fixture.componentRef.setInput('description', 'A very long description');
    await fixture.whenStable();
    const [label, description] = fixture.debugElement
      .queryAll(By.directive(BrnTooltip))
      .map((debugElement) => debugElement.injector.get(BrnTooltip));
    expect(label.mutableTooltipDisabled()).toBe(true);
    expect(description.mutableTooltipDisabled()).toBe(true);

    const descriptionElement = fixture.nativeElement.querySelector('[data-slot=option-with-description-text]');
    Object.defineProperty(descriptionElement, 'scrollWidth', { value: 200 });
    Object.defineProperty(descriptionElement, 'clientWidth', { value: 100 });
    resizeCallback();
    await fixture.whenStable();

    expect(label.mutableTooltipDisabled()).toBe(true);
    expect(description.mutableTooltipDisabled()).toBe(false);
  });

  it('should render the label and the description', () => {
    const element = render({ label: 'default', description: 'Default billing formula' });
    expect(element.querySelector('[data-slot=option-with-description-label]')?.textContent).toContain('default');
    expect(element.querySelector('[data-slot=option-with-description-text]')?.textContent).toContain(
      'Default billing formula',
    );
  });

  it('should not render the description line when there is none', () => {
    const element = render({ label: 'default' });
    expect(element.querySelector('[data-slot=option-with-description-text]')).toBeNull();
  });
});
