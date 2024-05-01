import { Component, OnInit } from '@angular/core';
import { PagetitleService } from '../services/pagetitle.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit{

  constructor(private title: PagetitleService) {
  }

  ngOnInit() {
    this.title.pageTitle = "dashboard";
  }
}
