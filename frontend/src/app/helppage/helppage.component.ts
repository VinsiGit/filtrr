import { Component } from '@angular/core';
import { PagetitleService } from '../services/pagetitle.service';

@Component({
  selector: 'app-helppage',
  templateUrl: './helppage.component.html',
  styleUrls: ['./helppage.component.css']
})
export class HelppageComponent {

  constructor(private title: PagetitleService) {
  }

  ngOnInit() {
    this.title.pageTitle = "help";
  }

}
