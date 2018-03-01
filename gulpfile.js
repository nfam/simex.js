var gulp = require('gulp');
var gulpif = require('gulp-if');
var change = require('gulp-change');
var concat = require('gulp-concat');
var strip = require('gulp-strip-comments');
var ts = require('gulp-typescript');

const license =
`/**
 * @license
 * Copyright (c) 2015 Ninh Pham <ninhpham@hotmail.com>
 *
 * Use of this source code is governed by The MIT license.
 */
`;

gulp.task('build', function() {
    return gulp.src(['src/**/*.ts'])
    .pipe(concat('simex.ts'))
    .pipe(change((content) => {
        return content.split('\n').map((line) => {
            if (line.startsWith('export /* internal */')) {
                return line.substring('export /* internal */'.length);
            } else if (line.startsWith('import { /* internal */')) {
                return '';
            } else {
                return line;
            }
        }).join('\n');
    }))
    .pipe(ts({
        "target": "es5",
        "module": "umd",
        "declaration": true,
        "noImplicitAny": true
    }))
    .pipe(gulpif('*.d.ts', change((content) => {
        return content.split(license).join('');
    })))
    .pipe(gulpif('*.js', strip()))
    .pipe(change(content => license + content))
    .pipe(gulp.dest('dist/'));
})
