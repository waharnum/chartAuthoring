/*
Copyright 2016 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://raw.githubusercontent.com/fluid-project/chartAuthoring/master/LICENSE.txt
*/

(function ($, fluid) {

    "use strict";

    fluid.defaults("floe.chartAuthoring.lineChart.line", {
        gradeNames: ["floe.chartAuthoring.valueBinding", "floe.d3ViewComponent"],
        model: {
            dataSet: [],
            svgTitle: "Line Chart",
            svgDescription: "A line chart."
        },
        bindings: {
            title: "svgTitle",
            description: "svgDescription"
        },
        svgOptions: {
            width: 700,
            height: 500
        },
        lineOptions: {
            padding: 50,
            // interpolation mode for chart line
            // see line.interpolate at https://github.com/mbostock/d3/wiki/SVG-Shapes
            // generally, "linear" for sharp lines, "basis" for smooth
            interpolation: "linear",
            // Whether or not to add an area fill under the chart line
            addArea: false,
            // Whether or not to add a point to each datapoint forming the line
            // Should not be used when using basis interpolation
            addPoints: false,
            pointRadius: 2
        },
        styles: {
            svg: "floe-ca-lineChart-line",
            chartLinePoint: "floe-ca-lineChart-line-chartLine-point"
        },
        selectors: {
            title: ".floec-ca-lineChart-title",
            description: ".floec-ca-lineChart-description",
            svg: ".floec-ca-lineChart-line",
            yAxis: ".floec-ca-lineChart-y-axis",
            xAxis: ".floec-ca-lineChart-x-axis",
            chartLine: ".floec-ca-lineChart-chartLine",
            chartLinePoint: ".floec-ca-lineChart-chartLine-point",
            chartLineArea: ".floec-ca-lineChart-chartLine-area"
        },
        events: {
            onLineCreated: null,  // Fire when the line is created. Ready to register D3 DOM event listeners,
            onLineRedrawn: null // Fire when the line is redrawn.
        },
        listeners: {
            "onCreate.create": {
                funcName: "floe.chartAuthoring.lineChart.line.create",
                args: ["{that}"]
            }
        },
        modelListeners: {
            dataSet: {
                funcName: "{that}.draw",
                excludeSource: "init"
            }
        },
        invokers: {
            draw: {
                funcName: "floe.chartAuthoring.lineChart.line.draw",
                args: ["{that}"]
            }
        }
    });

    floe.chartAuthoring.lineChart.line.draw = function (that) {
        // console.log("floe.chartAuthoring.lineChart.line.draw");

        var shouldAddArea = that.options.lineOptions.addArea,
            shouldAddPoints = that.options.lineOptions.addPoints;

        // Remove any older drawn elements from a previous dataset
        that.locate("xAxis").remove();
        that.locate("yAxis").remove();
        that.locate("chartLine").remove();
        that.locate("chartLinePoint").remove();

        that.yScale = floe.chartAuthoring.lineChart.line.getYScale(that);

        that.xScale = floe.chartAuthoring.lineChart.line.getXScale(that);

        that.yAxis = floe.chartAuthoring.lineChart.line.getYAxis(that);

        that.xAxis = floe.chartAuthoring.lineChart.line.getXAxis(that);

        that.line = floe.chartAuthoring.lineChart.line.getLineGenerator(that);

        that.area = floe.chartAuthoring.lineChart.line.getAreaGenerator(that);

        floe.chartAuthoring.lineChart.line.addYAxis(that);

        floe.chartAuthoring.lineChart.line.addXAxis(that);

        floe.chartAuthoring.lineChart.line.addChartLine(that);

        if (shouldAddArea) {
            floe.chartAuthoring.lineChart.line.addArea(that);
        }

        if (shouldAddPoints) {
            floe.chartAuthoring.lineChart.line.addPoints(that);
        }

    };

    floe.chartAuthoring.lineChart.line.addYAxis = function (that) {
        var yAxisClass = that.classes.yAxis,
            padding = that.options.lineOptions.padding;
        // Append the y axis
        that.svg.append("g")
            .attr("transform", "translate(" + padding + ",0)")
            .attr("class", yAxisClass)
            .call(that.yAxis);
    };

    floe.chartAuthoring.lineChart.line.addXAxis = function (that) {
        var xAxisClass = that.classes.xAxis,
            padding = that.options.lineOptions.padding,
            height = that.options.svgOptions.height;
        // Append the x axis
        that.svg.append("g")
            .attr("transform", "translate(0," + (height - padding) + ")")
            .attr("class", xAxisClass)
            .call(that.xAxis);
    };

    floe.chartAuthoring.lineChart.line.addChartLine = function (that) {
        var dataSet = that.model.dataSet,
            chartLineClass = that.classes.chartLine,
            svg = that.svg;

        // Append the line based on the dataset
        svg.append("path")
            .data([dataSet])
            .attr("class", chartLineClass)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("d", that.line);
    };

    floe.chartAuthoring.lineChart.line.addArea = function (that) {
        var chartLineAreaClass = that.classes.chartLineArea;
        // Append the area file for the line
        var svg = that.svg,
            dataSet = that.model.dataSet;

        svg.append("path")
            .attr("class", chartLineAreaClass)
            .data([dataSet])
            .attr("d", that.area);
    };

    floe.chartAuthoring.lineChart.line.addPoints = function (that) {
        var svg = that.svg,
            dataSet = that.model.dataSet,
            chartLinePointClass = that.classes.chartLinePoint,
            pointRadius = that.options.lineOptions.pointRadius;

        // Append a point for each datapoint
        svg.selectAll("circle")
        .data(dataSet)
        .enter()
        .append("circle")
        .attr("class", chartLinePointClass)
        .attr("r", pointRadius)
        .attr("cy", function (d) {
            return that.yScale(d.value);
        })
        .attr("cx", function (d) {
            return that.xScale(new Date(d.date));
        });
    };

    floe.chartAuthoring.lineChart.line.getYScale = function (that) {
        var height = that.options.svgOptions.height;
        var padding = that.options.lineOptions.padding;
        var dataSet = that.model.dataSet;

        var dataSetMax = d3.max(dataSet, function (d) {
            return d.value;
        });

        return d3.scale.linear()
            .domain([0, dataSetMax])
            .nice()
            .range([height - padding, padding]);
    };

    floe.chartAuthoring.lineChart.line.getXScale = function (that) {
        var width = that.options.svgOptions.width;
        var padding = that.options.lineOptions.padding;
        var dataSet = that.model.dataSet;
        var minDate = new Date(dataSet[0].date);
        var maxDate = new Date(dataSet[dataSet.length - 1].date);

        return d3.time.scale()
            .domain([minDate, maxDate])
            .range([padding, width - padding * 2]);
    };

    floe.chartAuthoring.lineChart.line.getYAxis = function (that) {
        var width = that.options.svgOptions.width;
        var padding = that.options.lineOptions.padding;
        var yScale = that.yScale;

        var yAxis = d3.svg.axis()
            .orient("left")
            .scale(yScale)
            .innerTickSize(- width + padding * 3)
            .outerTickSize(0)
            .tickPadding(10);

        return yAxis;
    };

    floe.chartAuthoring.lineChart.line.getXAxis = function (that) {
        var xScale = that.xScale;

        var customTickFormat = d3.time.format.multi([
            [".%L", function (d) { return d.getMilliseconds(); }],
            [":%S", function (d) { return d.getSeconds(); }],
            ["%I:%M", function (d) { return d.getMinutes(); }],
            ["%I %p", function (d) { return d.getHours(); }],
            ["%a %d", function (d) { return d.getDay() && d.getDate() !== 1; }],
            ["%b %d", function (d) { return d.getDate() !== 1; }],
            ["%b", function (d) { return d.getMonth(); }],
            ["%Y", function () { return true; }]
        ]);

        var xAxis = d3.svg.axis()
            .tickFormat(customTickFormat)
            .orient("bottom")
            .scale(xScale);

        return xAxis;

    };

    floe.chartAuthoring.lineChart.line.getLineGenerator = function (that) {
        var interpolation = that.options.lineOptions.interpolation;

        var line = d3.svg.line()
            .interpolate(interpolation)
            .x(function (d) {
                return that.xScale(new Date(d.date));
            })
            .y(function (d) {
                return that.yScale(d.value);
            });

        return line;
    };

    floe.chartAuthoring.lineChart.line.getAreaGenerator = function (that) {
        var interpolation = that.options.lineOptions.interpolation;
        var height = that.options.svgOptions.height,
            padding = that.options.lineOptions.padding;

        var area = d3.svg.area()
            .interpolate(interpolation)
            .x(function (d) {
                return that.xScale(new Date(d.date));
            })
            .y0(height - padding)
            .y1(function (d) {
                return that.yScale(d.value);
            });

        return area;
    };

    floe.chartAuthoring.lineChart.line.create = function (that) {
        // console.log("floe.chartAuthoring.lineChart.line.create");

        that.createBaseSVGDrawingArea();

        that.draw();

        that.events.onLineCreated.fire();

    };

})(jQuery, fluid);