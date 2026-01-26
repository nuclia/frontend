
import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { NodeConfig } from '../../../../workflow.models';

@Component({
  selector: 'app-array-string-field',
  templateUrl: './array-string-field.component.html',
  styleUrls: ['./array-string-field.component.scss'],
  standalone: true,
  imports: [PaButtonModule, PaTextFieldModule, ReactiveFormsModule, TranslateModule],
})
export class ArrayStringFieldComponent {
  @Input() form!: FormGroup;
  @Input() arrayName!: string;
  @Input() config?: NodeConfig | undefined;
  @Input() label: string = '';
  @Input() required: boolean = false;

  ngOnInit() {
    // Defensive: config may be undefined, arrayName may not exist
    const values = this.config && typeof this.arrayName === 'string' ? (this.config as any)[this.arrayName] : undefined;
    if (Array.isArray(values) && values.length > 0) {
      // Ensure FormArray has enough controls
      const numberToCreate = values.length - this.array.length;
      for (let i = 0; i < numberToCreate; i++) {
        this.addField();
      }
      this.array.patchValue(values);
    }
  }

  get array(): FormArray<FormControl<string>> {
    return this.form.get(this.arrayName) as FormArray<FormControl<string>>;
  }

  addField() {
    this.array.push(new FormControl<string>('', { nonNullable: true }));
  }

  removeField(index: number) {
    this.array.removeAt(index);
  }
}
