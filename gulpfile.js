const { src, dest, parallel, series, watch } = require('gulp'),
      path = require('path'),
      wrap = require('gulp-wrap'),
      declare = require('gulp-declare'),
      concat = require('gulp-concat'),
      merge = require('merge-stream'),
      handlebars = require('gulp-handlebars'),
      stylus = require('gulp-stylus'),
      postcss = require('gulp-postcss'),
      autoprefixer = require('autoprefixer'),
      lost = require('lost'),
      babel = require('gulp-babel'),
      cssnano = require('cssnano'),
      uglify = require('gulp-uglify'),
      browserSync = require('browser-sync').create()

function copyJS() {
  return src('src/js/*.js')
  .pipe(dest('public/js'))
}

function jsBabel() {
  return src('src/js/main.js')
    .pipe(babel({presets: ['@babel/env']}))
    .pipe(uglify())
    .pipe(dest('public/js'))
    .pipe(browserSync.stream())
}

function copyVendorJS() {
  return src('src/js/vendor/*.js')
    .pipe(dest('public/js/vendor'))
}

function copyCSS() {
  return src('src/css/*.css')
    .pipe(dest('public/css'))
}

function styles() {
  const processors = [
    lost,
    autoprefixer(),
    cssnano()
  ]

  return src('src/stylus/style.styl')
    .pipe(stylus())
    .pipe(postcss(processors))
    .pipe(dest('public/css'))
    .pipe(browserSync.stream())
}

function copyImg() {
  return src('src/img/*.png')
    .pipe(dest('public/img'))
}

function handlebarsRunTime(){
  return src('node_modules/handlebars/dist/handlebars.runtime.js')
    .pipe(dest('public/js/'))
}

function templates() {
  // Assume all partials start with an underscore
  // You could also put them in a folder such as source/templates/partials/*.hbs
  var partials = src(['src/templates/partials/_*.hbs'])
    .pipe(handlebars())
    .pipe(wrap('Handlebars.registerPartial(<%= processPartialName(file.relative) %>, Handlebars.template(<%= contents %>))', {}, {
      imports: {
        processPartialName: function(fileName) {
          // Strip the extension and the underscore
          // Escape the output with JSON.stringify
          return JSON.stringify(path.basename(fileName, '.js').substr(1))
        }
      }
    }))

  const templates = src('src/templates/**/[^_]*.hbs')
    .pipe(handlebars())
    .pipe(wrap('Handlebars.template(<%= contents %>)'))
    .pipe(declare({
      namespace: 'MyApp.templates',
      noRedeclare: true // Avoid duplicate declarations
    }))

  // Output both the partials and the templates as build/js/templates.js
  return merge(partials, templates)
    .pipe(concat('templates.js'))
    .pipe(dest('public/js/'))
}

function watcher() {
  watch(['./src/stylus/**/*.styl'], styles)
  watch(['./src/js/**/*.js'], jsBabel)
}

function browsersync() { 
  return browserSync.init({
    server: {
        baseDir: './public'
    }
  })
}

exports.default = series(copyJS, jsBabel, copyVendorJS, copyCSS, styles, copyImg, handlebarsRunTime, templates, parallel(browsersync, watcher))