import { CheckboxGroupItem } from '@flaps/common';

type OntologyCheckboxes = { [key: string]: CheckboxGroupItem[] };

export class OntologySelection {
  selection: { [ontologyId: string]: string[] } = {};

  constructor(ontologies: OntologyCheckboxes, initialSelection: string[]) {
    Object.keys(ontologies).forEach((ontologyId: string) => {
      this.selection[ontologyId] = initialSelection.filter((value) =>
        ontologies[ontologyId].some((checkbox) => checkbox.value === value),
      );
    });
  }

  getSelection(ontologyId: string): string[] {
    return this.selection[ontologyId];
  }

  setSelection(ontologyId: string, selection: string[]) {
    this.selection[ontologyId] = selection;
  }

  getAllSelections(): string[] {
    return Object.keys(this.selection).reduce(
      (prev: string[], ontologyId: string) => prev.concat(this.selection[ontologyId]),
      [],
    );
  }
}
