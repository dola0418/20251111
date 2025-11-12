// interation created by Ching-Yi Lin 
// more works //
   // 
// the first version by SamuelYAN
// more works //
   // https://twitter.com/SamuelAnn0924
   // https://www.instagram.com/samuel_yan_1990/
let mySize;

// a shader variable
let theShader;

// interaction-driven controls
let flowSpeed = 1.0;
let brightnessScale = 1.0;
let lastMouseY = null;
let scaleFactor = 1.0;
let lastMouseX = null;

// hand tracking state
let capture;
let hands;
let cameraFeed;
let fingerX = null;
let fingerY = null;
let lastFingerX = null;
let lastFingerY = null;

function preload(){
	theShader = new p5.Shader(this.renderer,vert,frag)
}

function setup() {
		mySize = min(windowWidth, windowHeight)*1.0;
  // shaders require WEBGL mode to work
  createCanvas(mySize/16*11, mySize, WEBGL);
  noStroke();

	// setup webcam capture (hidden)
	capture = createCapture({ video: true, audio: false }, () => {});
	capture.size(width, height);
	capture.hide();

	// initialize MediaPipe Hands if available
	if (window.Hands && window.Camera) {
		hands = new Hands({
			locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
		});
		hands.setOptions({
			maxNumHands: 1,
			modelComplexity: 1,
			minDetectionConfidence: 0.5,
			minTrackingConfidence: 0.5
		});
		hands.onResults((results) => {
			if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
				const lm = results.multiHandLandmarks[0];
				// index fingertip is landmark 8 (normalized coords, origin top-left)
				const tip = lm[8];
				lastFingerX = fingerX;
				lastFingerY = fingerY;
				fingerX = tip.x * width;
				// convert to shader's expected bottom-left origin by flipping Y later when sending uniform
				fingerY = tip.y * height;
			}
		});
		cameraFeed = new Camera(capture.elt, {
			onFrame: async () => {
				await hands.send({ image: capture.elt });
			},
			width: width,
			height: height
		});
		cameraFeed.start();
	}
}

function draw() {  
  // shader() sets the active shader with our shader
  shader(theShader);
  
	// compute vertical mouse movement
	let dy = 0.0;
	// prefer finger movement if available; fallback to mouse
	if (fingerY !== null && lastFingerY !== null) {
		dy = fingerY - lastFingerY; // up: negative, down: positive (screen coords top-left)
	} else if (lastMouseY !== null) {
		dy = mouseY - lastMouseY;
	}
	lastMouseY = mouseY;
	lastFingerY = fingerY;

	// map vertical movement: up -> accelerate and brighten, down -> decelerate and dim
	// scale deltas to reasonable ranges
	flowSpeed += (-dy) * 0.005;
	brightnessScale += (-dy) * 0.003;
	// clamp ranges
	flowSpeed = constrain(flowSpeed, 0.2, 3.0);
	brightnessScale = constrain(brightnessScale, 0.3, 2.0);

	// compute horizontal mouse movement for scaling: left -> smaller, right -> larger
	let dx = 0.0;
	if (fingerX !== null && lastFingerX !== null) {
		dx = fingerX - lastFingerX; // left: negative, right: positive
	} else if (lastMouseX !== null) {
		dx = mouseX - lastMouseX;
	}
	lastMouseX = mouseX;
	lastFingerX = fingerX;
	scaleFactor += dx * 0.003;
	scaleFactor = constrain(scaleFactor, 0.5, 2.0);

  theShader.setUniform("u_resolution", [width, height]);
	theShader.setUniform("u_time", millis() / 1000.0); 
  theShader.setUniform("u_frame", frameCount/10.0);
	// choose pointer position: fingertip if present, otherwise mouse
	const px = (fingerX !== null) ? fingerX : mouseX;
	const py = (fingerY !== null) ? (height - fingerY) : map(mouseY, 0, height, height, 0);
  theShader.setUniform("u_mouse", [px/100.0, py/100.0]);
	theShader.setUniform("u_speed", flowSpeed);
	theShader.setUniform("u_brightness", brightnessScale);
	// mouse-based radial push (pixels and params)
	theShader.setUniform("u_mousePx", [px, py]);
	theShader.setUniform("u_pushRadius", min(width, height)*0.25);
	theShader.setUniform("u_pushStrength", 1.0);
	theShader.setUniform("u_scale", scaleFactor);

  // rect gives us some geometry on the screen
  rect(0,0,width, height);
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
}

// function keyPressed() {
// 	//noLoop();
// 	saveCanvas("Shaders_0417_2024", "png");
// }


// interation created by Ching-Yi Lin 
// more works //
   // 
// the first version by SamuelYAN
// more works //
   // https://twitter.com/SamuelAnn0924
   // https://www.instagram.com/samuel_yan_1990/
