import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, map, Subject, take } from 'rxjs';
import { filter, switchMap, takeUntil, tap } from 'rxjs/operators';
import { FeatureFlagService, STFUtils } from '@flaps/core';
import { LabelSetKind, LabelSets } from '@nuclia/core';
import { EMPTY_LABEL_SET, LabelSetCounts, MutableLabelSet } from '../model';
import { LABEL_MAIN_COLORS } from '../utils';
import { noDuplicateListItemsValidator, Sluggable } from '../../../validators';
import { LabelsService } from '../../labels.service';
import { LABEL_COLORS } from '@nuclia/sistema';

const KINDS = [
  { id: LabelSetKind.RESOURCES, name: 'label-set.resources' },
  { id: LabelSetKind.PARAGRAPHS, name: 'label-set.paragraphs' },
];

@Component({
  selector: 'app-label-set',
  templateUrl: './label-set.component.html',
  styleUrls: ['./label-set.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelSetComponent implements OnDestroy {
  @ViewChild('labelList', { read: ElementRef }) labelListElement?: ElementRef;

  labelSetForm = new FormGroup({
    title: new FormControl<string>('', { validators: [Validators.required, Sluggable()], nonNullable: true }),
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
  kinds = this.featureFlag
    .isFeatureEnabled('pdf-annotation')
    .pipe(
      map((enabled) => (enabled ? KINDS.concat({ id: LabelSetKind.SELECTIONS, name: 'label-set.selections' }) : KINDS)),
    );
  counts = this.labelsService.labelSetsCount;

  validationMessages = {
    title: {
      required: 'label-set.form.name-required',
      sluggable: 'label-set.form.name-invalid',
    },
    labels: {
      pattern: 'label-set.form.labels.naming-constraint',
    },
  };

  labelSet?: MutableLabelSet;
  labelSetId?: string;

  addNew = false;
  labelView: 'list' | 'grid' = 'list';
  labelInputValue = '';
  labelInputError = '';
  labelSetBackup?: LabelSets;
  hasChanges: boolean = false;
  unsubscribeAll = new Subject<void>();

  get labelControl() {
    return this.labelSetForm.controls.labels;
  }
  get labelControlValue() {
    return this.labelSetForm.controls.labels.value;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private labelsService: LabelsService,
    private cdr: ChangeDetectorRef,
    private featureFlag: FeatureFlagService,
  ) {
    this.route.params
      .pipe(
        tap((params) => {
          this.labelSetId = params['labelSet'];
          this.addNew = !params['labelSet'];
          this.cdr.markForCheck();
        }),
        switchMap(() => this.labelsService.labelSets),
        filter((labelSets) => !!labelSets),
        map((labelSets) => labelSets as LabelSets),
        filter((labelSets) => !this.labelSetId || !!(this.labelSetId && labelSets[this.labelSetId])),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((labelSets) => {
        this.labelSetBackup = labelSets;
        this.initState(labelSets);
      });

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

  private hasChanged(): boolean {
    if (!this.labelSetId || !this.labelSetBackup || !this.labelSet) {
      return true;
    }
    return !this.labelSet.isEqual(this.labelSetBackup[this.labelSetId]);
  }

  initState(labelSets: LabelSets) {
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

    this.labelsService
      .saveLabelSet(slug, this.labelSet.getCopy())
      .pipe(
        switchMap(() => this.labelsService.refreshLabelsSets()),
        take(1),
      )
      .subscribe(() => this.goToLabelSetList());
  }

  goToLabelSetList() {
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  validateLabelList($event: Event) {
    $event.stopPropagation();
    $event.preventDefault();
    this.labelListElement?.nativeElement.querySelector('textarea')?.blur();
  }
}
