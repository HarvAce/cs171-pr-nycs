BarVis = function(_parentElement, _geoData, _keyMetrics, _eventHandler){
    this.parentElement = _parentElement;
    this.geoData = _geoData;
    this.keyMetrics = _keyMetrics;
    this.eventHandler = _eventHandler;
    this.displayData = [];
    this.clickedItems = [];

    this.margin = {top: 20, right: 20, bottom: 20, left: 20};
    this.width = 340 - this.margin.left - this.margin.right;
    this.height = 200 - this.margin.top - this.margin.bottom;


    this.initVis();
}

BarVis.prototype.initVis = function() {
    var that = this;

    console.log(that.keyMetrics);

    that.wrangleData(null);

    that.updateVis();
}

BarVis.prototype.wrangleData = function(_filterFunction){
    var that = this;

    that.displayData = that.filterAndAggregate(_filterFunction);
}

BarVis.prototype.updateVis = function() {
    var that = this;

    that.svg = that.parentElement.selectAll("svg").data(that.keyMetrics);

    //Create an svg for each key metric selected
    that.svg.enter()
        .append("svg")
        .attr("width", that.width + that.margin.left + that.margin.right)
        .attr("height", that.height + that.margin.top + that.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")")
        .each(function(metric){
            //metric.scale.range([that.height, 0]);
        });

    that.svg.exit().remove();
}

BarVis.prototype.filterAndAggregate = function(_filter) {

    var that = this;

    if(_filter != null) {
        that.displayData = jQuery.extend(true, {}, that.geoData.objects.nysp.geometries.filter(function (d) {
            return that.clickedItems.indexOf("S" + d.properties.ATS_CODE) > -1;
        }));

        console.log(that.displayData);
    }
    return that.displayData;
}

BarVis.prototype.clicked = function(params){
    var that = this;

    if(params.action == true)
    {
        that.clickedItems.push(params.schoolPoint);
    }
    else if(params.action == false)
    {
        that.clickedItems.splice(that.clickedItems.indexOf(params.schoolPoint), 1);
    }

    console.log(that.clickedItems);
    console.log(params.schoolPoint);

    that.wrangleData(that.clickedItems);
    that.updateVis();
}