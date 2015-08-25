var $map = $('#map');
var $estimatemap = $('#estimatemap');
var $legend = $('#legend');
var us,
    mobile_threshold = 400,
    map_aspect_width = 1.7,
    map_aspect_height = 1,
    json_url = "data/countypov.json",
    breaks = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35],
    legend_breaks = breaks,
    formatter = d3.format("%"),
    missingcolor = "#ccc",
    nullcondition = "",
    pymchild = null,
    randclick = false,
    animater;

//var colors = ["#d0e8f2", "#c5e3f0", "#badeee", "#b0daec", "#a6d5ea", "#9bd0e8", "#90cbe6", "#85c6e3", "#7cc1e1", "#71bddf", "#67b9dd", "#5cb4db", "#53afda", "#49aad8", "#3fa5d6", "#35a1d4", "#2c9cd2", "#2497d0", "#228ec3", "#2085b7", "#1d7cab", "#1b749e", "#196b92", "#166286", "#14597a", "#12506e", "#104762", "#0e3e55", "#0b3549", "#092c3d", "#072330", "#051a24", "#031219", "#02090c", "#000000"];

var colors = ["#CFE8F3", "#A2D4EC", "#73BFE2", "#46ABDB", "#1696D2", "#12719E", "#0A4C6A", "#062635"];

//var colors = ["#d0e8f2", "#badeee", "#a6d5ea", "#90cbe6", "#7cc1e1", "#67b9dd", "#53afda", "#3fa5d6", "#2c9cd2", "#228ec3", "#1d7cab", "#196b92", "#14597a", "#104762", "#0b3549", "#072330", "#031219"];

d3.helper = {};
d3.helper.tooltip = function (accessor) {
    return function (selection) {
        var tooltipDiv;
        var bodyNode = d3.select('body').node();
        selection.on("mouseover", function (d, i) {
                // Clean up lost tooltips
                d3.select('body').selectAll('div.tooltip').remove();
                // Append tooltip
                tooltipDiv = d3.select('body').append('div').attr('class', 'urban-map-tooltip');
                var absoluteMousePos = d3.mouse(bodyNode);
                if ((absoluteMousePos[0] - 150) < 100) {
                    tooltipDiv.style('left', (absoluteMousePos[0]) + 'px')
                        .style('top', (absoluteMousePos[1] - 45) + 'px')
                        .style('position', 'absolute')
                        .style('z-index', 1001);
                } else {
                    tooltipDiv.style('left', (absoluteMousePos[0] - 150) + 'px')
                        .style('top', (absoluteMousePos[1] - 45) + 'px')
                        .style('position', 'absolute')
                        .style('z-index', 1001);
                }
                // Add text using the accessor function
                var tooltipText = accessor(d, i) || '';
            })
            .on('mousemove', function (d, i) {
                // Move tooltip
                var absoluteMousePos = d3.mouse(bodyNode);
                if ((absoluteMousePos[0] - 150) < 100) {
                    tooltipDiv.style('left', (absoluteMousePos[0]) + 'px')
                        .style('top', (absoluteMousePos[1] - 45) + 'px');
                } else {
                    tooltipDiv.style('left', (absoluteMousePos[0] - 150) + 'px')
                        .style('top', (absoluteMousePos[1] - 45) + 'px');
                }
                var tooltipText = accessor(d, i) || '';
                tooltipDiv.html(tooltipText);
            })
            .on("mouseout", function (d, i) {
                tooltipDiv.remove();
            });
    };
};

//map of value estimate
function estimatemap(container_width) {
    if (container_width == undefined || isNaN(container_width)) {
        container_width = 1300;
    }

    var margin = {
        top: 10,
        right: 5,
        bottom: 10,
        left: 5
    };

    var width = container_width - margin.left - margin.right;
    var height = Math.ceil((width * map_aspect_height) / map_aspect_width) - margin.top - margin.bottom;

    $map.empty();

    $legend.empty();

    var svg = d3.select("#map").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var colorScale = d3.scale.threshold()
        .domain(breaks)
        .range(colors);

    var marginl = {
        top: 5,
        right: 10,
        bottom: 2,
        left: 10
    };

    var lsvg = d3.select("#legend").append("svg")
        .attr("width", width + marginl.left + marginl.right)
        .attr("height", 55)
        .append("g")
        .attr("transform", "translate(" + marginl.left + "," + marginl.top + ")");

    if ($legend.width() < mobile_threshold) {
        var lp_w = 0,
            ls_w = ((width - 10) / colors.length),
            ls_h = 18;
    } else {
        var lp_w = 30,
            ls_w = 30,
            ls_h = 18;
    }

    var legend = lsvg.selectAll("g.legend")
        .data(colors)
        .enter().append("g")
        .attr("class", "legend");

    legend.append("text")
        .data(legend_breaks)
        .attr("x", function (d, i) {
            return (i * ls_w) + lp_w + ls_w - 15;
        })
        .attr("y", 15)
        .text(function (d, i) {
            return formatter(d);
        });

    legend.append("rect")
        .data(colors)
        .attr("x", function (d, i) {
            return (i * ls_w) + lp_w;
        })
        .attr("y", 20)
        .attr("width", ls_w)
        .attr("height", ls_h)
        .attr("z-index", 10)
        .style("fill", function (d, i) {
            return colors[i];
        })

    var projection = d3.geo.albersUsa()
        .scale(width * 1.3)
        .translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(projection);

    svg.selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features)
        .enter().append("path")
        .attr("class", "counties")
        .attr("d", path)
        .style("fill", function (d) {
            if (d.properties.pov != null) {
                return colorScale(d.properties.pov);
            } else {
                return missingcolor;
            }
        })
        .call(d3.helper.tooltip(
            function (d, i) {
                if (d.properties.pov == null) {
                    return "<b>" + d.properties.name + "</b></br> No data";
                } else {
                    return "<b>" + d.properties.name + "</b></br>" + formatter(d.properties.pov) + "</br>MOE: " + formatter(d.properties.margin);
                }
            }
        ));

    svg.append("g")
        .attr("class", "states")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
        .enter().append("path")
        .attr("d", path);

    if (pymChild) {
        pymChild.sendHeight();
    }
}

function animatedmap(container_width) {
    if (container_width == undefined || isNaN(container_width)) {
        container_width = 1300;
    }

    var margin = {
        top: 10,
        right: 5,
        bottom: 10,
        left: 5
    };

    var width = container_width - margin.left - margin.right;
    var height = Math.ceil((width * map_aspect_height) / map_aspect_width) - margin.top - margin.bottom;

    $map.empty();

    var svg = d3.select("#map").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var colorScale = d3.scale.threshold()
        .domain(breaks)
        .range(colors);

    var projection = d3.geo.albersUsa()
        .scale(width * 1.3)
        .translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(projection);

    svg.selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features)
        .enter().append("path")
        .attr("class", "counties thresh")
        .attr("d", path)
        .style("fill", function (d) {
            if (d.properties.pov != null) {
                return colorScale(d.properties.pov);
            } else {
                return missingcolor;
            }
        });

    svg.append("g")
        .attr("class", "states")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
        .enter().append("path")
        .attr("d", path);

    function randmap(error, json) {
        svg.selectAll("path")
            .transition()
            .duration(1000)
            .style("fill", function (d) {
                return colorScale(randomize(d.properties.pov_hi, d.properties.pov_lo));
            })
            .attr("d", path);
    }

    function timeout() {
        animater = setTimeout(function () {
            randmap();
            //infinite recursive loop
            timeout();
        }, 1300);
    }
    console.log(randclick);
    $('button#randbtn').click(function (e) {
        if (randclick == true) {
            clearTimeout(animater);

            //go back to estimate map      
//            svg.selectAll("path")
//                .transition()
//                .duration(500)
//                .style("fill", function (d) {
//                    return colorScale(d.properties.pov);
//
//                })
//                .attr("d", path);

            randclick = false;
            console.log(randclick);
            d3.select(this).text("Play");
        } else {
            //randomize the colors within bounds
            timeout();
            randclick = true;
            console.log(randclick);
            d3.select(this).text("Pause");
        }
    });

    if (pymChild) {
        pymChild.sendHeight();
    }
}

function randomize(min, max) {
    return Math.random() * (max - min) + min;
}