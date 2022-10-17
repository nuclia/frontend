import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { KeyValue } from '@angular/common';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { LabelsService } from '../../services/labels.service';
import { isLabelMainColor } from '../utils';
import { LabelSet, LabelSets } from '@nuclia/core';
import { getLabelColor } from '@nuclia/sistema';

@Component({
  selector: 'app-ontology-list',
  templateUrl: './ontology-list.component.html',
  styleUrls: ['./ontology-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OntologyListComponent implements OnDestroy {
  unsubscribeAll = new Subject<void>();
  labelSets?: LabelSets;

  constructor(private labelsService: LabelsService, private cdr: ChangeDetectorRef) {
    this.labelsService.labels
      .pipe(
        filter((labels) => !!labels),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((labels) => {
        this.labelSets = labels!;
        this.cdr?.markForCheck();
      });
  }

  getTextColor(color: string): string | undefined {
    return isLabelMainColor(color) ? getLabelColor(color)?.textColor : undefined;
  }

  getBackgroundColor(color: string): string | undefined {
    return isLabelMainColor(color) ? color : undefined;
  }

  sortByTitle(a: KeyValue<string, LabelSet>, b: KeyValue<string, LabelSet>): number {
    return a.value.title.localeCompare(b.value.title);
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
