// electron and fs
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;

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

const wolfram = require('node-wolfram');
const wa_client = new wolfram(wa_key);
const gTTS = require('gtts');


try {
  // if running from repo
  Wit = require('../').Wit;
} catch (e) {
  Wit = require('node-wit').Wit;
}

const wit_client = new Wit({accessToken: wit_key});


// converts webm to mp3 (need this for request to wit ai speech since they don't support webm)
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


async function speechRecognition(path){
        return new Promise(resolve =>{
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

            request.post(options,  (err, resp,  b)=>{
                    if (!err && resp.statusCode == 200) {
                        var body = JSON.parse(b)
                        q = body.text
                        resolve(q)
                    }
            })

    })

}


ipc.on('query', async (e, path, buff)=>{
    // save user query as audio
    fs.createWriteStream(path).write(buff)

    // call converion method
    convert('site/audio/query.webm', 'site/audio/query.mp3', async function(err){
       if(!err) {
            console.log('conversion complete');

            // get the question as text (speech recognition method)
            var question = await speechRecognition('site/audio/query.mp3')
            console.log("Prompt: " + question)
       }
    });


//     // query and then receive the answer from wolfram
//     wit_client.message(question, {}).then(obj=>{
//         console.log(obj);
//         console.log(obj['entities']);
//         query = obj['_text'];

//         console.log(`Question: ${query}`);

//         wa_client.query(query,  function(err, result){
//            if(err)
//                console.log(err);
//            else
//            {

//                for(var a=0; a<result.queryresult.pod.length; a++)
//                {
//                    var pod = result.queryresult.pod[a];
//                    if(pod.$.title.toLowerCase().includes('result')){
//                        var subpod = pod.subpod[0];
//                        console.log(subpod.plaintext[0])
//                        var tts = new gTTS(subpod.plaintext[0], 'en')
//                        tts.save('site/audio/answer.mp3', function(err, res){
//                            if(err){throw new Error(err)}
//                            else{
//                                 console.log('Play voice.mp3!')
//                                 // finally, send the audiofile to the renderer
//                                 e.sender.send('answer','audio/answer.mp3')

//                            }
//                        })
//                    }
//                }
//            }
//        })

//     })
})

app.whenReady().then(()=>{

    const window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences:{
            nodeIntegration: true
        }
    })


    window.loadFile('site/index.html')
    window.webContents.openDevTools();
    window.setMenu(null)
})

