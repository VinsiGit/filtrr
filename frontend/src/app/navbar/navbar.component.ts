import { Component, OnInit  } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PagetitleService } from '../pagetitle.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})

export class NavbarComponent implements OnInit {
  navpinned: boolean = false;

  constructor(private title: PagetitleService, private auth: AuthService) {
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
