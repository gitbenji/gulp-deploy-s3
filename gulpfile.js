const gulp = require('gulp');
const awspublish = require('gulp-awspublish');
const AWS = require('aws-sdk');
const merge = require('merge-stream');
const minifyJs = require('gulp-uglify');
const minifyHTML = require('gulp-htmlmin');
const minifyCss = require('gulp-clean-css');

function deploy() {
  // create a new publisher using S3 options
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property
  const publisher = awspublish.create({
    region: process.env.AWS_REGION,
    params: {
      Bucket: process.env.AWS_BUCKET,
    },
    credentials: new AWS.SharedIniFileCredentials({ profile: process.env.AWS_PROFILE }),
  }, {
    cacheFileName: 'your-cache-location',
  });

  // define custom headers
  const headers = {
    'Cache-Control': 'max-age=315360000, no-transform, public',
  };

  const push = gulp.src('./public/**')
    // publisher will add Content-Length, Content-Type and headers specified above
    .pipe(awspublish.gzip({ ext: '' }))

    // If not specified it will set x-amz-acl to public-read by default
    .pipe(publisher.publish(headers))

    // create a cache file to speed up consecutive uploads
    .pipe(publisher.cache())

     // print upload updates to console
    .pipe(awspublish.reporter());

  return push;
}

gulp.task('deploy', deploy);

function ready() {
  const css = gulp.src('../public/css/*.css')
    .pipe(minifyCss())
    .pipe(gulp.dest('./public/css'));

  const js = gulp.src('../public/js/*.js')
    .pipe(minifyJs())
    .pipe(gulp.dest('./public/js'));

  const html = gulp.src('../public/*.html')
    .pipe(minifyHTML())
    .pipe(gulp.dest('./public'));

  const media = gulp.src('../public/media/*')
    .pipe(gulp.dest('./public/media'));

  return merge(css, js, html, media);
}

gulp.task('ready', ready);

gulp.task('default', ['ready', 'deploy']);
