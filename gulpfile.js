var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var wrapper = require('gulp-wrapper');

gulp.task('build', function() {
	gulp.src([
		'src/Injector.js',
		'src/injector.js'
	])
	.pipe(concat('injector.js'))
	.pipe(wrapper({
		header: '(function() { "use strict"; \n',
		footer: '}());'
	}))
	.pipe(uglify())
	.pipe(gulp.dest('build'));
});