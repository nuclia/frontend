import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { map, Subject, take } from 'rxjs';
import { filter, switchMap, takeUntil, tap } from 'rxjs/operators';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { STFUtils } from '@flaps/core';
import { LabelSetKind, LabelSets } from '@nuclia/core';
import { EMPTY_LABEL_SET, MutableLabelSet } from '../model';
import { LABEL_MAIN_COLORS } from '../utils';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { Sluggable } from '../../../validators';
import { LabelsService } from '../../labels.service';

interface LabelSetTitleError extends IErrorMessages {
  required: string;
  sluggable: string;
}

@Component({
  selector: 'app-label-set',
  templateUrl: './label-set.component.html',
  styleUrls: ['./label-set.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelSetComponent implements OnDestroy {
  labelSetForm = new FormGroup({
    title: new FormControl<string>('', { validators: [Validators.required, Sluggable()], nonNullable: true }),
    kind: new FormControl<LabelSetKind | undefined>(undefined, { validators: [Validators.required] }),
    exclusive: new FormControl<boolean>(false),
  });

  colors: string[] = LABEL_MAIN_COLORS;
  kinds = [
    { id: LabelSetKind.RESOURCES, name: 'label-set.resources' },
    { id: LabelSetKind.PARAGRAPHS, name: 'label-set.paragraphs' },
  ];

  validationMessages: { [key: string]: LabelSetTitleError } = {
    title: {
      required: 'label-set.form.name-required',
      sluggable: 'label-set.form.name-invalid',
    },
  };

  labelSet?: MutableLabelSet;
  labelSetId?: string;
  addNew: boolean = false;
  labelOrder: string[] = [];
  labelSetBackup?: LabelSets;
  hasChanges: boolean = false;
  unsubscribeAll = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private labelsService: LabelsService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
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
      .subscribe((labelSets: LabelSets) => {
        this.labelSetBackup = labelSets;
        this.initState(labelSets);
      });

    this.labelSetForm.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      if (this.labelSet) {
        const data = this.labelSetForm.getRawValue();
        this.labelSet.title = data.title;
        this.labelSet.multiple = !data.exclusive;
        if (data.kind) {
          this.labelSet.kind = [data.kind];
        }
        this.hasChanges = this.hasChanged();
        this.cdr.markForCheck();
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
    });
    this.labelOrder = this.getLabelOrder();
    this.hasChanges = false;
    this.cdr.markForCheck();
  }

  getLabelOrder(): string[] {
    return this.labelSet?.labels ? this.labelSet.labels.map((label) => label.title) : [];
  }

  setColor(color: string) {
    if (this.labelSet) {
      this.labelSet.color = color;
      this.hasChanges = this.hasChanged();
      this.cdr.markForCheck();
    }
  }

  addLabel(title: string) {
    this.labelSet?.addLabel(title);
    this.labelOrder = this.getLabelOrder();
    this.hasChanges = this.hasChanged();
  }

  modifyLabel(title: string, newTitle: string) {
    this.labelSet?.modifyLabel(title, { title: newTitle });
    this.labelOrder = this.getLabelOrder();
    this.hasChanges = this.hasChanged();
  }

  deleteLabel(title: string) {
    this.labelSet?.deleteLabel(title);
    this.labelOrder = this.getLabelOrder();
    this.hasChanges = this.hasChanged();
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.labelOrder, event.previousIndex, event.currentIndex);
    this.labelSet?.setLabelOrder(this.labelOrder);
    this.hasChanges = this.hasChanged();
    this.cdr.markForCheck();
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
}
