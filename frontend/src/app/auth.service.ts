// src/app/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  hostname: string | undefined = environment.hostname;
  private loginUrl = `https://${this.hostname}/api/login`; // URL to web api
  isLoggedIn: boolean = false;
  

  constructor(private http: HttpClient, private router: Router) { }

  login(username: string, password: string): Observable<any> {
    return this.http.post(this.loginUrl, {username, password});
  }

  logout(){
    localStorage.removeItem('access_token');
    this.isLoggedIn = false;
    this.router.navigate(['login']);
  }

  loginsuccess() {
    console.log('Login successful');
    this.isLoggedIn = true;
    this.router.navigate(['dashboard']);
  }


}
