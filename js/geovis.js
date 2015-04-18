GeoVis = function(_parentElement, _geoData, _eventHandler){
    this.parentElement = _parentElement;
    this.geoData = _geoData;
    this.eventHandler = _eventHandler;
    this.displayData = jQuery.extend(true, {}, _geoData);
    //Sets the default metric and metricType to render
    this.activeFilters = {"metrics": [{"value": "QualityScore"}], "metricType": "schoolButton"};

    this.margin = {top: 20, right: 20, bottom: 0, left: 0};
    this.width = 720 - this.margin.left - this.margin.right;
    this.height = 770 - this.margin.top - this.margin.bottom;


    this.initVis();
}

GeoVis.prototype.initVis = function(){
    var that = this;

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

    that.legendXScale = d3.scale.ordinal();

    that.legendXAxis = d3.svg.axis()
        .scale(that.legendXScale)
        .orient("bottom")
        .tickSize(13);

    that.legend.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0,0)");

    that.legend.append("text")
        .attr("class", "caption")
        .attr("y", -6);

    that.wrangleData(null);

    that.updateVis(this.activeFilters.metrics[0].value);
}

GeoVis.prototype.wrangleData = function(_filterFunction){
    var that = this;

    that.displayData = that.filterAndAggregate(_filterFunction);
}

GeoVis.prototype.updateVis = function(currentMetric){
    var that = this;

    //Draw the boroughs
    that.svg.selectAll(".borough")
        .data(topojson.feature(that.displayData, that.displayData.objects.nybb).features)
        .enter().append("path")
        .attr("class", function(d){
            return "borough B" + d.properties.BoroCode;
        })
        .attr("d", that.path)
        .attr("fill", "none");

    //TODO: Pull out these thresholds and put them into JSON in nycs.html so they can be used in the small multiple bar charts as well
    //Calculate the School District Thresholds - scales need to be calculated off GeoData, not display data so as not to skew results
    var schoolDistrictSortedAndFiltered = [];
    var schoolDistrictMetricThresholds = {};
    if(that.activeFilters.metricType == "schoolDistrictButton") {
        schoolDistrictSortedAndFiltered = that.geoData.objects.nysd.geometries.filter(function (d) {
            return d.properties[currentMetric] != "" && d.properties[currentMetric] != 0 && d.properties[currentMetric] != null;
        }).sort(function (a, b) {
            return parseInt(a.properties[currentMetric]) > parseInt(b.properties[currentMetric]);
        }).map(function (d) {
            return d.properties[currentMetric];
        });
        //console.log(sortedAndFiltered);
        schoolDistrictMetricThresholds = {
            "TwentyFive": d3.quantile(schoolDistrictSortedAndFiltered, .25),
            "Fifty": d3.quantile(schoolDistrictSortedAndFiltered, .5),
            "SeventyFive": d3.quantile(schoolDistrictSortedAndFiltered, .75)
        };
    }

    //Draw the school districts
    //SELECT - School Districts
    var schoolDistrictFills = that.svg.selectAll(".schoolDistrict")
        .data(topojson.feature(that.displayData, that.displayData.objects.nysd).features);

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
                if (currentMetric === "DistrictAttendance") {
                    if (d.properties[currentMetric] >= schoolDistrictMetricThresholds.SeventyFive) {
                        return "rgb(44,123,182)";
                    }
                    else if (d.properties[currentMetric] >= schoolDistrictMetricThresholds.Fifty) {
                        return "rgb(171,217,233)";
                    }
                    else if (d.properties[currentMetric] >= schoolDistrictMetricThresholds.TwentyFive) {
                        return "rgb(253,174,97)";
                    }
                    else if (d.properties[currentMetric] > 0) {
                        return "rgb(215,25,28)";
                    }
                    else
                    {
                        return "none";
                    }
                }
                else
                {
                    return "none";
                }
            }
            else
            {
                return "none";
            }
        });

    //DELETE - School Districts
    schoolDistrictFills.exit().remove();

    //Draw the school points
    //SELECT - School Points
    var schoolPoints = that.svg.selectAll(".schoolPoint")
        .data(topojson.feature(that.displayData, that.displayData.objects.nysp).features);

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
        //.attr("display", "none")
        .attr("fill", function(d){
            //return "black";
            //TODO Setup the colors for the metrics here

            //If the current metric is set to Quality Score
            if(that.activeFilters.metricType =="schoolButton") {
                if (currentMetric === "QualityScore") {
                    //Underdeveloped
                    if (d.properties.QualityScore === "U") {
                        return "rgb(215, 25, 28)";
                    }
                    //Developing
                    else if (d.properties.QualityScore === "D") {
                        return "rgb(252, 141, 89)";
                    }
                    //Proficient
                    else if (d.properties.QualityScore === "P") {
                        return "rgb(171, 217, 233)";
                    }
                    //Well Developed
                    else if (d.properties.QualityScore === "WD") {
                        return "rgb(44, 123, 182)";
                    }
                    else {
                        return "none";
                    }
                }
                else if (currentMetric === "GraduationOutcomeTotalGradPercentage" || currentMetric === "StudentToTeacherRatio") {
                    //Above 75th percentile
                    if (d.properties[currentMetric] >= metricThresholds.SeventyFive) {
                        return "rgb(44,123,182)"
                    }
                    //75th percentile
                    else if (d.properties[currentMetric] >= metricThresholds.Fifty) {
                        return "rgb(171,217,233)";
                    }
                    //50th percentile
                    else if (d.properties[currentMetric] >= metricThresholds.TwentyFive) {
                        return "rgb(253,174,97)";
                    }
                    //25th percentile
                    else if (d.properties[currentMetric] > 0) {
                        return "rgb(215,25,28)";
                    }
                    else {
                        return "none";
                    }
                }
                else {
                    return "black";
                }
            }
            else{
                return "none";
            }

        })
        .on("click", function(d){
            that.clicked("S" + d.properties.ATS_CODE);
        })
        .on("mouseover", function(d){
            d3.select(this).attr("r", "10px");
        })
        .on("mouseout", function(d){
            d3.select(this).attr("r", "3px");
        });

    //Delete - School Points
    schoolPoints.exit().remove();

    //TODO: Get the scales out of here and back into a master JSON file in nycs.html
    that.legendXScale
        .domain(["", "U", "D", "P", "WD"])
        .range([0, 120, 240, 360, 480]);
    var legendColorScale = d3.scale.ordinal()
        .domain(["", "U", "D", "P", "WD"])
        .range(["none", "#d7191c", "#fdae61", "#abd9e9", "#2c7bb6"]);

    //TODO: Get rid of hardcoding of tick values
    that.legendXAxis
        .tickValues(["None", "Underdeveloped", "Developed", "Proficient", "Well Developed"]);

    //SELECT - Legend
    var legendRects = that.svg.selectAll(".key").selectAll("rect")
        .data(that.legendXScale.domain());

    //ENTER - Legend
    legendRects
        .enter().append("rect");

    //UPDATE - Legend
    legendRects
        .attr("height", 8)
        .attr("x", function(d){
            return that.legendXScale(d);
        })
        .attr("width", 120)
        .attr("fill", function(d){
            return legendColorScale(d);
        });

    //DELETE - Legend
    legendRects.exit().remove();

    that.svg.selectAll(".axis").call(that.legendXAxis)
        .selectAll("text")
        .style("text-anchor", "start")
        .attr("x", 2);

    //TODO: Get rid of the hardcoding of label
    that.svg.selectAll(".caption")
        .text("Independent Quality Score Rating of Schools");

}

GeoVis.prototype.clicked = function(location){
    var that = this;

    console.log(location);

    var action = false;

    if(that.svg.selectAll("." + location).classed("active") == false) {
        that.svg.selectAll("." + location).classed("active", true);
        action = true;
    }
    else if (that.svg.selectAll("." + location).classed("active") == true)
    {
        that.svg.selectAll("." + location).classed("active", false);
        action = false;
    }

    $(that.eventHandler).trigger("clicked", {schoolPoint: location, "action": action});
}

GeoVis.prototype.onFilterChange = function(filters){
    var that = this;
    //console.log(filters);

    that.activeFilters = filters;

    //TODO: Come back here to change transition
    //that.svg.selectAll(".schoolPoint").transition().duration(1000);

    this.wrangleData({"filters": filters, "schoolList": that.schoolList});
    this.updateVis(filters.metrics[0].value);
}

GeoVis.prototype.onSelectionChange = function(schoolList){
    var that = this;

    that.schoolList = schoolList;

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
                if (_filter.filters.schoolTypes!= null && _filter.filters.schoolTypes.length > 0) {
                    for (var i = 0; i < _filter.filters.schoolTypes.length; i++) {
                        schoolTypesFilterList.push(_filter.filters.schoolTypes[i].value);
                    }
                }
            }
            if (_filter.schoolList != null) {
                schoolFilterList = _filter.schoolList.schools;
            }
            that.displayData.objects.nysp.geometries = that.geoData.objects.nysp.geometries.filter(function (d) {
                if ((boroughFilterList.length == 0 || boroughFilterList.indexOf(parseInt(d.properties.BORONUM)) > -1) && (schoolDistrictFilterList.length == 0 || schoolDistrictFilterList.indexOf(parseInt(d.properties.GEO_DISTRI)) > -1) && (schoolTypesFilterList.length == 0 || schoolTypesFilterList.indexOf(d.properties.SCH_TYPE) > -1) && (schoolFilterList.length == 0 || schoolFilterList.indexOf("S" + d.properties.ATS_CODE) > -1)) {
                    return true;
                }
                else {
                    return false;
                }
            });
        }
    }

    return that.displayData;
}