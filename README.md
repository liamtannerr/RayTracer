# Ray Tracer

## Scene editor

Run the web app from the repository root:

```sh
npm run dev
```

Open the URL printed in the terminal (normally **http://127.0.0.1:5173**).
If the default port is busy, the app tries the next available port through 5183. Requires **Node.js 20+** and a C++ compiler
(`xcode-select --install` on macOS, or `g++` on Linux). There are no npm dependencies
to install. The command builds the renderer and starts the web server.

Start with Candy Shop, Mirror Garden, Floating Orbit, or the original trio using
the scene picker. Picking a scene replaces its objects, ground, and camera while
keeping your render settings; click Render scene to preview it. Reset restores the
selected preset.

Add, select, and remove spheres; choose diffuse, metal, or glass; edit position,
radius, color, roughness, and refraction. Adjust the camera position, target, and
field of view, then click **Render scene**. The initial scene renders automatically at 320 × 180 with 8 samples to keep
startup lightweight on free hosting.
The progress bar follows actual C++ scanlines. Cancel stops the rendering process;
**Download PNG** saves the last completed render, even after you edit the scene.
For sharper results on a faster server or locally, select **1280 × 720 · High detail**
and **128 · Ultra smooth**. On free hosting, increase quality gradually; high-detail
renders may reach the 2-minute timeout.
This provides four times the pixels and four times the samples of the previous maximum.
Scenes are kept in memory in the browser and reset on page reload.

The web app runs the existing C++ materials, camera, and intersection code through
`src/web_render.cc`. The original `src/main.cc` stays available for standalone use.
The built-in Node server serves the frontend and a streaming `/api/render` endpoint.

Server-enforced limits: 160–1280 pixels wide at 16:9, 4–128 samples per pixel,
16 editable spheres plus the ground, 8 ray bounces, a 2-minute timeout, and one
active render per server process. Requests also have a 16 KB size limit. A busy
server asks the next user to retry. These limits bound each job; a public deployment
should also apply per-client rate limiting at its proxy or hosting layer.

```sh
npm test       # C++ render, API validation, concurrency, and cancellation tests
npm start      # Build and run without development watching
```

`PORT` defaults to `5173`; `HOST` defaults to `127.0.0.1`. Set `HOST=0.0.0.0`
when hosting. Restart `npm run dev` after changing C++ sources to rebuild them;
refresh the browser after changing frontend files.

### Deployment

This app needs a long-running Node server and the native renderer, so deploy it
to a container host or VM. A static-only host cannot run the render API.

```sh
docker build -t ray-studio .
docker run --rm -p 5173:5173 ray-studio
```

The Docker build compiles C++ in a separate stage; the runtime runs as an unprivileged
user. Point your HTTPS proxy at port 5173, preserve the request Host header, disable
response buffering for `/api/render`, and allow at least 125 seconds for responses.
No generated images or scenes are stored on the server.

## Overview

This repository contains a custom C++ ray tracer inspired by *Ray Tracing in One Weekend*. It renders scenes of spheres with various materials and camera configurations. The output is written to a PPM file, which can be converted to PNG for viewing.

## Features

* **Geometry**

  * Spheres: define objects by center coordinates and radius.
* **Camera**

  * Position: specify `lookfrom`, `lookat`, and `vup` vectors.
  * Field of view: vertical FOV control.
  * Aspect ratio: adjust width-to-height ratio.
* **Materials**

  * Lambertian (diffuse): matte surfaces with albedo color.
  * Metal: reflective surfaces with adjustable roughness (`fuzz`).
  * Dielectric (glass): transparent materials with index of refraction.
* **Image Settings**

  * Resolution: configurable width and height.
  * Anti-aliasing: sample count per pixel.
* **Scene Input**

  * Browser scene editor: configure spheres, camera parameters, and image settings.
* **Conversion and Animation**

  * PPM to PNG conversion (ImageMagick).
  * Frame generation for animations via ffmpeg scripts.

## Progression Gallery

![Initial gradient sphere](https://github.com/user-attachments/assets/ee4f6084-97d1-4758-a10d-e7c4040dd33b)
*The very first render, showing a simple gradient sphere.*

![Grassy hill background](https://github.com/user-attachments/assets/87eba55e-5732-4ac7-ac7c-3324b6e360f9)
*Added a large background sphere to mimic a grassy hill.*

![Diffuse sphere](https://github.com/user-attachments/assets/cb8ec282-40d5-4c46-86e3-873b49c7074b)
*Experimentation with ray reflections to create a diffuse sphere.*

![Shiny metal spheres](https://github.com/user-attachments/assets/64d3e540-032c-4632-86d5-df502a2aa7a1)
*Rendering two perfect mirrors to demonstrate shiny metal materials.*

![Rough metal](https://github.com/user-attachments/assets/b00b040d-20d2-4a15-b7c1-b8f6edb2ab70)
*Added `fuzz` for dull reflections on metal surfaces.*

![Glass material and camera movement](https://github.com/user-attachments/assets/3dafd770-6e2a-47c6-bab0-6e61168b52d0)
*Added camera bird's-eye view and glass-like dielectric material.*

![Final scene](https://github.com/user-attachments/assets/71753d7a-ed54-4f6b-878b-272969097c07)
*Final scene incorporating all current features.*

![Focused view](https://github.com/user-attachments/assets/7caa6b3d-d5ed-4c77-8b6f-eec18bcfa4f7)
*Focused view with narrow FOV on the mirrored sphere.*

## Future Plans

* Add scene save/load and more geometry to the scene editor.
* Host the back-end rendering service and front-end site on AWS free tier.

## Tools and Technologies

* C++11 for ray tracing logic
* ImageMagick for PPM to PNG conversion
* Node.js built-in HTTP server for the scene editor and rendering API
* ffmpeg for frame stitching into animations

## License

This project is for educational and portfolio purposes only.


