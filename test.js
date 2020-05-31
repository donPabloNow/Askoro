var request = require('request');
var fs = require('fs')
var ffmpeg = require('./ffmpeg')

var headers = {
    'Authorization': `Bearer ${process.env.WIT_KEY}`,
    'Content-Type': 'audio/mpeg3'
};

function convert(input, output, callback) {
    ffmpeg(input)
        .output(output)
        .on('end', function() {
            console.log('conversion ended');
            callback(null);
        }).on('error', function(err){
            console.log('error: ' + err);
            callback(err);
        }).run();
}

convert('site/audio/query.webm', 'site/audio/query.mp3', function(err){
   if(!err) {
       console.log('conversion complete');
   }

});

var dataString = 'site/audio/query.mp3';

var options = {
    url: 'https://api.wit.ai/speech?v=20200513/',
    method: 'POST',
    headers: headers
    //body: fs.createReadStream(dataString)
};

function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log(body);
    }
}

request.post(options, callback);

