import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaButtonModule, PaIconModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { AgenticSource } from '@nuclia/core';
import { BackButtonComponent, SisToastService, StickyFooterComponent } from '@nuclia/sistema';
import { filter, of, switchMap, take, tap } from 'rxjs';
import { sourceDefinitions, SourcesService } from '../logic/sources.service';
import { NucliadbSourceComponent } from './nucliadb-source/nucliadb-source.component';
import { SyncSourceComponent } from './sync-source/sync-source.component';

@Component({
  imports: [
    CommonModule,
    BackButtonComponent,
    NucliadbSourceComponent,
    PaButtonModule,
    PaIconModule,
    PaTextFieldModule,
    ReactiveFormsModule,
    StickyFooterComponent,
    SyncSourceComponent,
    TranslateModule,
  ],
  templateUrl: './add-source-page.component.html',
  styleUrl: './_common-source.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddSourcePageComponent implements OnInit {
  private router = inject(Router);
  private currentRoute = inject(ActivatedRoute);
  private toaster = inject(SisToastService);
  private sourcesService = inject(SourcesService);

  sourceType = signal<string | undefined>(undefined);
  editMode = signal<boolean>(false);

  sourceDefinition = computed(() =>
    Object.values(sourceDefinitions)
      .flat()
      .find((sourceType) => sourceType.type === this.sourceType()),
  );

  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern('[\\w_-]+')] }),
    description: new FormControl('', { nonNullable: true }),
  });

  errorMessages = {
    pattern: 'sync.add-source-page.invalid-name',
  };

  extraFields: FormControl<any> = new FormControl({});

  ngOnInit() {
    this.currentRoute.params
      .pipe(
        filter((params) => params['sourceId'] || params['type']),
        take(1),
        switchMap((params) => {
          if (params['sourceId']) {
            return this.sourcesService.getSource(params['sourceId']).pipe(
              tap((source) => {
                const { type, description, ...extraFields } = source;
                this.editMode.set(true);
                this.sourceType.set(type);
                this.form.patchValue({
                  name: params['sourceId'],
                  description,
                });
                this.extraFields.patchValue(extraFields);
              }),
            );
          } else {
            this.sourceType.set(params['type']);
            return of(undefined);
          }
        }),
      )
      .subscribe();
  }

  goBack() {
    this.router.navigate(['../..'], { relativeTo: this.currentRoute, queryParams: { tab: 'connect' } });
  }

  cancel() {
    this.goBack();
  }

  save() {
    const values = this.form.getRawValue();
    const payload: AgenticSource = {
      type: this.sourceType(),
      description: values.description,
      ...this.extraFields.getRawValue(),
    };
    return (
      this.editMode()
        ? this.sourcesService.updateSource(values.name, payload)
        : this.sourcesService.createSource(values.name, payload)
    ).subscribe({
      next: () => {
        this.goBack();
      },
      error: () => {
        this.toaster.error('sync.add-source-page.error');
      },
    });
  }
}
