LineVis = function(_parentElement, _geoData, _metricsData, _statsData, _eventHandler){
    this.parentElement = _parentElement;
    this.geoData = _geoData;
    this.metricsData = _metricsData;
    this.statsData = _statsData;
    this.displayStatsData = [];
    this.eventHandler = _eventHandler;
    this.displayData = jQuery.extend(true, {}, _geoData);
    this.activeMetricType = "schoolButton";

    this.margin = {top: 10, right: 20, bottom: 30, left: -10};
    this.width = 1200 - this.margin.left - this.margin.right;
    this.height = 230 - this.margin.top - this.margin.bottom;


    this.initVis();
}

LineVis.prototype.initVis = function(){
    var that = this;

    that.svg = that.parentElement.append("svg")
        .attr("width", that.width + that.margin.left + that.margin.right)
        .attr("height", that.height + that.margin.top + that.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")");

    that.x = d3.scale.ordinal().rangePoints([0, that.width], 1);
    that.y = {};
    that.dragging = {};
    that.line = d3.svg.line();
    that.axis = d3.svg.axis().orient("left");
    that.background = null;
    that.foreground = null;

    that.tip = d3.tip()
        .attr("class", "d3-tip-noarrow")
        .offset([0, 0])
        .direction('s')
        .html(function(d){
            var currentMetricInfo = $.grep(that.metricsData[that.activeMetricType], function(e){
                return e.metric == d;
            })[0];
            return(currentMetricInfo.legendCaption + (currentMetricInfo.textOne != null ? "<br/>" + currentMetricInfo.textOne : "") + (currentMetricInfo.textTwo != null ? "<br/>" + currentMetricInfo.textTwo : "") + (currentMetricInfo.textThree != null ? "<br/>" + currentMetricInfo.textThree : "") + (currentMetricInfo.textFour != null ? "<br/>" + currentMetricInfo.textFour : "") + (currentMetricInfo.textFive != null ? "<br/>" + currentMetricInfo.textFive : "") + (currentMetricInfo.textSix != null ? "<br/>" + currentMetricInfo.textSix : "") + (currentMetricInfo.textSeven != null ? "<br/>" + currentMetricInfo.textSeven : "") + (currentMetricInfo.textEight != null ? "<br/>" + currentMetricInfo.textEight : "") + (currentMetricInfo.textNine != null ? "<br/>" + currentMetricInfo.textNine : ""));
        });

    that.svg.call(that.tip);

    that.wrangleData(null);

    that.updateVis();
}

LineVis.prototype.wrangleData = function(_filterFunction){
    var that = this;

    that.displayStatsData = that.filterAndAggregate(_filterFunction);
}

LineVis.prototype.updateVis = function() {
    var that = this;

    var metricType;
    var selectorID;

    if(that.activeMetricType == "boroughButton")
    {
        metricType = "Boroughs";
        selectorID = "BoroCode";
    }
    else if(that.activeMetricType == "schoolDistrictButton")
    {
        metricType = "SchoolDistricts";
        selectorID = "SchoolDist";
    }
    else if(that.activeMetricType == "schoolButton")
    {
        metricType = "Schools";
        selectorID = "ATS_CODE";
    }

        // Extract the list of dimensions and create a scale for each.
        that.x.domain(that.dimensions = that.metricsData[that.activeMetricType].map(function(d){ return d.metric}).filter(function(d){
                return d=="EnrollmentDensitySM" || d=="ProgressReportOverallScore" || d=="BuildingCrimeMajorRate" || d=="GraduationOutcomeTotalGradPercentage" || d=="DistrictAttendance" || d=="ClassSizeGenEdAverage" || d=="MathMean" || d=="EnglishMean";
            })
        );

        that.dimensions.forEach(function(d, i)
        {
            var currentMetric = $.grep(that.metricsData[that.activeMetricType], function (e) {
                return e.metric == d;
            })[0];

            if (d == "QualityScore")
            {
                //"": No Data
                //U: Underdeveloped
                //D: Developing
                //P: Proficient
                //WD: Well Developed
                that.y[d] = d3.scale.ordinal()
                    .domain(["", "U", "D", "P", "WD"])
                    .rangePoints([that.height, 0]);
            }
            else if (d == "ProgressReportOverallGrade")
            {
                that.y[d] = d3.scale.ordinal()
                    .domain(["", "F", "D", "C", "B", "A"])
                    .rangePoints([that.height, 0]);
            }
            else if(d == "BuildingCrimeMajorRate" || that.activeMetricType == "schoolDistrictButton" || that.activeMetricType == "boroughButton")
            {
                //The min on BuildingCrimeMajorRate is already zero, and all boroughs and districts have data, therefore, no need for arbitrary minimum
                that.y[d] = d3.scale.linear()
                    .domain([
                        currentMetric.Min, currentMetric.Max
                    ])
                    .range([that.height, 0]);
            }
            else if (that.activeMetricType == "schoolButton")
            {
                that.y[d] = d3.scale.linear()
                    //Creates an arbitrary no data point 1 point below the actual minimum
                    .domain([
                        currentMetric.Min-1, currentMetric.Max
                    ])
                    .range([that.height, 0]);
            }

        });

        //START ADAPTATION FROM Jason Davies' Example: http://bl.ocks.org/jasondavies/1341281

        // Render the gray background lines
        that.background = that.svg.append("g")
            .attr("class", "background");

        // SELECT: Background lines
        var backgroundPaths = that.svg.selectAll(".background")
                .selectAll("path")
                .data(that.displayStatsData);

        // ENTER: Background lines
        backgroundPaths
                .enter().append("path");

        backgroundPaths
                .attr("class", function(d){
                if(that.activeMetricType == "boroughButton")
                {
                    return "B" + d.BoroCode;
                }
                else if(that.activeMetricType == "schoolDistrictButton")
                {
                    return "D" + d.SchoolDist;
                }
                else if(that.activeMetricType == "schoolButton") {
                    return "S" + d.ATS_CODE;
                }
                });

        // UPDATE: Background lines
        backgroundPaths
                .attr("d", path);

        // DELETE: Background lines
        backgroundPaths.exit().remove();

        // Render the blue foreground lines
        that.foreground = that.svg.append("g")
            .attr("class", "foreground");

        // SELECT: Foreground lines
        var foregroundPaths = that.svg.selectAll(".foreground")
            .selectAll("path")
            .data(that.displayStatsData);

        // ENTER: Foreground lines
        foregroundPaths
                .enter().append("path");

        foregroundPaths
                .attr("class", function(d){
                    if(that.activeMetricType == "boroughButton")
                    {
                        return "B" + d.BoroCode;
                    }
                    else if(that.activeMetricType == "schoolDistrictButton")
                    {
                        return "D" + d.SchoolDist;
                    }
                    else if(that.activeMetricType == "schoolButton") {
                        return "S" + d.ATS_CODE;
                    }
                })
            .on("mouseover", function(d){
                d3.select(this).moveToFront().style({"stroke": "black"}).attr("stroke-width", 3);
                if(that.activeMetricType == "boroughButton")
                {
                    d3.select("#hoverItem").html(d.BoroName);
                    $(that.eventHandler).trigger("hoverLine", {schoolPoint: "B" + d.BoroCode});
                }
                else if (that.activeMetricType == "schoolDistrictButton")
                {
                    d3.select("#hoverItem").html("District " + d.SchoolDist);
                    $(that.eventHandler).trigger("hoverLine", {schoolPoint: "D" + d.SchoolDist});
                }
                else if (that.activeMetricType == "schoolButton") {
                    d3.select("#hoverItem").html(d.SCHOOLNAME);
                    $(that.eventHandler).trigger("hoverLine", {schoolPoint: "S" + d.ATS_CODE});
                }

                if(that.svg.selectAll(".foreground").selectAll(".active")[0].length >= 6 && d3.select(this).classed("active") == false) {
                    d3.select(this).style("cursor", "not-allowed");
                }
            })
            .on("mouseout", function(d){
                if(d3.select(this).classed("active") == false) {
                    d3.select(this).style({"stroke": "steelblue"}).attr("stroke-width", 1);
                }
                d3.select("#hoverItem").html("None");

                d3.select(this).style("cursor", "pointer");

                if(that.activeMetricType == "boroughButton")
                {
                    $(that.eventHandler).trigger("hoverLineOut", {schoolPoint: "B" + d.BoroCode});
                }
                else if(that.activeMetricType == "schoolDistrictButton")
                {
                    $(that.eventHandler).trigger("hoverLineOut", {schoolPoint: "D" + d.SchoolDist});
                }
                else if (that.activeMetricType == "schoolButton")
                {
                    $(that.eventHandler).trigger("hoverLineOut", {schoolPoint: "S" + d.ATS_CODE});
                }
            })
            .on("click", function(d){
                if(that.svg.selectAll(".foreground").selectAll(".active")[0].length < 6 || (that.svg.selectAll(".foreground").selectAll(".active")[0].length >= 6 && d3.select(this).classed("active") == true)) {
                    if (that.activeMetricType == "boroughButton") {
                        that.clicked("B" + d.BoroCode, "line");
                    }
                    else if (that.activeMetricType == "schoolDistrictButton") {
                        that.clicked("D" + d.SchoolDist, "line");
                    }
                    else if (that.activeMetricType == "schoolButton") {
                        that.clicked("S" + d.ATS_CODE, "line");
                    }
                }
            });

        // UPDATE: Foreground lines
        foregroundPaths
            .attr("d", path);

        // DELETE: Foreground lines
        foregroundPaths.exit().remove();

        // Each y-axis gets a group and drag behavior
        // START CITATION - Below grouping and dragging behavior code is from the Jason Davies example: http://bl.ocks.org/jasondavies/1341281
        var g = that.svg.selectAll(".dimension")
            .data(that.dimensions).moveToFront();

            g
            .enter().append("g")
            .attr("class", "dimension");

            g
            .attr("transform", function(d) { return "translate(" + that.x(d) + ")"; })
            .call(d3.behavior.drag()
                .origin(function(d) { return {x: that.x(d)}; })
                .on("dragstart", function(d) {
                    that.dragging[d] = that.x(d);
                    backgroundPaths.attr("visibility", "hidden");
                })
                .on("drag", function(d) {
                    that.dragging[d] = Math.min(that.width, Math.max(0, d3.event.x));
                    foregroundPaths.attr("d", path);
                    that.dimensions.sort(function(a, b) { return position(a) - position(b); });
                    that.x.domain(that.dimensions);
                    g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
                })
                .on("dragend", function(d) {
                    delete that.dragging[d];
                    transition(d3.select(this)).attr("transform", "translate(" + that.x(d) + ")");
                    transition(foregroundPaths).attr("d", path);
                    backgroundPaths
                        .attr("d", path)
                        .transition()
                        .delay(500)
                        .duration(0)
                        .attr("visibility", null);
                }));
        // END CITATION

        that.svg.selectAll(".axis").remove();

        // Render the y-axes
        g.append("g")
            .attr("class", "axis")
            .each(function(d) {

                var currentMetric = $.grep(that.metricsData[that.activeMetricType], function (e) {
                    return e.metric == d;
                })[0];

                d3.select(this).call(that.axis.scale(that.y[d]).tickFormat(function(a){

                if(that.activeMetricType == "schoolButton" && a == that.y[d].domain()[0])
                {
                    return "None";
                }
                else if(currentMetric.formatType == "integer")
                {
                    var integerFormat = d3.format("d");
                    return integerFormat(parseInt(a));
                }
                else if(currentMetric.formatType == "percentage")
                {
                    var decimalFormat = d3.format("." + currentMetric.formatPrecision + "f");
                    return decimalFormat(a) + "%";
                }
                else if(currentMetric.formatType == "decimal")
                {
                    var decimalFormat = d3.format("." + currentMetric.formatPrecision + "f");
                    return decimalFormat(a);
                }
            }).tickValues([that.y[d].domain()[0], (that.y[d].domain()[0] + (that.y[d].domain()[1] + that.y[d].domain()[0])/ 2) / 2, (that.y[d].domain()[1] + that.y[d].domain()[0])/ 2, (that.y[d].domain()[1] + (that.y[d].domain()[1] + that.y[d].domain()[0])/ 2) / 2, that.y[d].domain()[1]])); })
            .append("text")
            .classed("axisText", true)
            .style("text-anchor", "middle")
            .attr("y", 55)
            .text(function(d) {
                var currentMetric = $.grep(that.metricsData[that.activeMetricType], function (e) {
                    return e.metric == d;
                })[0];
                return currentMetric.delimLabel;
            })
            .on("mouseover", that.tip.show)
            .on("mouseout", that.tip.hide);

    g.selectAll(".axisText").call(wrap, 20);

    that.svg.selectAll(".brush").remove();

        // Render brush for each y-axis
        // START CITATION - Below brush code is from the Jason Davies example: http://bl.ocks.org/jasondavies/1341281
        g.append("g")
            .attr("class", "brush")
            .each(function(d) {
                d3.select(this).call(that.y[d].brush = d3.svg.brush().y(that.y[d]).on("brushstart", brushstart).on("brush", brush));
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);
        // END CITATION

    g.exit().remove();

        // START CITATION - All of the below function code is from the Jason Davies example: http://bl.ocks.org/jasondavies/1341281
        // Minimal changes have been made to support some additional functionality that was desired (making no data points show up at the minimum point on the y scale)
        function position(d) {
            var v = that.dragging[d];
            return v == null ? that.x(d) : v;
        }

        function transition(g) {
            return g.transition().duration(500);
        }

        // Returns the line for a given data point.
        function path(d) {
            return that.line(that.dimensions.map(function (p) {
                //If no data, make the data point show up at the arbitrary no data point, the minimum on the y scale
                if(d[p] == "" || d[p] == null || d[p] == 0) {
                    return [position(p), that.y[p](that.y[p].domain()[0])];
                }
                else
                {
                    return [position(p), that.y[p](d[p])];
                }
            }));
        }

        function brushstart() {
            d3.event.sourceEvent.stopPropagation();
        }
        // END CITATION

    // START CITATION - The below function code started from the Jason Davies example: http://bl.ocks.org/jasondavies/1341281
    // Major changes have been made to handle ordinal scales, change display behavior, and fire the selectionChanged events

    //Displays foreground lines on brush and fires the selectionChanged event
    function brush() {
        var actives = that.dimensions.filter(function(p) { return !that.y[p].brush.empty(); }),
            extents = actives.map(function(p) {
                if (p == "QualityScore" || p == "ProgressReportOverallGrade")
                {
                    return that.y[p].domain().filter(function(d){return (that.y[p].brush.extent()[0] <= that.y[p](d)) && (that.y[p](d) <= that.y[p].brush.extent()[1])});
                }
                else
                {
                    return that.y[p].brush.extent();
                }
            });
        foregroundPaths.style("display", function(d) {
            return actives.every(function(p, i) {

                if (p == "QualityScore" || p == "ProgressReportOverallGrade")
                {
                    if(extents[i].indexOf(d.properties[p]) > -1)
                    {
                        return true;
                    }
                    else
                    {
                        return false;
                    }

                }
                else {
                    return extents[i][0] <= d[p] && d[p] <= extents[i][1];
                }
            }) ? null : "none";
        });

        var brushSchoolList = [];

        for(var z = 0; z<foregroundPaths[0].length; z++)
        {
            if(foregroundPaths[0][z].style.display != "none")
            {
                brushSchoolList.push(foregroundPaths[0][z].classList[0]);
            }
        }

        that.svg.selectAll(".active").classed("active", false).style({"stroke": "steelblue"}).attr("stroke-width", 1);

        $(that.eventHandler).trigger("selectionChanged", {schools: brushSchoolList});
    }
    // END CITATION

    //START CITATION: The code to wrap axis label text is from Mike Bostock's example: http://bl.ocks.org/mbostock/7555321
    function wrap(text, width) {
        text.each(function () {
            var text = d3.select(this),
                words = text.text().split("/").reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.1, // ems
                y = text.attr("y"),
                dy = parseFloat(14),
                tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }
    //END CITATION
}

LineVis.prototype.filterAndAggregate = function(_filter) {

    var that = this;


        var boroughFilterList = [];
        var schoolDistrictFilterList = [];
        var schoolTypesFilterList = [];
        var programTypesFilterList = [];

        if (_filter != null) {
            if (_filter.boroughs.length > 0) {
                for (var i = 0; i < _filter.boroughs.length; i++) {
                    boroughFilterList.push(parseInt(_filter.boroughs[i].value));
                }
            }
            if (_filter.districts.length > 0) {
                for (var i = 0; i < _filter.districts.length; i++) {
                    schoolDistrictFilterList.push(parseInt(_filter.districts[i].value));
                }
            }
            if (_filter.schoolTypes.length > 0) {
                for (var i = 0; i < _filter.schoolTypes.length; i++) {
                    schoolTypesFilterList.push(_filter.schoolTypes[i].value);
                }
            }
            if (_filter.programTypes.length > 0){
                for (var i = 0; i < _filter.programTypes.length; i++) {
                    programTypesFilterList.push(_filter.programTypes[i].value);
                }
            }
        }

        if(that.activeMetricType == "boroughButton")
        {
            metricType = "Boroughs";
            selectorID = "BoroCode";
        }
        else if(that.activeMetricType == "schoolDistrictButton")
        {
            metricType = "SchoolDistricts";
            selectorID = "SchoolDist";
        }
        else if(that.activeMetricType == "schoolButton")
        {
            metricType = "Schools";
            selectorID = "ATS_CODE";
        }

        if(that.activeMetricType == "boroughButton" || that.activeMetricType == "schoolDistrictButton") {
            that.displayStatsData = $.map(that.statsData[metricType], function (e1) {
                return e1;
            });
        }
        else if(that.activeMetricType == "schoolButton")
        {
            that.displayStatsData = $.map(that.statsData[metricType], function (e1) {
                return e1;
            }).filter(function(d){
                if((boroughFilterList.length ==0 || boroughFilterList.indexOf(parseInt(d.BoroughID)) > -1) && (schoolDistrictFilterList.length ==0 || schoolDistrictFilterList.indexOf(parseInt(d.GEO_DISTRI)) > -1) && (schoolTypesFilterList.length ==0 || schoolTypesFilterList.indexOf(d.SCH_TYPE) > -1) && (programTypesFilterList.length == 0 || $(programTypesFilterList).filter(d.Programs).length > 0)) {
                    return true;
                }
                else{
                    return false;
                }
            })
        }

    return that.displayStatsData;
}

LineVis.prototype.onFilterChange = function(filters) {
    var that = this;

    this.wrangleData(filters);
    this.updateVis();
}

LineVis.prototype.onButtonChange = function(params) {
    var that = this;

    that.svg.selectAll(".active").classed("active", false).style({"stroke": "steelblue"}).attr("stroke-width", 1);
    that.activeMetricType = params.metricType;

    that.wrangleData();
    that.updateVis();
}

LineVis.prototype.clicked = function(location, fire)
{
    var that = this;

    that.svg.selectAll(".foreground").select("." + location).moveToFront();

    if(that.activeMetricType == "boroughButton")
    {
        if (that.svg.selectAll(".foreground").select("." + location).classed("active") == false) {
            that.svg.selectAll(".foreground").select("." + location).classed("active", true);
            that.svg.selectAll(".foreground").select("." + location).style({"stroke": "black"}).attr("stroke-width", 3);
            if (fire == "line")
            {
                $(that.eventHandler).trigger("clickedItem", {
                    method: "borough",
                    schoolPoint: location,
                    "action": true
                });
            }
        }
        else if (that.svg.selectAll(".foreground").select("." + location).classed("active") == true){
            that.svg.selectAll(".foreground").select("." + location).classed("active", false);
            that.svg.selectAll(".foreground").select("." + location).style({"stroke": "steelblue"}).attr("stroke-width", 1);
            if (fire == "line") {
                $(that.eventHandler).trigger("clickedItem", {
                    method: "borough",
                    schoolPoint: location,
                    "action": false
                });
            }
        }
    }
    else if (that.activeMetricType == "schoolDistrictButton")
    {
        if (that.svg.selectAll(".foreground").select("." + location).classed("active") == false) {
            that.svg.selectAll(".foreground").select("." + location).style({"stroke": "black"}).attr("stroke-width", 3);
            that.svg.selectAll(".foreground").select("." + location).classed("active", true);
            if (fire == "line") {
                $(that.eventHandler).trigger("clickedItem", {
                    method: "district",
                    schoolPoint: location,
                    "action": true
                });
            }
        }
        else if (that.svg.selectAll(".foreground").select("." + location).classed("active") == true){
            that.svg.selectAll(".foreground").select("." + location).classed("active", false);
            that.svg.selectAll(".foreground").select("." + location).style({"stroke": "steelblue"}).attr("stroke-width", 1);
            if (fire == "line") {
                $(that.eventHandler).trigger("clickedItem", {
                    method: "district",
                    schoolPoint: location,
                    "action": false
                });
            }
        }
    }
    else if (that.activeMetricType == "schoolButton") {
        if (that.svg.selectAll(".foreground").select("." + location).classed("active") == false) {
            that.svg.selectAll(".foreground").select("." + location).style({"stroke": "black"}).attr("stroke-width", 3);
            that.svg.selectAll(".foreground").select("." + location).classed("active", true);
            if (fire == "line") {
                $(that.eventHandler).trigger("clickedItem", {
                    method: "district",
                    schoolPoint: location,
                    "action": true
                });
            }
        }
        else if (that.svg.selectAll(".foreground").select("." + location).classed("active") == true){
            that.svg.selectAll(".foreground").select("." + location).classed("active", false);
            that.svg.selectAll(".foreground").select("." + location).style({"stroke": "steelblue"}).attr("stroke-width", 1);
            if (fire == "line") {
                $(that.eventHandler).trigger("clickedItem", {
                    method: "district",
                    schoolPoint: location,
                    "action": false
                });
            }
        }
    }
}

LineVis.prototype.hover = function(location){
    var that = this;

    if(!that.svg.selectAll(".foreground").selectAll("." + location).empty() && that.svg.selectAll(".foreground").selectAll("." + location).classed("active") == false) {
        that.svg.selectAll(".foreground").selectAll("." + location).moveToFront().style({"stroke": "black"}).attr("stroke-width", 3);
    }

}

LineVis.prototype.hoverOut = function(location){
    var that = this;

    if(!that.svg.selectAll(".foreground").selectAll("." + location).empty() && that.svg.selectAll(".foreground").selectAll("." + location).classed("active") == false) {
        that.svg.selectAll(".foreground").selectAll("." + location).style({"stroke": "steelblue"}).attr("stroke-width", 1);
    }
}

d3.selection.prototype.moveToFront = function () {
    return this.each(function () {
        this.parentNode.appendChild(this);
    });
};