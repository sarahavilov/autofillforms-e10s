'use strict';

var gulp = require('gulp');
var change = require('gulp-change');
var babel = require('gulp-babel');
var gulpif = require('gulp-if');
var gulpFilter = require('gulp-filter');
var shell = require('gulp-shell');
var wait = require('gulp-wait');
var clean = require('gulp-clean');
var zip = require('gulp-zip');
var rename = require('gulp-rename');
var util = require('gulp-util');
var runSequence = require('run-sequence');

/* clean */
gulp.task('clean', function () {
  return gulp.src([
    'builds/unpacked/chrome/*',
    'builds/unpacked/firefox/*',
    'builds/unpacked/safari/*',
  ], {read: false})
    .pipe(clean());
});
/* chrome build */
gulp.task('chrome-build', function () {
  return gulp.src([
    'src/**/*'
  ])
  .pipe(gulpFilter(function (f) {
    if (f.relative.endsWith('.DS_Store') || f.relative.endsWith('Thumbs.db')) {
      return false;
    }
    if (f.relative.indexOf('firefox') !== -1 && !f.relative.endsWith('.png')) {
      return false;
    }
    if (f.relative.indexOf('safari') !== -1 && !f.relative.endsWith('.png')) {
      return false;
    }
    if (f.path.indexOf('/locale') !== -1) {
      return false;
    }
    if (f.relative.split('/').length === 1) {
      return f.relative === 'manifest.json' ? true : false;
    }
    return true;
  }))
  .pipe(gulpif(f => f.relative.endsWith('.html'), change(function (content) {
    return content.replace(/.*shadow_index\.js.*/, '    <script src="chrome/chrome.js"></script>\n    <script src="index.js"></script>');
  })))
  .pipe(gulpif(f => f.relative.endsWith('popup/index.html'), change(function (content) {
    return content.replace('<script src="index.js"></script>', '<script src="fuse.js"></script>\n    <script src="index.js"></script>');
  })))
  .pipe(gulp.dest('builds/unpacked/chrome'))
  .pipe(zip('chrome.zip'))
  .pipe(gulp.dest('builds/packed'));
});
gulp.task('chrome-install', function () {
  gulp.src('')
  .pipe(wait(1000))
  .pipe(shell([
    '"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --load-and-launch-app=`pwd` &'
  ], {
    cwd: './builds/unpacked/chrome'
  }));
});

/* firefox build */
gulp.task('firefox-build', function () {
  return gulp.src([
    'src/**/*'
  ])
  .pipe(gulpFilter(function (f) {
    if (f.relative.endsWith('.DS_Store') || f.relative.endsWith('Thumbs.db')) {
      return false;
    }
    if (f.path.indexOf('_locales') !== -1) {
      return false;
    }
    if (f.relative.indexOf('chrome') !== -1 &&
      !f.relative.endsWith('.manifest') &&
      !f.relative.endsWith('.png') &&
      f.relative.indexOf('firefox/chrome') === -1
    ) {
      return false;
    }
    if (f.relative.indexOf('shadow_index.js') !== -1) {
      return false;
    }
    if (f.relative.indexOf('safari') !== -1) {
      return false;
    }
    if (f.relative.split('/').length === 1) {
      return ['package.json', 'chrome.manifest'].indexOf(f.relative) !== -1;
    }
    return true;
  }))
  .pipe(gulpif(f => f.relative.endsWith('.html'), change(function (content) {
    return content.replace(/\n.*shadow_index\.js.*/, '');
  })))
  .pipe(gulp.dest('builds/unpacked/firefox'));
});
/* firefox pack */
gulp.task('firefox-pack', function () {
  return gulp.src('')
  .pipe(wait(1000))
  .pipe(shell([
    'jpm xpi',
    'mv *.xpi ../../packed/firefox.xpi',
    'jpm post --post-url http://localhost:8888/'
  ], {
    cwd: './builds/unpacked/firefox'
  }))
  .pipe(shell([
    'zip firefox.xpi icon.png icon64.png',
  ], {
    cwd: './builds/packed'
  }));
});
/* safari build */
gulp.task('safari-build', function () {
  return gulp.src([
    'src/**/*'
  ])
  .pipe(gulpFilter(function (f) {
    if (f.relative.endsWith('.DS_Store') || f.relative.endsWith('Thumbs.db')) {
      return false;
    }
    if (f.relative.indexOf('firefox') !== -1 && !f.relative.endsWith('.png')) {
      return false;
    }
    if (f.relative.indexOf('chrome') !== -1 && !f.relative.endsWith('.png')) {
      return false;
    }
    if (f.path.indexOf('/locale') !== -1) {
      return false;
    }
    if (f.relative.split('/').length === 1) {
      return f.relative === 'Icon-64.png' || f.relative.endsWith('.plist');
    }
    return true;
  }))
  .pipe(gulpif(f => f.relative.endsWith('.html'), change(function (content) {
    return content.replace(/.*shadow_index\.js.*/, '    <script src="safari/safari.js"></script>\n    <script src="fuse.js"></script>\n    <script src="index.js"></script>');
  })))
  .pipe(gulpif(function (f) {
    return f.path.endsWith('.js') &&
      !f.relative.endsWith('EventEmitter.js') &&
      !f.relative.endsWith('regtools.js')
  }, babel({
    presets: ['es2015']
  })))
  .pipe(gulp.dest('builds/unpacked/safari/src.safariextension'))
  .pipe(zip('safari.zip'))
  .pipe(gulp.dest('builds/packed'));
});
/* */
gulp.task('chrome', function (callback) {
  runSequence('clean', 'chrome-build', 'chrome-install', callback);
});
gulp.task('firefox', function (callback) {
  runSequence('clean', 'firefox-build', 'firefox-pack', callback);
});
gulp.task('safari', function (callback) {
  runSequence('clean', 'safari-build', callback);
});
