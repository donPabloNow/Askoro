// libs
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;
const wolfram = require('node-wolfram');
const gTTS = require('gtts');

// basic reqs
var request = require('request');
var fs = require('fs')
var ffmpeg = require('./ffmpeg')

//keys
let wit_key = process.env.WIT_KEY;
let wa_key = process.env.WA_KEY;

//apis
let Wit = null;
let interactive = null;

// inits
var nores = false;
var duration;

try {
	// if running from repo
	Wit = require('../').Wit;
} catch (e) {
	Wit = require('node-wit').Wit;
}

// init clients
const wit_client = new Wit({
	accessToken: wit_key
});
const wa_client = new wolfram(wa_key);



// converts webm to mp3 (need this for request to wit ai speech since they don't support webm)
function convert(input, output, callback) {
	ffmpeg(input)
		.output(output)
		.on('end', function() {
			console.log('conversion ended');
			callback(null);
		}).on('error', function(err) {
			console.log('error: ' + err);
			callback(err);
		}).run();
}


async function speechRecognition(path) {
	return new Promise(resolve => {
		// request to wit speech api for speech recognition
		var dataString = path;

		var headers = {
			'Authorization': `Bearer ${process.env.WIT_KEY}`,
			'Content-Type': 'audio/mpeg3'
		};

		var options = {
			url: 'https://api.wit.ai/speech?v=20200513/',
			method: 'POST',
			headers: headers,
			body: fs.createReadStream(dataString)
		};

		var q;

		request.post(options, (err, resp, b) => {
			if (!err && resp.statusCode == 200) {
				var body = JSON.parse(b)
				q = body.text
				resolve(q)
			}
		})

	})

}

function playres(e, text) {
    var file = 'site/audio/answer.mp3';
    var tts = new gTTS(text, 'en')


    tts.save(file, function(err, res) {
		if (err) {
			console.log(err)
		} else {
			console.log(text)
			console.log('Playing answer')

            // finally, send the audiofile to the renderer
		    e.sender.send('play', 'audio/answer.mp3')

        }
	})


}


// handle no result from wolfram
function noresult(e, question) {
	var tts = new gTTS(`Sorry nothing found for ${question}`, 'en')
	tts.save('site/audio/error.mp3', function(err, res) {
		if (err) {
			console.log(err)
		} else {
			console.log('Playing result')
			// finally, send the audiofile to the renderer
			e.sender.send('play', 'audio/error.mp3')

		}
	})

}




function query(e, question) {
	var text = '';
	// query and then receive the answer from wolfram
	wit_client.message(question, {}).then(obj => {
		console.log(obj);
		console.log(obj['entities']);

		wa_client.query(question, function(err, result) {
			if (err)
				console.log(err);
			else {
				console.log(result.queryresult.pod.length)
				if (typeof result.queryresult.pod.length === 'undefined' || result.queryresult.pod.length === 0) {
					nores = true;
				} else {

					// traversing the result to get the data we want
					for (var a = 0; a < result.queryresult.pod.length; a++) {
						var pod = result.queryresult.pod[a];
						if (pod.$.title.toLowerCase().includes('result')) {
							var subpod = pod.subpod[0];
							text = subpod.plaintext[0]
							nores = false
						}
					}
				}
			}
			// call nores after we are done changing nores value
			console.log('!res : ' + nores)
			if (text.length != 0) {
				playres(e, text)
			} else if (text.length == 0) {
				noresult(e, question)
			}


		})
	})
}


ipc.on('duration', (e, d)=>{
            duration = d;
            setTimeout(()=>e.sender.send('btn-state', 'enable'),d*1000)
            console.log(`Duration: ${duration}s`)

        })

ipc.on('query', async (e, path, buff) => {
	e.sender.send('btn-state', 'disable')
	// save user query as audio
	fs.createWriteStream(path).write(buff)
	var question;

	// call converion method
	convert('site/audio/query.webm', 'site/audio/query.mp3', async function(err) {
		if (!err) {
			console.log('conversion complete');

			// get the question as text (speech recognition method)
			question = await speechRecognition('site/audio/query.mp3')
			console.log("Prompt: " + question)

			if (typeof question === 'undefined') {
				var tts = new gTTS('Sorry, I did not understand. Please repeat your question', 'en')
				filepath = 'site/audio/error.mp3';
				tts.save(filepath, (err, res) => {
					// play error file in the render process
					if (!err) {
						e.sender.send('play', 'audio/error.mp3')
						setTimeout(() => e.sender.send('btn-state', 'enable'), 5100)
					} else {
						console.log(err)
					}
		})
			} else {
				// repeat question to the user
				var tts = new gTTS(`Looking for  ${question}`, 'en')
				tts.save('site/audio/askedQuestion.mp3', (err, res) => {
					// play error file in the render process
					if (!err) {
						e.sender.send('play', 'audio/askedQuestion.mp3')
						query(e, question)
                    } else {
						console.log(err)
					}
				})

			}

		}
	});

})

app.whenReady().then(() => {

	const window = new BrowserWindow({
		width: 1080,
		height: 720,
		icon: __dirname + '/icon.png',
		webPreferences: {
			nodeIntegration: true
		}
	})


	window.loadFile('site/index.html')
	window.setMenu(null)
})

