// Set up the projection
const width = 800;
const height = 600;
let start;

let rotateEnabled = true;

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
        globeGroup.selectAll("path.land")
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

        console.log("Zoom Scale:", event.transform.k);

        // if (event.transform.k < thresholdScale) {
        //     resetZoom();
        // }
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
        .datum({ type: "Sphere" })
        .attr("class", "ocean")
        .attr("d", path);

    globeGroup.append("path")
        .datum(topojson.feature(world, world.objects.countries))
        .attr("class", "land")
        .attr("d", path);

    

    svg.call(drag);
    svg.call(zoom);
    zoom.scaleTo(svg, 1)

    d3.timer(rotateGlobe);

    svg.on("click", function () {
        if (rotateEnabled == false){rotateEnabled = true;}
        else {rotateEnabled = false;}
    });

    
});


