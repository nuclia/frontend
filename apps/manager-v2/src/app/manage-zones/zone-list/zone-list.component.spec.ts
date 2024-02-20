import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZoneListComponent } from './zone-list.component';
import { MockModule, MockProvider } from 'ng-mocks';
import { RouterTestingModule } from '@angular/router/testing';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { ZoneService } from '../zone.service';
import { of } from 'rxjs';
import {
  PaButtonModule,
  PaIconModule,
  PaScrollModule,
  PaTableModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';

describe('ZoneListComponent', () => {
  let component: ZoneListComponent;
  let fixture: ComponentFixture<ZoneListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        MockModule(PaButtonModule),
        MockModule(PaIconModule),
        MockModule(PaScrollModule),
        MockModule(PaTableModule),
        MockModule(PaTextFieldModule),
      ],
      declarations: [ZoneListComponent],
      providers: [
        MockProvider(ZoneService, {
          loadZones: jest.fn(() => of([])),
        }),
        MockProvider(SisModalService),
        MockProvider(SisToastService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ZoneListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
