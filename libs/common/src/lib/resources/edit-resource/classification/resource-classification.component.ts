import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Classification, LabelSets, Resource } from '@nuclia/core';
import { BehaviorSubject, combineLatest, map, Observable, tap } from 'rxjs';
import { SelectFirstFieldDirective } from '../select-first-field/select-first-field.directive';
import { filter, takeUntil } from 'rxjs/operators';
import { LabelsService } from '../../../label';

@Component({
  templateUrl: './resource-classification.component.html',
  styleUrls: ['../common-page-layout.scss', './resource-classification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceClassificationComponent extends SelectFirstFieldDirective implements OnInit, OnDestroy {
  backupLabels: Classification[] = [];
  isModified = false;
  kbUrl = this.editResource.kbUrl;
  isAdminOrContrib = this.editResource.isAdminOrContrib;

  currentSelection: { [id: string]: boolean } = {};

  private _resourceLabelSets = this.labelsService.resourceLabelSets.pipe(tap(() => this._hasLabelLoaded.next(true)));

  resourceLabelSets = this._resourceLabelSets.pipe(
    filter((labelset) => !!labelset && Object.keys(labelset).length > 0),
    map((labelset) => labelset as LabelSets),
  );
  currentLabels: BehaviorSubject<Classification[]> = new BehaviorSubject<Classification[]>([]);
  hasLabels: Observable<boolean> = this._resourceLabelSets.pipe(
    map((labelSets) => !!labelSets && Object.keys(labelSets).length > 0),
  );

  private _hasLabelLoaded = new BehaviorSubject(false);
  private _resourceClassificationLoaded = new BehaviorSubject(false);
  isReady = combineLatest([this._hasLabelLoaded, this._resourceClassificationLoaded]).pipe(
    map(([hasLabelLoaded, resourceClassificationLoaded]) => hasLabelLoaded && resourceClassificationLoaded),
  );

  constructor(
    private cdr: ChangeDetectorRef,
    private labelsService: LabelsService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.editResource.setCurrentView('classification');
    this.editResource.resource
      .pipe(
        filter((resource) => !!resource),
        map((resource) => (resource as Resource).getClassifications() || []),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((labels) => {
        this.backupLabels = labels;
        this.currentLabels.next(labels);
        this.isModified = false;
        this._resourceClassificationLoaded.next(true);
        this.cdr.detectChanges();
      });
    this.currentLabels
      .pipe(
        tap((labels) => {
          this.currentSelection = labels.reduce(
            (selection, classification) => {
              selection[`${classification.labelset}_${classification.label}`] = true;
              return selection;
            },
            {} as { [id: string]: boolean },
          );
          this.cdr.markForCheck();
        }),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe();
  }

  updateLabels(labels: Classification[]) {
    this.currentLabels.next(labels);
    this.updateIsModified();
    this.cdr.detectChanges();
  }

  cancel() {
    this.currentLabels.next([...this.backupLabels]);
    this.isModified = false;
    this.cdr.markForCheck();
  }

  save() {
    const partial: Partial<Resource> = {
      usermetadata: {
        classifications: this.editResource.getClassificationsPayload(this.currentLabels.value),
      },
    };
    this.editResource.savePartialResource(partial).subscribe();
  }

  updateLabel(event: { selected: boolean; labelset: string; label: string }) {
    const { selected, labelset, label } = event;
    if (selected) {
      this.currentLabels.next(this.currentLabels.value.concat([{ label, labelset }]));
    } else {
      this.currentLabels.next(
        this.currentLabels.value.filter((item) => !(item.labelset === labelset && item.label === label)),
      );
    }

    this.updateIsModified();
  }

  private updateIsModified() {
    const current = this.currentLabels.value;
    this.isModified =
      current.length !== this.backupLabels.length ||
      !current.every(
        (classification) =>
          !!this.backupLabels.find(
            (item) => item.labelset === classification.labelset && item.label === classification.label,
          ),
      );
    this.cdr.markForCheck();
  }
}
