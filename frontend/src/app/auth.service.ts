// src/app/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loginUrl = 'https://s144272.devops-ap.be/api/login'; // URL to web api
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
