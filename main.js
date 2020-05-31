// electron and fs
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;
const fs = require('fs')


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




ipc.on('query', (e, path, buff)=>{
    fs.createWriteStream(path).write(buff)

    // query and then receive the answer from wolfram
    // wit_client.message(question, {}).then(obj=>{
    //    console.log(obj);
    //    console.log(obj['entities']);
    //    question = obj['_text'];

    //    console.log(`Question: ${question}`);

    //    wa_client.query(question,  function(err, result){
    //        if(err)
    //            console.log(err);
    //        else
    //        {

    //            for(var a=0; a<result.queryresult.pod.length; a++)
    //            {
    //                var pod = result.queryresult.pod[a];
    //                if(pod.$.title.toLowerCase().includes('result')){
    //                    var subpod = pod.subpod[0];
    //                    console.log(subpod.plaintext[0])
    //                    var tts = new gTTS(subpod.plaintext[0], 'en')
    //                    tts.save('site/audio/answer.mp3', function(err, res){
    //                        if(err){throw new Error(err)}
    //                        else
    //                        { console.log('Play voice.mp3!')}
    //                    })
    //                }
    //            }
    //        }
    //    })

    //})
    // finally, send the audiofile to the renderer
    e.sender.send('answer','audio/answer.mp3')
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
