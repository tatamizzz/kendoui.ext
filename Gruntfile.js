module.exports = function(grunt) {
    "use strict";
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        concat: {
            all: {
                src:[ ],
                dest:"src/js/kendo.web.js",
                matchBase : true
            }
        },
        build: {
            all: {
                src:[
                    "src/js/kendo.core.js",
                    "src/js/kendo.router.js",
                    "src/js/kendo.view.js",
                    "src/js/kendo.fx.js",
                    "src/js/kendo.data.odata.js",
                    "src/js/kendo.data.xml.js",
                    "src/js/kendo.data.js",
                    "src/js/kendo.binder.js",
                    "src/js/kendo.validator.js",
                    "src/js/kendo.userevents.js",
                    "src/js/kendo.draganddrop.js",
                    "src/js/kendo.mobile.scroller.js",
                    "src/js/kendo.groupable.js",
                    "src/js/kendo.reorderable.js",
                    "src/js/kendo.resizable.js",
                    "src/js/kendo.sortable.js",
                    "src/js/kendo.selectable.js",
                    "src/js/kendo.pager.js",
                    "src/js/kendo.popup.js",
                    "src/js/kendo.tooltip.js",
                    "src/js/kendo.list.js",
                    "src/js/kendo.calendar.js",
                    "src/js/kendo.datepicker.js",
                    "src/js/kendo.autocomplete.js",
                    "src/js/kendo.dropdownlist.js",
                    "src/js/kendo.combobox.js",
                    "src/js/kendo.multiselect.js",
                    "src/js/kendo.colorpicker.js",
                    "src/js/kendo.columnmenu.js",
                    "src/js/kendo.grid.js",
                    "src/js/kendo.listview.js",
                    "src/js/kendo.imagebrowser.js",
                    "src/js/kendo.editor.js",
                    "src/js/kendo.numerictextbox.js",
                    "src/js/kendo.menu.js",
                    "src/js/kendo.editable.js",
                    "src/js/kendo.filtermenu.js",
                    "src/js/kendo.panelbar.js",
                    "src/js/kendo.tabstrip.js",
                    "src/js/kendo.timepicker.js",
                    "src/js/kendo.datetimepicker.js",
                    "src/js/kendo.treeview.js",
                    "src/js/kendo.slider.js",
                    "src/js/kendo.splitter.js",
                    "src/js/kendo.upload.js",
                    "src/js/kendo.window.js"
                ],
                dest:"src/js/kendo.web.js"
            }
        },
        jshint:{
            grunt:{
                src:[ "Gruntfile.js" ,"src/js/kendo.*.js" ],
                options:{
                    jshintrc: ".jshintrc"
                }
            }
        },
        uglify: {
            all:{
                src:"src/js/kendo.web.js",
                dest:"js/kendo.web.min.js"
            }
        }
    });


    // build snippet from jquery
    grunt.registerMultiTask(
        "build",
        "Concatenate source (include/exclude modules with +/- flags), embed date/version",
        function() {

            // Concat specified files.
            var compiled = "",
            modules = this.flags,
            optIn = !modules["*"],
            explicit = optIn || Object.keys(modules).length > 1,
            name = this.data.dest,
            src = this.data.src,
            deps = {},
            excluded = {},
            version = grunt.config( "pkg.version" ),
            excluder = function( flag, needsFlag ) {
                // optIn defaults implicit behavior to weak exclusion
                if ( optIn && !modules[ flag ] && !modules[ "+" + flag ] ) {
                    excluded[ flag ] = false;
                }

                // explicit or inherited strong exclusion
                if ( excluded[ needsFlag ] || modules[ "-" + flag ] ) {
                    excluded[ flag ] = true;

                    // explicit inclusion overrides weak exclusion
                } else if ( excluded[ needsFlag ] === false &&
                           ( modules[ flag ] || modules[ "+" + flag ] ) ) {

                    delete excluded[ needsFlag ];

                    // ...all the way down
                    if ( deps[ needsFlag ] ) {
                        deps[ needsFlag ].forEach(function( subDep ) {
                            modules[ needsFlag ] = true;
                            excluder( needsFlag, subDep );
                        });
                    }
                }
            };

            // append commit id to version
            if ( process.env.COMMIT ) {
                version += " " + process.env.COMMIT;
            }

            // figure out which files to exclude based on these rules in this order:
            //  dependency explicit exclude
            //  > explicit exclude
            //  > explicit include
            //  > dependency implicit exclude
            //  > implicit exclude
            // examples:
            //  *                  none (implicit exclude)
            //  *:*                all (implicit include)
            //  *:*:-css           all except css and dependents (explicit > implicit)
            //  *:*:-css:+effects  same (excludes effects because explicit include is trumped by explicit exclude of dependency)
            //  *:+effects         none except effects and its dependencies (explicit include trumps implicit exclude of dependency)
            src.forEach(function( filepath ) {
                var flag = filepath.flag;

                if ( flag ) {

                    excluder(flag);

                    // check for dependencies
                    if ( filepath.needs ) {
                        deps[ flag ] = filepath.needs;
                        filepath.needs.forEach(function( needsFlag ) {
                            excluder( flag, needsFlag );
                        });
                    }
                }
            });

            // append excluded modules to version
            if ( Object.keys( excluded ).length ) {
                version += " -" + Object.keys( excluded ).join( ",-" );
                // set pkg.version to version with excludes, so minified file picks it up
                grunt.config.set( "pkg.version", version );
            }


            // conditionally concatenate source
            src.forEach(function( filepath ) {
                var flag = filepath.flag,
                specified = false,
                omit = false,
                messages = [];

                if ( flag ) {
                    if ( excluded[ flag ] !== undefined ) {
                        messages.push([
                                      ( "Excluding " + flag ).red,
                                      ( "(" + filepath.src + ")" ).grey
                        ]);
                        specified = true;
                        omit = !filepath.alt;
                        if ( !omit ) {
                            flag += " alternate";
                            filepath.src = filepath.alt;
                        }
                    }
                    if ( excluded[ flag ] === undefined ) {
                        messages.push([
                                      ( "Including " + flag ).green,
                                      ( "(" + filepath.src + ")" ).grey
                        ]);

                        // If this module was actually specified by the
                        // builder, then set the flag to include it in the
                        // output list
                        if ( modules[ "+" + flag ] ) {
                            specified = true;
                        }
                    }

                    filepath = filepath.src;

                    // Only display the inclusion/exclusion list when handling
                    // an explicit list.
                    //
                    // Additionally, only display modules that have been specified
                    // by the user
                    if ( explicit && specified ) {
                        messages.forEach(function( message ) {
                            grunt.log.writetableln( [ 27, 30 ], message );
                        });
                    }
                }

                if ( !omit ) {
                    compiled += grunt.file.read( filepath );
                }
            });

            // compiled = compiled.replace( /\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+/,"");
compiled = compiled.replace( /kendo_module\([^})]+\}\);/g , "");


// Embed Version
// Embed Date
compiled = compiled.replace( /@VERSION/g, version )
.replace( "@DATE", function () {
    // YYYY-MM-DD
    return ( new Date() ).toISOString().replace( /T.*/, "" );
});

// Write concatenated source to file
grunt.file.write( name, compiled );

// Fail task if errors were logged.
if ( this.errorCount ) {
    return false;
}

// Otherwise, print a success message.
grunt.log.writeln( "File '" + name + "' created." );
        });


        // grunt.loadNpmTasks("grunt-contrib-concat");
        grunt.loadNpmTasks("grunt-contrib-jshint");
        grunt.loadNpmTasks("grunt-contrib-uglify");

        // Default task(s).
        grunt.registerTask("default", ["build","uglify"]);

};
