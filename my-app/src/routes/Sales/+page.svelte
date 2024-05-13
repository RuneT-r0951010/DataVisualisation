<script>
    import { geoEqualEarth, geoMercator, geoPath } from "d3-geo";
    import { json } from "d3-fetch";
    import * as d3 from "d3";
    import * as topojson from 'topojson-client';
    export let data = [];
    import { onMount } from 'svelte';
  
    // SLIDER FOR OVER THE YEARS
    let mouse_x, mouse_y; 
    const setMousePosition = function(event) { 
      mouse_x = event.clientX;
      mouse_y = event.clientY;
    }
    let all_years = [];
    let slider_year = 2022;
    // Prepare Projection.
    const projection_earth = geoEqualEarth();
    const projection_europe = geoMercator();
  
    // Prepare Path-Generator: given a GeoJSON geometry or feature object, it generates an SVG path data string.
    const path_earth = geoPath(projection_earth);
    const path_europe = geoPath(projection_europe);
    
    // Prepare variables for data to load in.
    let selected;
    let eu_countries = [];
    let countries = [];

    // let CPR = data.CPR.data;
    let sales = data.sales.data;
    let customers = data.customers.data;

    // number of sales per country 
    let country_sales = {};


    for (const sale of sales) {
      let country = customers[sale.CustomerKey-1].CustomerCountry; // get customer country
      let year = parseInt(sale.RequestedDeliveryDate.substring(0, 4)); // year of sale
      if (! all_years.includes(year)) {
        all_years.push(year);
      } 
      
      if (country_sales[country]) {
        country_sales[country][year] = country_sales[country][year] 
                                          ? country_sales[country][year] + parseInt(sale.OrderQuantity) 
                                          : parseInt(sale.OrderQuantity);
      } else {
        let temp = {};
        temp[year] = parseInt(sale.OrderQuantity);
        country_sales[country] =  temp;
      }
    }

    // const sales_per_year = {};
    // for (let cntry in country_sales) {
    //   for (let year in country_sales[cntry]) {
    //     if (!sales_per_year[year]) {
    //       sales_per_year[year] = [];
    //     }
    //     sales_per_year[year].push(country_sales[cntry][year]);
    //   }
    // };

    // console.log(sales_per_year);
    // console.log(Object.values(country_sales));

    onMount(async () => {
        const eu = await fetch('https://gist.githubusercontent.com/spiker830/3eab0cb407031bf9f2286f98b9d0558a/raw/7edae936285e77be675366550e20f9166bed0ed5/europe_features.json')
          .then(d => d.json())
            eu_countries = eu.features;
      });

    // onMount(async () => {
    //     const world = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    //       .then(d => d.json())
    //         countries = topojson.feature(world, world.objects.countries).features;
    //   });


    // Specify the chart’s dimensions.
    const width = 1200;
    const height = 600;

    let max_value_per_year = {};
    let min_value_per_year = {};

    all_years.forEach((year) => {
      let max  = 0;
      let min = Infinity;
      for (let map of Object.values(country_sales)) {
        if (map[year] > max)
          max = map[year];
        if (map[year] < min )
          min = map[year];
      }
      max_value_per_year[year] = max;
      min_value_per_year[year] = min;
    });



    // Temperature points for the labels
    const points = [max_value_per_year[slider_year],min_value_per_year[slider_year]];


    console.log(country_sales);
    console.log(max_value_per_year);

    // Dit is eig correct maar je ziet maar weinig verschillen door dat in frankrijk ZO veel wordt gekocht
    // $: color_scale = d3.scaleSequential([min_value_per_year[slider_year], max_value_per_year[slider_year]], d3.interpolateBlues);
    $: color_scale = d3.scaleSequential([min_value_per_year[slider_year], 80000], d3.interpolateBlues);

    function color(feature, year) {
      let country = feature.properties.name;
      if (country in country_sales) {
        if (country_sales[country][year] != undefined) {
          return color_scale(country_sales[country][year]);
        }
      }
      return "#808080";
    }

    function assign_class(feature) {
      let country = feature.properties.name;
      if (country in country_sales) {
        return "country";
      }
      return "";
    }

    function scale (number, inMin, inMax, outMin, outMax) {
      return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }
  </script>


<h1>Sales data</h1>
<!-- <svg width="200" height="120">
  <g transform="translate(10, 10)">
    {#each items as {color, label}, i}
      <rect x="0" y={i * 25} width="20" height="20" fill={color} />
      <text x="30" y={i * 25 + 15} font-family="Arial" font-size="12px">{label}</text>
    {/each}
  </g>
</svg> -->

<!-- <div class="legend" on:mounted={() => {
  const legendScale = d3.scaleLinear()
    .domain([min_value_per_year[slider_year], max_value_per_year[slider_year]])
    .range([0, 200]);

  const legendAxis = d3.axisBottom(legendScale)
    .ticks(5);

  const svg = d3.select('.legend')
    .append("g")
    .attr("transform", "translate(10,20)");

  svg.call(legendAxis);

  // Add colored rectangles as legend items
  svg.selectAll("rect")
    .data(d3.range(min_value_per_year[slider_year], max_value_per_year[slider_year], (max_value_per_year[slider_year] - min_value_per_year[slider_year]) / 5))
    .enter().append("rect")
    .attr("x", function(d, i) { return i * 40; })
    .attr("y", 30)
    .attr("width", 40)
    .attr("height", 10)
    .style("fill", function(d) { return color_scale(d); });

  // Add text labels to the legend
  svg.selectAll("text")
    .data(d3.range(min_value_per_year[slider_year], max_value_per_year[slider_year], (max_value_per_year[slider_year] - min_value_per_year[slider_year]) / 5))
    .enter().append("text")
    .attr("x", function(d, i) { return i * 40; })
    .attr("y", 45)
    .text(function(d) { return d.toFixed(2); });
}}>

</div> -->





Year of sales: {slider_year} <br/>
<input type="range" min={Math.min(...all_years)} max={Math.max(...all_years)} bind:value={slider_year} /><br/> 
<svg width="420" height="200" viewBox="0 0 400 200">
  <!-- Define the gradient for the temperature scale -->
  <defs>
    <linearGradient id="tempGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f7fbff" />   <!-- Lightest blue -->
      <stop offset="25%" stop-color="#deebf7" />
      <stop offset="50%" stop-color="#9ecae1" />
      <stop offset="75%" stop-color="#3182bd" />
      <stop offset="100%" stop-color="#08519c" /> <!-- Darkest blue -->
    </linearGradient>
  </defs>

  <!-- Background rectangle using the gradient -->
  <rect x="10" y="20" width="380" height="20" fill="url(#tempGradient)" />
  {#each points as point}
    {console.log(point)}
    <line x1={scale(point, min_value_per_year[slider_year], max_value_per_year[slider_year], 10, 390)} y1="40" x2={scale(point, min_value_per_year[slider_year], max_value_per_year[slider_year], 10, 390)} y2="50" stroke="black" />
    <text x={scale(point, min_value_per_year[slider_year], max_value_per_year[slider_year], 10, 390)} y="65" fill="black" font-size="12" text-anchor="middle">{point}</text>
  {/each}

  <!-- Title -->
  <text x="200" y="8" fill="black" font-size="12" text-anchor="middle">Number of late deliveries</text>
</svg><br/>

<svg width="1200" height="800" viewBox="400 -10 350 175">
	<g fill="white" stroke="black">
    {#each eu_countries as feature}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <!-- svelte-ignore a11y-mouse-events-have-key-events -->
      <path 
          d={path_europe(feature)} 
          on:mouseover={function(event) {selected = feature; setMousePosition(event)}} 
          on:mouseout={function() {selected = undefined}}
          on:click={() => selected = feature} 
          class={assign_class(feature)} 
          fill={color(feature, slider_year)}/>
    {/each}
      <!-- SHOW WORLD MAP (is too big) -->
      <!-- {#each countries as feature}
        <path d={path_earth(feature)} on:click={() => selected = feature} class="country" fill={color(feature)}/>
      {/each} -->
    </g> 
</svg>



{#if selected != undefined}
  <div id="tooltip" style="left: {mouse_x + 10}px; top: {mouse_y - 10}px">
  <svg class="tooltip" width=20 height=20>
  </svg><br/>
  {#if selected.properties.name in country_sales}
    Country: {selected.properties.name} <br/>
    Number of Sales: {country_sales[selected.properties.name][slider_year]}
  {:else}
    Country: {selected.properties.name} <br/>
    Number of Sales: None
  {/if}
  </div>
{/if}



<!-- <div class="selectedName">{selected?.properties.name ?? ''}</div> -->
	
<style>
	.country:hover {
		fill: hsla(122, 100%, 50%, 0.2);
	}
  #tooltip { 
    position: fixed;
    background-color: white;
    padding: 3px;
    border: solid 1px;
  }
  svg.tooltip { 
    margin: 0px;
    padding: 0px;
  }

	
	/* .selectedName {
		text-align: center;
		margin-top: 8px;
		font-size: 1.5rem;
	} */
</style>
  


  <!-- <svg
    {width}
    {height}
    viewBox="0 0 {width} {height}"
    style:max-width="100%"
    style:height="auto"
  > 
      <path d={path(land)} fill="#FF0000"/>
      <path d={path(borders)} fill="none" stroke="#fff" />
  
  </svg> -->


  
  