/*
Copyright 2015-2016 OCAD University

Licensed under the Educational Community License (ECL), Version 2.0 or the New
BSD license. You may not use this file except in compliance with one these
Licenses.

You may obtain a copy of the ECL 2.0 License and BSD License at
https://raw.githubusercontent.com/fluid-project/chartAuthoring/master/LICENSE.txt
*/

// Declare dependencies
/* global module */

module.exports = function (grunt) {
    "use strict";

    var licenseWrapper = function (libraryName, licenseFilePath) {
        return "/* " + libraryName + "\n" + grunt.file.read(licenseFilePath) + "*/\n";
    };

    var d3License = licenseWrapper("D3", "src/lib/d3/LICENSE");
    var flockingMITLicense = licenseWrapper("Flocking", "src/lib/flocking/MIT-LICENSE.txt");
    var infusionLicense = licenseWrapper("Infusion", "src/lib/infusion/infusion-LICENSE.txt");

    // Project configuration.
    grunt.initConfig({
        // Project package file destination.
        pkg: grunt.file.readJSON("package.json"),
        jshint: {
            all: ["**/*.js"],
            buildScripts: ["Gruntfile.js"],
            options: {
                jshintrc: true
            }
        },
        jsonlint: {
            all: ["package.json", ".jshintrc", "src/**/*.json", "tests/**/*.json", "demos/**/*.json"]
        },
        copy: {
            // Copy external front end dependencies into appropriate directories
            frontEndDependencies: {
                files: [
                    // D3
                    {expand: true, cwd: "./node_modules/d3/", src: "**", dest: "./src/lib/d3/"},
                    // Flocking
                    {expand: true, cwd: "./node_modules/flocking/", src: "**", dest: "./src/lib/flocking/"}
                ]
            }
        },
        concat: {
            options: {
                separator: ";"
            },
            d3WithLicense: {
                options: {
                    banner: d3License
                },
                src: ["src/lib/d3/d3.min.js"],
                dest: "dist/d3-with-license.js"
            },
            flockingWithLicense: {
                options: {
                    banner: flockingMITLicense
                },
                src: ["src/lib/flocking/dist/flocking-base.js", "src/lib/flocking/src/ugens/oscillators.js", "src/lib/flocking/src/ugens/math.js",
                "src/lib/flocking/src/ugens/envelopes.js",
                "src/lib/flocking/src/ugens/midi.js",
                "src/lib/flocking/src/ugens/scheduling.js"],
                dest: "dist/flocking-with-license.js"
            },
            infusionWithLicense: {
                options: {
                    banner: infusionLicense
                },
                src: ["src/lib/infusion/infusion-custom.js"],
                dest: "dist/infusion-with-license.js"
            },
            dist: {
                src: ["dist/d3-with-license.js",
                 "dist/infusion-with-license.js",
                 "dist/flocking-with-license.js",
                "src/js/*.js"],
                dest: "dist/chartAuthoring-full.js",
                nonull: true
            }
        },
        clean: {
            distArtifacts: {
                src: ["dist/*-with-license.js"]
            }
        },
        uglify: {
            options: {
                preserveComments: "all"
            },
            distUglify: {
                src: "dist/chartAuthoring-full.js",
                dest: "dist/chartAuthoring-full.min.js"
            }
        }
    });
    // Load the plugin(s):
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-jsonlint");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-uglify");

    // Custom tasks:

    grunt.registerTask("default", ["lint"]);
    grunt.registerTask("lint", "Apply jshint and jsonlint", ["jshint", "jsonlint"]);
    grunt.registerTask("dist", "Build single-file distrbituion", ["concat", "uglify", "clean:distArtifacts"]);
};
