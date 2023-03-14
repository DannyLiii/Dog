const { src, dest, series, parallel, watch } = require("gulp");
const autoprefixer = require('gulp-autoprefixer'); //用於自動為CSS样式添加瀏覽器器前綴
const sourcemaps = require('gulp-sourcemaps');   //映射回原始源代碼，用於調適和查找问题
const imagemin = require('gulp-imagemin');  //圖片壓縮
const clean = require('gulp-clean');  //清空指定的目錄，或者删除指定的文件
const uglify = require("gulp-uglify");  //壓縮JavaScript代碼。它可以删除不必要的空格、註釋、換行，提高性能
const rename = require("gulp-rename");  //重命名文件。它可以將文件名或者路徑名修改為指定的名稱，或者通過指定的函数生成新的名稱
const cleanCSS = require("gulp-clean-css"); //用於壓縮CSS文件
const babel = require('gulp-babel'); //將ES6+代碼轉換為ES5代碼。它使用了Babel轉換器，可以將最新版本的js代碼轉換為較舊的版本，以便在不支持新語法的瀏覽器或環境中运行。
const sass = require("gulp-sass")(require("sass"));  //SASS代碼轉換為CSS代碼
const fileinclude = require("gulp-file-include");  //將多个文件合併成一个文件，並且可以在其中包含其他文件或代碼區塊，將重複的代碼和組合進行重用及管理．
const browserSync = require('browser-sync');  //引入插件browserSync
const reload = browserSync.reload; //引用並自動監聽及加載頁面

//搬家語法
function move() {
  return src("src/index.html").pipe(dest("dist"));
}
exports.m = move;


// 清除舊檔案
function clear() {
  return src('dist' ,{ read: false ,allowEmpty: true })//不去讀檔案結構，增加刪除效率  / allowEmpty : 允許刪除空的檔案
  .pipe(clean({force: true})); //強制刪除檔案 
}

exports.c = clear

//  css minify
function cssminify() {
  return src("src/css/style.css").pipe(cleanCSS()).pipe(dest("dist/css"));
}

exports.cssm = cssminify;

// php move
function phpmove() {
  return src(['src/php/*.php','src/php/**/*.php','src/php/**/**/*.php']).pipe(dest("dist/php"));
}
// js minify
function jsmove() {
  return src(['src/js/*.js','src/js/**/*.js']).pipe(dest("dist/js"));
}
// js優化
function jsmini() {
  return src(['src/js/*.js','src/js/**/*.js','src/js/**/**/*.js']).pipe(uglify()).pipe(dest("dist/js"));
}

// js es6 -> es5
function babel5() {
    return src(['src/js/*.js','src/js/**/*.js','src/js/**/**/*.js'])
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(uglify())
        .pipe(dest('dist/js'));
}

exports.es5 = babel5;
exports.js = jsmini;
exports.jsm = jsmove;


// sass complier
// 沒壓縮css
function sassStyle() {
  return src("src/sass/*.scss")
    .pipe(sourcemaps.init())//初始化
    .pipe(sass.sync().on("error", sass.logError)) // sass -> css
    .pipe(sourcemaps.write())//寫入
    .pipe(autoprefixer({
      cascade: false
  }))
    .pipe(dest("dist/css"));
}

// 有壓縮
function sassStyleMini() {
  return src("src/sass/*.scss")
  .pipe(sourcemaps.init())
  .pipe(sass.sync().on("error", sass.logError)) // sass ->css
  .pipe(sourcemaps.write())
    .pipe(cleanCSS()) // minify css
    .pipe(autoprefixer({
      cascade: false
     }))
    .pipe(
      rename({
        extname: ".min.css",
      })
    )
    .pipe(dest("dist/css"));
}

exports.style = sassStyle;
exports.styleMini = sassStyleMini;


// html template
function html() {
  return src("src/*.html")
    .pipe(
      fileinclude({
        prefix: "@@",
        basepath: "@file",
      })
    )
    .pipe(dest("dist/"));
}

exports.template = html


// 打包圖片img、png、svg到dist
function img(){
   return src(['src/img/*.*','src/img/**/*.*']).pipe(dest('dist/img'))
}
function otherPng(){
  return src(['src/img/*.png','src/img/**/*.png']).pipe(dest('dist/img'))
}
function otherSvg(){
  return src(['src/img/*.svg','src/img/**/*.svg']).pipe(dest('dist/img'))
}
exports.img = img;
exports.png = otherPng;
exports.svg = otherSvg;

//圖片壓縮
function imgmini(){
  return src(['src/img/**/**/*.*' ,'src/img/*.*','src/img/**/*.*'])
  .pipe(imagemin([
    imagemin.mozjpeg({quality: 80, progressive: true}) // 壓縮品質      quality越低 -> 壓縮越大 -> 品質越差 

]))
  .pipe(dest('dist/img/'))
}

exports.minifyimg = imgmini;

// 監看所有變動
function watchfile(){
  watch(['src/*.html' , 'src/compement/*.html'] ,html)
  watch(['src/sass/*.style' , 'src/sass/**/*.scss'] ,sassStyle)
  watch('src/js/*.js' , jsmini)
  watch(['src/img/*.*', 'src/img/**/*.*'] , img)
}


//瀏覽器同步
function browser(done) {
    browserSync.init({
        server: {
            baseDir: "./dist",
            index: "index.html"
        },
        port: 3000
    });
    watch(['src/*.html' , 'src/compoment/*.html'] ,html).on('change' , reload)
    watch(['src/sass/*.style' , 'src/sass/**/*.scss'] ,sassStyle).on('change' , reload)
    watch(['src/js/*.js', 'src/js/**/*.js'], jsmove).on('change' , reload)
    watch(['src/php/*.php','src/php/**/*.php','src/php/**/**/*.php'], phpmove).on('change' , reload)
    watch(['src/img/*.*', 'src/img/**/*.*'] , img).on('change' , reload)
    watch(['src/img/*.png','src/img/**/*.png'] , otherPng).on('change' , reload)
    watch(['src/img/*.svg','src/img/**/*.svg'] , otherSvg).on('change' , reload)
    done();
}

//開發用
exports.default = series(parallel(html , sassStyle ,jsmove ,img, otherSvg, otherPng,phpmove) , browser);


// 打包上線用
exports.package = series(clear,parallel(html ,sassStyle , babel5 , imgmini,otherSvg,otherPng,phpmove))
// exports.package = series(clear,parallel(html ,sassStyleMini , babel5 , imgmini))
