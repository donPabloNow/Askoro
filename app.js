/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 */


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
  interactive = require('../').interactive;
} catch (e) {
  Wit = require('node-wit').Wit;
  interactive = require('node-wit').interactive;
}


const handleMessage =async (obj) => {
    //const getJoke = firstValue(traits, 'getJoke');
    //const greetings = firstValue(traits, 'wit$greetings');
    //const category = firstValue(entities, 'category:category');
    //const sentiment = firstValue(traits, 'wit$sentiment');
    console.log(obj);
    console.log(obj['entities']);
    question = obj['_text'];

    console.log(`Question: ${question}`);

    wa_client.query(question,  function(err, result){
        if(err)
            console.log(err);
        else
        {

            for(var a=0; a<result.queryresult.pod.length; a++)
            {
                var pod = result.queryresult.pod[a];
                if(pod.$.title.toLowerCase().includes('result')){
                    var subpod = pod.subpod[0];
                    console.log(subpod.plaintext[0])
                    var tts = new gTTS(subpod.plaintext[0], 'en')
                    tts.save('site/audio/voice.mp3', function(err, res){
                        if(err){throw new Error(err)}
                        else
                        { console.log('Play voice.mp3!')}
                    })
                }
            }
        }
    })

};

const client = new Wit({accessToken: wit_key});
interactive(client, handleMessage);









