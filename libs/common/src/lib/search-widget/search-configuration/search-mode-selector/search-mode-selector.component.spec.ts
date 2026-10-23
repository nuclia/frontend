import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslatePipe } from '@ngx-translate/core';
import { SearchModeOption, SearchModeSelectorComponent } from './search-mode-selector.component';

describe('SearchModeSelectorComponent', () => {
  let fixture: ComponentFixture<SearchModeSelectorComponent>;
  let emitted: string[];

  const options: SearchModeOption[] = [
    { value: 'simple-rag', label: 'Simple RAG', description: 'Simple description' },
    { value: 'search', label: 'Search', description: 'Search description' },
    { value: 'agentic', label: 'Agentic', description: 'Agentic description' },
  ];

  const buttons = () => Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchModeSelectorComponent],
    })
      .overrideComponent(SearchModeSelectorComponent, {
        set: { imports: [TranslatePipe] },
      })
      .compileComponents();
    fixture = TestBed.createComponent(SearchModeSelectorComponent);
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('value', 'search');
    emitted = [];
    fixture.componentInstance.valueChange.subscribe((value) => emitted.push(value));
    fixture.detectChanges();
  });

  it('marks only the selected option as checked and focusable, and shows its description', () => {
    expect(buttons().map((button) => button.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    expect(buttons().map((button) => button.tabIndex)).toEqual([-1, 0, -1]);
    expect(fixture.nativeElement.querySelector('.option-description').textContent.trim()).toBe('Search description');
  });

  it('emits the clicked mode but not a re-click of the current mode', () => {
    buttons()[1].click();
    buttons()[2].click();

    expect(emitted).toEqual(['agentic']);
  });

  it('moves selection with arrow keys, wrapping at both ends', () => {
    document.body.appendChild(fixture.nativeElement);
    buttons()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.componentRef.setInput('value', 'agentic');
    fixture.detectChanges();
    buttons()[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    buttons()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));

    expect(emitted).toEqual(['agentic', 'simple-rag']);
    expect(document.activeElement).toBe(buttons()[2]);
  });

  it('does not emit when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    fixture.componentInstance.select('agentic');

    expect(emitted).toEqual([]);
  });
});
