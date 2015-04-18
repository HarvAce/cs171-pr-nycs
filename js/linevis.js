LineVis = function(_parentElement, _geoData, _eventHandler){
    this.parentElement = _parentElement;
    this.geoData = _geoData;
    this.eventHandler = _eventHandler;
    this.displayData = jQuery.extend(true, {}, _geoData);

    this.margin = {top: 20, right: 20, bottom: 20, left: 20};
    this.width = 800 - this.margin.left - this.margin.right;
    this.height = 200 - this.margin.top - this.margin.bottom;


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

    that.wrangleData(null);

    that.updateVis();
}

LineVis.prototype.wrangleData = function(_filterFunction){
    var that = this;

    that.displayData = that.filterAndAggregate(_filterFunction);
}

LineVis.prototype.updateVis = function() {
    var that = this;

        // TODO : REFACTOR Take this whole section out and pass the key metrics and scales in through some JSON from nycs.html
        // Extract the list of dimensions and create a scale for each. --> needs to be off geoData so results aren't skewed as filters change
        that.x.domain(that.dimensions = d3.keys(that.geoData.objects.nysp.geometries[0].properties).filter(function(d) {
            return (d == "QualityScore" || d == "ProgressReportOverallGrade" || d == "GraduationOutcomeTotalGradPercentage" || d == "StudentToTeacherRatio" || d == "SurveyTotalAcademicExpectationsScore" || d == "SurveyTotalCommunicationScore" || d == "SurveyTotalEngagementScore" || d == "SurveyTotalSafetyRespectScore");
        }));

        that.dimensions.forEach(function(d, i)
        {
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
            else
            {
                that.y[d] = d3.scale.linear()
                    //.domain(d3.extent(that.displayData.objects.nysp.geometries, function(p) { return +p.properties[d]; }))
                    //Creates an arbitrary no data point 1 point below the actual minimum
                    .domain([d3.min(that.geoData.objects.nysp.geometries.filter(function(a){
                        return a.properties[d] != "" && a.properties[d] != null && a.properties[d] != 0;
                    }), function(p) { return +p.properties[d]; })-1,
                        d3.max(that.geoData.objects.nysp.geometries.filter(function(a){
                            return a.properties[d] != "" && a.properties[d] != null && a.properties[d] != 0;
                        }), function(p) { return +p.properties[d]; })])
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
                .data(that.displayData.objects.nysp.geometries);

        // ENTER: Background lines
        backgroundPaths
                .enter().append("path")
                .attr("class", function(d){
                    return "S" + d.properties.ATS_CODE;
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
            .data(that.displayData.objects.nysp.geometries);

        // ENTER: Foreground lines
        foregroundPaths
                .enter().append("path")
                .attr("class", function(d){
                    return "S" + d.properties.ATS_CODE;
                });

        // UPDATE: Foreground lines
        foregroundPaths
            .attr("d", path);

        // DELETE: Foreground lines
        foregroundPaths.exit().remove();

        // Each y-axis gets a group and drag behavior
        // START CITATION - Below grouping and dragging behavior code is from the Jason Davies example: http://bl.ocks.org/jasondavies/1341281
        var g = that.svg.selectAll(".dimension")
            .data(that.dimensions)
            .enter().append("g")
            .attr("class", "dimension")
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

        // TODO: REFACTOR Get the metric labels out of here and pass in through some JSON from nycs.html
        // TODO: Get the y-axis labels to wrap
        // Render the y-axes
        g.append("g")
            .attr("class", "axis")
            .each(function(d) { d3.select(this).call(that.axis.scale(that.y[d]).tickFormat(function(a){
                if(a == that.y[d].domain()[0])
                {
                    return "None";
                }
                else
                {
                    return a;
                }
            })); })
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", -9)
            .text(function(d) {
                if (d === "QualityScore")
                {
                    return "Quality Score";
                }
                else if(d === "ProgressReportOverallGrade")
                {
                    return "Progress Grade";
                }
                else if(d === "GraduationOutcomeTotalGradPercentage")
                {
                    return "Graduation Percentage";
                }
                else if(d === "StudentToTeacherRatio")
                {
                    return "Student to Teacher Ratio";
                }
                else if(d === "SurveyTotalAcademicExpectationsScore")
                {
                    return "Academic Expectations Score";
                }
                else if(d === "SurveyTotalCommunicationScore")
                {
                    return "Communication Score";
                }
                else if(d === "SurveyTotalEngagementScore")
                {
                    return "Engagement Score";
                }
                else if(d === "SurveyTotalSafetyRespectScore")
                {
                    return "Safety Respect Score";
                }

            });

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
                if(d.properties[p] == "" || d.properties[p] == null || d.properties[p] == 0) {
                    return [position(p), that.y[p](that.y[p].domain()[0])];
                }
                else
                {
                    return [position(p), that.y[p](d.properties[p])];
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
                    return extents[i][0] <= d.properties[p] && d.properties[p] <= extents[i][1];
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

        $(that.eventHandler).trigger("selectionChanged", {schools: brushSchoolList});
    }
    // END CITATION

}

LineVis.prototype.filterAndAggregate = function(_filter) {

    var that = this;

    if (_filter != null) {
        var boroughFilterList = [];
        var schoolDistrictFilterList = [];
        var schoolTypesFilterList = [];
        if(_filter.boroughs.length>0) {
            for (var i=0; i<_filter.boroughs.length; i++)
            {
                boroughFilterList.push(parseInt(_filter.boroughs[i].value));
            }
        }
        if(_filter.districts.length>0)
        {
            for (var i=0; i<_filter.districts.length; i++)
            {
                schoolDistrictFilterList.push(parseInt(_filter.districts[i].value));
            }
        }
        if(_filter.schoolTypes.length>0)
        {
            for (var i=0; i<_filter.schoolTypes.length; i++)
            {
                schoolTypesFilterList.push(_filter.schoolTypes[i].value);
            }
        }
        that.displayData.objects.nysp.geometries = that.geoData.objects.nysp.geometries.filter(function (d) {
            if((boroughFilterList.length ==0 || boroughFilterList.indexOf(parseInt(d.properties.BORONUM)) > -1) && (schoolDistrictFilterList.length ==0 || schoolDistrictFilterList.indexOf(parseInt(d.properties.GEO_DISTRI)) > -1) && (schoolTypesFilterList.length ==0 || schoolTypesFilterList.indexOf(d.properties.SCH_TYPE) > -1)) {
                return true;
            }
            else{
                return false;
            }
        });
    }

    return that.displayData;
}

LineVis.prototype.onFilterChange = function(filters) {
    var that = this;

    //TODO: Clear brushes
    //that.dimensions.forEach(function(p) { that.y[p].brush.clear(); })
    console.log(filters);
    this.wrangleData(filters);
    this.updateVis();
}

//TODO: Come back and get this to work for bringing the axes back to the front
d3.selection.prototype.moveToFront = function () {
    return this.each(function () {
        this.parentNode.appendChild(this);
    });
};