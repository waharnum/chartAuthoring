(function ($, fluid) {

    "use strict";

    fluid.registerNamespace("floe.chartAuthoring.userTest");

    var smartPhoneData =

    [{
        label: "Android",
        value: 48
    },
    {
        label: "Apple",
        value: 28
    },
    {
        label: "Blackberry",
        value: 18
    },
    {
        label: "Microsoft",
        value: 4
    },
    {
        label: "Other",
        value: 2
    }];

    fluid.defaults("floe.chartAuthoring.userTest.sonifier.unitDivisorSonificationStrategyContinuous", {
        // can override these to control sonification behaviour
        // These need better explanations of what they do
        sonificationOptions: {
            strategies: {
                unitDivisor: {
                    config: {
                        divisor: 10,
                        notes: {
                            durations: {
                                play: {
                                    divisorReturnValue: 10 / 10,
                                    remainderReturnValue: 1 / 10
                                }
                            },
                            values: {
                                divisorReturnValue: 74,
                                remainderReturnValue: 74
                            }
                        },
                        envelope: {
                            durations: {
                                play: {
                                    divisorReturnValue: 10 / 10,
                                    remainderReturnValue: 1 / 10
                                },
                                silence: {
                                    divisorReturnValue: 0,
                                    remainderReturnValue: 0
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    fluid.defaults("floe.chartAuthoring.userTest.continuousSonifier", {
        gradeNames: ["floe.chartAuthoring.sonifier", "floe.chartAuthoring.userTest.sonifier.unitDivisorSonificationStrategyContinuous"]
    });

    fluid.defaults("floe.chartAuthoring.userTestDefault", {
        gradeNames: ["floe.chartAuthoring"],
        listeners: {
            "onToolReady.addExampleInput": {
                funcName: "{that}.updateDataEntryPanelFromDataSet",
                args: ["{that}.options.initialData"]
            }
        },
        templateLoader: {
            terms: {
                templatePrefix: "../src/html"
            }
        },
        initialData: smartPhoneData
    });

    fluid.defaults("floe.chartAuthoring.userTestContinuous", {
        gradeNames: ["floe.chartAuthoring"],
        listeners: {
            "onToolReady.addExampleInput": {
                funcName: "{that}.updateDataEntryPanelFromDataSet",
                args: ["{that}.options.initialData"]
            }
        },
        templateLoader: {
            terms: {
                templatePrefix: "../src/html"
            }
        },
        components: {
            chartAuthoringInterface: {
                options: {
                    components: {
                        sonifier: {
                            type: "floe.chartAuthoring.userTest.continuousSonifier"
                        }
                    }
                }
            }
        },
        initialData: smartPhoneData
    });

})(jQuery, fluid);
