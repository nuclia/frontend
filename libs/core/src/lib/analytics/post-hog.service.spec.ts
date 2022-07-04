import { TestBed } from '@angular/core/testing';

import { PostHogService } from './post-hog.service';

describe('PostHogService', () => {
  let service: PostHogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PostHogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
