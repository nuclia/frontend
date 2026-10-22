import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Widget } from '@nuclia/core';

export type SearchMode = NonNullable<Widget.SearchConfiguration['searchMode']>;

export interface SearchModeOption {
  value: SearchMode;
  label: string;
  description: string;
}

let nextId = 0;

/**
 * Multi-option variant of `nsi-segmented-buttons` (which only supports two options),
 * with radio-group semantics and the selected option's description rendered below.
 */
@Component({
  selector: 'stf-search-mode-selector',
  imports: [TranslatePipe],
  templateUrl: './search-mode-selector.component.html',
  styleUrl: './search-mode-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchModeSelectorComponent {
  options = input.required<SearchModeOption[]>();
  value = input.required<SearchMode>();
  disabled = input(false, { transform: booleanAttribute });
  label = input<string>();

  valueChange = output<SearchMode>();

  readonly descriptionId = `stf-search-mode-description-${nextId++}`;

  selectedOption = computed(() => this.options().find((option) => option.value === this.value()));

  select(value: SearchMode) {
    if (this.disabled() || value === this.value()) return;
    this.valueChange.emit(value);
  }

  onKeydown(event: KeyboardEvent, index: number) {
    const options = this.options();
    const lastIndex = options.length - 1;
    let nextIndex: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = index === lastIndex ? 0 : index + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = index === 0 ? lastIndex : index - 1;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = lastIndex;
        break;
      default:
        return;
    }
    event.preventDefault();
    const group = (event.currentTarget as HTMLElement).parentElement;
    (group?.children[nextIndex] as HTMLElement | undefined)?.focus();
    this.select(options[nextIndex].value);
  }
}
