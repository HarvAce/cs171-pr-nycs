ProfileVis = function(_parentElement, _statsData){
    this.parentElement = _parentElement;
    this.statsData = _statsData;
    this.displayData = [];

    this.margin = {top: 80, right: 20, bottom: 20, left: 40};
    this.width = getInnerWidth(this.parentElement) - this.margin.left - this.margin.right;
    this.squareSize = 8;

    this.sources = [
        {"key": "ATS_CODE", "order": 0, "source": "School Point Locations Shape File", "url": "https://data.cityofnewyork.us/Education/School-Point-Locations/jfju-ynrr"},
        {"key": "SCHOOLNAME", "order": 1, "source": "School Point Locations Shape File", "url": "https://data.cityofnewyork.us/Education/School-Point-Locations/jfju-ynrr"},
        {"key": "SCH_TYPE", "order": 2, "source": "School Point Locations Shape File", "url": "https://data.cityofnewyork.us/Education/School-Point-Locations/jfju-ynrr"},
        {"key": "BoroughID", "order": 3, "source": "School Point Locations Shape File", "url": "https://data.cityofnewyork.us/Education/School-Point-Locations/jfju-ynrr"},
        {"key": "SchoolDistrictID", "order": 4, "source": "School Point Locations Shape File", "url": "https://data.cityofnewyork.us/Education/School-Point-Locations/jfju-ynrr"},

        {"key": "QualityScore", "order": 5, "source": "Quality Review 2005-2012", "url": "https://data.cityofnewyork.us/Education/Quality-Review-2005-2012/piri-jns7", "notes": "Filtered on school year 2010-2011"},

        {"key": "ProgressReportOverallScore", "order": 6, "source": "School Progress Reports - All Schools - 2010-2011", "url": "https://data.cityofnewyork.us/Education/School-Progress-Reports-All-Schools-2010-11/yig9-9zum"},
        {"key": "ProgressReportEnvironmentCategoryScore", "order": 7, "source": "School Progress Reports - All Schools - 2010-2011", "url": "https://data.cityofnewyork.us/Education/School-Progress-Reports-All-Schools-2010-11/yig9-9zum"},
        {"key": "ProgressReportPerformanceCategoryScore", "order": 8, "source": "School Progress Reports - All Schools - 2010-2011", "url": "https://data.cityofnewyork.us/Education/School-Progress-Reports-All-Schools-2010-11/yig9-9zum"},
        {"key": "ProgressReportProgressCategoryScore", "order": 9, "source": "School Progress Reports - All Schools - 2010-2011", "url": "https://data.cityofnewyork.us/Education/School-Progress-Reports-All-Schools-2010-11/yig9-9zum"},
        {"key": "ProgressReportAdditionalCredit", "order": 10, "source": "School Progress Reports - All Schools - 2010-2011", "url": "https://data.cityofnewyork.us/Education/School-Progress-Reports-All-Schools-2010-11/yig9-9zum"},

        {"key": "SurveyTotalAcademicExpectationsScore", "order": 11, "source": "NYC School Survey - 2011", "url": "https://data.cityofnewyork.us/Education/NYC-School-Survey-2011/mnz3-dyi8"},
        {"key": "SurveyTotalCommunicationScore", "order": 12, "source": "NYC School Survey - 2011", "url": "https://data.cityofnewyork.us/Education/NYC-School-Survey-2011/mnz3-dyi8"},
        {"key": "SurveyTotalEngagementScore", "order": 13, "source": "NYC School Survey - 2011", "url": "https://data.cityofnewyork.us/Education/NYC-School-Survey-2011/mnz3-dyi8"},
        {"key": "SurveyTotalSafetyRespectScore", "order": 14, "source": "NYC School Survey - 2011", "url": "https://data.cityofnewyork.us/Education/NYC-School-Survey-2011/mnz3-dyi8"},

        {"key": "SurveyStudentResponseRate", "order": 15, "source": "NYC School Survey - 2011", "url": "https://data.cityofnewyork.us/Education/NYC-School-Survey-2011/mnz3-dyi8", "notes": "Grades 6-12 only"},
        {"key": "SurveyStudentAcademicExpectationsScore", "order": 16, "source": "NYC School Survey - 2011", "url": "https://data.cityofnewyork.us/Education/NYC-School-Survey-2011/mnz3-dyi8", "notes": "Grades 6-12 only"},
        {"key": "SurveyStudentCommunicationScore", "order": 17, "source": "NYC School Survey - 2011", "url": "https://data.cityofnewyork.us/Education/NYC-School-Survey-2011/mnz3-dyi8", "notes": "Grades 6-12 only"},
        {"key": "SurveyStudentEngagementScore", "order": 18, "source": "NYC School Survey - 2011", "url": "https://data.cityofnewyork.us/Education/NYC-School-Survey-2011/mnz3-dyi8", "notes": "Grades 6-12 only"},
        {"key": "SurveyStudentSafetyRespectScore", "order": 19, "source": "NYC School Survey - 2011", "url": "https://data.cityofnewyork.us/Education/NYC-School-Survey-2011/mnz3-dyi8", "notes": "Grades 6-12 only"},

        {"key": "SurveyParentResponseRate", "order": 20, "source": "NYC School Survey - 2011", "url": "https://data.cityofnewyork.us/Education/NYC-School-Survey-2011/mnz3-dyi8"},
        {"key": "SurveyParentCommunicationScore", "order": 21, "source": "NYC School Survey - 2011", "url": "https://data.cityofnewyork.us/Education/NYC-School-Survey-2011/mnz3-dyi8"},
        {"key": "SurveyParentAcademicExpectationsScore", "order": 22, "source": "NYC School Survey - 2011", "url": "https://data.cityofnewyork.us/Education/NYC-School-Survey-2011/mnz3-dyi8"},
        {"key": "SurveyParentEngagementScore", "order": 23, "source": "NYC School Survey - 2011", "url": "https://data.cityofnewyork.us/Education/NYC-School-Survey-2011/mnz3-dyi8"},
        {"key": "SurveyParentSafetyRespectScore", "order": 24, "source": "NYC School Survey - 2011", "url": "https://data.cityofnewyork.us/Education/NYC-School-Survey-2011/mnz3-dyi8"},

        {"key": "SurveyTeacherResponseRate", "order": 25, "source": "NYC School Survey - 2011", "url": "https://data.cityofnewyork.us/Education/NYC-School-Survey-2011/mnz3-dyi8"},
        {"key": "SurveyTeacherAcademicExpectationsScore", "order": 26, "source": "NYC School Survey - 2011", "url": "https://data.cityofnewyork.us/Education/NYC-School-Survey-2011/mnz3-dyi8"},
        {"key": "SurveyTeacherCommunicationScore", "order": 27, "source": "NYC School Survey - 2011", "url": "https://data.cityofnewyork.us/Education/NYC-School-Survey-2011/mnz3-dyi8"},
        {"key": "SurveyTeacherEngagementScore", "order": 28, "source": "NYC School Survey - 2011", "url": "https://data.cityofnewyork.us/Education/NYC-School-Survey-2011/mnz3-dyi8"},
        {"key": "SurveyTeacherSafetyRespectScore", "order": 29, "source": "NYC School Survey - 2011", "url": "https://data.cityofnewyork.us/Education/NYC-School-Survey-2011/mnz3-dyi8"},

        {"key": "ClassSizeGenEdAverage", "order": 30, "source": "2010-2011 Class Size - School-level Detail", "url": "https://data.cityofnewyork.us/Education/2010-2011-Class-Size-School-level-detail/urz7-pzb3"},
        {"key": "ClassSizeSpecialEdAverage", "order": 31, "source": "2010-2011 Class Size - School-level Detail", "url": "https://data.cityofnewyork.us/Education/2010-2011-Class-Size-School-level-detail/urz7-pzb3"},
        {"key": "ClassSizeCTTAverage", "order": 32, "source": "2010-2011 Class Size - School-level Detail", "url": "https://data.cityofnewyork.us/Education/2010-2011-Class-Size-School-level-detail/urz7-pzb3"},
        {"key": "ClassSizeGTAverage", "order": 33, "source": "2010-2011 Class Size - School-level Detail", "url": "https://data.cityofnewyork.us/Education/2010-2011-Class-Size-School-level-detail/urz7-pzb3"},

        {"key": "BuildingCode", "order": 34, "source": "School Safety Report", "url": "https://data.cityofnewyork.us/Education/School-Safety-Report/qybk-bjjc"},
        {"key": "BuildingCrimeMajorRate", "order": 35, "source": "School Safety Report", "url": "https://data.cityofnewyork.us/Education/School-Safety-Report/qybk-bjjc"},
        {"key": "BuildingCrimeOtherRate", "order": 36, "source": "School Safety Report", "url": "https://data.cityofnewyork.us/Education/School-Safety-Report/qybk-bjjc"},
        {"key": "BuildingCrimeNoncriminalRate", "order": 37, "source": "School Safety Report", "url": "https://data.cityofnewyork.us/Education/School-Safety-Report/qybk-bjjc"},

        {"key": "MathMean", "order": 38, "source": "NYS Math Test Results by Grade 2006-2011 - School Level - All Students", "url": "https://data.cityofnewyork.us/Education/Graduation-Outcomes-School-Level-Classes-of-2005-2/cma4-zi8m", "notes": "Grades 3-8 only<br/>Filtered on school year 2010-2011"},
        {"key": "MathLevelOnePct", "order": 39, "source": "NYS Math Test Results by Grade 2006-2011 - School Level - All Students", "url": "https://data.cityofnewyork.us/Education/Graduation-Outcomes-School-Level-Classes-of-2005-2/cma4-zi8m", "notes": "Grades 3-8 only<br/>Filtered on school year 2010-2011"},
        {"key": "MathLevelTwoPct", "order": 40, "source": "NYS Math Test Results by Grade 2006-2011 - School Level - All Students", "url": "https://data.cityofnewyork.us/Education/Graduation-Outcomes-School-Level-Classes-of-2005-2/cma4-zi8m", "notes": "Grades 3-8 only<br/>Filtered on school year 2010-2011"},
        {"key": "MathLevelThreePct", "order": 41, "source": "NYS Math Test Results by Grade 2006-2011 - School Level - All Students", "url": "https://data.cityofnewyork.us/Education/Graduation-Outcomes-School-Level-Classes-of-2005-2/cma4-zi8m", "notes": "Grades 3-8 only<br/>Filtered on school year 2010-2011"},
        {"key": "MathLevelFourPct", "order": 42, "source": "NYS Math Test Results by Grade 2006-2011 - School Level - All Students", "url": "https://data.cityofnewyork.us/Education/Graduation-Outcomes-School-Level-Classes-of-2005-2/cma4-zi8m", "notes": "Grades 3-8 only<br/>Filtered on school year 2010-2011"},

        {"key": "EnglishMean", "order": 43, "source": "English Language Arts (ELA) Test Results by Grade 2006-2011 - School Level - All Students", "url": "https://data.cityofnewyork.us/Education/NYS-Math-Test-Results-By-Grade-2006-2011-School-Le/jufi-gzgp", "notes": "Grades 3-8 only<br/>Filtered on school year 2010-2011"},
        {"key": "EnglishLevelOnePct", "order": 44, "source": "English Language Arts (ELA) Test Results by Grade 2006-2011 - School Level - All Students", "url": "https://data.cityofnewyork.us/Education/NYS-Math-Test-Results-By-Grade-2006-2011-School-Le/jufi-gzgp", "notes": "Grades 3-8 only<br/>Filtered on school year 2010-2011"},
        {"key": "EnglishLevelTwoPct", "order": 45, "source": "English Language Arts (ELA) Test Results by Grade 2006-2011 - School Level - All Students", "url": "https://data.cityofnewyork.us/Education/NYS-Math-Test-Results-By-Grade-2006-2011-School-Le/jufi-gzgp", "notes": "Grades 3-8 only<br/>Filtered on school year 2010-2011"},
        {"key": "EnglishLevelThreePct", "order": 46, "source": "English Language Arts (ELA) Test Results by Grade 2006-2011 - School Level - All Students", "url": "https://data.cityofnewyork.us/Education/NYS-Math-Test-Results-By-Grade-2006-2011-School-Le/jufi-gzgp", "notes": "Grades 3-8 only<br/>Filtered on school year 2010-2011"},
        {"key": "EnglishLevelFourPct", "order": 47, "source": "English Language Arts (ELA) Test Results by Grade 2006-2011 - School Level - All Students", "url": "https://data.cityofnewyork.us/Education/NYS-Math-Test-Results-By-Grade-2006-2011-School-Le/jufi-gzgp", "notes": "Grades 3-8 only<br/>Filtered on school year 2010-2011"},

        {"key": "Programs", "order": 48, "source": "NYC Public High School Program Data", "url": "https://data.cityofnewyork.us/Education/NYC-Public-High-School-Program-Data/mreg-rk5p", "notes": "High schools only"},

        {"key": "GraduationOutcomeTotalGradPercentage", "order": 49, "source": "Graduation Outcomes - School Level - Classes of 2005-2011 - Total Cohort", "url": "https://data.cityofnewyork.us/Education/Graduation-Outcomes-School-Level-Classes-of-2005-2/cma4-zi8m", "notes": "High schools only<br/>Filtered on school year 2010-2011"},
        {"key": "GraduationOutcomeStillEnrolledPercentageCohort", "order": 50, "source": "Graduation Outcomes - School Level - Classes of 2005-2011 - Total Cohort", "url": "https://data.cityofnewyork.us/Education/Graduation-Outcomes-School-Level-Classes-of-2005-2/cma4-zi8m", "notes": "High schools only<br/>Filtered on school year 2010-2011"},
        {"key": "GraduationOutcomeDroppedOutPercentageCohort", "order": 51, "source": "Graduation Outcomes - School Level - Classes of 2005-2011 - Total Cohort", "url": "https://data.cityofnewyork.us/Education/Graduation-Outcomes-School-Level-Classes-of-2005-2/cma4-zi8m", "notes": "High schools only<br/>Filtered on school year 2010-2011"}
    ];

    this.itemToOrder = d3.scale.ordinal()
        .domain(["ATS_CODE",
    "SCHOOLNAME",
    "SCH_TYPE",
    "BoroughID",
    "SchoolDistrictID",

    "QualityScore",

    "ProgressReportOverallScore",
    "ProgressReportEnvironmentCategoryScore",
    "ProgressReportPerformanceCategoryScore",
    "ProgressReportProgressCategoryScore",
    "ProgressReportAdditionalCredit",

    "SurveyTotalCommunicationScore",
    "SurveyTotalAcademicExpectationsScore",
    "SurveyTotalEngagementScore",
    "SurveyTotalSafetyRespectScore",

    "SurveyStudentResponseRate",
    "SurveyStudentAcademicExpectationsScore",
    "SurveyStudentCommunicationScore",
    "SurveyStudentEngagementScore",
    "SurveyStudentSafetyRespectScore",

    "SurveyParentResponseRate",
    "SurveyParentCommunicationScore",
    "SurveyParentAcademicExpectationsScore",
    "SurveyParentEngagementScore",
    "SurveyParentSafetyRespectScore",

    "SurveyTeacherResponseRate",
    "SurveyTeacherAcademicExpectationsScore",
    "SurveyTeacherCommunicationScore",
    "SurveyTeacherEngagementScore",
    "SurveyTeacherSafetyRespectScore",

    "ClassSizeGenEdAverage",
    "ClassSizeSpecialEdAverage",
    "ClassSizeCTTAverage",
    "ClassSizeGTAverage",

    "BuildingCode",
    "BuildingCrimeMajorRate",
    "BuildingCrimeOtherRate",
    "BuildingCrimeNoncriminalRate",

    "MathMean",
    "MathLevelOnePct",
    "MathLevelTwoPct",
    "MathLevelThreePct",
    "MathLevelFourPct",

    "EnglishMean",
    "EnglishLevelOnePct",
    "EnglishLevelTwoPct",
    "EnglishLevelThreePct",
    "EnglishLevelFourPct",

    "Programs",

    "GraduationOutcomeTotalGradPercentage",
    "GraduationOutcomeStillEnrolledPercentageCohort",
    "GraduationOutcomeDroppedOutPercentageCohort"]
    )
        .range([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51]);

    this.initVis();

}

ProfileVis.prototype.initVis = function() {

    var that = this;

    that.tip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-6, 0])
        .html(function(d){
            return d.value;
        });

    that.itemTip = d3.tip()
        .attr("class", "d3-tip-noarrow")
        .offset([0, 0])
        .html(function(d){
            var assemblyText = "Source: " + d.source;
            if(d.notes != null)
            {
                assemblyText = assemblyText + "<br/>Notes : " + d.notes;
            }
            return assemblyText;
        })

    that.wrangleData();

    that.updateVis();
}

ProfileVis.prototype.wrangleData= function(){

    var that = this;

    for (var item in that.statsData)
    {
        var metricItems = d3.range(0,52).map(function(){return ""});
        //var metricItems = [];
        for (var key in that.statsData[item])
        {

            //metricItems.push({"key": key, "value": that.statsData[item][key]});
            metricItems[that.itemToOrder(key)] = {"key": key, "value": that.statsData[item][key]};
        }
        that.displayData.push({"key": item, "values": metricItems});
    }

    that.displayData = that.displayData.sort(function(a, b){
        return a.values[that.itemToOrder("SCHOOLNAME")].value < b.values[that.itemToOrder("SCHOOLNAME")].value ? -1 : a.values[that.itemToOrder("SCHOOLNAME")].value > b.values[that.itemToOrder("SCHOOLNAME")].value ? 1 : a.values[that.itemToOrder("SCHOOLNAME")].value >= b.values[that.itemToOrder("SCHOOLNAME")].value ? 0 : NaN;
    });

}

ProfileVis.prototype.updateVis = function() {

    var that = this;

    that.height = (13 * that.displayData.length) + 280 - that.margin.top - that.margin.bottom;

    that.svg = that.parentElement.append("svg")
        .attr("width", that.width + that.margin.left + that.margin.right)
        .attr("height", that.height + that.margin.top + that.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")");

    that.svg.call(that.tip);
    that.svg.call(that.itemTip);

    var groups = that.svg.append("g")
        .attr("transform", function(d){
            return "translate(0,200)";
        })
        .selectAll(".rows")
        .data(that.displayData)
        .enter().append("g")
        .classed("rows", true)
        .attr("transform", function(d,i){
            return "translate(350, " + (that.squareSize + 5) * i + ")";
        });

    groups.selectAll("rect")
        .data(function(d){return d.values;})
        .enter().append("rect")
        .attr("x", function(d, i){return (that.squareSize + 5) * i})
        .attr("width", that.squareSize)
        .attr("height", that.squareSize)
        .attr("fill", function(d){
            if(d.value == null || d.value == "")
            {
                return "white";
            }
            else {
                return "black";
            }
        })
        .on("mouseover", function(d){
            if(d.value != null && d.value != "")
            {
                that.tip.show(d);
            }
        })
        .on("mouseout", function(d){
            if(d.value != null && d.value != "")
            {
                that.tip.hide(d);
            }
        });

    that.svg.append("g")
        .attr("transform", function(d){
            return "translate(348,208)";
        })
        .selectAll(".labels")
        .data(that.displayData)
        .enter().append("text")
        .classed("labels", true)
        .classed("label", true)
        .text(function(d){ return d.values[that.itemToOrder("SCHOOLNAME")].value;})
        .attr("transform", function(d, i){
            return "translate(0, " + (that.squareSize + 5) * i + ")";
        })
        .attr("text-anchor", "end");

    that.svg.append("g")
        .attr("transform", function(d){
            return "translate(358,198)";
        })
        .selectAll(".headers")
        .data(that.sources)
        .enter().append("text")
        .classed("headers", true)
        .classed("label", true)
        .text(function(d){return d.key})
        .attr("transform", function(d, i){
            return "translate(" + (that.squareSize + 5) * i + ", 0) rotate(-90)";
        })
        .on("mouseover", function(d){
            that.itemTip.show(d);
        })
        .on("mouseout", function(d){
            that.itemTip.hide(d);
        });

}