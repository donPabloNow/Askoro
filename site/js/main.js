var pieces, radius, fft, analyzer, mapMouseX, mapMouseY, audio, toggleBtn, uploadBtn, uploadedAudio, uploadAnim;
var colorPalette = ["white", "black", "black", "black"];
var uploadLoading = false;
var record, btn, chunks;

navigator.getUserMedia({audio:true}, stream=>{handleStream(stream)}, error=>{ handleError(error) });

function handleStream(stream){
    record= new MediaRecorder(stream)
    chunks = []
    record.onstop = function(e){
        var blob = new Blob(chunks, {'type': 'audio/ogg; codecs=opus'})
        chunks= []
        var audioURL = URL.createObjectURL(blob)
        console.log(audioURL)
        console.log(chunks)
    }
    record.ondataavailable = function(e){
        chunks.push(e.data);


    }

}

function handleError(e){
    console.log(e)
}



/*=============================================
  SETUP
=============================================*/



function preload() {
	audio = loadSound("audio/voice.mp3");
}

function uploaded(file) {
	uploadLoading = true;
	uploadedAudio = loadSound(file.data, uploadedAudioPlay);
}



function uploadedAudioPlay(audioFile) { uploadLoading = false; 
	if (audio.isPlaying()) {
		audio.pause();
	}

	audio = audioFile;
	audio.loop();
}

function setup() {

	uploadAnim = select('#uploading-animation');

	createCanvas(windowWidth, windowHeight);
	toggleBtn = createButton("Speak");

	toggleBtn.addClass("toggle-btn");
    btn = toggleBtn;
	toggleBtn.mouseClicked(toggleMic);

	analyzer = new p5.Amplitude();
	fft = new p5.FFT();

}



/*=============================================
  DRAW
=============================================*/
function draw() {

	// Add a loading animation for the uploaded track
	// -----------------------------------------------
	if (uploadLoading) {
		uploadAnim.addClass('is-visible');
	} else {
		uploadAnim.removeClass('is-visible');
	}

	background(colorPalette[0]);

	translate(windowWidth / 2, windowHeight / 2);

	level = analyzer.getLevel();
	fft.analyze();

	var bass = fft.getEnergy(100, 150);
	var treble = fft.getEnergy(150, 250);
	var mid = fft.getEnergy("mid");

	var mapMid = map(mid, 0, 255, -100, 200);
	var scaleMid = map(mid, 0, 255, 1, 1.5);

	var mapTreble = map(treble, 0, 255, 200, 350);
	var scaleTreble = map(treble, 0, 255, 0, 1);

	var mapbass = map(bass, 0, 255, 50, 200);
	var scalebass = map(bass, 0, 255, 0.05, 1.2);

	//mapMouseX = map(mouseX, 0, width, 1, 50);
	//mapMouseXbass = map(mouseX, 0, width, 1, 5);
	//mapMouseY = map(mouseY, 0, height, 2, 6);

	pieces = 20;
	radius = 100;

	for (i = 0; i < pieces; i += 0.1) {

		rotate(TWO_PI / (pieces / 2));

		noFill();

		/*----------  BASS  ----------*/
		push();
		stroke(colorPalette[1]);
		rotate(frameCount * 0.002);
		strokeWeight(0.5);
        //polygon(mapbass + i, mapbass - i, 15* i, 2);
		pop();


		/*----------  MID  ----------*/
		push();
		stroke(colorPalette[2]);
		strokeWeight(0.2);
		polygon(mapMid + i / 2, mapMid - i * 2, 10* i, 7);
		pop();


		/*----------  TREMBLE  ----------*/
		push();
		stroke(colorPalette[3]);
		strokeWeight(0.6);
		scale(mouseX * 0.0005);
		polygon(mapTreble + i / 2, mapTreble - i / 2, 50 * i / 2, 3);
		pop();

	}

}


function btnInit(text){
    btn.remove()
    btn = createButton(text)
    btn.addClass('toggle-btn')
    btn.mousePressed(toggleMic)

}

function toggleMic() {
    console.log('clicked!')
    try{
        // on click switch state
        // after a second click process the query

        if(record.state == 'recording'){
            // stop recording
            btnInit('speak')
            record.stop()
            console.log(record.state)
        }
        else if(record.state == 'inactive'){
            // start recording
            btnInit('stop')
            record.start()
            console.log(record.state)

        }

    }catch(e){
        console.log(e)
    }
}


function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}

function polygon(x, y, radius, npoints) {
	var angle = TWO_PI / npoints;
	beginShape();
	for (var a = 0; a < TWO_PI; a += angle) {
		var sx = x + cos(a) * radius;
		var sy = y + sin(a) * radius;
		vertex(sx, sy);
	}
	endShape(CLOSE);
}