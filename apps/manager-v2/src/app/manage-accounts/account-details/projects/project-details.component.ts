import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matCheckRound, matContentCopyRound } from '@ng-icons/material-icons/round';
import { UiToastService } from '@nuclia/ui/toast';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmFieldImports } from '@nuclia/ui-spartan/field';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmTextareaImports } from '@nuclia/ui-spartan/textarea';
import { combineLatest, filter, map, switchMap } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { ProjectDetails } from '../../account-ui.models';
import { AccountService } from '../../account.service';
import { FormFooterComponent } from '../../form-footer/form-footer.component';

@Component({
  templateUrl: './project-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    HlmButtonImports,
    HlmFieldImports,
    HlmInputImports,
    HlmTextareaImports,
    NgIcon,
    FormFooterComponent,
  ],
  providers: [provideIcons({ matCheckRound, matContentCopyRound })],
})
export class ProjectDetailsComponent {
  private route = inject(ActivatedRoute);
  private accountService = inject(AccountService);
  private store = inject(ManagerStore);
  private toast = inject(UiToastService);

  canEdit = this.store.canEdit;
  private accountDetails$ = toObservable(this.store.accountDetails);
  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('', { nonNullable: true }),
  });
  project = this.store.projectDetails;
  isSaving = signal(false);
  copied = signal(false);

  private backupProject?: ProjectDetails;

  constructor() {
    effect(() => {
      const canEdit = this.canEdit();
      untracked(() =>
        [this.form.controls.name, this.form.controls.description].forEach((control) =>
          canEdit ? control.enable() : control.disable(),
        ),
      );
    });

    combineLatest([
      this.accountDetails$.pipe(filter((accountDetails) => !!accountDetails)),
      this.route.params.pipe(
        filter((params) => !!params['projectId'] && !!params['zoneId']),
        map((params) => ({ projectId: params['projectId'] as string, zoneId: params['zoneId'] as string })),
      ),
    ])
      .pipe(
        takeUntilDestroyed(),
        switchMap(([account, { projectId, zoneId }]) => this.accountService.loadProject(account.id, projectId, zoneId)),
      )
      .subscribe((project) => {
        this.backupProject = project;
        this.form.patchValue(project);
      });
  }

  save() {
    this.isSaving.set(true);
    if (this.backupProject) {
      this.accountService
        .updateProject(
          this.backupProject.account_id,
          this.backupProject.project_id,
          this.backupProject.zone.id,
          this.form.getRawValue(),
        )
        .subscribe({
          next: (updatedProject) => {
            this.backupProject = updatedProject;
            this.isSaving.set(false);
            this.form.markAsPristine();
          },
          error: () => {
            this.isSaving.set(false);
            this.toast.error('Updating project failed');
          },
        });
    }
  }

  reset() {
    if (this.backupProject) {
      this.form.patchValue(this.backupProject);
      this.form.markAsPristine();
    }
  }

  copy() {
    if (this.backupProject) {
      const text = this.backupProject.project_id;
      navigator.clipboard.writeText(text);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1000);
    }
  }
}
