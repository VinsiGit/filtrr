import { Component, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexTitleSubtitle,
  ApexDataLabels,
  ApexChart,
  ApexPlotOptions,
  ApexXAxis,
  ApexYAxis,
  ApexGrid,
  ApexStroke
} from "ng-apexcharts";
import { AnalyticsdataService } from "../../services/analyticsdata.service";
import { ThemeService } from "../../services/theme.service";
import { ConfusionMatrix } from "../../interfaces/dataresponse";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  fill: any;
  colors: any;
  title: ApexTitleSubtitle;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  grid: ApexGrid;
  stroke: ApexStroke;
  plotOptions: ApexPlotOptions;
};

@Component({
  selector: 'app-confusionmatrix',
  templateUrl: './confusionmatrix.component.html',
  styleUrls: ['./confusionmatrix.component.css']
})
export class ConfusionmatrixComponent {
  @ViewChild("chart") chart: ChartComponent | undefined;
  public chartOptions: Partial<ChartOptions> | any;
  datapoints: ApexAxisChartSeries = [];
  labels: string[] = [];

  constructor(private theme: ThemeService, private route: ActivatedRoute, private data: AnalyticsdataService) {
  }

  async ngOnInit(): Promise<void> {
    await this.loadMatrixData().then(() => {
      this.renderChart();
    });
  }


  renderChart() {
    this.chartOptions = {
      series: this.datapoints,
      chart: {
        height: 300,
        width: 380,
        id: "confusionmatrix",
        type: "heatmap",
        foreColor: this.theme.chart_textcolor,
        redrawOnParentResize: true,
      },
      plotOptions: {
        heatmap: {
          radius: 20,
          reverseNegativeShade: false,
          shadeIntensity: 0.1
        },
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: any) {
          return `${val}%`
        },
      },
      colors: this.theme.labelcolors,
      xaxis: {
        lines: {
          show: true
        },
        labels: {
          trim: true,
        },
        type: "category",
        categories: this.labels,
      },
      yaxis: {
        labels: {
          align: 'right',
          maxWidth: 50
        },
      },
      title: {
        text: "confusion matrix",
        align: 'left'
      },
      grid: {
        show: false,
        padding: {
          right: 20,
        },
      },
      stroke: {
        show: true,
        colors: this.theme.matrix_bordercolor,
        width: 2,
      }
    };
  }

  async loadMatrixData(): Promise<void> {
    this.datapoints = [];

    const responseData: ConfusionMatrix = await this.data.getMatrixData();

    // Initialize an object to hold the aggregated data
    const counts: { [label: string]: number[] } = {};


    responseData.labels.forEach((label: string) => {
      // iterate through labels
      let labelIndex = responseData.labels.indexOf(label)
      const lowerCaseLabel = label.replace('_', ' ').toLowerCase();

      // if label name isn't present in counts yet
      if (!counts[lowerCaseLabel]) {
        counts[lowerCaseLabel] = [];
        this.labels.push(lowerCaseLabel);
      }

      // Parse strings to numbers, and add to counts object
      counts[lowerCaseLabel] = responseData.confusion_matrix[labelIndex].map((percentStr: string) => {
        // Remove '%' and convert to number
        return parseFloat(percentStr.replace('%', ''));
      });
    });

    // Transform the aggregated data into ApexAxisChartSeries format
    Object.entries(counts).forEach(([name, data]) => {
      this.datapoints.push({ name, data });
    });
  }
}

