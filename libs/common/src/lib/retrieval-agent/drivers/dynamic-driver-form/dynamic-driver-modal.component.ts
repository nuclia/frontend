import { ChangeDetectionStrategy, Component, inject, Input, OnInit, ViewChild, signal, computed } from '@angular/core';
import { PaModalModule, PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ARAGSchemas, Driver, DriverCreation } from '@nuclia/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { DynamicDriverFormComponent } from './dynamic-driver-form.component';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';

export interface DynamicDriverModalData {
  driverTitle: string;
  existingDriver?: Driver;
  existingDrivers?: Driver[];
}

@Component({
  selector: 'app-dynamic-driver-modal',
  templateUrl: './dynamic-driver-modal.component.html',
  styleUrls: ['./dynamic-driver-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [PaModalModule, PaButtonModule, TranslateModule, CommonModule, DynamicDriverFormComponent],
})
export class DynamicDriverModalComponent implements OnInit {
  @ViewChild(DynamicDriverFormComponent) formComponent!: DynamicDriverFormComponent;

  private modalRef = inject(ModalRef<DynamicDriverModalData>);
  private translate = inject(TranslateService);
  private toaster = inject(SisToastService);

  // Get data from modal service instead of @Input
  driverTitle!: string;
  existingDriver?: Driver;
  existingDrivers?: Driver[];

  form = signal<FormGroup | null>(null);
  isFormValid = signal(false);
  isLoading = signal(false);

  modalTitle = computed(() => {
    const isEditing = !!this.existingDriver;
    const driverName = this.getDriverDisplayName();
    return isEditing
      ? this.translate.instant('retrieval-agents.drivers.edit.title', { name: driverName })
      : this.translate.instant('retrieval-agents.drivers.add.title', { name: driverName });
  });

  saveButtonText = computed(() => {
    const isEditing = !!this.existingDriver;
    return isEditing ? this.translate.instant('generic.save') : this.translate.instant('generic.create');
  });

  ngOnInit() {
    // Get data from the modal service
    const modalData = this.modalRef.config.data as DynamicDriverModalData;
    this.driverTitle = modalData.driverTitle;
    this.existingDriver = modalData.existingDriver;
    this.existingDrivers = modalData.existingDrivers;
  }

  onFormReady(form: FormGroup) {
    this.form.set(form);
  }

  onFormValidChange(isValid: boolean) {
    this.isFormValid.set(isValid);
  }

  async onSave() {
    if (!this.form() || !this.isFormValid()) {
      this.formComponent.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    try {
      const formValue = this.formComponent.getFormValue();

      // Validate the form data
      if (!this.validateFormData(formValue)) {
        return;
      }

      // Close modal with the form data
      this.modalRef.close(formValue);
    } catch (error) {
      console.error('Error saving driver:', error);
      this.toaster.error(this.translate.instant('retrieval-agents.drivers.errors.save'));
    } finally {
      this.isLoading.set(false);
    }
  }

  onCancel() {
    try {
      // Explicitly close with null to indicate cancellation
      this.modalRef.close(null);
    } catch (error) {
      console.error('Error closing modal:', error);
      // Force dismiss if close fails
      try {
        this.modalRef.dismiss();
      } catch (dismissError) {
        console.error('Error dismissing modal:', dismissError);
      }
    }
  }

  // Handle backdrop clicks
  onBackdropClick() {
    this.onCancel();
  }

  // Add explicit dismiss method for debugging
  forceDismiss() {
    try {
      this.modalRef.dismiss();
    } catch (error) {
      console.error('Error force dismissing modal:', error);
    }
  }

  private validateFormData(data: DriverCreation): boolean {
    // Basic validation
    if (!data.name || !data.provider) {
      this.toaster.error(this.translate.instant('retrieval-agents.drivers.errors.required-fields'));
      return false;
    }

    // Check for duplicate names (excluding current driver if editing)
    if (this.existingDrivers) {
      const isDuplicate = this.existingDrivers.some(
        (driver) => driver.name === data.name && driver.id !== this.existingDriver?.id,
      );

      if (isDuplicate) {
        this.toaster.error(this.translate.instant('retrieval-agents.drivers.errors.duplicate-name'));
        return false;
      }
    }

    return true;
  }

  private getDriverDisplayName(): string {
    // Handle case where driverTitle might be undefined
    if (!this.driverTitle) {
      return 'Driver';
    }

    // Convert driver title to display name
    const titleLower = this.driverTitle.toLowerCase();

    // Fallback to the original title
    return !!this.translate.instant(`retrieval-agents.drivers.types.${titleLower}`)
      ? this.translate.instant(`retrieval-agents.drivers.types.${titleLower}`)
      : this.driverTitle;
  }
}
