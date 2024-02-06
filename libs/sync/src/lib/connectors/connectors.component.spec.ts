import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipeMock } from '@flaps/core';
import { of } from 'rxjs';
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
            sourceObs: of([
              {
                id: 'source1',
                title: 'Source 1',
                icon: '',
                description: '',
              },
            ]),
          },
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
    it('should select connector', () => {
      jest.spyOn(component.selectConnector, 'emit');
      const element = fixture.debugElement.nativeElement.querySelector('.connector');
      element.click();
      expect(component.selectConnector.emit).toHaveBeenCalledWith('source1');
    });
  });
});
