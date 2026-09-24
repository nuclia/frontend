import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { SisToastService } from '@nuclia/sistema';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { MockProvider } from 'ng-mocks';
import { UserService } from '../../manage-users/user.service';
import { ZoneService } from '../zone.service';
import { ZoneDetailsComponent } from './zone-details.component';

describe('ZoneDetailsComponent', () => {
  let component: ZoneDetailsComponent;
  let fixture: ComponentFixture<ZoneDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoneDetailsComponent, RouterModule.forRoot([])],
      providers: [
        MockProvider(ZoneService),
        MockProvider(UserService),
        MockProvider(SisToastService),
        {
          provide: SvgIconRegistryService,
          useValue: {
            loadSvg: () => {
              /* empty */
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ZoneDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
