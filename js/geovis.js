GeoVis = function(_parentElement, _geoData, _metricsData, _eventHandler){
    this.parentElement = _parentElement;
    this.geoData = _geoData;
    this.eventHandler = _eventHandler;
    this.displayData = jQuery.extend(true, {}, _geoData);
    this.metricsData = _metricsData;
    //Sets the default metric and metricType to render
    this.activeFilters = {"metrics": [{"value": "Location"}], "metricType": "schoolButton"};
    this.selections = [];
    this.schoolList = [];

    this.margin = {top: 25, right: 45, bottom: 0, left: 45};
    this.width = 720 - this.margin.left - this.margin.right;
    this.height = 770 - this.margin.top - this.margin.bottom;


    this.initVis();
}

GeoVis.prototype.initVis = function(){
    var that = this;

    //console.log(that.metricsData);

    that.svg = that.parentElement.append("svg")
        .attr("width", that.width + that.margin.left + that.margin.right)
        .attr("height", that.height + that.margin.top + that.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")");

    //The albers projection is good for the northeast region
    //The scale was set to sufficiently zoom in on New York City
    //The center and rotate were set to the coordinates for New York City
    that.projection = d3.geo.albers()
        .scale(90000)
        .center([0, 40.7])
        .rotate([74.0, 0])
        .translate([that.width/2, that.height/2]);

    that.path = d3.geo.path()
        .projection(that.projection);

    //The group for the legend/key
    that.legend = that.svg.append("g")
        .attr("class", "key")
        .attr("transform", "translate(0,0)");

    that.legendThresholdScale = d3.scale.threshold();

    //that.legendXScale = d3.scale.ordinal();
    that.legendXScale = d3.scale.linear();

    that.legendXAxis = d3.svg.axis()
        .scale(that.legendXScale)
        .orient("bottom")
        .tickSize(13);

    that.legend.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0,0)");

    that.legend.append("text")
        .attr("class", "caption")
        .attr("font-weight", "bold")
        .attr("y", -6);

    that.tip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-6, 0])
        .html(function(d){
            var currentMetricInfo = $.grep(that.metricsData[that.activeFilters.metricType], function(e){
                return e.metric == that.activeFilters.metrics[0].value;
            })[0];

            if (that.activeFilters.metricType == "boroughButton")
            {
                return d.properties.BoroName + "<br/>" + currentMetricInfo.label + ": " + d.properties[that.activeFilters.metrics[0].value];
            }
            else if (that.activeFilters.metricType == "schoolDistrictButton")
            {
                return "District " + d.properties.SchoolDist + "<br/>" + currentMetricInfo.label + ": " + d.properties[that.activeFilters.metrics[0].value];
            }
            else if(that.activeFilters.metricType == "schoolButton") {
                if (that.activeFilters.metrics[0].value == "Location")
                {
                    return d.properties.SCHOOLNAME + "<br/>" + d.properties.SCH_TYPE;
                }
                else {
                    return d.properties.SCHOOLNAME + "<br/>" + d.properties.SCH_TYPE + "<br/>" + currentMetricInfo.label + ": " + d.properties[that.activeFilters.metrics[0].value];
                }
            }
        });

    that.svg.call(that.tip);

    //Create the explanation text

    that.metricRectBox = that.svg.append("rect")
        .attr("fill", "#F0F0F0")
        .attr("transform", "translate(-10,40)")
        //.attr("transform", "translate(310,645)")
        .attr("width", 350);
        //.attr("height", 90);

    that.metricTextOne = that.svg.append("text")
        .attr("fill", "black")
        .attr("class", "metricText")
        .attr("text-anchor", "start")
        .attr("transform", "translate(0,60)");
        //.attr("transform", "translate(320,665)");

    that.metricTextTwo = that.svg.append("text")
        .attr("fill", "black")
        .attr("class", "metricText")
        .attr("text-anchor", "start")
        .attr("transform", "translate(0,75)");
        //.attr("transform", "translate(320,685)")

    that.metricTextThree = that.svg.append("text")
        .attr("fill", "black")
        .attr("class", "metricText")
        .attr("text-anchor", "start")
        .attr("transform", "translate(0,90)");
        //.attr("transform", "translate(320,705)")

    that.metricTextFour = that.svg.append("text")
        .attr("fill", "black")
        .attr("class", "metricText")
        .attr("text-anchor", "start")
        .attr("transform", "translate(0,105)");
        //.attr("transform", "translate(320,725)")

    that.metricTextFive = that.svg.append("text")
        .attr("fill", "black")
        .attr("class", "metricText")
        .attr("text-anchor", "start")
        .attr("transform", "translate(0,120)");

    that.metricTextSix = that.svg.append("text")
        .attr("fill", "black")
        .attr("class", "metricText")
        .attr("text-anchor", "start")
        .attr("transform", "translate(0,135)");

    that.metricTextSeven = that.svg.append("text")
        .attr("fill", "black")
        .attr("class", "metricText")
        .attr("text-anchor", "start")
        .attr("transform", "translate(0,150)");

    that.metricTextEight = that.svg.append("text")
        .attr("fill", "black")
        .attr("class", "metricText")
        .attr("text-anchor", "start")
        .attr("transform", "translate(0,165)");

    that.metricTextNine = that.svg.append("text")
        .attr("fill", "black")
        .attr("class", "metricText")
        .attr("text-anchor", "start")
        .attr("transform", "translate(0,180)");

    that.wrangleData(null);

    that.updateVis(this.activeFilters.metrics[0].value);
}

GeoVis.prototype.wrangleData = function(_filterFunction){
    var that = this;

    that.displayData = that.filterAndAggregate(_filterFunction);
}

GeoVis.prototype.updateVis = function(currentMetric){
    var that = this;

    //Get all the details for the current selected metric
    var currentMetricInfo = $.grep(that.metricsData[that.activeFilters.metricType], function(e){
        return e.metric == currentMetric;
    })[0];

    //Load the explanation text
    that.metricRectBox.attr("height", (currentMetricInfo.textCount * 15) + 15);
    that.metricTextOne.text(currentMetricInfo.textOne);
    that.metricTextTwo.text(currentMetricInfo.textTwo);
    that.metricTextThree.text(currentMetricInfo.textThree);
    that.metricTextFour.text(currentMetricInfo.textFour);
    that.metricTextFive.text(currentMetricInfo.textFive);
    that.metricTextSix.text(currentMetricInfo.textSix);
    that.metricTextSeven.text(currentMetricInfo.textSeven);
    that.metricTextEight.text(currentMetricInfo.textEight);
    that.metricTextNine.text(currentMetricInfo.textNine);

    //Toggle showing and hiding the school districts layer
    var showBoroughs = [];

    if(that.activeFilters.metricType == "boroughButton")
    {
        showBoroughs = topojson.feature(that.displayData, that.displayData.objects.nybb).features;
    }

    //Draw the boroughs
    //SELECT - Boroughs
    var boroughFills = that.svg.selectAll(".borough")
        .data(showBoroughs);

    //ENTER - Boroughs
    boroughFills
        .enter().append("path")
        .attr("class", function(d){
            return "borough B" + d.properties.BoroCode;
        });

    //UPDATE - Boroughs
    boroughFills
        .attr("d", that.path)
        .attr("stroke-width", "1px")
        .attr("fill", function(d){
            if(that.schoolList.schools != null && that.schoolList.schools.length > 0 && that.schoolList.schools.indexOf("B" + d.properties.BoroCode)<0) {
                return "white";
            }
            else {
                return colorPicker(d);
            }
        })
        .on("click", function(d){
            if(that.activeFilters.metricType == "boroughButton") {
                //console.log("B" + d.properties.BoroCode);
                that.clicked("B" + d.properties.BoroCode);
                $(that.eventHandler).trigger("clickedGeo", {
                    method: "school",
                    schoolPoint: "B" + d.properties.BoroCode,
                    "action": false
                });
            }
        })
        .on("mouseover", function(d){
            if(that.activeFilters.metricType == "boroughButton") {
                if(d3.select(this).classed("active") == false) {
                    d3.select(this).style("stroke", "black");
                    d3.select(this).style("stroke-width", "5px");
                }
                that.tip.show(d);

                $(that.eventHandler).trigger("hoverMap", {schoolPoint: "B" + d.properties.BoroCode});
            }
            //d3.select(this).attr("r", "10px");
        })
        .on("mouseout", function(d){
            if(that.activeFilters.metricType == "boroughButton") {
                if(d3.select(this).classed("active") == false) {
                    d3.select(this).style("stroke", "black");
                    d3.select(this).style("stroke-width", "1px");
                }
                that.tip.hide(d);

                $(that.eventHandler).trigger("hoverMapOut", {schoolPoint: "B" + d.properties.BoroCode});
            }
        });

    //DELETE - Boroughs
    boroughFills.exit().remove();

    var boroughLabels = that.svg.selectAll(".borough-label")
        .data(topojson.feature(that.displayData, that.displayData.objects.nybb).features);

    boroughLabels.enter().append("text")
        .attr("class", "borough-label");

    boroughLabels
        .attr("transform", function(d){
            return "translate(" + that.path.centroid(d) + ")";
        })
        .attr("dy", function(d){
            if(d.properties.BoroCode == 1)
            {
                return -20;
            }
            else if(d.properties.BoroCode == 2)
            {
                return 50;
            }
            else if(d.properties.BoroCode == 3)
            {
                return 140;
            }
            else if(d.properties.BoroCode == 4)
            {
                return 140;
            }
            else if(d.properties.BoroCode == 5)
            {
                return 100;
            }
        })
        .attr("dx", function(d){
            if(d.properties.BoroCode == 1)
            {
                return -80;
            }
            else if(d.properties.BoroCode == 2)
            {
                return 110;
            }
            else if(d.properties.BoroCode == 3)
            {
                return -40;
            }
            else if(d.properties.BoroCode == 4)
            {
                return 110;
            }
            else if(d.properties.BoroCode == 5)
            {
                return 60;
            }
        })
        .text(function(d){
            return d.properties.BoroName;
        });

    boroughLabels.exit().remove();

    //Toggle showing and hiding the school districts layer
    var showDistricts = [];

    if(that.activeFilters.metricType == "schoolDistrictButton" || that.activeFilters.metricType == "schoolButton")
    {
        showDistricts = topojson.feature(that.displayData, that.displayData.objects.nysd).features;
    }

    //Draw the school districts
    //SELECT - School Districts
    var schoolDistrictFills = that.svg.selectAll(".schoolDistrict")
        .data(showDistricts);

    //ENTER - School Districts
    schoolDistrictFills
        .enter().append("path")
        .attr("class", function(d){
            return "schoolDistrict D" + d.properties.SchoolDist;
        });

    //UPDATE - School Districts
    schoolDistrictFills
        .attr("d", that.path)
        .attr("class", function(d){
            return "schoolDistrict D" + d.properties.SchoolDist;
        })
        .attr("fill", function(d){
            if(that.activeFilters.metricType =="schoolDistrictButton") {
                if(that.schoolList.schools != null && that.schoolList.schools.length > 0 && that.schoolList.schools.indexOf("D" + d.properties.SchoolDist)<0) {
                    return "white";
                }
                else {
                    return colorPicker(d);
                }
            }
            else
            {
                return "white";
            }
        })
        .attr("stroke-width", "1px")
        .on("click", function(d){
            if(that.activeFilters.metricType == "schoolDistrictButton") {
                if(that.selections.length < 6 || (that.selections.length >= 6 && d3.select(this).classed("active") == true)) {
                    that.clicked("D" + d.properties.SchoolDist);
                    $(that.eventHandler).trigger("clickedGeo", {
                        method: "district",
                        schoolPoint: "D" + d.properties.SchoolDist,
                        "action": false
                    });
                }
            }
        })
        .on("mouseover", function(d){
            if(that.activeFilters.metricType == "schoolDistrictButton") {
                if(d3.select(this).classed("active") == false)
                {
                    d3.select(this).style("stroke", "black");
                    d3.select(this).style("stroke-width", "5px");
                }
                that.tip.show(d);

                if(that.selections.length >= 6 && d3.select(this).classed("active") == false) {
                    d3.select(this).style("cursor", "not-allowed");
                }

                $(that.eventHandler).trigger("hoverMap", {schoolPoint: "D" + d.properties.SchoolDist});
            }
        })
        .on("mouseout", function(d){
            if(that.activeFilters.metricType == "schoolDistrictButton") {
                if(d3.select(this).classed("active") == false)
                {
                    d3.select(this).style("stroke", "black");
                    d3.select(this).style("stroke-width", "1px");
                }
                that.tip.hide(d);

                d3.select(this).style("cursor", "auto");

                $(that.eventHandler).trigger("hoverMapOut", {schoolPoint: "D" + d.properties.SchoolDist});
            }
        });

    //DELETE - School Districts
    schoolDistrictFills.exit().remove();

    //Toggle showing and hiding the schools layer
    var showSchools = [];

    if(that.activeFilters.metricType == "schoolButton")
    {
        showSchools = topojson.feature(that.displayData, that.displayData.objects.nysp).features;
    }

    //Draw the school points
    //SELECT - School Points
    var schoolPoints = that.svg.selectAll(".schoolPoint")
        .data(showSchools);

    //ENTER - School Points
    schoolPoints
        .enter().append("circle")
        .attr("class", function(d){
            return "schoolPoint S" + d.properties.ATS_CODE;
        });

    //UPDATE - School Points
    schoolPoints
        .attr("class", function(d){
            return "schoolPoint S" + d.properties.ATS_CODE;
        })
        .attr("cx", function (d){
            return that.projection(d.geometry.coordinates)[0];
        })
        .attr("cy", function (d){
            return that.projection(d.geometry.coordinates)[1];
        })
        .attr("r", "3px")
        .attr("stroke", "none")
        .attr("fill", function(d){

            if(currentMetric == "Location")
            {
                return "steelblue";
            }
            else {
                var result = colorPicker(d);
                if (result == "white") {
                    return "none";
                }
                else {
                    return result;
                }
            }
        })
        .on("click", function(d){
            if(that.selections.length < 6 || (that.selections.length >= 6 && d3.select(this).classed("active") == true)) {
                that.clicked("S" + d.properties.ATS_CODE);
                $(that.eventHandler).trigger("clickedGeo", {
                    method: "school",
                    schoolPoint: "S" + d.properties.ATS_CODE,
                    "action": false
                });
            }
        })
        .on("mouseover", function(d){
            d3.select(this).attr("r", "10px");
            d3.select(this).style({"stroke": "black", "stroke-width": "2"});

            that.tip.show(d);

            if(that.selections.length >= 6 && d3.select(this).classed("active") == false) {
                d3.select(this).style("cursor", "not-allowed");
            }
            else{
                d3.select(this).style("cursor", "pointer");
            }

            $(that.eventHandler).trigger("hoverMap", {schoolPoint: "S" + d.properties.ATS_CODE});
        })
        .on("mouseout", function(d){
            if(d3.select(this).classed("active") == false) {
                d3.select(this).attr("r", "3px");
                d3.select(this).style({"stroke": "none", "stroke-width": "0"});
            }

            that.tip.hide(d);

            d3.select(this).style("cursor", "auto");

            $(that.eventHandler).trigger("hoverMapOut", {schoolPoint: "S" + d.properties.ATS_CODE});
        });

    //Delete - School Points
    schoolPoints.exit().remove();

    function getRange() {
        if(currentMetricInfo.colorSpread == "divergent")
        {
            if(currentMetricInfo.colorPath == "ascending") {
                return ["none", "#d7191c", "#fdae61", "#abd9e9", "#4575b4"];
            }
            else if(currentMetricInfo.colorPath == "descending")
            {
                return ["none", "#4575b4", "#abd9e9", "#fdae61", "#d7191c"];
            }
        }
        else if(currentMetricInfo.colorSpread == "sequential")
        {
            if(currentMetricInfo.colorBase == "blue")
            {
                return ["none", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4"]
            }
            else if(currentMetricInfo.colorBase == "red")
            {
                return ["none", "#fee090", "#fdae61", "#f46d43", "#d73027"];
            }
        }
    }

    var showLegend = []

    if (currentMetricInfo.metric != "Location")
    {
        that.legendXScale
            .domain([0, currentMetricInfo.Min, currentMetricInfo.TwentyFive, currentMetricInfo.Fifty, currentMetricInfo.SeventyFive])
            .range([0, 120, 240, 360, 480]);

        that.legendColorScale = d3.scale.ordinal()
            .domain([0, currentMetricInfo.Min, currentMetricInfo.TwentyFive, currentMetricInfo.Fifty, currentMetricInfo.SeventyFive])
            .range(getRange());

        that.legendXAxis
            .tickValues([0, currentMetricInfo.Min, currentMetricInfo.TwentyFive, currentMetricInfo.Fifty, currentMetricInfo.SeventyFive])
            .tickFormat(function(d){
                if(d == 0)
                {
                    return "None";
                }
                else
                {
                    if(currentMetricInfo.formatType == "integer")
                    {
                        return d;
                    }
                    else if(currentMetricInfo.formatType == "percentage")
                    {
                        var decimalFormat = d3.format("." + currentMetricInfo.formatPrecision + "f");
                        return decimalFormat(d) + "%";
                    }
                    else if(currentMetricInfo.formatType == "decimal")
                    {
                        var decimalFormat = d3.format("." + currentMetricInfo.formatPrecision + "f");
                        return decimalFormat(d);
                    }
                }
            });

        showLegend = that.legendXScale.domain();
        that.svg.selectAll(".axis").style("display", null);
    }
    else
    {
        that.svg.selectAll(".axis").style("display", "none");
    }

        //SELECT - Legend
        var legendRects = that.svg.selectAll(".key").selectAll("rect")
            .data(showLegend);

        //ENTER - Legend
        legendRects
            .enter().append("rect");

        //UPDATE - Legend
        legendRects
            .attr("x", 0)
            .transition().duration(1000)
            .attr("height", 8)
            .attr("x", function (d) {
                return that.legendXScale(d);
            })
            .attr("width", 120)
            .attr("fill", function (d) {
                return that.legendColorScale(d);
            });

        //DELETE - Legend
        legendRects.exit().remove();

            that.svg.selectAll(".axis").transition().duration(1000)
                .call(that.legendXAxis)
                .selectAll("text")
                .style("text-anchor", "start")
                .attr("x", 2);

            that.svg.selectAll(".caption")
                .text(currentMetricInfo.legendCaption)
                .attr("x", 0);


    //Pick the right color for the metric display
    function colorPicker(d){

        if (d.properties[currentMetric] == "" || d.properties[currentMetric] == null) {
            return "white";
        }
        else if (parseFloat(d.properties[currentMetric]) > parseFloat(currentMetricInfo.SeventyFive)) {
            if(currentMetricInfo.colorSpread == "divergent") {
                if(currentMetricInfo.colorPath == "ascending") {
                    return "#4575b4";
                }
                else if(currentMetricInfo.colorPath == "descending")
                {
                    return "#d7191c";
                }
            }
            else if (currentMetricInfo.colorSpread == "sequential")
            {
                if(currentMetricInfo.colorBase == "blue")
                {
                    return "#4575b4";
                }
                else if(currentMetricInfo.colorBase == "red")
                {
                    return "#d73027";
                }
            }
        }
        else if (parseFloat(d.properties[currentMetric]) > parseFloat(currentMetricInfo.Fifty)) {
            if(currentMetricInfo.colorSpread == "divergent") {
                if(currentMetricInfo.colorPath == "ascending") {
                    return "#abd9e9";
                }
                else if(currentMetricInfo.colorPath == "descending")
                {
                    return "#fdae61";
                }
            }
            else if (currentMetricInfo.colorSpread == "sequential")
            {
                if(currentMetricInfo.colorBase == "blue")
                {
                    return "#74add1";
                }
                else if(currentMetricInfo.colorBase == "red")
                {
                    return "#f46d43";
                }
            }
        }
        else if (parseFloat(d.properties[currentMetric]) > parseFloat(currentMetricInfo.TwentyFive)) {
            if(currentMetricInfo.colorSpread == "divergent") {
                if(currentMetricInfo.colorPath == "ascending") {
                    return "#fdae61";
                }
                else if(currentMetricInfo.colorPath == "descending")
                {
                    return "#abd9e9";
                }
            }
            else if (currentMetricInfo.colorSpread == "sequential")
            {
                if(currentMetricInfo.colorBase == "blue")
                {
                    return "#abd9e9";
                }
                else if(currentMetricInfo.colorBase == "red")
                {
                    return "#fdae61";
                }
            }
        }
        else if (parseFloat(d.properties[currentMetric]) >= 0) {
            if(currentMetricInfo.colorSpread == "divergent") {
                if(currentMetricInfo.colorPath == "ascending") {
                    return "#d7191c";
                }
                else if(currentMetricInfo.colorPath == "descending")
                {
                    return "#2c7bb6";
                }
            }
            else if (currentMetricInfo.colorSpread == "sequential")
            {
                if(currentMetricInfo.colorBase == "blue")
                {
                    return "#e0f3f8";
                }
                else if(currentMetricInfo.colorBase == "red")
                {
                    return "#fee090";
                }
            }
        }
    }
}

GeoVis.prototype.clicked = function(location){
    var that = this;

    var action = false;

    if (that.activeFilters.metricType == "boroughButton")
    {
        if (that.svg.selectAll("." + location).classed("active") == false) {
            that.svg.selectAll("." + location).style("stroke", "black");
            that.svg.selectAll("." + location).style("stroke-width", "5px");
            that.svg.selectAll("." + location).classed("active", true);
            that.selections.push(location);
            action = true;
        }
        else if (that.svg.selectAll("." + location).classed("active") == true) {
            that.svg.selectAll("." + location).style("stroke", "black");
            that.svg.selectAll("." + location).style("stroke-width", "1px");
            that.svg.selectAll("." + location).classed("active", false);
            that.selections.splice(that.selections.indexOf(location), 1);
            action = false;
        }

            $(that.eventHandler).trigger("clicked", {method: "borough", schoolPoint: location, "action": action});

    }
    else if(that.activeFilters.metricType == "schoolDistrictButton")
    {
        if (that.svg.selectAll("." + location).classed("active") == false) {
            that.svg.selectAll("." + location).style("stroke", "black");
            that.svg.selectAll("." + location).style("stroke-width", "5px");
            that.svg.selectAll("." + location).classed("active", true);
            that.selections.push(location);
            action = true;
        }
        else if (that.svg.selectAll("." + location).classed("active") == true) {
            that.svg.selectAll("." + location).style("stroke", "black");
            that.svg.selectAll("." + location).style("stroke-width", "1px");
            that.svg.selectAll("." + location).classed("active", false);
            that.selections.splice(that.selections.indexOf(location), 1);
            action = false;
        }

            $(that.eventHandler).trigger("clicked", {method: "district", schoolPoint: location, "action": action});
    }
    else if(that.activeFilters.metricType == "schoolButton") {
        if (that.svg.selectAll("." + location).classed("active") == false) {
            that.svg.selectAll("." + location).attr("r", "10px");
            that.svg.selectAll("." + location).style({"stroke": "black", "stroke-width": "2"});
            that.svg.selectAll("." + location).classed("active", true);
            that.selections.push(location);
            action = true;
        }
        else if (that.svg.selectAll("." + location).classed("active") == true) {
            that.svg.selectAll("." + location).attr("r", "3px");
            that.svg.selectAll("." + location).style({"stroke": "none", "stroke-width": "0"});
            that.svg.selectAll("." + location).classed("active", false);
            that.selections.splice(that.selections.indexOf(location), 1);
            action = false;
        }

            $(that.eventHandler).trigger("clicked", {method: "school", schoolPoint: location, "action": action});
            //$(that.eventHandler).trigger("clickedGeo", {method: "school", schoolPoint: location, "action": action});
    }
}

GeoVis.prototype.onFilterChange = function(filters){
    var that = this;

    that.activeFilters = filters;

    if(filters.sender == "metricDropDown")
    {
        console.log("METRIC DROP DOWN");
        this.wrangleData({"filters": filters, "schoolList": that.schoolList});
    }
    else {
        console.log("FILTER HIT");
        this.wrangleData({"filters": filters /*, "schoolList": that.schoolList*/}); //"schoolList": that.schoolList
    }
    this.updateVis(filters.metrics[0].value);

    //When the filter changes, ensure that all of the selected items get cleared
    if(filters.clearSelection != null && filters.clearSelection == true) {
        that.selections.length = 0;
    }

    //When the metric changes, ensure that all of the selected items are still highlighted
    if(that.selections != null && that.selections.length>0) {
        for (var i = 0; i < that.selections.length; i++) {
            if(that.svg.selectAll("." + that.selections[i]).empty() == false) {
                if (that.activeFilters.metricType == "boroughButton") {
                    if (that.svg.selectAll("." + that.selections[i]).classed("active") == false) {
                        that.svg.selectAll("." + that.selections[i]).style("stroke", "black");
                        that.svg.selectAll("." + that.selections[i]).style("stroke-width", "5px");
                        that.svg.selectAll("." + that.selections[i]).classed("active", true);
                    }
                }
                else if (that.activeFilters.metricType == "schoolDistrictButton") {
                    if (that.svg.selectAll("." + that.selections[i]).classed("active") == false) {
                        that.svg.selectAll("." + that.selections[i]).style("stroke", "black");
                        that.svg.selectAll("." + that.selections[i]).style("stroke-width", "5px");
                        that.svg.selectAll("." + that.selections[i]).classed("active", true);
                    }
                }
                else if (that.activeFilters.metricType == "schoolButton") {
                    if (that.svg.selectAll("." + that.selections[i]).classed("active") == false) {
                        that.svg.selectAll("." + that.selections[i]).attr("r", "10px");
                        that.svg.selectAll("." + that.selections[i]).style({"stroke": "black", "stroke-width": "2"});
                        that.svg.selectAll("." + that.selections[i]).classed("active", true);
                    }
                }
            }
        }
    }
}

//This is for clicking on an item or selecting it from the dropdown
GeoVis.prototype.onSelectChange = function(selections){
    var that = this;

    that.clicked(selections.selections);

}

GeoVis.prototype.onSelectionChange = function(schoolList){
    var that = this;

    that.schoolList = schoolList;

    that.selections.length = 0;

    that.svg.selectAll(".schoolDistrict").style("stroke-width", "1px").classed("active", false);
    that.svg.selectAll(".borough").style("stroke-width", "1px").classed("active", false);
    that.svg.selectAll(".schoolPoint").classed("active", false)
    that.svg.selectAll(".schoolPoint").style({"stroke": "none", "stroke-width": "0"});

    this.wrangleData({"filters": that.activeFilters, "schoolList": schoolList});
    this.updateVis(that.activeFilters.metrics[0].value);

}

GeoVis.prototype.filterAndAggregate = function(_filter) {

    var that = this;

    if (_filter != null) {
        if(_filter.filters.metricType == "schoolButton") {
            var boroughFilterList = [];
            var schoolDistrictFilterList = [];
            var schoolTypesFilterList = [];
            var programTypesFilterList = [];
            var schoolFilterList = [];

            if (_filter.filters != null) {
                if (_filter.filters.boroughs != null && _filter.filters.boroughs.length > 0) {
                    for (var i = 0; i < _filter.filters.boroughs.length; i++) {
                        boroughFilterList.push(parseInt(_filter.filters.boroughs[i].value));
                    }
                }
                if (_filter.filters.districts != null && _filter.filters.districts.length > 0) {
                    for (var i = 0; i < _filter.filters.districts.length; i++) {
                        schoolDistrictFilterList.push(parseInt(_filter.filters.districts[i].value));
                    }
                }
                if (_filter.filters.schoolTypes != null && _filter.filters.schoolTypes.length > 0) {
                    for (var i = 0; i < _filter.filters.schoolTypes.length; i++) {
                        schoolTypesFilterList.push(_filter.filters.schoolTypes[i].value);
                    }
                }
                if (_filter.filters.programTypes != null && _filter.filters.programTypes.length > 0){
                    for (var i = 0; i < _filter.filters.programTypes.length; i++) {
                        programTypesFilterList.push(_filter.filters.programTypes[i].value);
                    }
                }
            }
            if (_filter.schoolList != null && _filter.schoolList.schools != null && _filter.schoolList.schools.length > 0) {
                schoolFilterList = _filter.schoolList.schools;
            }

            that.displayData.objects.nysp.geometries = that.geoData.objects.nysp.geometries.filter(function (d) {
                if ((boroughFilterList.length == 0 || boroughFilterList.indexOf(parseInt(d.properties.BoroughID)) > -1) && (schoolDistrictFilterList.length == 0 || schoolDistrictFilterList.indexOf(parseInt(d.properties.GEO_DISTRI)) > -1) && (schoolTypesFilterList.length == 0 || schoolTypesFilterList.indexOf(d.properties.SCH_TYPE) > -1) && (programTypesFilterList.length == 0 || $(programTypesFilterList).filter(d.properties.Programs).length > 0) && ((_filter.schoolList == null || _filter.schoolList.schools == null) || schoolFilterList.indexOf("S" + d.properties.ATS_CODE) > -1)) {
                    return true;
                }
                else {
                    return false;
                }
            });
        }
    }
    else
    {
        console.log("I WRANGELD NULL");
        that.displayData.objects.nysp.geometries = that.geoData.objects.nysp.geometries;
    }

    return that.displayData;
}

GeoVis.prototype.onButtonChange = function(params){
    var that = this;

    that.svg.selectAll(".schoolDistrict").style("stroke-width", "1px").classed("active", false);
    that.svg.selectAll(".borough").style("stroke-width", "1px").classed("active", false);
    that.svg.selectAll(".schoolPoint").classed("active", false)
    that.svg.selectAll(".schoolPoint").style({"stroke": "none", "stroke-width": "0"});

    that.activeFilters.metricType = params.metricType;
    if(that.schoolList.schools != null) {
        that.schoolList.schools = [];
    }
    if(that.schoolList != null) {
        that.schoolList = [];
    }

    that.selections.length = 0;

    that.wrangleData(null);
    that.updateVis(that.activeFilters.metrics[0].value);

}

GeoVis.prototype.hover = function(location){
    var that = this;

    if(that.activeFilters.metricType == "boroughButton" || that.activeFilters.metricType == "schoolDistrictButton") {
        if(!that.svg.select("." + location).empty() && that.svg.select("." + location).classed("active") == false) {
            that.svg.select("." + location).style("stroke", "black");
            that.svg.select("." + location).style("stroke-width", "5px");
        }
    }
    else if(that.activeFilters.metricType == "schoolButton"){
        if(!that.svg.select("." + location).empty() && that.svg.select("." + location).classed("active") == false) {
            that.svg.select("." + location).attr("r", "10px");
            that.svg.select("." + location).style({"stroke": "black", "stroke-width": "2"});
        }
    }
}

GeoVis.prototype.hoverOut = function(location){
    var that = this;

    if(that.activeFilters.metricType == "boroughButton" || that.activeFilters.metricType == "schoolDistrictButton") {
        if(!that.svg.select("." + location).empty() && that.svg.select("." + location).classed("active") == false) {
            that.svg.select("." + location).style("stroke", "black");
            that.svg.select("." + location).style("stroke-width", "1px");
        }
    }
    else if(that.activeFilters.metricType == "schoolButton"){
        if(!that.svg.select("." + location).empty() && that.svg.select("." + location).classed("active") == false) {
            that.svg.select("." + location).attr("r", "3px");
            that.svg.select("." + location).style({"stroke": "none", "stroke-width": "0"});
        }
    }
}