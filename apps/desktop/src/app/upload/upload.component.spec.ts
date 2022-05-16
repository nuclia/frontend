import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslatePipeMock } from '@flaps/core';
import { STFButtonsModule, STFInputModule } from '@flaps/pastanaga';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ConnectorComponent } from '../connectors/connector/connector.component';
import { ConnectorsComponent } from '../connectors/connectors.component';
import { SyncService } from '../sync/sync.service';

import { UploadComponent } from './upload.component';

describe('UploadComponent', () => {
  let component: UploadComponent;
  let fixture: ComponentFixture<UploadComponent>;
  let sync: SyncService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UploadComponent, ConnectorsComponent, ConnectorComponent, TranslatePipeMock],
      imports: [RouterTestingModule, ReactiveFormsModule, STFButtonsModule, STFInputModule],
      providers: [
        {
          provide: SyncService,
          useValue: {
            sources: { source1: { definition: { id: 'source1' }, settings: {} } },
            destinations: { destination1: { definition: { id: 'destination1' }, settings: {} } },
            addSync: jest.fn(),
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
            getDestination: (id: string) =>
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
    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    sync = TestBed.inject(SyncService);
  });

  it('should allow to add a new sync', () => {
    expect(component.step).toEqual(0);
    fixture.debugElement.nativeElement.querySelector('.connector').click();
    expect(component.step).toEqual(1);
    fixture.debugElement.nativeElement.querySelector('[qa="next"]').click();
    expect(component.step).toEqual(2);
    fixture.debugElement.nativeElement.querySelector('.connector').click();
    fixture.debugElement.nativeElement.querySelector('[qa="validate"]').click();
    expect(sync.addSync).toHaveBeenCalled();
  });
});
