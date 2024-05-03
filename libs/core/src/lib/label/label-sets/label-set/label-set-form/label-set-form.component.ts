import {
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InfoCardComponent, LABEL_COLORS, SisLabelModule } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaIconModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { LabelsService } from '../../../labels.service';
import { FeaturesService } from '../../../../analytics';
import { LabelSet, LabelSetKind, LabelSets } from '@nuclia/core';
import { LABEL_MAIN_COLORS, noDuplicateListItemsValidator } from '../../utils';
import { combineLatest, map, Subject, take, tap } from 'rxjs';
import { filter, switchMap, takeUntil } from 'rxjs/operators';
import { EMPTY_LABEL_SET, LabelSetCounts, MutableLabelSet } from '../../model';
import { STFUtils } from '../../../../utils';

const KINDS = [
  { id: LabelSetKind.RESOURCES, name: 'label-set.resources' },
  { id: LabelSetKind.PARAGRAPHS, name: 'label-set.paragraphs' },
];

@Component({
  selector: 'stf-label-set-form',
  standalone: true,
  imports: [
    CommonModule,
    PaButtonModule,
    PaIconModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    RouterLink,
    SisLabelModule,
    TranslateModule,
    InfoCardComponent,
  ],
  templateUrl: './label-set-form.component.html',
  styleUrl: './label-set-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelSetFormComponent implements OnInit, OnChanges {
  private labelsService = inject(LabelsService);
  private features = inject(FeaturesService);
  private cdr = inject(ChangeDetectorRef);
  private unsubscribeAll = new Subject<void>();

  @Input({ transform: booleanAttribute }) addNew = false;
  @Input({ transform: booleanAttribute }) inModal = false;
  @Input() kind?: LabelSetKind;
  @Input() labelSetId?: string;

  @Output() cancel = new EventEmitter<void>();
  @Output() done = new EventEmitter<{ id: string; labelSet: LabelSet }>();

  @ViewChild('labelList', { read: ElementRef }) labelListElement?: ElementRef;

  labelSet?: MutableLabelSet;
  labelSetForm = new FormGroup({
    title: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
    kind: new FormControl<LabelSetKind | undefined>(undefined, { validators: [Validators.required] }),
    exclusive: new FormControl<boolean>(false),
    labels: new FormControl<string>('', {
      nonNullable: true,
      updateOn: 'blur',
      validators: [
        Validators.required,
        noDuplicateListItemsValidator(',', 'label-set.form.labels.duplicated-name-in-list'),
        Validators.pattern('[^/{}]+'),
      ],
    }),
  });

  colors: string[] = LABEL_MAIN_COLORS;
  kinds = this.features.unstable.pdfAnnotation.pipe(
    map((enabled) => (enabled ? KINDS.concat({ id: LabelSetKind.SELECTIONS, name: 'label-set.selections' }) : KINDS)),
  );
  counts = this.labelsService.labelSetsCount;

  validationMessages = {
    title: {
      required: 'label-set.form.name-required',
    },
    labels: {
      pattern: 'label-set.form.labels.naming-constraint',
    },
  };

  labelView: 'list' | 'grid' = 'list';
  labelInputValue = '';
  labelInputError = '';
  hasChanges: boolean = false;
  labelSetBackup?: LabelSets;

  labelSets = this.labelsService.labelSets.pipe(
    filter((labelSets) => !!labelSets),
    map((labelSets) => labelSets as LabelSets),
    tap((labelSets) => {
      this.labelSetBackup = labelSets;
    }),
    takeUntil(this.unsubscribeAll),
  );

  get labelControl() {
    return this.labelSetForm.controls.labels;
  }
  get labelControlValue() {
    return this.labelSetForm.controls.labels.value;
  }

  ngOnInit() {
    if (this.kind) {
      this.labelSetForm.patchValue({ kind: this.kind });
    }
    this.labelSetForm.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      if (this.labelSet) {
        const data = this.labelSetForm.getRawValue();
        this.labelSet.title = data.title;
        this.labelSet.multiple = !data.exclusive;
        this.labelSet.labels = data.labels
          .split(',')
          .map((label) => label.trim())
          .filter((label) => !!label)
          .map((title) => ({ title }));
        if (data.kind) {
          this.labelSet.kind = [data.kind];
        }
        this.hasChanges = this.hasChanged();
        this.cdr.markForCheck();
      }
    });

    combineLatest([this.counts, this.labelSetForm.controls.kind.valueChanges])
      .pipe(
        filter(([counts, kind]) => this.addNew && !!counts && !!kind),
        map(([counts, kind]) => [counts, kind] as [LabelSetCounts, LabelSetKind]),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(([counts, kind]) => {
        let colorIndex = counts[kind];
        if (colorIndex > LABEL_COLORS.length - 1) {
          colorIndex = 0;
        }
        if (this.labelSet) {
          this.labelSet.color = LABEL_COLORS[colorIndex].mainColor;
        }
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['addNew'] || changes['labelSetId']) {
      this.initState();
    }
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  private hasChanged(): boolean {
    if (!this.labelSetId || !this.labelSetBackup || !this.labelSet) {
      return true;
    }
    return !this.labelSet.isEqual(this.labelSetBackup[this.labelSetId]);
  }

  initState() {
    this.labelSets.pipe(take(1)).subscribe((labelSets) => {
      if (this.labelSetId) {
        this.labelSet = new MutableLabelSet(labelSets[this.labelSetId]);
      } else {
        this.labelSet = new MutableLabelSet(EMPTY_LABEL_SET);
      }
      this.labelSetForm.patchValue({
        title: this.labelSet.title,
        kind: this.labelSet.kind[0],
        exclusive: !this.labelSet.multiple,
        labels: (this.labelSet.labels || [])
          .map((label) => label.title.trim())
          .filter((label) => !!label)
          .join(', '),
      });
      if (!this.addNew) {
        this.labelSetForm.controls.kind.disable();
      }
      this.hasChanges = false;
      this.cdr.markForCheck();
    });
  }

  addLabel(title?: string) {
    if (title) {
      if (this.labelControlValue.includes(title)) {
        this.labelInputError = 'label-set.form.labels.duplicated-name';
      } else if (title.includes('/') || title.includes('{') || title.includes('}')) {
        this.labelInputError = this.validationMessages.labels.pattern as string;
      } else {
        this.labelInputError = '';
        this.labelControl.patchValue(this.labelControlValue ? `${this.labelControlValue}, ${title}` : title);
        this.hasChanges = this.hasChanged();
        setTimeout(() => {
          this.labelInputValue = '';
          this.cdr.detectChanges();
        });
      }
    }
  }

  deleteLabel(title: string) {
    this.labelControl.patchValue(
      this.labelControlValue
        .split(', ')
        .filter((label) => title !== label)
        .join(', '),
    );
    this.hasChanges = this.hasChanged();
  }

  saveLabelSet(): void {
    if (!this.labelSetForm.valid || !this.labelSet) {
      return;
    }

    let slug: string;
    if (this.addNew) {
      const slugs = Object.keys(this.labelSetBackup!);
      slug = STFUtils.generateUniqueSlug(this.labelSetForm.getRawValue().title, slugs);
    } else {
      slug = this.labelSetId as string;
    }

    const labelSet = this.labelSet.getCopy();
    this.labelsService
      .saveLabelSet(slug, labelSet)
      .pipe(
        switchMap(() => this.labelsService.refreshLabelsSets()),
        take(1),
      )
      .subscribe(() => this.done.emit({ id: slug, labelSet }));
  }

  validateLabelList($event: Event) {
    $event.stopPropagation();
    $event.preventDefault();
    this.labelListElement?.nativeElement.querySelector('textarea')?.blur();
  }
}
