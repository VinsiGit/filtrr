import { Component, OnInit  } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { PagetitleService } from '../services/pagetitle.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})

export class NavbarComponent implements OnInit {
  navpinned: boolean = false;
  accountType: string | null = null;


  constructor(private title: PagetitleService, private auth: AuthService, private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.accountType = localStorage.getItem('account_type');
      }
    });
  }

  get pagetitle() {
    return this.title.pageTitle;
  }

  get isLoggedIn() {
    return this.auth.isLoggedIn;
  }

  toggleNavPinned() {
    this.navpinned = !this.navpinned;
  }

  logout() {
    this.auth.logout();
  }

  ngOnInit() {
  }
}
