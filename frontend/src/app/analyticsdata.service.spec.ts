import { TestBed } from '@angular/core/testing';

import { AnalyticsdataService } from './analyticsdata.service';

describe('AnalyticsdataService', () => {
  let service: AnalyticsdataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnalyticsdataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
