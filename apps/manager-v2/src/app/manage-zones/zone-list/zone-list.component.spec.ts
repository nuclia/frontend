import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { UiConfirmService } from '@nuclia/ui/confirm-dialog';
import { UiToastService } from '@nuclia/ui/toast';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ZoneService } from '../zone.service';
import { ZoneListComponent } from './zone-list.component';

describe('ZoneListComponent', () => {
  let component: ZoneListComponent;
  let fixture: ComponentFixture<ZoneListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoneListComponent, RouterModule.forRoot([])],
      providers: [
        MockProvider(ZoneService, {
          loadZones: vi.fn(() => of([])),
          zones: of([]),
        }),
        MockProvider(UiConfirmService),
        MockProvider(UiToastService),
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
