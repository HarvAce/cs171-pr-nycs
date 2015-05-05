BarVis = function(_parentElement, _metricsData, _statsData, _eventHandler){
    this.parentElement = _parentElement;
    this.metricsData = _metricsData;
    this.statsData = _statsData;
    this.displayStatsData = [];
    this.displayMetrics = [];
    this.eventHandler = _eventHandler;
    this.activeMetricType = "schoolButton";
    this.activeMetricList = [];
    this.displayData = [];
    this.clickedItems = [];

    this.margin = {top: 46, right: 20, bottom: 20, left: 60};
    this.width = 340 - this.margin.left - this.margin.right;

    this.initVis();
}

BarVis.prototype.initVis = function() {
    var that = this;

    that.colorScale = d3.scale.ordinal()
        .domain([0, 1, 2, 3, 4, 5])
        .range(["#252525", "#636363", "#969696", "#bdbdbd", "#d9d9d9", "#f7f7f7"]);

    that.tip = d3.tip()
        .attr("class", "d3-tip-noarrow")
        .direction('w')
        .offset([0, 0])
        .html(function(d){
            var decimalFormat = d3.format("." + d.currentMetricInfo.formatPrecision + "f");
            if (that.activeMetricType == "boroughButton")
            {
                return d.values[0].BoroName + "<br/>" + d.currentMetricInfo.label + ": " + (d.currentMetricInfo.formatType == "integer" ? d.values[0][d.currentMetricInfo.metric] : (d.currentMetricInfo.formatType == "decimal" ? decimalFormat(d.values[0][d.currentMetricInfo.metric]) : decimalFormat(d.values[0][d.currentMetricInfo.metric]) + "%"));
            }
            else if (that.activeMetricType == "schoolDistrictButton")
            {
                return "District " + d.values[0].SchoolDist + "<br/>" + d.currentMetricInfo.label + ": " + d.values[0][d.currentMetricInfo.metric];
            }
            else if(that.activeMetricType == "schoolButton") {
                    return d.values[0].SCHOOLNAME + "<br/>" + d.currentMetricInfo.label + ": " + d.values[0][d.currentMetricInfo.metric];
            }
        });

    that.percentileTip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-6, 0])
        .html(function(d){
            return d[1] + ": " + d[0];
        });

    that.barTitleTip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-6, 0])
        .html(function(d){
            var currentMetricInfo = $.grep(that.displayMetrics, function (e) {
                return e.metric == d.key;
            })[0];

            return currentMetricInfo.legendCaption + (currentMetricInfo.textOne != null ? "<br/>" + currentMetricInfo.textOne : "") + (currentMetricInfo.textTwo != null ? "<br/>" + currentMetricInfo.textTwo : "") + (currentMetricInfo.textThree != null ? "<br/>" + currentMetricInfo.textThree : "") + (currentMetricInfo.textFour != null ? "<br/>" + currentMetricInfo.textFour : "") + (currentMetricInfo.textFive != null ? "<br/>" + currentMetricInfo.textFive : "") + (currentMetricInfo.textSix != null ? "<br/>" + currentMetricInfo.textSix : "") + (currentMetricInfo.textSeven != null ? "<br/>" + currentMetricInfo.textSeven : "") + (currentMetricInfo.textEight != null ? "<br/>" + currentMetricInfo.textEight : "") + (currentMetricInfo.textNine != null ? "<br/>" + currentMetricInfo.textNine : "");
        });

    that.wrangleData();

    that.updateVis();
}

BarVis.prototype.wrangleData = function(){
    var that = this;

    that.displayStatsData = that.filterAndAggregate();
}

BarVis.prototype.updateVis = function() {
    var that = this;


    if(that.clickedItems.length == 1)
    {
        that.height = (that.clickedItems.length * 30) + 3;
    }
    else {
        that.height = (that.clickedItems.length * 30);
    }

    that.parentElement.selectAll("svg").remove();

    that.svg = that.parentElement.selectAll("svg").data(that.displayStatsData);

    that.y = d3.scale.ordinal()
        .domain(that.clickedItems.reverse())
        .rangeRoundBands([that.height, 0],.2);

    that.yTwo = d3.scale.ordinal()
        .domain(that.clickedItems.reverse())
        .rangeBands([that.height, 0],0);

    //Create an svg for each key metric selected
    that.svg.enter()
        .append("svg");

    that.svg
        .attr("width", that.width + that.margin.left + that.margin.right)
        .attr("height", that.height + that.margin.top + that.margin.bottom)
        .attr("style", "outline: thin solid black;")
        .append("g")
        .attr("class", function(d){
            return "metric " + d.key;
        })
        .attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")")
        .each(function(metric){

            var xScale;
            var myMetric;

            for (var i=0; i<metric.values.length; i++) {
                metric.values[i].currentMetricInfo = $.grep(that.displayMetrics, function (e) {
                    return e.metric == metric.key;
                })[0];
                myMetric = $.grep(that.displayMetrics, function (e) {
                    return e.metric == metric.key;
                })[0];

                    metric.values[i].x = d3.scale.linear()
                        .domain([metric.values[i].currentMetricInfo.Min, metric.values[i].currentMetricInfo.Max])
                        .range([0, that.width]);
                    xScale = d3.scale.linear()
                        .domain([metric.values[i].currentMetricInfo.Min, metric.values[i].currentMetricInfo.Max])
                        .range([0, that.width]);
            }

            var xAxis = d3.svg.axis()
                .scale(xScale)
                .tickValues([myMetric.Min, (myMetric.Min + (myMetric.Min + myMetric.Max) / 2) / 2, (myMetric.Min + myMetric.Max) / 2, (myMetric.Max + (myMetric.Min + myMetric.Max) / 2) / 2, myMetric.Max])
                .tickFormat(function(d){
                    if(that.activeMetricType == "schoolButton" && d == myMetric.Min)
                    {
                        return "None";
                    }
                    else if(myMetric.formatType == "integer")
                    {
                        var integerFormat = d3.format("d");
                        return integerFormat(parseInt(d));
                    }
                    else if(myMetric.formatType == "percentage")
                    {
                        var decimalFormat = d3.format("." + myMetric.formatPrecision + "f");
                        return decimalFormat(d) + "%";
                    }
                    else if(myMetric.formatType == "decimal")
                    {
                        var decimalFormat = d3.format("." + myMetric.formatPrecision + "f");
                        return decimalFormat(d);
                    }
                })
                .orient("bottom");
            d3.select(this).append("g")
                .attr("class", "x axis xBar")
                .attr("transform", "translate(0," + that.height + ")")
                .call(xAxis);

            var xAxisTwo = d3.svg.axis()
                .scale(xScale)
                .tickValues([myMetric.Min, myMetric.TwentyFive, myMetric.Fifty, myMetric.SeventyFive, myMetric.Max])
                .tickFormat(function(d){
                    if (d == myMetric.Min)
                    {
                        return "0%";
                    }
                    else if (d == myMetric.TwentyFive)
                    {
                        return "25%";
                    }
                    else if (d == myMetric.Fifty)
                    {
                        return "50%";
                    }
                    else if (d == myMetric.SeventyFive)
                    {
                        return "75%";
                    }
                    else if (d == myMetric.Max)
                    {
                        return "100%";
                    }
                })
                .orient("top");
            d3.select(this).append("g")
                .attr("class", "x axis xBar")
                .call(xAxisTwo);

            //Create the twenty-five line
            var lineTwentyFive = [{x: xScale(myMetric.TwentyFive), y: that.height}, {x: xScale(myMetric.TwentyFive), y: 0}];
            var areaTwentyFive = [{x: xScale(myMetric.Min), width: xScale(myMetric.TwentyFive), y: that.height, height: 0}]

            var line = d3.svg.line()
                .x(function(d, i){
                    return d.x;
                })
                .y(function(d, i){
                    return d.y;
                });

            d3.select(this).append("rect")
                .attr("x", xScale(myMetric.Min))
                .attr("y", 0)
                .attr("width", xScale(myMetric.TwentyFive) - xScale(myMetric.Min))
                .attr("height", that.height)
                .attr("fill", function(){
                    return colorPicker(myMetric, "TwentyFive");
                })
                .attr("fill-opacity",.25)
                .on("mouseover", function(d){
                    d3.select(this).attr("fill-opacity", 1);
                    that.percentileTip.show([d.values[0].currentMetricInfo.TwentyFive, "Twenty-Fifth Percentile"]);
                })
                .on("mouseout", function(d){
                    d3.select(this).attr("fill-opacity",.25);
                    that.percentileTip.hide(d);
                });

            d3.select(this).append("path")
                .datum(lineTwentyFive)
                .attr("d", line);

            //Create the fifty line
            var lineFifty = [{x: xScale(myMetric.Fifty), y: that.height}, {x: xScale(myMetric.Fifty), y: 0}]

            var line = d3.svg.line()
                .x(function(d, i){
                    return d.x;
                })
                .y(function(d, i){
                    return d.y;
                });

            d3.select(this).append("rect")
                .attr("x", xScale(myMetric.TwentyFive))
                .attr("y", 0)
                .attr("width", xScale(myMetric.Fifty) - xScale(myMetric.TwentyFive))
                .attr("height", that.height)
                .attr("fill", function(){
                    return colorPicker(myMetric, "Fifty");
                })
                .attr("fill-opacity",.25)
                .on("mouseover", function(d){
                    d3.select(this).attr("fill-opacity", 1);
                    that.percentileTip.show([d.values[0].currentMetricInfo.Fifty, "Fiftieth Percentile"]);
                })
                .on("mouseout", function(d){
                    d3.select(this).attr("fill-opacity",.25)
                    that.percentileTip.hide(d);
                });

            d3.select(this).append("path")
                .datum(lineFifty)
                .attr("d", line);

            var lineSeventyFive = [{x: xScale(myMetric.SeventyFive), y: that.height}, {x: xScale(myMetric.SeventyFive), y: 0}]

            var line = d3.svg.line()
                .x(function(d, i){
                    return d.x;
                })
                .y(function(d, i){
                    return d.y;
                });

            d3.select(this).append("rect")
                .attr("x", xScale(myMetric.Fifty))
                .attr("y", 0)
                .attr("width", xScale(myMetric.SeventyFive) - xScale(myMetric.Fifty))
                .attr("height", that.height)
                .attr("fill", function(){
                    return colorPicker(myMetric, "SeventyFive");
                })
                .attr("fill-opacity",.25)
                .on("mouseover", function(d){
                    d3.select(this).attr("fill-opacity", 1);
                    that.percentileTip.show([d.values[0].currentMetricInfo.SeventyFive, "Seventy-Fifth Percentile"]);
                })
                .on("mouseout", function(d){
                    d3.select(this).attr("fill-opacity",.25)
                    that.percentileTip.hide(d);
                });

            d3.select(this).append("path")
                .datum(lineSeventyFive)
                .attr("d", line);

            d3.select(this).append("rect")
                .attr("x", xScale(myMetric.SeventyFive))
                .attr("y", 0)
                .attr("width", xScale(myMetric.Max) - xScale(myMetric.SeventyFive))
                .attr("height", that.height)
                .attr("fill", function(){
                    return colorPicker(myMetric, "Hundred");
                })
                .attr("fill-opacity",.25)
                .on("mouseover", function(d){
                    d3.select(this).attr("fill-opacity", 1);
                    that.percentileTip.show([d.values[0].currentMetricInfo.Max, "Hundredth Percentile"]);
                })
                .on("mouseout", function(d){
                    d3.select(this).attr("fill-opacity",.25)
                    that.percentileTip.hide(d)
                });

        });

    that.yAxis = d3.svg.axis()
        .scale(that.y)
        .ticks(10)
        .orient("left");

    var yAxis = that.svg.selectAll(".metric").append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(0,0)")
        .call(that.yAxis);

    that.svg.selectAll(".metric").append("text")
        .attr("class", "barTitle");

    that.svg.selectAll(".barTitle")
        .attr("text-anchor", "middle")
        .attr("x", (that.width-20)/2)
        .attr("y", -25)
        .text(function(d){
            var currentMetricInfo = $.grep(that.displayMetrics, function (e) {
                return e.metric == d.key;
            })[0];

            return currentMetricInfo.label;
        })
        .on("mouseover", that.barTitleTip.show)
        .on("mouseout", that.barTitleTip.hide);

    that.svg.selectAll(".metric").selectAll(".bar")
        .data(function(d){return d.values;})
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", function(d){
            if (that.activeMetricType == "boroughButton") {
                return that.y(d.values[0].BoroCode);
            }
            else if (that.activeMetricType == "schoolDistrictButton") {
                return that.y(d.values[0].SchoolDist);
            }
            else if (that.activeMetricType == "schoolButton") {
                return that.y(d.values[0].ATS_CODE);
            }
        })
        .attr("width", function(metric){
            if(metric.values[0][metric.currentMetricInfo.metric] == null || metric.values[0][metric.currentMetricInfo.metric] == "" || metric.values[0][metric.currentMetricInfo.metric] == 0)
            {
                return metric.x(metric.currentMetricInfo.Min);
            }
            else {
                return metric.x(metric.values[0][metric.currentMetricInfo.metric]);
            }
        })
        .attr("height", function(d){
            return that.y.rangeBand();
        })
        .attr("fill", function(d, i){
            return that.colorScale(i);
        })
        .attr("stroke", "black")
        .on("mouseover", that.tip.show)
        .on("mouseout", that.tip.hide);

    that.svg.selectAll(".metric").selectAll(".noData")
        .data(function(d){return d.values;})
        .enter()
        .append("text")
        .attr("class", "noData")
        .attr("y", function(d){
            if (that.activeMetricType == "boroughButton") {
                return that.y(d.values[0].BoroCode) + 16;
            }
            else if (that.activeMetricType == "schoolDistrictButton") {
                return that.y(d.values[0].SchoolDist) + 16;
            }
            else if (that.activeMetricType == "schoolButton") {
                return that.y(d.values[0].ATS_CODE) + 16;
            }
        })
        .attr("x", 4)
        .text(function(metric){
            if(metric.values[0][metric.currentMetricInfo.metric] === 0)
            {
                return "";
            }
            else if(metric.values[0][metric.currentMetricInfo.metric] == null || metric.values[0][metric.currentMetricInfo.metric] == "")
            {
                return "NO DATA";
            }
        });

    that.svg.exit().remove();

    if(that.clickedItems.length>0 && that.activeMetricList.length>0) {
        that.parentElement.selectAll("svg").call(that.tip);
        that.parentElement.selectAll("svg").call(that.percentileTip);
        that.parentElement.selectAll("svg").call(that.barTitleTip);
    }

    function colorPicker(metricInfo, metricVal){

        if (metricVal == "Hundred") {
            if(metricInfo.colorSpread == "divergent") {
                if(metricInfo.colorPath == "ascending") {
                    return "#4575b4";
                }
                else if(metricInfo.colorPath == "descending")
                {
                    return "#d7191c";
                }
            }
            else if (metricInfo.colorSpread == "sequential")
            {
                if(metricInfo.colorBase == "blue")
                {
                    return "#4575b4";
                }
                else if(metricInfo.colorBase == "red")
                {
                    return "#d73027";
                }
            }
        }
        else if (metricVal == "SeventyFive") {
            if(metricInfo.colorSpread == "divergent") {
                if(metricInfo.colorPath == "ascending") {
                    return "#abd9e9";
                }
                else if(metricInfo.colorPath == "descending")
                {
                    return "#fdae61";
                }
            }
            else if (metricInfo.colorSpread == "sequential")
            {
                if(metricInfo.colorBase == "blue")
                {
                    return "#74add1";
                }
                else if(metricInfo.colorBase == "red")
                {
                    return "#f46d43";
                }
            }
        }
        else if (metricVal == "Fifty") {
            if(metricInfo.colorSpread == "divergent") {
                if(metricInfo.colorPath == "ascending") {
                    return "#fdae61";
                }
                else if(metricInfo.colorPath == "descending")
                {
                    return "#abd9e9";
                }
            }
            else if (metricInfo.colorSpread == "sequential")
            {
                if(metricInfo.colorBase == "blue")
                {
                    return "#abd9e9";
                }
                else if(metricInfo.colorBase == "red")
                {
                    return "#fdae61";
                }
            }
        }
        else if (metricVal == "TwentyFive") {
            if(metricInfo.colorSpread == "divergent") {
                if(metricInfo.colorPath == "ascending") {
                    return "#d7191c";
                }
                else if(metricInfo.colorPath == "descending")
                {
                    return "#2c7bb6";
                }
            }
            else if (metricInfo.colorSpread == "sequential")
            {
                if(metricInfo.colorBase == "blue")
                {
                    return "#e0f3f8";
                }
                else if(metricInfo.colorBase == "red")
                {
                    return "#fee090";
                }
            }
        }
    }

}

BarVis.prototype.filterAndAggregate = function() {

    var that = this;

    var metricType;
    var selectorID;
    var selectorLetter;

    if(that.activeMetricType == "boroughButton")
    {
        metricType = "Boroughs";
        selectorID = "BoroCode";
        selectorLetter = "B";
    }
    else if(that.activeMetricType == "schoolDistrictButton")
    {
        metricType = "SchoolDistricts";
        selectorID = "SchoolDist";
        selectorLetter = "D";
    }
    else if(that.activeMetricType == "schoolButton")
    {
        metricType = "Schools";
        selectorID = "ATS_CODE";
        selectorLetter = "S";
    }

    var midData = [];

    midData = $.map(that.statsData[metricType], function(e1){
        return e1;
    });

    that.displayStatsData.length = 0;

    that.displayMetrics = that.metricsData[that.activeMetricType].filter(function(d){
        return that.activeMetricList.indexOf(d.metric)>-1;
    });

    if(that.clickedItems.length > 0) {
        for (var item in that.displayMetrics) {
            that.displayStatsData.push({
                "key": that.displayMetrics[item].metric, "values": d3.nest()
                    .key(function (d) {
                        return d[selectorID];
                    })
                    .entries(midData.filter(function (d) {
                        return that.clickedItems.indexOf(d[selectorID].toString()) > -1;
                    }))
            });
        }
    }

    return that.displayStatsData;
}

BarVis.prototype.clicked = function(params){
    var that = this;

    if(params.action == true)
    {
        that.clickedItems.push(params.schoolPoint.slice(1));
    }
    else if(params.action == false)
    {
        that.clickedItems.splice(that.clickedItems.indexOf(params.schoolPoint.slice(1)), 1);
    }

    that.wrangleData();
    that.updateVis();
}

BarVis.prototype.onFilterChange = function(params){
    var that = this;

    that.activeMetricList.length = 0;

    for (var i = 0; i < params.metrics.length; i++) {
        that.activeMetricList.push(params.metrics[i].value);
    }

    that.wrangleData();
    that.updateVis();

}

BarVis.prototype.onButtonChange = function(params){
    var that = this;

    that.activeMetricType = params.metricType;
    that.activeMetricList.length = 0;
    that.clickedItems.length = 0;

    that.wrangleData();
    that.updateVis();

}

BarVis.prototype.onSelectionChange = function(params){
    var that = this;

    that.clickedItems.length = 0;

    that.wrangleData();
    that.updateVis();
}