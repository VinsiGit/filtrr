import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-certaintygraph',
  templateUrl: './certaintygraph.component.html',
  styleUrls: ['./certaintygraph.component.css']
})
export class CertaintygraphComponent {
  @Input() title: string | undefined;
  @Input() certainty: string | undefined;
  @Input() dataUrl: string | undefined;
}
