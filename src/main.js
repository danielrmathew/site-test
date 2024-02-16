// // Set up the projection
// const width = 800;
// const height = 600;

// const projection = d3.geoOrthographic()
//     .scale(250)
//     .translate([width / 2, height / 2])
//     .clipAngle(90);

// const path = d3.geoPath().projection(projection);

// // Create an SVG element
// const svg = d3.select("#globe-container")
//     .append("svg")
//     .attr("width", width)
//     .attr("height", height);

// // Load the world map data
// d3.json("countries-110m.json").then((world) => {
//     // Draw the world map
//     svg.append("path")
//         .datum(topojson.feature(world, world.objects.countries))
//         .attr("class", "land")
//         .attr("d", path);


//     // Enable drag and rotate behavior
//     const drag = d3.drag()
//         .subject(function () {
//             const r = projection.rotate();
//             return { x: r[0] / 2, y: -r[1] / 2 };
//         })
//         .on("drag", function (event) {
//             const rotate = projection.rotate();
//             projection.rotate([rotate[0] + event.dx * 0.5, rotate[1] - event.dy * 0.5]);
//             svg.selectAll("path.land")
//                 .attr("d", path);
//         });
    
//     // Enable zoom behavior
//     const zoom = d3.zoom()
//         .scaleExtent([1, 10]) // Set the minimum and maximum zoom levels
//         .on("zoom", function (event) {
//             svg.attr("transform", event.transform);
//         });

//     svg.call(drag);
//     svg.call(zoom);

    
// });


// Set up the projection
const width = 900;
const height = 700;
let start;

let rotateEnabled = true;

const projection = d3.geoOrthographic()
    .scale(250)
    .translate([width / 2, height / 2])
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
        globeGroup.selectAll("path.land")
            .attr("d", path);
    
    
    rotateEnabled = false;
    start = Date.now();
    });

// Enable zoom behavior on the globe group
const zoom = d3.zoom()
    .scaleExtent([1, 10]) // Set the minimum and maximum zoom levels
    .on("zoom", function (event) {
        globeGroup.attr("transform", event.transform);
    });

function rotateGlobe() {
    if (rotateEnabled == false){return;}

    const rotate = projection.rotate();
    projection.rotate([rotate[0] + 0.1, rotate[1]]);
    globeGroup.selectAll("path.land")
        .attr("d", path);
}

// Load the world map data
d3.json("countries-110m.json").then((world) => {
    // Draw the world map in the globe group
    globeGroup.append("path")
        .datum(topojson.feature(world, world.objects.countries))
        .attr("class", "land")
        .attr("d", path);

    svg.call(drag);
    svg.call(zoom);

    d3.timer(rotateGlobe);

    svg.on("click", function () {
        if (rotateEnabled == false){rotateEnabled = true;}
        else {rotateEnabled = false;}
    });
});


