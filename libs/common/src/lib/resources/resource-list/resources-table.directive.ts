import { Directive, EventEmitter, inject, Input, Output } from '@angular/core';
import { BulkAction, MenuAction, ResourceWithLabels } from './resource-list.model';
import { Resource } from '@nuclia/core';
import { map } from 'rxjs/operators';
import { SDKService } from '@flaps/core';

@Directive({
  selector: '[stfResourcesTable]',
})
export class ResourcesTableDirective {
  @Input()
  set data(value: ResourceWithLabels[] | undefined | null) {
    if (value) {
      this._data = value;
    }
  }
  get data(): ResourceWithLabels[] {
    return this._data;
  }

  @Input()
  set bulkAction(value: BulkAction | undefined | null) {
    if (value) {
      // Reset selection when bulk action is done
      if (this._bulkAction.inProgress && !value.inProgress) {
        this.selection = [];
      }
      this._bulkAction = value;
    }
  }
  get bulkAction(): BulkAction {
    return this._bulkAction;
  }

  @Input()
  set selection(value: string[] | undefined | null) {
    if (value) {
      this._selection = value;
    }
  }
  get selection(): string[] {
    return this._selection;
  }

  get allSelected(): boolean {
    return this.selection.length > 0 && this.selection.length === this.data.length;
  }

  @Output() clickOnTitle: EventEmitter<{ resource: Resource }> = new EventEmitter();
  @Output() deleteResources: EventEmitter<Resource[]> = new EventEmitter();
  @Output() menuAction: EventEmitter<{ resource: Resource; action: MenuAction }> = new EventEmitter();
  @Output() reprocessResources: EventEmitter<Resource[]> = new EventEmitter();

  private _bulkAction: BulkAction = {
    inProgress: false,
    total: 0,
    done: 0,
    label: '',
  };
  private _data: ResourceWithLabels[] = [];
  private _selection: string[] = [];

  protected sdk: SDKService = inject(SDKService);
  currentKb = this.sdk.currentKb;
  isAdminOrContrib = this.currentKb.pipe(map((kb) => this.sdk.nuclia.options.standalone || !!kb.admin || !!kb.contrib));

  triggerAction(resource: Resource, action: MenuAction) {
    this.menuAction.emit({ resource, action });
  }

  onClickTitle(resource: Resource) {
    this.clickOnTitle.emit({ resource });
  }

  bulkDelete() {
    const resources = this.getSelectedResources();
    this.deleteResources.emit(resources);
  }

  bulkReprocess() {
    const resources = this.getSelectedResources();
    this.reprocessResources.emit(resources);
  }

  toggleAll() {
    if (this.allSelected) {
      this.selection = [];
    } else {
      this.selection = this.data.map((row) => row.resource.id);
    }
  }

  toggleSelection(resourceId: string) {
    if (this.selection.includes(resourceId)) {
      this.selection = this.selection.filter((id) => id !== resourceId);
    } else {
      this.selection = this.selection.concat([resourceId]);
    }
  }

  protected getSelectedResources(): Resource[] {
    return this.data.filter((row) => this.selection.includes(row.resource.id)).map((row) => row.resource);
  }
}
