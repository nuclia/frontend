import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { TranslatePipeMock } from '@flaps/core';
import { BehaviorSubject, of } from 'rxjs';
import { SyncService } from '../sync/sync.service';
import { ConnectorComponent } from './connector/connector.component';

import { ConnectorsComponent } from './connectors.component';
import { PaButtonModule, PaCardModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';

describe('ConnectorsComponent', () => {
  let component: ConnectorsComponent;
  let fixture: ComponentFixture<ConnectorsComponent>;
  let sync: SyncService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConnectorsComponent, ConnectorComponent, TranslatePipeMock],
      imports: [ReactiveFormsModule, FormsModule, PaButtonModule, PaTextFieldModule, PaCardModule],
      providers: [
        {
          provide: SyncService,
          useValue: {
            sources: { source1: { definition: { id: 'source1' }, settings: {} } },
            destinations: { destination1: { definition: { id: 'destination1' }, settings: {} } },
            getConnectors: (type: 'sources' | 'destinations') =>
              type === 'sources'
                ? [
                    {
                      id: 'source1',
                      title: 'Source 1',
                      icon: '',
                      description: '',
                    },
                  ]
                : [
                    {
                      id: 'destination1',
                      title: 'Destination 1',
                      icon: '',
                      description: '',
                    },
                  ],
            getSource: () =>
              of({
                getParameters: () => of([]),
              }),
            getDestination: () =>
              of({
                getParameters: () =>
                  of([
                    {
                      id: 'param1',
                      label: 'Param 1',
                      type: 'text',
                    },
                  ]),
              }),
            sourceObs: of([
              {
                id: 'source1',
                title: 'Source 1',
                icon: '',
                description: '',
              },
            ]),
            step: new BehaviorSubject<number>(0),
            setStep: (step: number) => {
              (sync.step as BehaviorSubject<number>).next(step);
            },
          },
        },
        {
          provide: TranslateService,
          useValue: { get: () => of('') },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    sync = TestBed.inject(SyncService);
  });

  describe('sources', () => {
    beforeEach(() => {
      component.type = 'sources';
      fixture.detectChanges();
    });

    it('should go to source form on selection', () => {
      jest.spyOn(sync, 'setStep');
      const element = fixture.debugElement.nativeElement.querySelector('.connector');
      element.click();
      expect(sync.setStep).toHaveBeenCalledWith(1);
    });
  });

  describe('destinations', () => {
    beforeEach(() => {
      component.type = 'destinations';
      fixture.detectChanges();
    });

    it('should select a destination and display the corresponding fields', () => {
      const element = fixture.debugElement.nativeElement.querySelector('.connector');
      element.click();
      fixture.detectChanges();
      expect(fixture.debugElement.nativeElement.querySelector('input')).toBeTruthy();
    });
  });
});
