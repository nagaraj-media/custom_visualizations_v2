import * as d3 from 'd3'
import { handleErrors } from '../common/utils'

import {
  Cell,
  Link,
  Looker,
  LookerChartUtils,
  VisData,
  VisualizationDefinition
} from '../types/types'

// Global values provided via the API
declare var looker: Looker
declare var LookerCharts: LookerChartUtils

interface Sankey extends VisualizationDefinition {
  svg?: any
}

const vis: Sankey = {
  id: 'sankey', // id/label not required, but nice for testing and keeping manifests in sync
  label: 'Sankey',
  options: {
    color_range: {
      type: 'array',
      label: 'Color Range',
      display: 'colors',
      default: ['#dd3333', '#80ce5d', '#f78131', '#369dc1', '#c572d3', '#36c1b3', '#b57052', '#ed69af']
    },
    label_type: {
      default: 'name',
      display: 'select',
      label: 'Label Type',
      type: 'string',
      values: [
        { 'Name': 'name' },
        { 'Name (value)': 'name_value' }
      ]
    },
    show_null_points: {
      type: 'boolean',
      label: 'Plot Null Values',
      default: true
    }
  },
  // Set up the initial state of the visualization
  create(element, config) {
    element.innerHTML = `
      <style>
      .node,
      .link {
        transition: 0.5s opacity;
      }
      </style>
    `
    this.svg = d3.select(element).append('svg')
  },
  // Render in response to the data or settings changing
  updateAsync(data: VisData, element, config, queryResponse, details, doneRendering) {
    console.log(data, element, config, queryResponse, details)
    if (!handleErrors(this, queryResponse, {
      min_pivots: 0, max_pivots: 0,
      min_dimensions: 2, max_dimensions: undefined,
      min_measures: 1, max_measures: 1
    })) return

    const width = element.clientWidth
    const height = element.clientHeight

    const svg = this.svg
      .html('')
      .attr('width', '100%')
      .attr('height', '100%')
      .append('g')


    const dimensions = queryResponse.fields.dimension_like
    const measure = queryResponse.fields.measure_like[0]


    const defs = svg.append('defs')


    const graph: any = {
      nodes: [],
      links: []
    }

   // const nodes = d3.set()

    data.forEach(function (d: any) {

      // // variable number of dimensions
      // const path: any[] = []
      // for (const dim of dimensions) {
      //   if (d[dim.name].value === null && !config.show_null_points) break
      //   path.push(d[dim.name].value + '')
      // }
      // path.forEach(function (p: any, i: number) {
      //   if (i === path.length - 1) return
      //   const source: any = path.slice(i, i + 1)[0] + i + `len:${path.slice(i, i + 1)[0].length}`
      //   const target: any = path.slice(i + 1, i + 2)[0] + (i + 1) + `len:${path.slice(i + 1, i + 2)[0].length}`
      //   nodes.add(source)
      //   nodes.add(target)
      //   // Setup drill links
      //   const drillLinks: Link[] = []
      //   for (const key in d) {
      //     if (d[key].links) {
      //       d[key].links.forEach((link: Link) => { drillLinks.push(link) })
      //     }
      //   }

      //   graph.links.push({
      //     'drillLinks': drillLinks,
      //     'source': source,
      //     'target': target,
      //     'value': +d[measure.name].value
      //   })
      // })
    })


    const strokeWidth = 1.5;
    const margin = { top: 0, bottom: 20, left: 30, right: 20 };
    const chart = svg.append("g").attr("transform", `translate(${margin.left},0)`);
    const grp = chart
      .append("g")
      .attr("transform", `translate(-${margin.left - strokeWidth},-${margin.top})`);

    // TODO: override
    type DummyData = { year: Number, popularity: Number }

    const dataa: DummyData[] = [
      {
        "year": 2000,
        "popularity": 50
      },
      {
        "year": 2001,
        "popularity": 150
      },
      {
        "year": 2002,
        "popularity": 200
      },
      {
        "year": 2003,
        "popularity": 130
      },
      {
        "year": 2004,
        "popularity": 240
      },
      {
        "year": 2005,
        "popularity": 380
      },
      {
        "year": 2006,
        "popularity": 420
      }
    ]


   // Create scales
    const yScale = d3
      .scaleLinear()
      .range([height, 0])
      .domain([0, (d3.max(dataa, (dataPoint: DummyData) => dataPoint.popularity) || 0)]);

    const d = d3.extent(dataa, (dataPoint: DummyData) => dataPoint.year)
    const xScale = d3
      .scaleLinear()
      .range([0, width])
      .domain([Number(d[0]), Number(d[1])])

      
    // const area = d3
    //   .area()
    //   .x(((dataPoint: DummyData) => xScale(dataPoint.year))())
    //   .y0(height)
    //   .y1((dataPoint: DummyData) => yScale(dataPoint.popularity));

    const area = d3
      .area()
      .x(10)
      .y0(height)
      .y1(20);

    // Add area
    grp
      .append("path")
      .attr("transform", `translate(${margin.left},0)`)
      .datum(data)
      .style("fill", "url(#svgGradient)")
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", strokeWidth)
      .attr("d", area)
    //.on("mousemove", handleMouseMove)
    // .on('mouseout', handleMouseOut);

    // Add the X Axis
    chart
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(data.length)
          .tickFormat(d3.format(""))
      );

    // Add the Y Axis
    chart
      .append("g")
      .attr("transform", `translate(0, 0)`)
      .call(d3.axisLeft(yScale));



    // Add total value to the tooltip
    const totalSum = data.reduce((total, dp) => +total + +dp.popularity, 0);
    d3.select('.tooltip .totalValue').text(totalSum);


    const gradient = defs.append("linearGradient").attr("id", "svgGradient");
    const gradientResetPercentage = "50%";

    gradient
      .append("stop")
      .attr("class", "start")
      .attr("offset", gradientResetPercentage)
      .attr("stop-color", "lightblue");

    gradient
      .append("stop")
      .attr("class", "start")
      .attr("offset", gradientResetPercentage)
      .attr("stop-color", "darkblue");

    gradient
      .append("stop")
      .attr("class", "end")
      .attr("offset", gradientResetPercentage)
      .attr("stop-color", "darkblue")
      .attr("stop-opacity", 1);

    gradient
      .append("stop")
      .attr("class", "end")
      .attr("offset", gradientResetPercentage)
      .attr("stop-color", "lightblue");

    const bisectDate = d3.bisector((dataPoint: DummyData) => dataPoint.year).left;
    doneRendering()
  }
}
looker.plugins.visualizations.add(vis)
