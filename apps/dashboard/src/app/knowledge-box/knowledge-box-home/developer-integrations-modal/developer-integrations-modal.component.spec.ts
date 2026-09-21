import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MockModule, MockProvider } from 'ng-mocks';
import {
  ModalConfig,
  ModalRef,
  PaButtonModule,
  PaModalModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { SDKService, ZoneService } from '@flaps/core';
import { WritableKnowledgeBox } from '@nuclia/core';

import { DeveloperIntegrationsModalComponent } from './developer-integrations-modal.component';

describe('DeveloperIntegrationsModalComponent', () => {
  let component: DeveloperIntegrationsModalComponent;
  let fixture: ComponentFixture<DeveloperIntegrationsModalComponent>;
  let modalRef: ModalRef;

  const kb = {
    id: 'kb-id',
    zone: 'test-zone',
    path: '/v1/kb/kb-id',
    fullpath: 'https://backend.nuclia.cloud/api/v1/kb/kb-id',
  } as unknown as WritableKnowledgeBox;

  beforeEach(async () => {
    modalRef = new ModalRef({ id: 0, config: new ModalConfig({}) });
    jest.spyOn(modalRef, 'close');

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true,
    });

    await TestBed.configureTestingModule({
      imports: [
        DeveloperIntegrationsModalComponent,
        MockModule(PaButtonModule),
        MockModule(PaModalModule),
        MockModule(PaTextFieldModule),
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: ModalRef, useValue: modalRef },
        MockProvider(SDKService, {
          currentKb: of(kb),
          nuclia: { options: { backend: 'https://backend.nuclia.cloud' } } as unknown as SDKService['nuclia'],
        }),
        MockProvider(ZoneService, {
          buildMcpEndpointUrl: () => of('https://test-zone.dp.nuclia.cloud/v1/v1/kb/kb-id/mcp'),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeveloperIntegrationsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose the endpoint, uid and mcp signals from the current KB', () => {
    expect(component.endpoint()).toBe(kb.fullpath);
    expect(component.uid()).toBe(kb.id);
    expect(component.mcp()).toBe('https://test-zone.dp.nuclia.cloud/v1/v1/kb/kb-id/mcp');
  });

  describe('copy()', () => {
    it('should write the value to the clipboard and mark the field as copied', () => {
      component.copy('endpoint', kb.fullpath);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(kb.fullpath);
      expect(component.copiedField()).toBe('endpoint');
    });

    it('should reset copiedField after the timeout', () => {
      jest.useFakeTimers();

      component.copy('uid', kb.id);
      expect(component.copiedField()).toBe('uid');

      jest.advanceTimersByTime(1000);
      expect(component.copiedField()).toBeNull();

      jest.useRealTimers();
    });

    it('should not clear a more recently copied field when an earlier timeout fires', () => {
      jest.useFakeTimers();

      component.copy('endpoint', kb.fullpath);
      jest.advanceTimersByTime(500);
      component.copy('mcp', 'https://mcp-url');

      // The first field's timeout fires here; it must not clear the second field's state.
      jest.advanceTimersByTime(500);
      expect(component.copiedField()).toBe('mcp');

      jest.advanceTimersByTime(500);
      expect(component.copiedField()).toBeNull();

      jest.useRealTimers();
    });
  });

  describe('close()', () => {
    it('should call ModalRef.close()', () => {
      component.close();

      expect(modalRef.close).toHaveBeenCalledTimes(1);
    });
  });
});
