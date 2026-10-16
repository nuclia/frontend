import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EditResourceService } from '@flaps/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { FIELD_TYPE } from '@nuclia/core';
import { of, Subject } from 'rxjs';
import { AddFieldComponent } from './add-field.component';

describe('AddFieldComponent', () => {
  let component: AddFieldComponent;
  let result: Subject<void>;
  let modal: { close: jest.Mock; dismiss: jest.Mock };
  let service: { resource: ReturnType<typeof of>; addField: jest.Mock; addFile: jest.Mock; setCurrentView: jest.Mock };
  let markForCheck: jest.Mock;

  beforeEach(() => {
    result = new Subject<void>();
    modal = { close: jest.fn(), dismiss: jest.fn() };
    markForCheck = jest.fn();
    service = {
      resource: of({ getFields: () => [] }),
      addField: jest.fn(() => result),
      addFile: jest.fn(() => result),
      setCurrentView: jest.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: EditResourceService, useValue: service },
        { provide: ModalRef, useValue: modal },
        { provide: ChangeDetectorRef, useValue: { markForCheck } },
      ],
    });
    component = TestBed.runInInjectionContext(() => new AddFieldComponent());
  });

  it('dismisses an untouched form without changing the current field view', () => {
    component.cancel();

    expect(modal.dismiss).toHaveBeenCalled();
    expect(service.setCurrentView).not.toHaveBeenCalled();
    expect(service.addField).not.toHaveBeenCalled();
  });

  it('closes only after saving and prevents duplicate submissions', () => {
    component.textControl.setValue('New field content');
    component.save();
    component.save();

    expect(service.addField).toHaveBeenCalledTimes(1);
    expect(service.addField).toHaveBeenCalledWith(FIELD_TYPE.text, 'text1', {
      body: 'New field content',
      format: 'PLAIN',
    });
    expect(modal.close).not.toHaveBeenCalled();

    result.next();

    expect(modal.close).toHaveBeenCalled();
  });

  it('keeps the dialog and entered content available after a save error', () => {
    component.textControl.setValue('Content to retry');
    component.save();
    result.error(new Error('Save failed'));

    expect(component.isSaving).toBe(false);
    expect(component.textControl.value).toBe('Content to retry');
    expect(modal.close).not.toHaveBeenCalled();
    expect(markForCheck).toHaveBeenCalled();
  });

  it('clears a selected upload when switching field types', () => {
    component.changeFieldType(FIELD_TYPE.file);
    component.onFileChange(new File(['content'], 'example.txt'));
    component.changeFieldType(FIELD_TYPE.link);

    expect(component.newFile).toBeUndefined();
    expect(component.isModified).toBe(false);
    expect(component.form.invalid).toBe(true);
  });
});
