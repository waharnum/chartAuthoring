/*
Copyright 2015 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://raw.githubusercontent.com/fluid-project/chartAuthoring/master/LICENSE.txt
*/

(function ($, fluid) {

    "use strict";

    // The D3 view component that is able to:
    // 1. Convert jQuery DOM elements to D3 elements;
    // 2. Attach D3 DOM event listeners;
    // 3. Synthesize that.options.styles and that.options.selectors to combine elements with the same key into that.classes

    fluid.defaults("floe.d3ViewComponent", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        members: {
            classes: {
                expander: {
                    funcName: "floe.d3ViewComponent.synthesizeClasses",
                    args: ["{that}.options.styles", "{that}.options.selectors"]
                }
            }
        },
        model: {
            // Keeps track of D3 keys and their associated DOM elements
            dataKeys: {}
        },
        invokers: {
            jQueryToD3: {
                funcName: "floe.d3.jQueryToD3",
                args: ["{arguments}.0"]
            },
            addD3Listeners: {
                funcName: "floe.d3.addD3Listeners",
                args: ["{arguments}.0", "{arguments}.1", "{arguments}.2", "{that}"]
            },
            addElementIdToDataKey: {
                funcName: "floe.d3ViewComponent.addElementIdToDataKey",
                args: ["{arguments}.0", "{arguments}.1", "{that}"]
            },
            removeElementIdFromDataKey: {
                funcName: "floe.d3ViewComponent.removeElementIdFromDataKey",
                args: ["{arguments}.0", "{arguments}.1", "{that}"]
            },
            getElementsByDataKeys: {
                funcName: "floe.d3ViewComponent.getElementsByDataKey",
                args: ["{arguments}.0", "{that}"]
            },
            getElementsByDataKey: {
                funcName: "floe.d3ViewComponent.getElementsByDataKey",
                args: ["{arguments}.0", "{that}"]
            },
            getElementsNotMatchingDataKey: {
                funcName: "floe.d3ViewComponent.getElementsNotMatchingDataKey",
                args: ["{arguments}.0", "{that}"]
            }

        }
    });

    /**
     * Validate the given string is in the form of a css class, such as ".floe-css-name"
     * @param cssClass - string
     * @return - boolean
     */

     // Validate the given selector to ensure it is in the form "period plus classname". The current
     // implementation adds the given classname via the d3 "class" directive, so it couldn't handle
     // selectors in any other forms such as "#foo" or ".foo.bar"

    floe.d3ViewComponent.isCssClass = function (cssClass) {
        cssClass = cssClass.trim();
        var pattern = /^\.[_a-zA-Z]+[_a-zA-Z0-9-]*$/;
        return pattern.test(cssClass);
    };

    floe.d3ViewComponent.extractSelectorName = function (selector) {
        if (!selector) {
            return;
        }
        selector = selector.trim();
        if (floe.d3ViewComponent.isCssClass(selector)) {
            return selector.substring(1);
        } else {
            fluid.fail(selector + " is not a css class");
        }
    };

    floe.d3ViewComponent.removeArrayDuplicates = function (array) {
        return array.filter(function (value, index, self) {
            return self.indexOf(value) === index;
        });
    };

    // Synthesize "styles" and "selectors" blocks to combine elements with the same key
    floe.d3ViewComponent.synthesizeClasses = function (styles, selectors) {

        // 1. Combine any matching styles and selectors by key into an array of class names

        // Do the selectors first to maintain floec/floe-style ordering

        var consolidatedClasses = fluid.transform(selectors, function (selector) {
            return [floe.d3ViewComponent.extractSelectorName(selector)];
        });

        // Needed catch to handle the result of a nonexistent selectors block meaning object is not initialized
        consolidatedClasses = consolidatedClasses || {};

        // Add any style values to consolidatedClasses

        fluid.each(styles, function (styleValue, key) {
            var resultArray = styleValue.split(" ");
            var correspondingSelectorArray = fluid.get(consolidatedClasses, key);

            if (correspondingSelectorArray) {
                resultArray = correspondingSelectorArray.concat(resultArray);
            }
            // Only keep unique values for each consolidated class array
            var resultArrayWithUniqueValues = floe.d3ViewComponent.removeArrayDuplicates(resultArray);

            fluid.set(consolidatedClasses, key, resultArrayWithUniqueValues);
        });

        // 2. For each key/value pair in the consolidatedClasses object, turn the value from an array
        // to a space-delimited string

        var togo = fluid.transform(consolidatedClasses, function (selectorArray) {
            return selectorArray.join(" ");
        });

        return togo;
    };

    // Returns a formatted string for a numeric data value based on a supplied template
    floe.d3ViewComponent.getTemplatedDisplayValue = function (totalValue, percentageDigits, template, d) {
        var percentage = floe.chartAuthoring.percentage.calculate(d.value, totalValue);
        var percentageForTemplate = percentage !== null ? percentage.toFixed(percentageDigits) : percentage;
        var output = fluid.stringTemplate(template, {label: d.label, value: d.value, percentage: percentageForTemplate, total: totalValue});
        return output;
    };

    // Given a data key used to maintain object constancy in D3, a DOM
    // element with a unique ID and the component, updates the key's
    // value (an array of IDs) to include that ID
    floe.d3ViewComponent.addElementIdToDataKey = function (d3Key, idToAdd, that) {
        var keyPath = "dataKeys." + d3Key;
        var elementIds = fluid.get(that.model, keyPath);
        // Create an empty array at the path if the key isn't currently defined
        if (elementIds === undefined) {
            that.applier.change(keyPath, []);
            elementIds = fluid.get(that.model, keyPath);
        }
        if (!elementIds.includes(idToAdd)) {
            elementIds.push(idToAdd);
        }
        that.applier.change(keyPath, elementIds);
    };

    // Corresponding "remove" functionality to addElementIdToDataKey
    floe.d3ViewComponent.removeElementIdFromDataKey = function (d3Key, idToRemove, that) {
        var keyPath = "dataKeys." + d3Key;
        var elementIds = fluid.get(that.model, keyPath);
        fluid.remove_if(elementIds, function (currentId) {
            return currentId === idToRemove;
        });
        that.applier.change(keyPath, elementIds);
    };

    // Given an array "elements" consisting of element IDs, returns a joined
    // string of IDs suitable for use as a jQuery selector to select all
    // those IDs
    floe.d3ViewComponent.getElementIdsAsSelector = function (elementIds) {
        if (fluid.isArrayable(elementIds)) {
            var elemIdCollectionWithPreface = fluid.transform(elementIds, function (elemId) {
                    return "#" + elemId;
                });
            var keyedElements = elemIdCollectionWithPreface.join(", ");
            return keyedElements;
        }
    };

    // Given a D3 data key, return the affiliated D3-bound elements using the
    // model's dataKeys information (singular convenience form)
    // TODO: test
    floe.d3ViewComponent.getElementsByDataKey = function (dataKey, that) {
        return floe.d3ViewComponent.getElementsByDataKeys([dataKey], that);
    };

    // Given an array of D3 data keys, returns all affiliated D3-bound elements
    // using the model's dataKeys information
    floe.d3ViewComponent.getElementsByDataKeys = function (dataKeys, that) {
        var matchedElements = [];
        fluid.each(dataKeys, function (dataKey) {
            var elementIds = that.model.dataKeys[dataKey];

            var selector = floe.d3ViewComponent.getElementIdsAsSelector(elementIds);
            matchedElements.push(selector);
        });
        return $(matchedElements.join(","));
    };

    // Given a D3 data key, returns all D3-bound elements that aren't associated
    // with that key

    floe.d3ViewComponent.getElementsNotMatchingDataKey = function (dataKey, that) {
        var dataKeys = fluid.copy(that.model.dataKeys);
        fluid.remove_if(dataKeys, function (currentObj, currentKey) {
            return currentKey === dataKey;
        });
        return floe.d3ViewComponent.getElementsByDataKeys(Object.keys(dataKeys), that);
    };

    // Given an array of D3 data keys and a function `operation` matching the
    // signature expected by jquery.each, applies that function to each element
    // returned
    floe.d3ViewComponent.operateOnElementsByDataKeys = function(dataKeys, operation, args, that, invert) {

        var elementsToOperateOn = invert ? that.getElementsNotMatchingDataKey(dataKeys[0]) :  that.getElementsByDataKeys(dataKeys);
        elementsToOperateOn.each(function(idx, element) {
            var argsToApply = args.concat([idx, element]);
            operation.apply(this, argsToApply);
        });
    };

    floe.d3ViewComponent.logOperation = function(message, idx, element) {
        console.log(message);
        console.log(idx);
        console.log(element);
    };

    // addClass that also handles SVG elements
    floe.d3ViewComponent.addClassOperation = function(classToAdd, idx, element) {
        $(element).addClass(classToAdd);
        element.classList.add(classToAdd);
    };

    // removeClass that also handles SVG elements
    floe.d3ViewComponent.removeClassOperation = function(classToRemove, idx, element) {
        $(element).removeClass(classToRemove);
        element.classList.remove(classToRemove);
    };

    // Given a selection of D3 elements, an ID and a CSS class, turns that
    // class on for any elements matching the ID and makes sure it's turn off
    // for any elements not matching it
    floe.d3ViewComponent.toggleCSSClassByDataId = function (id, toggleClass, that) {
        floe.d3ViewComponent.operateOnElementsByDataKeys([id], floe.d3ViewComponent.addClassOperation, [toggleClass], that);

        floe.d3ViewComponent.operateOnElementsByDataKeys([id], floe.d3ViewComponent.removeClassOperation, [toggleClass], that, true);
    };

})(jQuery, fluid);
