import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let hostname: string | undefined = environment.hostname;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    }).compileComponents();
  });

  beforeEach(() => {
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login()', () => {
    it('makes HTTP POST request to /api/login endpoint', done => {
      const username = 'testuser';
      const password = 'testpassword';

      service.login(username, password).subscribe(() => {
        done();
      });

      const req = TestBed.inject(HttpTestingController).expectOne(`https://${hostname}/api/login`);
      expect(req.request.method).toEqual('POST');
      req.flush({ success: true });
    });

    it('sets isLoggedIn property to true upon successful login', () => {
      const initialIsLoggedInValue = service.isLoggedIn;
      const username = 'testuser';
      const password = 'testpassword';

      service.login(username, password).subscribe(() => {
        expect(service.isLoggedIn).toBeTrue();
      });

      const req = TestBed.inject(HttpTestingController).expectOne(`https://${hostname}/api/login`);
      req.flush({ success: true });
    });

    it('does not set isLoggedIn property to true upon unsuccessful login', () => {
      const initialIsLoggedInValue = service.isLoggedIn;
      const username = 'testuser';
      const password = 'testpassword';

      service.login(username, password).subscribe(() => {
        expect(service.isLoggedIn).toBeFalsy();
      });

      const req = TestBed.inject(HttpTestingController).expectOne(`https://${hostname}/api/login`);
      req.flush({ success: false }, { status: 400, statusText: 'Bad Request' });
      expect(service.isLoggedIn).toBe(initialIsLoggedInValue);
    });
  });
});