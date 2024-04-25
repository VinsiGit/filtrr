import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const accountType = localStorage.getItem('account_type');
    if (accountType == 'admin') {
      return true;
    } else {
      this.router.navigate(['/paste-in']);
      return false;
    }
  }
}
