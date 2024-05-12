import { Component, OnInit, ViewChild } from "@angular/core";
import { ThemeService } from "../services/theme.service";

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexMarkers,
  ApexDataLabels,
  ApexTitleSubtitle,
  ApexStroke,
  ApexGrid,
  ApexFill,
  ApexLegend,
  ApexYAxis,
} from "ng-apexcharts";
import { ActivatedRoute } from "@angular/router";
import { AnalyticsdataService } from "../services/analyticsdata.service";
import { LabelData, DayData, LabelCount } from "../interfaces/dataresponse";

export interface ChartOptions {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  fill: ApexFill;
  markers: ApexMarkers;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  colors: any;
  stroke: ApexStroke;
  legend: ApexLegend;
  title: ApexTitleSubtitle;
};

@Component({
  selector: 'app-mailamountgraph',
  templateUrl: './mailamountgraph.component.html',
  styleUrls: ['./mailamountgraph.component.css']
})

export class MailamountgraphComponent implements OnInit {
  @ViewChild("chart") chart: ChartComponent | undefined;
  public chartOptions: Partial<ChartOptions> | any;

  datapoints: ApexAxisChartSeries = [];
  days: string[] = [];


  constructor(private theme: ThemeService, private route: ActivatedRoute, private data: AnalyticsdataService) {
  }

  async ngOnInit(): Promise<void> {
    await this.loadChartData().then(() => {
      this.renderChart();
    });
  }

  //instanciating the chart
  renderChart() {
    this.chartOptions = {
      series: this.datapoints,
      chart: {
        height: 650,
        foreColor: this.theme.chart_textcolor,
        redrawOnParentResize: true,
        id: "mailAmountGraph",
        type: 'area',
        zoom: {
          enabled: true,
        },
        dropShadow: {
          enabled: false,
          top: 1,
          left: 4,
          blur: 2,
          color: "#000",
          opacity: 0.05,
        },
      },
      colors: this.theme.labelcolors,
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "smooth",
        width: 4,
      },
      title: {
        text: "mails",
        align: "left",
      },
      grid: {
        borderColor: this.theme.chart_gridcolor,
        row: {
          opacity: 0.5,
        },
        padding: {
          left: 25,
        },
      },
      xaxis: {
        type: 'datetime',
        categories: this.days,
        axisBorder: {
          show: false,
        },
        labels: {
          style: {
            colors: this.theme.chart_axistextcolor,
          },
        },
      },
      yaxis: {
        stepSize: 1,
        labels: {
          style: {
            colors: this.theme.chart_axistextcolor,
          },
        },
      },
      markers: {
        size: 4,
        hover: {
          size: 8,
        },
      },
    };
  }

  // loading the data
  async loadChartData(): Promise<void> {
    this.datapoints = [];
    this.days = [];

    const responseData: LabelData = await this.data.getDataBetween(undefined, undefined);
    console.log(responseData);

    // Initialize an object to hold the aggregated data
    const counts: { [label: string]: number[] } = {};

    responseData.data.forEach((dayData: DayData) => {
      // add date
      this.days.push(dayData.date);

      // iterate through labels and adding counts
      dayData.labels_count.forEach((labelCount: LabelCount) => {
        // converting label name to lowercase and removing spaces
        const label = labelCount.label.replace('_', ' ').toLowerCase();
        // if label name isn't present in counts yet
        if (!counts[label]) {
          counts[label] = [];
        }
        counts[label].push(labelCount.count);
      });
    });

    // Transform the aggregated data into the desired format
    Object.entries(counts).forEach(([name, data]) => {
      this.datapoints.push({ name, data });
    });
  }
}

