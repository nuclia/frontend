import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KbDetailsComponent } from './kb-details.component';

describe('KbDetailsComponent', () => {
  let component: KbDetailsComponent;
  let fixture: ComponentFixture<KbDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KbDetailsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KbDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
