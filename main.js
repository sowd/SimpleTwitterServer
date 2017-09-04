const fs = require('fs');
const express = require('express') ;
const bodyParser = require('body-parser');
const https = require('https');


const SERVER_PORT = 1111 ;
const TWITTER_TIMEOUT_MS = 60*1000 ;


const log = console.log ;

const Twit = require('twit');

let twitter_oauth_info ;
try {
	twitter_oauth_info = JSON.parse(fs.readFileSync('twitter_auth_info.json').toString()) ;
} catch(e){
	console.error('Please specify Twitter oauth info to twitter_auth_info.json') ;
	process.exit(-1) ;
}

twitter_oauth_info.timeout_ms = TWITTER_TIMEOUT_MS ;

const twitter = new Twit(twitter_oauth_info);

let exp = express() ;
exp.use(bodyParser.urlencoded({ extended: true }));
exp.use(bodyParser.json());
exp.use (function (e, req, res, next){
    res.jsonp(e) ;	//Catch json error
});

let server = exp.listen(SERVER_PORT,function() {
	log('Web server is waiting on port '+SERVER_PORT+'.') ;
}) ;

// REST API call
exp.all('*', function(req, res, next){
	//for( var e in req ){if( typeof req[e] == 'string') log(e+':'+req[e]);}
	// var caller_ip = req.ip ;
	let args = req.body ;
	// Overwrite args in body with GET parameters
	if( req.originalUrl.indexOf('?') >= 0 ){
		req.originalUrl.slice(req.originalUrl.indexOf('?')+1).split('&').forEach(eq=>{
			var terms = eq.split('=') ;
			if( terms[0] == 'callback' || terms[0] == 'jsoncallback' )
				return ;
			if( terms.length == 1 ) args.value = terms[0] ;
			else					args[terms[0]] = decodeURIComponent(terms[1]) ;
		}) ;
	}

	if( req.path.indexOf('/f/')==0){
		const path = req.path.slice(3) ;
		console.log('path:'+path) ;
		console.log('args:'+JSON.stringify(args)) ;
		try {
			console.log('Method:'+req.method) ;
			console.log('Function?:'+typeof(twitter[req.method.toLowerCase()])) ;
			twitter[req.method.toLowerCase()](path,args,function(err,data,re){
				res.jsonp(err?err:data)
			});
		} catch (e){res.jsonp(e)}
	} else 
		res.jsonp({error:'No API is assigned on the URL.'});
}) ;
