'use strict'

var http = require("http")
var fs = require('fs')
var cheerio = require('cheerio')
var mkdirp = require('mkdirp');
var iconv = require('iconv-lite');

var mangad = {}

const S = 'S'
const PIC_LIST_URL = 'var PicListUrl = "'
const KEY = 'tahfcioewrm' // decode key

/**
* parse the attribute 's' (server index) in a URL
*/
function parseS(url) {
	var intPos = url.indexOf("?");
	var strRight = url.substr(intPos + 1);

	var arrTmp = strRight.split("*");
	for(var i = 0; i < arrTmp.length; i++)
	{
		var arrTemp = arrTmp[i].split("=");
		if(arrTemp[0].toUpperCase() == S) return arrTemp[1];
	}
	return "";
}

/*
* Get a encrypted string of a list of pictures
*/
function getPicURLs(targetURL, callback) {
	http.get(targetURL, function(res) {
	    var data = "";
	    res.on('data', function (chunk) {
	      data += chunk;
	    });
	    res.on("end", function() {
	      data.split("\r").forEach(function(str) {
	      	var tag = PIC_LIST_URL
	      	let index = str.indexOf(tag)
	      	if (index > 0) {
	      		var data = str.substring(index + tag.length, str.length - 2)
	      		callback(data)
	      	}
	      })
	    });
	}).on("error", function() {
	    callback(null);
	});
}

/**
* decode 
*/
function decode(s,sk) 
{
	let sw="hanhan88.com|hhcomic.com|hanhan8.com";
	let su = 'www.hanhan88.com';
	let b=false;
	for(let i=0;i<sw.split("|").length;i++) {
	    if(su.indexOf(sw.split("|")[i])>-1) {
	        b=true;
	        break;
        }
    }
    if(!b)return "";
	let k=sk.substring(0,sk.length-1);
	let f=sk.substring(sk.length-1);
	for(let i=0;i<k.length;i++) {
	    eval("s=s.replace(/"+ k.substring(i,i+1) +"/g,'"+ i +"')");
	}
    let ss = s.split(f);
	var s="";
	for(let i=0;i<ss.length;i++) {
	    s+=String.fromCharCode(ss[i]);
    }
    return s;
}

function getDomain(index) {
	var ServerList=new Array(16);
	ServerList[0]="http://104.237.55.70:9393/dm01/";
	ServerList[1]="http://64.185.235.244:9393/dm02/";
	ServerList[2]="http://64.185.235.244:9393/dm03/";
	ServerList[3]="http://104.237.55.70:9393/dm04/";
	ServerList[4]="http://104.237.55.70:9393/dm05/";
	ServerList[5]="http://104.237.55.70:9393/dm06/";
	ServerList[6]="http://104.237.55.70:9393/dm07/";
	ServerList[7]="http://104.237.55.70:9393/dm08/";
	ServerList[8]="http://64.185.235.244:9393/dm09/";
	ServerList[9]="http://104.237.55.70:9393/dm10/";
	ServerList[10]="http://64.185.235.244:9393/dm11/";
	ServerList[11]="http://64.185.235.244:9393/dm12/";
	ServerList[12]="http://104.237.55.70:9393/dm13/";
	ServerList[13]="http://104.237.55.70:9393/dm14/";
	ServerList[14]="http://104.237.55.70:9393/dm15/";
	ServerList[15]="http://104.237.55.70:9393/dm16/";
	return ServerList[index]
}

mangad.getPics = function(url, callback) {
	getPicURLs(url, function(cryptedPicUrl) {
		if (cryptedPicUrl == undefined) {
			// console.log('unable to get the encrypted pic urls')
			callback()
		}

		let serverIndex = parseS(url)	
		let domain = getDomain(serverIndex - 1)	
		let picUrls=decode(cryptedPicUrl, KEY);

		var arrPicListUrl = picUrls.split('|');
		let index = 0
		arrPicListUrl.forEach(function(str) {
			arrPicListUrl[index] = domain + str
			index ++
		})
		callback(arrPicListUrl)
	})
}

mangad.getChapterURLs = function(tagetURL, callback) {
	http.get(tagetURL, function(res) {
	    var data = "";
	    res.on('data', function (chunk) {
	      data += chunk;
	    });
	    res.on("end", function() {
	    	var domain = extracDomain(tagetURL)
	      let $ = cheerio.load(data)
	     
	      var arr = new Array()
	      $('ul.bi li a[href]').each((a,b) => {
	      	let href = $(b).attr('href');
	      	if (href.indexOf('javascript:') < 0) {
	      		arr.push(domain + href)
	      	}
	      })
	      callback(arr.reverse())
	    });
	}).on("error", function() {
	    callback(null);
	});
}

function extracDomain(url) {
	var matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
	return matches && matches[0]
}

module.exports = mangad