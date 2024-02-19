
// Set up the projection
const width = 800;
const height = 600;
let start;

let rotateEnabled = true; // changed to false for now to figure out tooltip


const projection = d3.geoOrthographic()
    .scale(250)
    .translate([width /2, height / 2])
    .clipAngle(90);

const path = d3.geoPath().projection(projection);

// Create an SVG element
const svg = d3.select("#globe-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Create a group for the globe
const globeGroup = svg.append("g");

// Enable drag and rotate behavior
const drag = d3.drag()
    .subject(function () {
        const r = projection.rotate();
        return { x: r[0] / 2, y: -r[1] / 2 };
    })
    .on("drag", function (event) {
        const rotate = projection.rotate();
        projection.rotate([rotate[0] + event.dx * 0.5, rotate[1] - event.dy * 0.5]);
        globeGroup.selectAll("path.country")
            .attr("d", path);
    
    
    rotateEnabled = false;
    start = Date.now();
    });

// initial zoom state to reset to
const thresholdScale = 0.75; 
const initialTranslate = [width /2, height / 2];
const initialZoomState = d3.zoomIdentity.translate(initialTranslate[0], initialTranslate[1]).scale(1);

function calculateZoomTranslation(transform) {
    const scale = transform.k;
    const x = width / 2 - (width / 2) * scale;
    const y = height / 2 - (height / 2) * scale;
    return `translate(${x},${y}) scale(${scale})`;
}

// Enable zoom behavior on the globe group
const zoom = d3.zoom()
    .scaleExtent([0.75, 10]) // Set the minimum and maximum zoom levels
    .on("zoom", function (event) {
        globeGroup.attr("transform", calculateZoomTranslation(event.transform));
        // console.log("Zoom Scale:", event.transform.k);
    });
    

function rotateGlobe() {
    if (rotateEnabled == false){return;}

    const rotate = projection.rotate();
    projection.rotate([rotate[0] + 0.1, rotate[1]]);
    globeGroup.selectAll("path.country")
        .attr("d", path);
}

const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
// console.log(colorScale);

// Load the world map data
d3.json("countries-110m.json").then((world) => {
    // Draw the world map in the globe group
    globeGroup.append("path")
        .datum({ type: "Sphere" })
        .attr("class", "ocean")
        .attr("d", path);

    // globeGroup.append("path")
    //     .datum(topojson.feature(world, world.objects.countries))
    //     .attr("class", "land")
    //     .attr("d", path);



    // Load the internet data CSV file
    d3.csv("/static/Internet_data_mod.csv").then(internetData => {
        const internetDataMap = new Map();
        internetData.forEach(d => {
            const country = d.Name;
            const year = d.Year;
            const usage = +d.Value; 

                // Check if the country already exists in the map
            if (internetDataMap.has(country)) {
                // If the country exists, push the new data to its array
                internetDataMap.get(country)[year] = usage;
            } else {
                // If the country doesn't exist, create a new array with the data
                internetDataMap.set(country, { [year]: usage });
            }
        });
        // console.log(internetDataMap);
        let selectedYear = 2000;
        const yearSelect = document.getElementById("yearSelect");

        function updateInternetValue(selectedYear) {
            // Write code here to update the internet value based on the selected year
            console.log("Selected Year:", selectedYear);
            // You can retrieve the internet value for the selected year from your data source
        }
        yearSelect.addEventListener("change", function() {
            selectedYear = parseInt(yearSelect.value);
            updateInternetValue(selectedYear);
        });


        // Define tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 1);

        // Draw the world map in the globe group
        globeGroup.selectAll(".country")
            .data(topojson.feature(world, world.objects.countries).features)
            .enter().append("path")
            .attr("class", "country")
            .attr("d", path)
            .on("mouseover", function (event, d) {
                let countryName = d.properties.name;
                // console.log(countryName);
                let internetUsage;
                if (selectedYear in internetDataMap.get(countryName)) {
                    internetUsage = internetDataMap.get(countryName)[selectedYear];
                    tooltip
                    .html(`<strong>Country:</strong> ${countryName}<br><strong>Internet Usage:</strong> ${internetUsage}%`);
                } else {
                    internetUsage = "No data for this year!"
                    tooltip
                    .html(`<strong>Country:</strong> ${countryName}<br><strong>Internet Usage:</strong> ${internetUsage}`);
                }
                tooltip.style("opacity", 1)
                
            })
            .on("mouseout", function () {
                tooltip.style("opacity", 0);
            });

        
    });


    svg.call(drag);
    svg.call(zoom);
    zoom.scaleTo(svg, 1)

    d3.timer(rotateGlobe);

    svg.on("click", function () {
        if (rotateEnabled == false){rotateEnabled = true;}
        else {rotateEnabled = false;}
    });

    
});





