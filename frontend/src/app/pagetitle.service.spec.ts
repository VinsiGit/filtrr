import { TestBed } from '@angular/core/testing';

import { PagetitleService } from './pagetitle.service';

describe('PagetitleService', () => {
  let service: PagetitleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PagetitleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
