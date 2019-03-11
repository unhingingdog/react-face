A component and detects faces using the user media camera API, and injects face position data into an application using a render prop.

The face detection algorithm used is a modification of the Viola-Jones method called Pico, created by by Markuš et al. (2013) (https://github.com/nenadmarkus/pico). This component uses a JavaScript implementation called Pico.js by tehnokv (https://github.com/tehnokv/picojs).

I've adapted Pico.js to make detections with a dynamically adjusting canvas size and minimum face size. The approach ensures that the resources employed in the face detection process are minimal. The detection process is broken up into three parts. At minimum, one of these will run each frame, with the others running if time allows (i.e. it will detect either 20, 40, or 60 times per second, depending on the quality of the image, proximity of faces, and resource usage of the main thread). Ideally, detection would be made off the main thread using a web worker. However, this would greatly decrease the ease of integration, making it unsuitable for casual/experimental use.

This is released under an MIT license.