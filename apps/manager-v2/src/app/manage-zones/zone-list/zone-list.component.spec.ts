import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { UiConfirmService } from '@nuclia/ui/confirm-dialog';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ZoneSummary } from '../zone.models';
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
          zones: of([
            { id: '2', title: 'Beta', slug: 'beta' },
            { id: '1', title: 'Alpha', slug: 'alpha' },
          ] as ZoneSummary[]),
        }),
        MockProvider(UiConfirmService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ZoneListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should sort zones by title and filter them by title or slug', () => {
    expect(component.zones().map((zone) => zone.id)).toEqual(['1', '2']);
    component.filter.set('bet');
    expect(component.zones().map((zone) => zone.id)).toEqual(['2']);
  });
});
