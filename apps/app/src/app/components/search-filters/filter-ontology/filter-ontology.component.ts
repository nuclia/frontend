import {
  Component,
  OnInit,
  OnChanges,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { CheckboxGroupItem } from '@flaps/common';
import { OntologySelection } from './utils';


@Component({
  selector: 'app-filter-ontology',
  templateUrl: './filter-ontology.component.html',
  styleUrls: ['./filter-ontology.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterOntologyComponent implements OnInit, OnChanges {
  
  @Input() selection: string[] = [];
  @Output() selectionChange = new EventEmitter<string[]>();

  ontologies: { [key: string]: CheckboxGroupItem[] } = {
    ontology1: EXAMPLE_TAGS,
    ontology2: EXAMPLE_TAGS2
  };
  _selection: OntologySelection | undefined;
  openOntologies = new SelectionModel<string>(true, []);

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.openInitialOntologies();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selection) {
      this._selection = new OntologySelection(this.ontologies, changes.selection.currentValue); 
    }
  }

  openInitialOntologies() {
    if (this._selection) {
      Object.keys(this.ontologies).forEach((ontologyId: string) => {
        if (this._selection!.getSelection(ontologyId).length > 0) {
          this.openOntologies.select(ontologyId);
        }
      });
    }
    this.cdr.markForCheck();
  }

  setSelection(ontologyId: string, selection: string[]): void  {
    this._selection!.setSelection(ontologyId, selection);
    this.selectionChange.emit(this._selection!.getAllSelections());
    this.cdr.markForCheck();
  }

  toggleOntology(ontologyId: string): void {
    this.openOntologies.toggle(ontologyId);
    this.cdr.markForCheck();
  }

  isOpenOntology(ontologyId: string): boolean {
    return this.openOntologies.isSelected(ontologyId);
  }
}

const EXAMPLE_TAGS = [
  {
    label: 'Tag1',
    value: 'tag1',
    helpTips: ['12'],
  },
  {
    label: 'Tag2',
    value: 'tag2',
    helpTips: ['6'],
  },
  {
    label: 'Tag3',
    value: 'tag3',
    helpTips: ['4'],
  }
];

const EXAMPLE_TAGS2 = [
  {
    label: 'Tag4',
    value: 'tag4',
    helpTips: ['12'],
  },
  {
    label: 'Tag5',
    value: 'tag5',
    helpTips: ['6'],
  },
  {
    label: 'Tag6',
    value: 'tag6',
    helpTips: ['4'],
  }
];