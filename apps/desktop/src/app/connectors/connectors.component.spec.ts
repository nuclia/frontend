import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { STFInputModule, STFFormDirectivesModule, STFButtonsModule } from '@flaps/pastanaga';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { SyncService } from '../sync/sync.service';
import { ConnectorComponent } from './connector/connector.component';

import { ConnectorsComponent } from './connectors.component';

describe('ConnectorsComponent', () => {
  let component: ConnectorsComponent;
  let fixture: ComponentFixture<ConnectorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConnectorsComponent, ConnectorComponent],
      imports: [STFInputModule, STFFormDirectivesModule, ReactiveFormsModule, FormsModule, STFButtonsModule],
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
  });

  describe('sources', () => {
    beforeEach(() => {
      component.type = 'sources';
      fixture.detectChanges();
    });

    it('should select a source', () => {
      jest.spyOn(component.selectConnector, 'emit');
      const element = fixture.debugElement.nativeElement.querySelector('.connector');
      element.click();
      expect(component.selectConnector.emit).toHaveBeenCalledWith({ connector: { id: 'source1' } });
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
