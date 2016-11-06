"use strict";

var gulp   = require("gulp"),    
    sass = require("gulp-sass"),
    autoprefixer = require("gulp-autoprefixer"),
    cleanCSS = require("gulp-clean-css"),    
    notify = require("gulp-notify"),
    jshint = require("gulp-jshint"),
    uglify = require("gulp-uglify"),
    stripDebug = require('gulp-strip-debug'),
    livereload = require("gulp-livereload"),
    http = require("http"),
    st = require("st"),    
    rename = require("gulp-rename");

var settings = new function () {
  this.src = "src";
  this.demoHtml = "demo/**/*.html";
  this.demoCSS = "demo/stylesheets/css";
  this.demoSCSS = "demo/stylesheets/scss";
  this.demoJS = "demo/js";  
  this.dist = "dist";
};

/****************************\
 * MOSAIC
\****************************/
//Linting
gulp.task("lint", function() {
  return gulp.src(settings.src + "/**/*.js")
    .pipe(jshint())
    .pipe(jshint.reporter("jshint-stylish"));
});
//Dist and uglify
gulp.task("js", function() {
  return gulp.src(settings.src + "/**/*.js")      
    .pipe(gulp.dest(settings.dist))    
    .pipe(gulp.dest(settings.demoJS))
    .pipe(stripDebug())
    .pipe(uglify())
    .pipe(rename({suffix: ".min"}))    
    .pipe(gulp.dest(settings.dist))
    .pipe(gulp.dest(settings.demoJS))
    .pipe(livereload());
});
gulp.task("mosaicStyles", function() {
    return gulp.src(settings.src + "/**/*.scss")
        .pipe(sass({ outputStyle: 'expanded' })
            .on('error', sass.logError))
            .on("error", notify.onError(function(error) { return "Error: " + error.message; }))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false,
        	remove: false
        }))        
        .pipe(gulp.dest(settings.dist))
        .pipe(gulp.dest(settings.demoCSS))
        .pipe(notify({
            title: "Success",
            message: "<%= file.relative %> compiled!"
        }))        
        .pipe(livereload());
});

/****************************\
 * DEMO
\****************************/
gulp.task("demoStyles", function() {
    return gulp.src(settings.demoSCSS + "/**/*.scss")
        .pipe(sass({ outputStyle: 'compressed' })
            .on('error', sass.logError))
            .on("error", notify.onError(function(error) { return "Error: " + error.message; }))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false,
        	remove: false
        }))
        .pipe(cleanCSS())
        .pipe(gulp.dest(settings.demoCSS))
        .pipe(notify({
            title: "Success",
            message: "<%= file.relative %> compiled!"
        }))        
        .pipe(livereload());
});

/****************************\
 * IMPORT ANIMATE.CSS
\****************************/
var animateCssFiles = [
    "AnimateCSS/animate.css",
    "AnimateCSS/animate.min.css"
];

gulp.task("ImportAnimateCSS", function () {    
    return gulp.src(animateCssFiles)
        .pipe(gulp.dest(settings.dist));
});

/****************************\
 * LIVE RELOAD
\****************************/
//http://localhost:8080/
//Remember to enable livereload in chrome - https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei?hl=en
gulp.task("server", function(done) {
    http.createServer(        
        st({ path: __dirname, index: "index.html", cache: false })
    ).listen(8080, done);    

  console.log("Serving on: http://localhost:8080/");  
});
gulp.task("performLiveReload", function () {
    return gulp.src(settings.demoHtml)
    .pipe(livereload());    
});

gulp.task("default", ["init"], function() {
    livereload.listen();

    //Mosaic
    gulp.watch(settings.src + "/**/*.js", ["lint", "js"]);
    gulp.watch(settings.src + "/**/*.scss", ["mosaicStyles"]);

    //Import AnimateCSS
    gulp.watch(animateCssFiles, ["ImportAnimateCSS"]);

    //DEMO
    gulp.watch(settings.demoSCSS + "/**/*.scss", ["demoStyles"]);
    gulp.watch(settings.demoHtml, ["performLiveReload"]);
});

gulp.task("init", ["server", "lint", "demoStyles", "js", "mosaicStyles", "ImportAnimateCSS"]);