// Set up the projection
const width = 800;
const height = 600;
let start;

let rotateEnabled = true; 

// Define the color scale for the internet usage 
const colorScale = d3.scaleSequential()
    .domain([0, 100]) // Input domain
    .interpolator(d3.interpolateBuGn);

// add stroke to globe
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

// Load the world map data
d3.json("countries-110m.json").then((world) => {
    // Draw the world map in the globe group
    globeGroup.append("path")
        .datum({ type: "Sphere" })
        .attr("class", "ocean")
        .attr("d", path);

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

        // making the initial year button active
        const initial_year_button = document.getElementById("2000");
        initial_year_button.classList.add("active_button");

        // Displaying initial average
        document.getElementById("curr_avg").innerHTML = "~" + get_average_usage().toFixed(2) + "%";

        function updateGlobeColors(currYear) {
            globeGroup.selectAll(".country")
            .transition().duration(1000)
            .style("fill", function (d) {
                let countryName = d.properties.name;
    
                if (internetDataMap.has(countryName)){
                let internetUsage;
                    if (currYear in internetDataMap.get(countryName)) {
                        internetUsage = internetDataMap.get(countryName)[currYear];
                        console.log(internetUsage);
                        return colorScale(internetUsage);
                    } else {
                        return "grey";
                    }
                }
                else {
                    return "black";
                }
            })
        }

        // Function to handle updating year
        function updateYear(year) {
            selectedYear = year;
            updateGlobeColors(selectedYear);
            // console.log("Selected year:", year);
            document.getElementById("curr_avg").innerHTML = "~" + get_average_usage().toFixed(2) + "%";
        }

        const buttons = document.querySelectorAll('.button');

        buttons.forEach(button => {
            button.addEventListener('click', function() {
                buttons.forEach(btn => btn.classList.remove('active_button'));
                this.classList.toggle('active_button');
                updateYear(this.id);
            });
        });

        function get_average_usage() {
            sum = 0

            for (let [key, value] of internetDataMap) {
                if (selectedYear in value) {
                    sum += value[selectedYear];
                }
            }
            return sum / internetDataMap.size;
        }

        // Define tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 1);

        globeGroup.selectAll(".country")
            .data(topojson.feature(world, world.objects.countries).features)
            .enter().append("path")
            .attr("class", "country")
            .attr("d", path)
            .on("mouseover", function (event, d) {
                d3.select(this).style("opacity", 0.5);
                
                let countryName = d.properties.name;
                let internetUsage;

                if (internetDataMap.has(countryName)){
                    if (selectedYear in internetDataMap.get(countryName)) {
                        internetUsage = internetDataMap.get(countryName)[selectedYear];
                        tooltip
                        .html(`<strong>Country:</strong> ${countryName}<br><strong>Internet Usage:</strong> ${internetUsage}%`).style("font-family", "Titillium Web, sans-serif");
                    } else {
                        internetUsage = "No data for this year!"
                        tooltip
                        .html(`<strong>Country:</strong> ${countryName}<br><strong>Internet Usage:</strong> ${internetUsage}`);
                    }
                }
                else {
                    internetUsage = "No data for this country!"
                    tooltip
                    .html(`<strong>Country:</strong> ${countryName}<br><strong>Internet Usage:</strong> ${internetUsage}`);
                }

                tooltip.style("opacity", 1)
                
            })  
            .style("fill", function (d) {
                let countryName = d.properties.name;
    
                if (internetDataMap.has(countryName)){
                let internetUsage;
                    if (selectedYear in internetDataMap.get(countryName)) {
                        internetUsage = internetDataMap.get(countryName)[selectedYear];
                        // console.log(internetUsage);
                        return colorScale(internetUsage);
                    } else {
                        return "grey";
                    }
                }
                else {
                    return "black";
                }
            })
            .on("mouseout", function (event, d) {
                d3.select(this).style("opacity", 1);
                tooltip.style("opacity", 0);
                })
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





