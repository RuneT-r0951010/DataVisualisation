<script>
    import { geoEqualEarth, geoMercator, geoPath } from "d3-geo";
    import { json } from "d3-fetch";
    import * as d3 from "d3";
    import * as topojson from 'topojson-client';
    export let data = [];
    import { onMount } from 'svelte';
  
    // SLIDER FOR OVER THE YEARS
    let width = 1200;
    let height = 800;
    let mouse_x, mouse_y; 

    const setMousePosition = function(event) { 
      mouse_x = event.clientX;
      mouse_y = event.clientY;
    //   console.log(mouse_x, mouse_y);
    }
    let all_years = [];
    let slider_year = 2022;
    let proportional_check = false;

    // Prepare Projection.
    const projection_europe = geoMercator();
   
    // Prepare Path-Generator: given a GeoJSON geometry or feature object, it generates an SVG path data string.
    const path_europe = geoPath(projection_europe);
    
    // Prepare variables for data to load in.
    let selected_country;
    let selected_center;
    let eu_countries = [];

    // let CPR = data.CPR.data;
    let sales = data.sales.data;
    let customers = data.customers.data;
    let plants = data.plants.data;

    // console.log(plants);

    let distribution_center_countries = []
    let distribution_centers = {};
    for (const plant of plants) {
        if (plant.PlantType == "Distribution Center") {
            distribution_center_countries.push(plant.PlantCountry);
            distribution_centers[plant.PlantCountry] = plant.PlantKey;
        }
    }

    // number of sales per country 
    let late_deliveries = {};
    let timely_deliveries = {};
    let early_deliveries = {};
    let all_deliveries = {};
    let all_late_deliveries = {};

    let deliveries_per_plant = {};
    let late_deliveries_per_plant = {};

    for (const sale of sales) {
      let plant_key = sale.PlantKey;                                   // key of distribution center
      let country = customers[sale.CustomerKey-1].CustomerCountry;     //country of customer
      let year = parseInt(sale.RequestedDeliveryDate.substring(0, 4)); // year of sale
      let delivery = new Date(sale.DeliveryDate);                      // delivery date
      let requested = new Date(sale.RequestedDeliveryDate);            // requested delivery date
      let difference = delivery.getTime() - requested.getTime();       // difference in time between delivery and requested date

      if (! all_years.includes(year)) {
        all_years.push(year);
      } 

      if (deliveries_per_plant[plant_key]) {
            if (deliveries_per_plant[plant_key][country]) {
                deliveries_per_plant[plant_key][country][year] = deliveries_per_plant[plant_key][country][year] ? deliveries_per_plant[plant_key][country][year] + 1 : 1;
            } else {
                let temp = {};
                temp[year] = 1;
                deliveries_per_plant[plant_key][country] = temp;
            }
      } else {
            let temp = {};
            temp[year] = 1;
            let temp2 = {};
            temp2[country] = temp;
            deliveries_per_plant[plant_key] = temp2;
        }

      add_one_to_dict(all_deliveries, country, year);
      if (difference > 0) {
        all_late_deliveries[year] = all_late_deliveries[year] ? all_late_deliveries[year] + 1 : 1;
        add_one_to_dict(late_deliveries, country, year);
        if (late_deliveries_per_plant[plant_key]) {
            if (late_deliveries_per_plant[plant_key][country]) {
                late_deliveries_per_plant[plant_key][country][year] = late_deliveries_per_plant[plant_key][country][year] ? late_deliveries_per_plant[plant_key][country][year] + 1 : 1;
            } else {
                let temp = {};
                temp[year] = 1;
                late_deliveries_per_plant[plant_key][country] = temp;
            }

        } else {
            let temp = {};
            temp[year] = 1;
            let temp2 = {};
            temp2[country] = temp;
            late_deliveries_per_plant[plant_key] = temp2;
        }
        
      } else if (difference < 0) {
        add_one_to_dict(early_deliveries, country, year);
      } else {
        add_one_to_dict(timely_deliveries, country, year)
      }
    }
    onMount(async () => {
        const eu = await fetch('https://gist.githubusercontent.com/spiker830/3eab0cb407031bf9f2286f98b9d0558a/raw/7edae936285e77be675366550e20f9166bed0ed5/europe_features.json')
          .then(d => d.json())
            eu_countries = eu.features;
      });

    let max_late_del_per_year = {}; // highest number of late deliveries per year 
    let min_late_del_per_year = {}; // lowest number of late deliveries per year 
    let max_value_per_year_prop = {}; // highest number of late deliveries per year proportional to all the deliveries in that country (so highest percentage of late deliveries)
    let min_value_per_year_prop = {}; // lowest number of late deliveries per year proportional to all the deliveries in that country (so lowest percentage of late deliveries)
    
    all_years.forEach((year) => {
      let max  = 0;
      let max_prop = 0;
      let min = Infinity;
      let min_prop = Infinity;

      for (let entry of Object.entries(late_deliveries)) {
        let cntry = entry[0];
        let delayed = entry[1][year]

        // there could be no deliveries in a certain year for a given country
        if (delayed != undefined) {
            let delayed_prop =  delayed / all_deliveries[cntry][year];
            if (delayed > max)
                max = delayed;
            if (delayed < min )
                min = delayed;

            if (delayed_prop > max_prop)
                max_prop = delayed_prop;
            if (delayed_prop < min_prop )
                min_prop = delayed_prop;
        }
      }
      max_late_del_per_year[year] = max;
      min_late_del_per_year[year] = min;
      max_value_per_year_prop[year] = max_prop;
      min_value_per_year_prop[year] = min_prop;
    });

    $: color_scale = d3.scaleSequential([min_late_del_per_year[slider_year], max_late_del_per_year[slider_year]], d3.interpolateBlues);
    $: color_scale_prop = d3.scaleSequential([min_value_per_year_prop[slider_year], max_value_per_year_prop[slider_year]], d3.interpolateBlues);

    function add_one_to_dict(dict, country,year) {
        if (dict[country]) {
            dict[country][year] = dict[country][year] ? dict[country][year] + 1 : 1;
        } else {
            let temp = {};
            temp[year] = 1;
            dict[country] = temp;
        }
    }

    function color(feature, year, proportional, center) {
      let country = feature.properties.name;
      if (country in late_deliveries) {
        if (center != undefined) {
            let key = distribution_centers[center.properties.name];
            if (country in late_deliveries_per_plant[key]) {
                if (late_deliveries[country][year] != undefined) {
                    if (proportional){
                        return color_scale_prop(late_deliveries[country][year]/all_deliveries[country][year]);
                    } else {
                        return color_scale(late_deliveries[country][year]);
                    }
                 }
            }
        }

        else if (late_deliveries[country][year] != undefined) {
          if (proportional){
            return color_scale_prop(late_deliveries[country][year]/all_deliveries[country][year]);
          } else {
            return color_scale(late_deliveries[country][year]);
          }
        
        }
      }
      return "#808080";
    }

    function assign_class(feature) {
      let country = feature.properties.name;
      if (country in late_deliveries) {
        return "country";
      }
      return "";
    }

    function centroid(feature) {
        const centroid = geoPath(geoMercator()).centroid(feature);
        // console.log('Centroid coordinates:', centroid);
        return centroid;
    }

    function scale (number, inMin, inMax, outMin, outMax) {
      return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }

    function generatePoints(start, end, numPoints) {
        var totalDistance = end - start;                         // Calculate the total distance
        var intervalDistance = totalDistance / (numPoints + 1);  // Calculate the interval distance
        var points = [];                                         // Initialize an array to store the points
        points.push(Math.round(start * 100)/ 100);                                      // Add the start point
        for (var i = 1; i <= numPoints; i++) {                   // Generate the points in between
            var point = start + i * intervalDistance;
            points.push(Math.round(point * 100)/ 100);
        }
        points.push(Math.round(end * 100)/ 100);                 // Add the end point
        return points;
    }

    function get_total_deliveries(country, deliveries) {
       let number = 0;
       for (let feature of Object.entries(deliveries[distribution_centers[country]])) {
        number += feature[1][slider_year];
       }
       return number;
    }

  </script>


<h1>Late deliveries data</h1>
Year of deliveries: {slider_year} <br/>
<input type="range" min={Math.min(...all_years)} max={Math.max(...all_years)} bind:value={slider_year} /><br/> 
Show late deliveries in proportion to total deliveries: 
<input type="checkbox" bind:checked={proportional_check} /><br/><br/> 
<svg width="420" height="100" viewBox="0 0 400 100">
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
    {#each generatePoints((proportional_check ? min_value_per_year_prop[slider_year] : min_late_del_per_year[slider_year]),(proportional_check ? max_value_per_year_prop[slider_year] : max_late_del_per_year[slider_year]), 5) as point}
      <line x1={(scale(point, (proportional_check ? min_value_per_year_prop[slider_year] : min_late_del_per_year[slider_year]), (proportional_check ? max_value_per_year_prop[slider_year] : max_late_del_per_year[slider_year]), 10, 390))} y1="40" x2={scale(point, (proportional_check ? min_value_per_year_prop[slider_year] : min_late_del_per_year[slider_year]), (proportional_check ? max_value_per_year_prop[slider_year] : max_late_del_per_year[slider_year]), 10, 390)} y2="50" stroke="black" />
      <text x={scale(point, (proportional_check ? min_value_per_year_prop[slider_year] : min_late_del_per_year[slider_year]), (proportional_check ? max_value_per_year_prop[slider_year] : max_late_del_per_year[slider_year]), 10, 390)} y="65" fill="black" font-size="12" text-anchor="middle">{point}</text>
    {/each}
  
    <!-- Title -->
    <text x="200" y="8" fill="black" font-size="12" text-anchor="middle">{proportional_check ? "Percentage of late deliveries" : "Number of late deliveries"}</text>
  </svg><br/>

<svg width={width} height={height} viewBox="400 0 350 175">
	<g fill="white" stroke="black">
        {#each eu_countries as feature}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <!-- svelte-ignore a11y-mouse-events-have-key-events -->
            <path 
                d={path_europe(feature)} 
                on:mouseover={function(event) {selected_country = feature; setMousePosition(event)}} 
                on:mouseout={function() {selected_country = undefined}}
                on:click={() => selected_country = feature} 
                class={assign_class(feature)} 
                fill={color(feature, slider_year, proportional_check, selected_center)}/>
                
            {#if distribution_center_countries.includes(feature.properties.name)}
                <!-- {console.log(feature)} -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <!-- svelte-ignore a11y-mouse-events-have-key-events -->
                <circle
                    cx={centroid(feature)[0]}
                    cy={centroid(feature)[1]}
                    class="center"
                    on:mouseover={function(event) {selected_center = feature; setMousePosition(event)}} 
                    on:mouseout={function() {selected_center = undefined}}
                    r="2"
                    fill="red"
                />
            {/if}
        {/each} 
    </g> 
</svg>


<!-- {#if selected_center != undefined}
{console.log("not undefined")}
{/if} -->

{#if selected_center != undefined}
  <div id="tooltip" style="left: {600}px; top: {150}px">
    <svg class="tooltip" width=10 height=10></svg><br/>
    Distribution Center in: {selected_center.properties.name} <br/>
    Late deliveries per country: 
    <ul>
        {#each Object.entries(late_deliveries_per_plant[distribution_centers[selected_center.properties.name]]) as feature}
            <li>{feature[0]} : {feature[1][slider_year]}</li>
        {/each}
    </ul><br/>
    <!-- {console.log(deliveries_per_plant)}
    {console.log(late_deliveries_per_plant)} -->
    {#if proportional_check}
    A total of {get_total_deliveries(selected_center.properties.name, late_deliveries_per_plant)} late deliveries. 
    {(Math.round((get_total_deliveries(selected_center.properties.name, late_deliveries_per_plant)/get_total_deliveries(selected_center.properties.name, deliveries_per_plant)) * 100))}% of all deliveries from this distribution center are late.
    <!-- This is {(Math.round((get_total_deliveries(selected_center.properties.name, late_deliveries_per_plant)/get_total_deliveries(selected_center.properties.name, deliveries_per_plant)) * 100))}% of all deliveries from this distribution center. -->
    {:else}
        A total of {get_total_deliveries(selected_center.properties.name, late_deliveries_per_plant)} late deliveries. This is {(Math.round((get_total_deliveries(selected_center.properties.name, late_deliveries_per_plant)/all_late_deliveries[slider_year]) * 100))}% of all late deliveries.
    {/if}

  </div>

{:else if selected_country != undefined}
  <div id="tooltip" style="left: {mouse_x + 10}px; top: {mouse_y - 10}px">
  <svg class="tooltip" width=20 height=20>
  </svg><br/>
  Country: {selected_country.properties.name} <br/>
  {#if selected_country.properties.name in late_deliveries}
    Number of late deliveries: {late_deliveries[selected_country.properties.name][slider_year]} ({Math.round(late_deliveries[selected_country.properties.name][slider_year]/all_deliveries[selected_country.properties.name][slider_year] * 100)}%) <br/>
    {#if selected_country.properties.name in timely_deliveries}
        Number of timely deliveries: {timely_deliveries[selected_country.properties.name][slider_year]} ({Math.round(timely_deliveries[selected_country.properties.name][slider_year]/all_deliveries[selected_country.properties.name][slider_year] * 100)}%)  <br/>
    {/if}
    {#if selected_country.properties.name in early_deliveries}
        Number of early deliveries: {early_deliveries[selected_country.properties.name][slider_year]} ({Math.round(early_deliveries[selected_country.properties.name][slider_year]/all_deliveries[selected_country.properties.name][slider_year] * 100)}%) <br/>
    {/if}
    {#if selected_country.properties.name in all_deliveries}
        Total deliveries: {all_deliveries[selected_country.properties.name][slider_year]}  <br/>
    {/if}
    
  {:else}
    No deliveries
  {/if}
  </div>
{/if}


<style>
    .country:hover {
        fill: hsla(122, 100%, 50%, 0.2);
    }
    .center:hover {
        fill: hsl(122, 100%, 50%);
    }
  #tooltip { 
    position: fixed;
    background-color: rgb(255, 255, 255);
    padding: 3px;
    border: solid 1px;
  }
  svg.tooltip { 
    margin: 0px;
    padding: 0px;
  }
</style>
  

  
