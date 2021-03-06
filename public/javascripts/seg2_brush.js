// user company 정보 가져오기
var companyName = document.getElementById("userCompany").innerHTML;

if (companyName.indexOf("(주)") != -1) {
    companyName = companyName.replace("(주)", "")
}

var svg2Size = d3.select('.seg2_chart');

var svg2_margin = { top: 120, right: 250, bottom: 50, left: 40 },
    svg2_width = +svg2Size.attr("width") - svg2_margin.left - svg2_margin.right,
    svg2_height = +svg2Size.attr("height") - svg2_margin.top - svg2_margin.bottom;

var xScale, yScale;

d3.json('/seg2Data/seg2/company=' + companyName, function (error, data) {

    function orderData3(data) {

        var sData = data.sort(function (x, y) {
            return d3.ascending(x.date, y.date);
        })

        sData.forEach(d => {
            d.date = Number(new Date(d.date).getTime());
            if (d.value < 0) {
                d.value = -d.value;
            }
        });
        return sData;
    }

    var orderData = orderData3(data.data);

    var sumValue = d3.nest()
        .key(function (d) {
            return d.date;
        })
        .rollup(function (v) { return d3.sum(v, function (d) { return d.value; }); })
        .entries(orderData);

    setScales(sumValue);
    drawChart(sumValue);

});

function largestTriangleThreeBucket(data, threshold, xProperty) {

    xProperty = xProperty || 1;

    var m = Math.floor,
        y = Math.abs,
        f = data.length;

    if (threshold >= f || 0 === threshold) {
        return data;
    }

    var n = [],
        t = 0,
        p = (f - 2) / (threshold - 2),
        c = 0,
        v,
        u,
        w;

    n[t++] = data[c];

    for (var e = 0; e < threshold - 2; e++) {
        for (var g = 0,
            h = 0,
            a = m((e + 1) * p) + 1,
            d = m((e + 2) * p) + 1,
            d = d < f ? d : f,
            k = d - a; a < d; a++) {
            g += +data[a][xProperty];
        }

        for (var g = g / k,
            h = h / k,
            a = m((e + 0) * p) + 1,
            d = m((e + 1) * p) + 1,
            k = +data[c][xProperty],
            c = -1; a < d; a++) {
            "undefined" != typeof data[a] &&
                (u = .5 * y((k - g) * (k - data[a][xProperty])),
                    u > c && (c = u, v = data[a], w = a));
        }

        n[t++] = v;
        c = w;
    }

    n[t++] = data[f - 1];

    return n;
};

function setScales(data) {
    var dataSet = largestTriangleThreeBucket(data, svg2_width / 3, "key");

    var start_date = dataSet[0].key;
    var end_date = dataSet[dataSet.length - 1].key;

    xScale = d3.scaleTime().domain(d3.extent([start_date, end_date])).range([0, svg2_width]);

    yScale = d3.scaleLinear()
        .domain([0, d3.max(dataSet, function (d) {
            return d.value;
        })])
        .range([svg2_height, 0]).nice();

}


function drawChart(data) {
    var dataSet = largestTriangleThreeBucket(data, svg2_width / 3, "key");
  
    var xAxis = d3.axisBottom(xScale)

    yAxis = d3.axisLeft(yScale);

    // ON svg
    var svg = d3.select('.seg2_chart')
        .attr("width", svg2_width + 200)
        .attr("transform", function (d, i) {
            return "translate(100, 0)";
        })

    var chartArea = svg.append("g");

    chartArea.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("class", "zoom")
        .attr("width", svg2_width)
        .attr("height", svg2_height + svg2_margin.bottom);

    var infotext = chartArea.append("g")
        .append("text")
        .attr("class", "information")
        .attr("dx", 12)
        .attr("dy", 12)
        .attr("transform", "translate(" + svg2_margin.left + "," + (svg2_margin.top - 20) + ")")
        .text("<회사전체 전력사용량>")
        .style("fill", "#9A9A9A");

    var chart = chartArea.append("g")
        .attr("class", "chart")
        .attr("width", svg2_width)
        .attr("height", svg2_height)
        .attr("transform", "translate(" + svg2_margin.left + "," + svg2_margin.top + ")")
        .attr("clip-path", "url(#clip)");

    var axis = chartArea.append("g")
        .attr("width", svg2_width)
        .attr("height", svg2_height)
        .attr("transform", "translate(" + svg2_margin.left + "," + svg2_margin.top + ")");

    var getDate = d3.timeFormat("%Y-%m-%d %H:%M");

    chart.selectAll("rect")
        .data(dataSet).enter()
        .append("rect")
        .attr("class", "barChart")
        .attr("opacity", "0.6")
        .attr("x", function (d, i, da) { return (xScale(d.key) - ((svg2_width / da.length) - 0.5) * 0.5); })
        .attr("y", function (d, i) {
            return yScale(d.value);
        })
        .attr("width", function (d, i, da) {
            return (svg2_width / da.length) - 0.5;
        })
        .attr("height", function (d) {
            return svg2_height - yScale(d.value);
        })
        .attr("clip-path", "url(#clip)")
        .on("mouseover", function (d) {
            d3.select(this)
                .attr("opacity", "0.9");
        })
        .on("mouseout", function () {
            d3.select(this)
                .transition()
                .duration(500)
                .attr("opacity", "0.6");
        })

    // set axis
    axis.append("g")
        .attr("class", "axis-x")
        .attr("transform", "translate(0," + svg2_height + ")")
        .call(xAxis);

    axis.append("g")
        .attr("class", "axis-y")
        .call(yAxis)
        .append("text")
        .text("Amount of Electricity Used")
        .attr("transform", "translate(10,123) rotate(90)")
        .attr('fill', 'black');

}
