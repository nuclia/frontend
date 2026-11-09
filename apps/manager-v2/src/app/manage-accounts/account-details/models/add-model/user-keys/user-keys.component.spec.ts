import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LearningConfigurationOption, LearningConfigurations } from '@nuclia/core';
import { UserKeysComponent, UserKeysForm } from './user-keys.component';

const MODEL = {
  value: 'openai-compatible',
  name: 'OpenAI compatible',
  user_key: 'openai_compat',
} as LearningConfigurationOption;
const CONFIGURATIONS = {
  user_keys: {
    schemas: {
      openai_compat: {
        title: 'OpenAI compatible',
        type: 'string',
        required: ['url', 'mode'],
        properties: {
          url: { title: 'URL', type: 'string', description: 'Endpoint' },
          key: { title: 'Key', type: 'string', widget: 'textarea' },
          mode: { title: 'Mode', type: 'integer', $ref: '#/$defs/Mode' },
          options: { title: 'Options', type: 'object', $ref: '#/$defs/Options' },
        },
        $defs: {
          Mode: { title: 'Mode', type: 'integer', properties: undefined, enum: [1, 2], titles: ['One', 'Two'] },
          Options: {
            title: 'Options',
            type: 'string',
            properties: { stream: { title: 'Stream', type: 'boolean', default: true } },
          },
        },
      },
    },
  },
} as unknown as LearningConfigurations;

describe('UserKeysComponent', () => {
  let fixture: ComponentFixture<UserKeysComponent>;
  let form: UserKeysForm;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UserKeysComponent] }).compileComponents();
    fixture = TestBed.createComponent(UserKeysComponent);
    fixture.componentRef.setInput('generativeModel', MODEL);
    fixture.componentRef.setInput('learningConfigurations', CONFIGURATIONS);
    fixture.componentInstance.formReady.subscribe((value) => (form = value));
    fixture.detectChanges();
  });

  it('should build controls from the schema, including sub-forms, and emit the form once', () => {
    expect(form).toBeDefined();
    expect(Object.keys(form.controls.user_keys.controls)).toEqual(['url', 'key', 'mode', 'options']);
    expect(form.controls.user_keys.get('options.stream')?.value).toBe(true);
  });

  it('should require schema required fields only when own key is enabled', () => {
    expect(form.valid).toBe(true);
    form.controls.enabled.setValue(true);
    expect(form.controls.user_keys.get('url')?.hasError('required')).toBe(true);
    expect(form.controls.user_keys.get('key')?.valid).toBe(true);
    form.controls.enabled.setValue(false);
    expect(form.valid).toBe(true);
  });

  it('should render fields only when own key is enabled', () => {
    expect(fixture.nativeElement.querySelector('#user-key-url')).toBeNull();
    form.controls.enabled.setValue(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#user-key-url')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('textarea#user-key-key')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Required field Endpoint');
  });
});
