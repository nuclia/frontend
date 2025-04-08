import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaDropdownModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { filter, map, of, Subject, switchMap, take, tap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ResourceListService } from '../../../../resources';
import { LabelModule } from '@flaps/core';
import { Classification } from '@nuclia/core';
import { NerFamily, NerService } from '../../../../entities';
import { DropdownButtonComponent, InfoCardComponent } from '@nuclia/sistema';

@Component({
  selector: 'stf-filter-value',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaDropdownModule,
    PaTextFieldModule,
    PaTogglesModule,
    TranslateModule,
    LabelModule,
    InfoCardComponent,
    DropdownButtonComponent,
  ],
  styleUrl: 'filter-value.component.scss',
  templateUrl: './filter-value.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterValueComponent implements OnInit, OnDestroy {
  private resourceListService = inject(ResourceListService);
  private nerService = inject(NerService);
  private cdr = inject(ChangeDetectorRef);
  private unsubscribeAll = new Subject<void>();

  @Input({ required: true }) filterType!: string;
  @Input({ required: true }) valueControl!: FormControl;

  @Output() valueChange = new EventEmitter<string>();

  labelSets = this.resourceListService.labelSets;
  entities = this.nerService.entities;

  mimeTypePatternError = {
    pattern: 'search.configuration.search-box.preselected-filters.assistant.filter-value.validation.mime-type-pattern',
  };

  labelSelectionMode: 'label' | 'labelset' = 'label';
  selectedLabelSetTitle?: string;
  labelSelection?: Classification;
  labelSetSelection?: string;
  nerFamilies: NerFamily[] = [];
  nerForm = new FormGroup({
    family: new FormControl('', Validators.required),
    entity: new FormControl('', Validators.required),
  });
  nerList: { [family: string]: string[] } = {};

  get nerFamilyValue() {
    return this.nerForm.controls.family.value;
  }
  get nerEntityControl() {
    return this.nerForm.controls.entity;
  }

  ngOnInit() {
    this.valueControl?.valueChanges
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((value) => this.valueChange.emit(value));

    this.nerForm.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      const entity = this.nerForm.getRawValue();
      this.valueControl.patchValue(`${entity.family}/${entity.entity || ''}`);
    });

    this.initializeNERs();

    if (this.filterType === 'classification.labels' && this.valueControl.value) {
      const [labelset, label] = this.valueControl.value.split('/');
      if (labelset || label) {
        this.labelSelectionMode = label ? 'label' : 'labelset';
        if (label) {
          this.labelSelection = { labelset, label };
        } else {
          this.labelSetSelection = labelset;
        }
        this.setSelectedLabelSetTitle();
        this.cdr.detectChanges();
      }
    }
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  updateValueWithLabels(labels: Classification[]) {
    this.labelSelection = labels[0];
    this.valueControl.patchValue(`${labels[0].labelset}/${labels[0].label}`);
    this.setSelectedLabelSetTitle();
  }

  updateValueWithLabelSet(labelSet: string) {
    this.labelSetSelection = labelSet;
    this.valueControl.patchValue(labelSet);
    this.setSelectedLabelSetTitle();
  }

  clearLabels() {
    this.labelSelection = undefined;
    this.labelSetSelection = undefined;
    this.valueControl.reset();
  }

  familyChange(family: NerFamily) {
    if (!this.nerList[family.key]) {
      this.nerService
        .getEntities(family.key)
        .pipe(map((family) => Object.keys(family.entities)))
        .subscribe((entities) => {
          this.nerList[family.key] = entities;
          this.cdr.markForCheck();
        });
    }
    this.nerEntityControl.patchValue('');
  }

  private initializeNERs() {
    this.entities
      .pipe(
        filter((entities) => !!entities),
        take(1),
        map((entities) => this.nerService.getNerFamilyWithTitles(entities)),
        tap((families) => {
          this.nerFamilies = families;
          this.cdr.detectChanges();
        }),
        switchMap(() => {
          // Initialise NER form if needed
          if (this.filterType === 'entities' && this.valueControl.value) {
            const [familyKey, entity] = this.valueControl.value.split('/');
            this.nerForm.patchValue({ family: familyKey });
            return this.nerService.getEntities(familyKey).pipe(
              map((family) => Object.keys(family.entities)),
              tap((entities) => {
                this.nerList[familyKey] = entities;
                this.cdr.detectChanges();
                this.nerForm.patchValue({ entity });
              }),
            );
          }
          return of(null);
        }),
      )
      .subscribe();
  }

  private setSelectedLabelSetTitle() {
    if (this.labelSelection || this.labelSetSelection) {
      const labelSetId = this.labelSelection?.labelset || this.labelSetSelection;
      this.labelSets.pipe(take(1)).subscribe((labelSets) => {
        const labelSet = labelSets[labelSetId || ''];
        if (labelSet) {
          this.selectedLabelSetTitle = labelSet.title;
        }
      });
    }
  }
}
