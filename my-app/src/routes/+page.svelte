<script>
    // import { onMount } from 'svelte';
    // import * as d3 from 'd3';
  
    // let data = [
    //   { country: 'USA', sales: 100 },
    //   { country: 'Canada', sales: 50 },
    //   // Add more countries and their sales data here
    // ];
  
    // let projection;
  
    // onMount(() => {
    //   const width = 800;
    //   const height = 500;
  
    //   const svg = d3.select('svg')
    //     .attr('width', width)
    //     .attr('height', height);
  
    //   projection = d3.geoNaturalEarth1()
    //     .translate([width / 2, height / 2])
    //     .scale(150);
  
    //   const path = d3.geoPath().projection(projection);
  
    //   d3.json('world-geojson-file.json').then(geojson => {
    //     svg.selectAll('path')
    //       .data(geojson.features)
    //       .enter()
    //       .append('path')
    //       .attr('d', path)
    //       .attr('fill', d => {
    //         const countryData = data.find(item => item.country === d.properties.name);
    //         if (countryData) {
    //           // Adjust opacity based on sales
    //           return `rgba(0, 0, 255, ${countryData.sales / 100})`; // Change 100 to your maximum sales
    //         } else {
    //           return '#ccc'; // Default color for countries without data
    //         }
    //       });
    //   });
    // });
    
  </script>
  
  
  <div>
    <svg></svg>
  </div>
  
  <style>
    svg {
      width: 100%;
      height: auto;
    }
  </style>