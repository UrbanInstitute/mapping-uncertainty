var $map,
    $legend = $('#legend'),
    us,
    mobile_threshold = 600,
    map_aspect_width = 1.7,
    map_aspect_height = 1,
    json_url = "data/countypov.json",
    colors = ["#bcbec0", "#fdbf11"],
    breaks = [0.3],
    legend_breaks = breaks,
    formatter = d3.format("%"),
    missingcolor = "#ccc",
    nullcondition = "",
    pymchild = null;


function legend() {

    var marginl = {
        top: 5,
        right: 10,
        bottom: 2,
        left: 10
    };

    if ($map.width < mobile_threshold) {
        marginl.bottom = 55;
    } else {
        marginl.bottom = 5;
    }

    $legend.empty();

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
}

var valuetomap,
    value = {};

function map_lo() {
    $map = $("#maplo");
    thresholdmap("#maplo");
}

function map_estimate() {
    $map = $("#mapest");
    thresholdmap("#mapest");
}

function map_hi() {
    $map = $("#maphi");
    thresholdmap("#maphi");
}

function thresholdmap(div) {

    var margin = {
        top: 2,
        right: 4,
        bottom: 10,
        left: 4
    };

    var width = $map.width() - margin.left - margin.right;
    var height = Math.ceil((width * map_aspect_height) / map_aspect_width) - margin.top - margin.bottom;

    $map.empty();

    var svg = d3.select(div).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var color = d3.scale.threshold()
        .domain(breaks)
        .range(colors);

    var projection = d3.geo.albersUsa()
        .scale(width * 1.25)
        .translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(projection);

    svg.selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features)
        .enter().append("path")
        .attr("class", "thresh")
        .attr("d", path)
        .style("fill", function (d) {
            if (d.properties.pov != null) {
                return color(d.properties.pov_lo);
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

}

function threshmaps() {
    map_lo();
    map_estimate();
    map_hi();
}
$(window).load(function () {
    if (Modernizr.svg) {
        d3.json(json_url, function (json) {
            us = json;
            threshmaps();
            window.onresize = threshmaps();
        });
    }
});