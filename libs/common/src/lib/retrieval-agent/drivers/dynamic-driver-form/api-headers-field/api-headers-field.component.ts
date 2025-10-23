import { Component, Input, OnInit, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormGroup, FormArray, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PaTextFieldModule, PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

export interface HeaderEntry {
  key: string;
  value: string;
}

@Component({
  selector: 'app-api-headers-field',
  templateUrl: './api-headers-field.component.html',
  styleUrls: ['./api-headers-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaTextFieldModule, PaButtonModule, PaIconModule, TranslateModule],
})
export class ApiHeadersFieldComponent implements OnInit {
  @Input() form!: FormGroup;
  @Input() controlName!: string;
  @Input() label!: string;
  @Input() required: boolean = false;

  headerEntries = signal<HeaderEntry[]>([]);

  ngOnInit() {
    this.initializeHeaders();
    this.watchFormChanges();
  }

  private initializeHeaders() {
    const currentValue = this.form.get(this.controlName)?.value || {};
    const entries: HeaderEntry[] = Object.entries(currentValue).map(([key, value]) => ({
      key,
      value: value as string,
    }));

    // If no entries, add one empty entry to start with
    if (entries.length === 0) {
      entries.push({ key: '', value: '' });
    }

    this.headerEntries.set(entries);
  }

  private watchFormChanges() {
    // Watch for external changes to the form control
    this.form.get(this.controlName)?.valueChanges.subscribe((value) => {
      if (value && typeof value === 'object') {
        const entries: HeaderEntry[] = Object.entries(value).map(([key, val]) => ({
          key,
          value: val as string,
        }));
        this.headerEntries.set(entries.length > 0 ? entries : [{ key: '', value: '' }]);
      }
    });
  }

  addHeader() {
    const currentEntries = this.headerEntries();
    const newEntries = [...currentEntries, { key: '', value: '' }];
    this.headerEntries.set(newEntries);
    // Ensure form is updated when headers are added
    this.updateFormValue(newEntries);
  }

  removeHeader(index: number) {
    const currentEntries = this.headerEntries();
    if (currentEntries.length > 1) {
      const newEntries = currentEntries.filter((_, i) => i !== index);
      this.headerEntries.set(newEntries);
      this.updateFormValue(newEntries);
    }
  }

  onHeaderKeyChange(index: number, key: string) {
    const currentEntries = this.headerEntries();
    const newEntries = [...currentEntries];
    newEntries[index] = { ...newEntries[index], key };
    this.headerEntries.set(newEntries);
    this.updateFormValue(newEntries);
  }

  onHeaderValueChange(index: number, value: string) {
    const currentEntries = this.headerEntries();
    const newEntries = [...currentEntries];
    newEntries[index] = { ...newEntries[index], value };
    this.headerEntries.set(newEntries);
    this.updateFormValue(newEntries);
  }

  private updateFormValue(entries: HeaderEntry[]) {
    // Convert entries back to object format
    const headersObject: { [key: string]: string } = {};

    entries.forEach((entry) => {
      // Only include entries that have both key and value filled
      if (entry.key.trim() && entry.value.trim()) {
        headersObject[entry.key.trim()] = entry.value.trim();
      }
    });

    // Update the form control
    this.form.get(this.controlName)?.setValue(headersObject, { emitEvent: false });
  }
}
