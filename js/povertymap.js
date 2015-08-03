var $map = $('#map');
var $legend = $('#legend');
var us,
    mobile_threshold = 600,
    map_aspect_width = 1.7,
    map_aspect_height = 1,
    json_url = "data/countypov.json",
    colors = ['rgb(247,251,255)', 'rgb(222,235,247)', 'rgb(198,219,239)', 'rgb(158,202,225)', 'rgb(107,174,214)', 'rgb(66,146,198)', 'rgb(33,113,181)', 'rgb(8,81,156)', 'rgb(8,48,107)'],
    breaks = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4],
    legend_breaks = breaks,
    formatter = d3.format("%"),
    missingcolor = "#ccc",
    nullcondition = "",
    pymchild = null;

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


function urbanmap(container_width) {
    if (container_width == undefined || isNaN(container_width)) {
        container_width = 1300;
    }

    var margin = {
        top: 2,
        right: 10,
        bottom: 10,
        left: 10
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

    var color = d3.scale.threshold()
        .domain(breaks)
        .range(colors);

    var marginl = {
        top: 5,
        right: 10,
        bottom: 2,
        left: 10
    };

    if (container_width < mobile_threshold) {
        marginl.bottom = 55;
    } else {
        marginl.bottom = 5;
    }

    var lsvg = d3.select("#legend").append("svg")
        .attr("width", width + marginl.left + marginl.right)
        .attr("height", 50 + marginl.top + marginl.bottom)
        .append("g")
        .attr("transform", "translate(" + marginl.left + "," + marginl.top + ")");

    if ($legend.width() < mobile_threshold) {
        var lp_w = 0,
            ls_w = ((width - 10) / colors.length),
            ls_h = 18;
    } else {
        var lp_w = (3 * width / 5),
            ls_w = 30,
            ls_h = 18;
    }

    if (legend_breaks.length > colors.length) {
        var legend = lsvg.selectAll("g.legend")
            .data(legend_breaks)
            .enter().append("g")
            .attr("class", "legend");

        legend.append("text")
            .data(legend_breaks)
            .attr("x", function (d, i) {
                return (i * ls_w) + lp_w - 15;
            })
            .attr("y", 15)
            .text(function (d, i) {
                return formatter(d);
            });
    } else {
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
    }

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
        .scale(width * 1.25)
        .translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(projection);

    svg.selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features)
        .enter().append("path")
        .attr("class", "counties")
        .attr("d", path)
        //        .attr("rand",  function (d) {
        //                return randomize(d.properties.pov_hi, d.properties.pov_lo);
        //        })
        .style("fill", function (d) {
            if (d.properties.pov != null) {
                return color(d.properties.pov);
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

function randomize(min, max) {
    return Math.random() * (max - min) + min;
}

$(window).load(function () {
    if (Modernizr.svg) {
        d3.json(json_url, function (json) {
            us = json;

            pymChild = new pym.Child({
                renderCallback: urbanmap
            });
        });
    } else {
        pymChild = new pym.Child({});
    }
});