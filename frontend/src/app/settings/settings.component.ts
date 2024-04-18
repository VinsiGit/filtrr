import { Component, OnInit } from '@angular/core';
import { PagetitleService } from '../pagetitle.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit{

  constructor(private title: PagetitleService) {
  }

  ngOnInit() {
    this.title.pageTitle = "settings";
  }
}

