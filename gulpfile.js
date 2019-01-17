const { src, dest, parallel } = require('gulp');
const path = require('path');
const wrap = require('gulp-wrap');
const declare = require('gulp-declare');
const concat = require('gulp-concat');
const merge = require('merge-stream');
const handlebars = require('gulp-handlebars');
const stylus = require('gulp-stylus');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const lost = require('lost');

function copyJS() {
  return src('src/js/*.js')
    .pipe(dest('public/js'));
}

function copyVendorJS() {
  return src('src/js/vendor/*.js')
    .pipe(dest('public/js/vendor'));
}

function copyCSS() {
  return src('src/css/*.css')
    .pipe(dest('public/css'));
}

function styles() {
  const processors = [
    lost,
    autoprefixer()
  ];

  return src('src/stylus/style.styl')
    .pipe(stylus())
    .pipe(postcss(processors))
    .pipe(dest('public/css'));
};

function copyImg() {
  return src('src/img/*.png')
    .pipe(dest('public/img'));
}

function handlebarsRunTime(){
  return src('node_modules/handlebars/dist/handlebars.runtime.js')
    .pipe(dest('public/js/'));
};

function templates() {
  // Assume all partials start with an underscore
  // You could also put them in a folder such as source/templates/partials/*.hbs
  var partials = src(['src/templates/partials/_*.hbs'])
    .pipe(handlebars())
    .pipe(wrap('Handlebars.registerPartial(<%= processPartialName(file.relative) %>, Handlebars.template(<%= contents %>));', {}, {
      imports: {
        processPartialName: function(fileName) {
          // Strip the extension and the underscore
          // Escape the output with JSON.stringify
          return JSON.stringify(path.basename(fileName, '.js').substr(1));
        }
      }
    }));

  const templates = src('src/templates/**/[^_]*.hbs')
    .pipe(handlebars())
    .pipe(wrap('Handlebars.template(<%= contents %>)'))
    .pipe(declare({
      namespace: 'MyApp.templates',
      noRedeclare: true // Avoid duplicate declarations
    }));

  // Output both the partials and the templates as build/js/templates.js
  return merge(partials, templates)
    .pipe(concat('templates.js'))
    .pipe(dest('public/js/'));
};

exports.default = parallel(copyJS, copyVendorJS, copyCSS, styles, copyImg, handlebarsRunTime, templates);