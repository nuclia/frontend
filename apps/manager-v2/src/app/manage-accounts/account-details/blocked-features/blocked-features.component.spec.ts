import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlockedFeaturesComponent } from './blocked-features.component';

describe('BlockedFeaturesComponent', () => {
  let component: BlockedFeaturesComponent;
  let fixture: ComponentFixture<BlockedFeaturesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BlockedFeaturesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BlockedFeaturesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
