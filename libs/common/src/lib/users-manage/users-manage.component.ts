import { ChangeDetectionStrategy, Component, effect, Input } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { WritableKnowledgeBox } from '@nuclia/core';
import { KB_ROLE_TITLES, SORTED_KB_ROLES } from '../utils';
import { INVITE_REMOVE_ARIA_I18N_KEY, INVITE_STATUS_CLASS, INVITE_STATUS_I18N_KEY } from './users-manage.config';
import { InviteEntry, InviteEntryStatus } from './users-manage.model';
import { UsersManageService } from './users-manage.service';

type InviteEntryStatus = 'valid' | 'invalid' | 'duplicate' | 'existing' | 'failed';

interface InviteEntry {
  email: string;
  status: InviteEntryStatus;
}

@Component({
  selector: 'app-users-manage',
  templateUrl: './users-manage.component.html',
  styleUrls: ['./users-manage.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UsersManageComponent {
  @ViewChild('emailInputRef', { read: ElementRef }) emailInputRef?: ElementRef<HTMLElement>;
  @ViewChild('bulkInputRef', { read: ElementRef }) bulkInputRef?: ElementRef<HTMLElement>;

  @Input() set kb(value: WritableKnowledgeBox | undefined) {
    if (value) {
      this.users.setKb(value);
    }
  }

  protected readonly addForm = this.formBuilder.group({
    bulkInput: [''],
    role: ['SMEMBER', [Validators.required]],
  });

  readonly roles = SORTED_KB_ROLES;
  readonly roleTitles = KB_ROLE_TITLES;
  orderOpen = false;
  private existingUserEmails = new Set<string>();

  constructor(
    protected readonly users: UsersManageService,
    private readonly formBuilder: UntypedFormBuilder,
    private readonly translate: TranslateService,
  ) {
    effect(() => {
      if (this.users.inviteInProgress()) {
        this.addForm.disable();
      } else {
        this.addForm.enable();
      }
    });
  }

  get bulkInputValue(): string {
    return this.addForm.controls['bulkInput'].value || '';
  }

  handleTextareaKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey && this.bulkInputValue.trim()) {
      event.preventDefault();
      this.addBulkEmails();
    }
  }

  addBulkEmails(): void {
    if (!this.bulkInputValue.trim()) return;
    this.users.addEmailsFromText(this.bulkInputValue);
    this.addForm.controls['bulkInput'].setValue('');
  }

  inviteEntryStatusClass(status: InviteEntryStatus): string {
    return INVITE_STATUS_CLASS[status];
  }

  inviteEntryStatusLabel(status: InviteEntryStatus): string {
    return this.translate.instant(INVITE_STATUS_I18N_KEY[status]);
  }

  removeInviteEntryAriaLabel(entry: InviteEntry): string {
    return this.translate.instant(INVITE_REMOVE_ARIA_I18N_KEY[entry.status], { email: entry.email });
  }
}
