import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SDKService } from '@flaps/core';
import { LearningConfigurationOption, LearningConfigurations } from '@nuclia/core';
import { UiConfirmService } from '@nuclia/ui/confirm-dialog';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ZoneSummary } from '../../../manage-zones/zone.models';
import { ZoneService } from '../../../manage-zones/zone.service';
import { ManagerStore } from '../../../manager.store';
import { KbSummary } from '../../account-ui.models';
import { AccountService } from '../../account.service';
import { ZoneModels } from '../../regional-account.models';
import { RegionalAccountService } from '../../regional-account.service';
import { ACCOUNT_DETAILS } from '../../test-utils';
import { AddModelComponent } from './add-model/add-model.component';
import { UserKeysComponent, UserKeysForm } from './add-model/user-keys/user-keys.component';
import { ModelDetailsComponent } from './model-details/model-details.component';
import { ModelsComponent } from './models.component';

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

describe('Models', () => {
  describe('ModelsComponent', () => {
    let fixture: ComponentFixture<ModelsComponent>;

    const zoneModels = [
      {
        zone: { id: 'z1', slug: 'europe-1', title: 'Europe' },
        models: [{ model_id: 'm1', title: 'My model', location: 'openai:gpt', model_types: ['generator'] }],
      },
    ] as unknown as ZoneModels[];

    async function setup(canManageModels: boolean) {
      await TestBed.configureTestingModule({
        imports: [ModelsComponent, RouterModule.forRoot([])],
        providers: [
          MockProvider(ManagerStore, {
            accountDetails: signal(ACCOUNT_DETAILS),
            accountModels: signal(zoneModels),
            canManageModels: signal(canManageModels),
          }),
          MockProvider(AccountService, { loadAccountModels: vi.fn(() => of([] as ZoneModels[])) }),
          MockProvider(RegionalAccountService),
          MockProvider(UiConfirmService),
        ],
      }).compileComponents();
      fixture = TestBed.createComponent(ModelsComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    it('should list the models by zone and offer the add button', async () => {
      await setup(true);
      const element: HTMLElement = fixture.nativeElement;
      expect(element.textContent).toContain('Europe');
      expect(element.textContent).toContain('My model');
      expect(element.querySelector('a[hlmBtn]')).toBeTruthy();
    });

    it('should hide the actions when the user cannot manage models', async () => {
      await setup(false);
      const element: HTMLElement = fixture.nativeElement;
      expect(element.textContent).toContain('My model');
      expect(element.querySelector('a[hlmBtn]')).toBeFalsy();
      expect(element.querySelector('button[aria-label="Menu"]')).toBeFalsy();
    });
  });

  describe('AddModelComponent', () => {
    let fixture: ComponentFixture<AddModelComponent>;
    let component: AddModelComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AddModelComponent, RouterModule.forRoot([]), MockComponent(UserKeysComponent)],
        providers: [
          MockProvider(ManagerStore, {
            accountDetails: signal(ACCOUNT_DETAILS),
            getAccountId: vi.fn(() => ACCOUNT_DETAILS.id),
          }),
          MockProvider(RegionalAccountService),
          MockProvider(SDKService, {
            nuclia: { db: { getLearningSchema: vi.fn(() => of({})) } },
          } as unknown as SDKService),
          MockProvider(ZoneService, {
            getZoneDict: vi.fn(() => of({ z1: { id: 'z1', slug: 'europe-1', title: 'Europe' } as ZoneSummary })),
          }),
          { provide: ActivatedRoute, useValue: { params: of({}) } },
        ],
      }).compileComponents();
      fixture = TestBed.createComponent(AddModelComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should preselect the first zone and keep the form invalid until filled', () => {
      expect(component.zoneControl.value).toBe('europe-1');
      expect(component.invalid).toBe(true);
      component.modelForm.patchValue({ description: 'Name', location: 'openai:gpt', model_types: [] });
      expect(component.invalid).toBe(true);
    });
  });

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

  describe('ModelDetailsComponent', () => {
    let fixture: ComponentFixture<ModelDetailsComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ModelDetailsComponent],
        providers: [
          MockProvider(ManagerStore, {
            accountDetails: signal(ACCOUNT_DETAILS),
            kbList: signal([
              { id: 'kb1', title: 'First KB', zone: { slug: 'europe-1' } },
              { id: 'kb2', title: 'Other zone KB', zone: { slug: 'aws-us' } },
            ] as unknown as KbSummary[]),
          }),
          MockProvider(SDKService, {
            nuclia: { db: { getModel: vi.fn(() => of({ location: 'openai:gpt', kbids: ['kb1'] })) } },
          } as unknown as SDKService),
          { provide: ActivatedRoute, useValue: { params: of({ modelId: 'm1', zoneSlug: 'europe-1' }) } },
        ],
      }).compileComponents();
      fixture = TestBed.createComponent(ModelDetailsComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should list only the knowledge boxes of the model zone, with the assigned ones checked', () => {
      const element: HTMLElement = fixture.nativeElement;
      expect(element.textContent).toContain('First KB');
      expect(element.textContent).not.toContain('Other zone KB');
      expect(fixture.componentInstance.kbForm.controls['kb1'].value).toBe(true);
    });
  });
});
