'use strict'
var mangad = require('./index')
var mkdirp = require('mkdirp')
var http = require('http')
var fs = require('fs')
// 
const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();
myEmitter.on('event', function() {
  console.log('an event occurred!');
});
myEmitter.emit('event');

myEmitter.on('launch', function(jobs, jobPool) {
	jobs = jobs.sort(function(a,b) {return a.jobIndex - b.jobIndex} )
	console.log("start downloading ... " + jobs.length)

	for (let jobId =0; jobId < jobPool; jobId ++) {
		runNext(jobs, jobId)
	}
})


const JOBS_POOL = 10

// mkdirp('/tmp/foo/bar/baz', function (err) {
//     if (err) console.error(err)
//     else console.log('pow!')
// });

var jobs = new Array()
//http://www.hanhan88.com/comic/18169/
//1815553
mangad.getChapterURLs('http://www.hanhan88.com/comic/1815553/', (urls) => {
	let categoryNumber = urls.length;
	var categoryCount = 0;
	console.log("get " + categoryNumber + " chapters")
	urls.forEach((url, urlIndex) => {
		mangad.getPics(url, function(albums){
			console.log("get pics from album " + urlIndex)
			albums.forEach((album, albumIndex) => {
				console.log("add jobs [" + urlIndex + "] for [" + albumIndex + "]")
				// console.log("add jobs --> " +urlIndex + " ==> " + album)
				var str = "" + albumIndex
				var pad = "0000"
				var ans = pad.substring(0, pad.length - str.length) + str
				let filename = ans + '.jpg'
				jobs.push({jobIndex: urlIndex * 1000 + albumIndex ,url: album, directory: './download/jojo_' + (urlIndex + 1), fileName: filename})
			});
			categoryCount ++

			if (categoryCount == categoryNumber) {
				myEmitter.emit('launch', jobs, JOBS_POOL)
			}
		})			
	})
})

function runNext(jobsArr, id) {
	var param = jobsArr.shift()
	if (param == undefined) {
		return
	}
	console.log("downloading --> [" + id + "] -->" + param.jobIndex)
	var directory = param.directory
	var fileName = param.fileName
	var url = param.url
	mkdirp(directory, function (err) {
    	if (err) console.error(err)
    	else download(url, directory, fileName, () => {
    		runNext(jobsArr, id)
    	})
	});
}

function download(url, directory, fileName, next) {
		// console.log('downloading: ' + url)
		http.get(url , function(res){
	      var imgData = '';
	      res.setEncoding('binary'); //一定要设置response的编码为binary否则会下载下来的图片打不开
	      res.on('data', function(chunk){
	          imgData+=chunk;
	      });
	      res.on('end', function(){
  			    
				// console.log('write: ' + directory + '/' + fileName)
	            fs.writeFile(directory + '/' + fileName, imgData, 'binary', function(err){
	            	// console.log('finish write: ' + directory + '/' + fileName)
	            	if (next) {
	            		next()
	            	}
	           });
		    });
		}).on('error', function(e) {
			console.error(e);
			console.error("failed to download: " + url)
			next()
		});
}


// var excuters = setTimeout(() => {
// 	jobs = jobs.sort(function(a,b) {return a.jobIndex - b.jobIndex} )
// 	console.log("start downloading ... " + jobs.length)

// 	for (let jobId =0; jobId < JOBS_POOL; jobId ++) {
// 		runNext(jobs, jobId)
// 	}
// }, 16000)


