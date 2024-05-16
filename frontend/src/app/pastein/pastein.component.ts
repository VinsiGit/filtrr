import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PostService } from '../services/post.service';
import { PagetitleService } from '../services/pagetitle.service';
import { PasteInResponse } from '../interfaces/dataresponse';

import {
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ChartComponent
} from "ng-apexcharts";
import { ThemeService } from '../services/theme.service';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  plotOptions: ApexPlotOptions;
};

@Component({
  selector: 'app-pastein',
  templateUrl: './pastein.component.html',
  styleUrls: ['./pastein.component.css']
})
export class PasteinComponent {
  @ViewChild("chart") chart: ChartComponent | undefined;
  public chartOptions: Partial<ChartOptions> | any;
  input: string = "";
  text: string = "";
  textBoxResponse: PasteInResponse | undefined;

  constructor(private route: ActivatedRoute, private post: PostService, private title: PagetitleService, private theme: ThemeService) {
  }

  ngOnInit() {
    this.title.pageTitle = "paste-in";
  }

  renderchart() {
    if(this.textBoxResponse)
    {
      this.chartOptions = {
        series: [Math.round((this.textBoxResponse.certainty*100) * 100) / 100], //round to 2 decimal places
        chart: {
          id: "certaintyWheel",
          height: 350,
          type: "radialBar"
        },
        colors: [this.theme.labelcolors[1]],  
        plotOptions: {
          radialBar: {
            hollow: {
              margin: 0,
              size: "65%",
              background: this.theme.radial_backgroundcolor
            },
            track: {
              background: this.theme.radial_trackcolor,
              dropShadow: {
                enabled: true,
                top: 1,
                left: 1,
                blur: 2,
                opacity: this.theme.shadowOpacity,
                color: this.theme.shadowcolor
              }
            },
            dataLabels: {
              name: {
                offsetY: -10,
                color: this.theme.radial_textcolor,
                fontSize: "13px"
              },
              value: {
                color: this.theme.radial_textcolor,
                fontSize: "30px",
                show: true
              }
            }
          }
        },
        fill: {
          type: "gradient",
          gradient: {
            shade: "dark",
            type: "vertical",
            gradientToColors: [this.theme.labelcolors[2]],
            stops: [0, 200]
          }
        },
        stroke: {
          lineCap: "round"
        },
        labels: [this.textBoxResponse.predicted_label]
      };
    }
  }

  async submitText() {
    try {
      const response = await this.post.postMail({"body": this.input});
      this.textBoxResponse = response;
      this.text = this.input;
      this.renderchart();
    } catch (error) {
      console.error('Error occurred:', error);
    }
  }
}
