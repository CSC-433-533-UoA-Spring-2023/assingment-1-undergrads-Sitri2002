/*
  Basic File I/O for displaying
  Skeleton Author: Joshua A. Levine
  Modified by: Amir Mohammad Esmaieeli Sikaroudi
  Email: amesmaieeli@email.arizona.edu
  Student Submission: Jack Nguyen
  Student Email: anhnguyen2002@arizona.edu
*/

// Access DOM elements
var input = document.getElementById("load_image");
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// Image properties
var width = 0;
var height = 0;
var ppm_img_data;
var animationRunning = false;

// Function to process upload
var upload = function () {
	if (input.files.length > 0) {
		var file = input.files[0];
		console.log("You chose", file.name);
		if (file.type) console.log("It has type", file.type);
		var fReader = new FileReader();
		fReader.readAsBinaryString(file);

		fReader.onload = async function () {
			// Stop any previous animation before starting a new one
			animationRunning = false;
			await sleep(100);

			// Load and parse the new image
			parsePPM(fReader.result);
			startAnimation();
		};
	}
};

// Function to start animation
function startAnimation() {
	animationRunning = true;
	var centerX = width / 2;
	var centerY = height / 2;
	var newImageData = ctx.createImageData(width, height);
	var transMatrix = GetTranslationMatrix(0, height); // Translate image
	var toOriginMatrix = GetTranslationMatrix(-centerX, -centerY); // shift to origin
	var fromOriginMatrix = GetTranslationMatrix(centerX, centerY); // shift back to image center
	var scaleMatrix = GetScalingMatrix(1, -1); // Flip image y axis
	var flipMatrix = MultiplyMatrixMatrix(transMatrix, scaleMatrix); // Mix the translation and scale matrices

	var angle = 0; // Starting angle

	async function animate() {
		while (animationRunning) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			angle += 1.8 % 360; // Rotate a single cycle every 2s

			var rotationMatrix = GetRotationMatrix(-angle); // Calculate the new flat rotation matrix
			var transformAndRotateMatrix = MultiplyMatrixMatrix(
				fromOriginMatrix,
				MultiplyMatrixMatrix(rotationMatrix, toOriginMatrix)
			); // shift to origin, rotate, then shift back
			var matrix = MultiplyMatrixMatrix(flipMatrix, transformAndRotateMatrix); // apply the static flip matrix

			// Loop through all the pixels in the image and set its color
			for (var i = 0; i < ppm_img_data.data.length; i += 4) {
				// Get the pixel location in x and y with (0,0) being the top left of the image
				var pixel = [Math.floor(i / 4) % width, Math.floor(i / 4) / width, 1];
				// Get the location of the sample pixel
				var samplePixel = MultiplyMatrixVector(matrix, pixel);
				// Floor pixel to integer
				samplePixel[0] = Math.floor(samplePixel[0]);
				samplePixel[1] = Math.floor(samplePixel[1]);
				setPixelColor(newImageData, samplePixel, i);
			}

			// Draw the new image
			ctx.putImageData(
				newImageData,
				canvas.width / 2 - width / 2,
				canvas.height / 2 - height / 2
			);

			// Show transformation matrix
			showMatrix(matrix);
			await sleep(100);
		}
	}

	animate();
}
// Show transformation matrix on HTML
function showMatrix(matrix) {
	for (let i = 0; i < matrix.length; i++) {
		for (let j = 0; j < matrix[i].length; j++) {
			matrix[i][j] = Math.floor(matrix[i][j] * 100) / 100;
		}
	}
	document.getElementById("row1").innerHTML =
		"row 1:[ " + matrix[0].toString().replaceAll(",", ",\t") + " ]";
	document.getElementById("row2").innerHTML =
		"row 2:[ " + matrix[1].toString().replaceAll(",", ",\t") + " ]";
	document.getElementById("row3").innerHTML =
		"row 3:[ " + matrix[2].toString().replaceAll(",", ",\t") + " ]";
}

// Sets the color of a pixel in the new image data
function setPixelColor(newImageData, samplePixel, i) {
	var offset = ((samplePixel[1] - 1) * width + samplePixel[0] - 1) * 4;

	// Set the new pixel color
	newImageData.data[i] = ppm_img_data.data[offset];
	newImageData.data[i + 1] = ppm_img_data.data[offset + 1];
	newImageData.data[i + 2] = ppm_img_data.data[offset + 2];
	newImageData.data[i + 3] = 255;
}

// Load PPM Image to Canvas
// Untouched from the original code
function parsePPM(file_data) {
	/*
	 * Extract header
	 */
	var format = "";
	var max_v = 0;
	var lines = file_data.split(/#[^\n]*\s*|\s+/); // split text by whitespace or text following '#' ending with whitespace
	var counter = 0;
	// get attributes
	for (var i = 0; i < lines.length; i++) {
		if (lines[i].length == 0) {
			continue;
		} //in case, it gets nothing, just skip it
		if (counter == 0) {
			format = lines[i];
		} else if (counter == 1) {
			width = lines[i];
		} else if (counter == 2) {
			height = lines[i];
		} else if (counter == 3) {
			max_v = Number(lines[i]);
		} else if (counter > 3) {
			break;
		}
		counter++;
	}
	console.log("Format: " + format);
	console.log("Width: " + width);
	console.log("Height: " + height);
	console.log("Max Value: " + max_v);
	/*
	 * Extract Pixel Data
	 */
	var bytes = new Uint8Array(3 * width * height); // i-th R pixel is at 3 * i; i-th G is at 3 * i + 1; etc.
	// i-th pixel is on Row i / width and on Column i % width
	// Raw data must be last 3 X W X H bytes of the image file
	var raw_data = file_data.substring(file_data.length - width * height * 3);
	for (var i = 0; i < width * height * 3; i++) {
		// convert raw data byte-by-byte
		bytes[i] = raw_data.charCodeAt(i);
	}
	// update width and height of canvas
	document.getElementById("canvas").setAttribute("width", window.innerWidth);
	document.getElementById("canvas").setAttribute("height", window.innerHeight);
	// create ImageData object
	var image_data = ctx.createImageData(width, height);
	// fill ImageData
	for (var i = 0; i < image_data.data.length; i += 4) {
		let pixel_pos = parseInt(i / 4);
		image_data.data[i + 0] = bytes[pixel_pos * 3 + 0]; // Red ~ i + 0
		image_data.data[i + 1] = bytes[pixel_pos * 3 + 1]; // Green ~ i + 1
		image_data.data[i + 2] = bytes[pixel_pos * 3 + 2]; // Blue ~ i + 2
		image_data.data[i + 3] = 255; // A channel is deafult to 255
	}
	ctx.putImageData(
		image_data,
		canvas.width / 2 - width / 2,
		canvas.height / 2 - height / 2
	);
	ppm_img_data = image_data;
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

//Connect event listeners
input.addEventListener("change", upload);
