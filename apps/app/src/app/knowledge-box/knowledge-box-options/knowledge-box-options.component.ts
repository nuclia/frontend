import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { CheckboxGroupItem } from '@flaps/common';


@Component({
  selector: 'app-knowledge-box-options',
  templateUrl: './knowledge-box-options.component.html',
  styleUrls: ['./knowledge-box-options.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KnowledgeBoxOptionsComponent implements OnInit {

  selectedFilters: string[] = [];
  selectedCategories = new SelectionModel<string>(true, []);

  filters: CheckboxGroupItem[] = [
    { value: 'sort_by', label: 'search.sort_by' },
    { value: 'tags', label: 'generic.tags' },
    { value: 'results', label: 'search.type_of_results' },
    { value: 'document', label: 'search.type_of_document' },
    { value: 'origin', label: 'generic.origin' },
    { value: 'top_insights', label: 'search.top_insights' },
  ];

  categories = [
    'date', 'event', 'fac', 'gpe', 'language', 'loc', 'mail', 'money',
    'norp', 'org', 'percent','person', 'product', 'time', 'work_of_art'
  ];

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
  }

  isDisabled(category: string) {
    return !this.selectedCategories.isSelected(category) && this.selectedCategories.selected.length >=4;
  }

  toggleCategory(category: string) {
    this.selectedCategories.toggle(category);
    this.saveInsights();
    this.cdr.markForCheck();
  }

  saveFilters(selection: string[]): void {
    this.selectedFilters = selection;
    this.cdr.markForCheck();
    // TODO
  }

  saveInsights(): void {
    // TODO
  }

}