import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, Validators } from '@angular/forms';
import {
  PaButtonModule,
  PaChipsModule,
  PaDropdownModule,
  PaIconModule,
  PaTableModule,
  PaTextFieldModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { WritableKnowledgeBox } from '@nuclia/core';
import { DropdownButtonComponent, ExpandableTextareaComponent, InfoCardComponent } from '@nuclia/sistema';
import { KB_ROLE_TITLES, SORTED_KB_ROLES } from '../utils';
import { INVITE_REMOVE_ARIA_I18N_KEY, INVITE_STATUS_CLASS, INVITE_STATUS_I18N_KEY } from './users-manage.config';
import { InviteEntry, InviteEntryStatus } from './users-manage.model';
import { UsersManageService } from './users-manage.service';

@Component({
  selector: 'app-users-manage',
  templateUrl: './users-manage.component.html',
  styleUrls: ['./users-manage.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ExpandableTextareaComponent,
    PaButtonModule,
    PaChipsModule,
    NgClass,
    PaTextFieldModule,
    PaDropdownModule,
    InfoCardComponent,
    DropdownButtonComponent,
    PaTableModule,
    PaIconModule,
    PaTooltipModule,
    AsyncPipe,
    DatePipe,
    TranslatePipe,
  ],
})
export class UsersManageComponent {
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
