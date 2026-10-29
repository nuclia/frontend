import { ScrollingModule } from '@angular/cdk/scrolling';
import {
  afterEveryRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmCheckboxImports } from '@nuclia/ui-spartan/checkbox';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { UserSummary } from '../../../manage-users/user.models';
import { RecipientsService } from '../recipients.service';

const USER_ROW_HEIGHT = 40;
const MIN_VIEWPORT_HEIGHT = 200;
// Room kept below the list for the Next button and the page paddings
const PAGE_BOTTOM_RESERVED = 120;

@Component({
  selector: 'nma-recipient-list',
  templateUrl: './recipient-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, HlmButtonImports, HlmCheckboxImports, HlmInputImports, ScrollingModule],
  host: { class: 'block', '(window:resize)': 'measureListHeight()' },
})
export class RecipientListComponent {
  protected recipients = inject(RecipientsService);

  readonly userRowHeight = USER_ROW_HEIGHT;
  readonly trackUser = (_: number, user: UserSummary) => user.id;

  private userList = viewChild('userList', { read: ElementRef });
  private availableListHeight = signal(MIN_VIEWPORT_HEIGHT);
  viewportHeight = computed(() =>
    Math.min(this.recipients.filteredUsers().length * USER_ROW_HEIGHT, this.availableListHeight()),
  );

  constructor() {
    afterEveryRender({ read: () => this.measureListHeight() });
  }

  measureListHeight() {
    const element: HTMLElement | undefined = this.userList()?.nativeElement;
    if (!element || element.offsetParent === null) {
      return;
    }
    let scrolled = 0;
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      scrolled += parent.scrollTop;
    }
    const top = element.getBoundingClientRect().top + scrolled;
    this.availableListHeight.set(
      Math.max(MIN_VIEWPORT_HEIGHT, Math.round(window.innerHeight - top - PAGE_BOTTOM_RESERVED)),
    );
  }
}
