import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostBinding,
} from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { Label, Labels, LabelValue } from '@nuclia/core';

@Component({
  selector: 'app-label-select',
  templateUrl: './label-select.component.html',
  styleUrls: ['./label-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelSelectComponent implements OnInit {
  @Input() labelSets: Labels = {};
  @Input() selected: LabelValue[] = [];
  @Output() selectedChange: EventEmitter<LabelValue[]> = new EventEmitter();

  @HostBinding('style.width') @Input() width?: string;
  expanded = new SelectionModel<string>(true);

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.initExpandedLabelSets();
  }

  initExpandedLabelSets() {
    Object.keys(this.labelSets)
      .filter((key) => this.selected.some((labelValue) => labelValue.labelset === key))
      .forEach((key) => this.expanded.select(key));

    if (!this.expanded.hasValue()) {
      const first = Object.keys(this.labelSets)[0];
      if (first) {
        this.toggleExpanded(first);
      }
    }
  }

  changeSelected(label: LabelValue, selected: boolean) {
    let newSelectedLabels;
    if (selected) {
      const isMultiple = this.labelSets[label.labelset]?.multiple;
      newSelectedLabels = isMultiple
        ? this.selected.concat([label])
        : this.selected.filter((item) => item.labelset !== label.labelset).concat([label]);
    } else {
      newSelectedLabels = this.selected.filter(
        (item) => !(item.label === label.label && item.labelset === label.labelset)
      );
    }
    this.selectedChange.emit(newSelectedLabels);
  }

  isSelected(label: LabelValue): boolean {
    return this.selected.some((item) => item.label === label.label && item.labelset === label.labelset);
  }

  toggleExpanded(labelSetKey: string): void {
    this.expanded.toggle(labelSetKey);
    this.cdr.markForCheck();
  }

  isExpanded(labelSetKey: string): boolean {
    return this.expanded.isSelected(labelSetKey);
  }

  preserveOrder() {
    return 0;
  }
}
