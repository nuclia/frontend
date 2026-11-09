import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matCheckRound, matContentCopyRound } from '@ng-icons/material-icons/round';
import { UiToastService } from '@nuclia/ui/toast';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmFieldImports } from '@nuclia/ui-spartan/field';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmTextareaImports } from '@nuclia/ui-spartan/textarea';
import { combineLatest, filter, map, Subject, switchMap, takeUntil } from 'rxjs';
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
    AsyncPipe,
  ],
  providers: [provideIcons({ matCheckRound, matContentCopyRound })],
})
export class ProjectDetailsComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();

  canEdit = this.store.canEdit;
  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('', { nonNullable: true }),
  });
  project = this.store.projectDetails;
  isSaving = false;
  copied = false;

  private backupProject?: ProjectDetails;

  constructor(
    private route: ActivatedRoute,
    private accountService: AccountService,
    private store: ManagerStore,
    private toast: UiToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.canEdit.pipe(takeUntil(this.unsubscribeAll)).subscribe((canEdit) => {
      [this.form.controls.name, this.form.controls.description].forEach((control) =>
        canEdit ? control.enable() : control.disable(),
      );
      this.cdr.markForCheck();
    });

    combineLatest([
      this.store.accountDetails.pipe(filter((accountDetails) => !!accountDetails)),
      this.route.params.pipe(
        filter((params) => !!params['projectId'] && !!params['zoneId']),
        map((params) => ({ projectId: params['projectId'] as string, zoneId: params['zoneId'] as string })),
      ),
    ])
      .pipe(
        takeUntil(this.unsubscribeAll),
        switchMap(([account, { projectId, zoneId }]) => this.accountService.loadProject(account.id, projectId, zoneId)),
      )
      .subscribe((project) => {
        this.backupProject = project;
        this.form.patchValue(project);
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  save() {
    this.isSaving = true;
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
            this.isSaving = false;
            this.form.markAsPristine();
            this.cdr.markForCheck();
          },
          error: () => {
            this.isSaving = false;
            this.cdr.markForCheck();
            this.toast.error('Updating project failed');
          },
        });
    }
  }

  reset() {
    if (this.backupProject) {
      this.form.patchValue(this.backupProject);
      this.form.markAsPristine();
      this.cdr.markForCheck();
    }
  }

  copy() {
    if (this.backupProject) {
      const text = this.backupProject.project_id;
      navigator.clipboard.writeText(text);
      this.copied = true;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.copied = false;
        this.cdr.markForCheck();
      }, 1000);
    }
  }
}
