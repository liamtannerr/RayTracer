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
field of view, then click **Render scene**. A bundled PNG of Candy shop appears
immediately. The browser wakes the backend in the background without rendering;
the editor stays usable while it connects. Clicking **Render scene** during startup
shows a short message asking you to try again once the renderer is ready. No render
is queued automatically. The default quality is 640 × 360 with 16 samples (Balanced).
Completed rows appear live from top to bottom, and the progress bar tracks rows
received. Cancel stops the rendering process and leaves the partial preview visible;
**Download PNG** saves the last completed render, even after you edit the scene or
cancel a new render. During a new render, the link is labeled **Download previous PNG**.
For sharper results on a faster server or locally, select **1280 × 720 · High detail**
and **128 · Ultra smooth**. Higher settings take longer to render. The application
does not impose a render time limit; keep the page open until rendering completes.
This provides four times the pixels and four times the samples of the previous maximum.
Scenes are kept in memory in the browser and reset on page reload.

The web app runs the existing C++ materials, camera, and intersection code through
`src/web_render.cc`. The original `src/main.cc` stays available for standalone use.
The built-in Node server provides `/api/health` and a streaming `/api/render`
endpoint. It also serves the frontend locally; production can host the frontend separately.

Server-enforced limits: 160–1280 pixels wide at 16:9, 4–128 samples per pixel,
16 editable spheres plus the ground, 8 ray bounces, and one
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

#### Vercel frontend + Render backend

Both deployments use this repository. Vercel serves only the static editor and
placeholder PNG; Render runs the Node API and native C++ renderer.

1. Keep (or create) the **Render Web Service** using the root `Dockerfile`. The
   container defaults to API-only mode (`SERVE_FRONTEND=false`). Set its health
   check path to `/api/health`.
2. Import the repository into **Vercel**, with the repository root as Root
   Directory and **Other** as the framework. The checked-in `vercel.json` runs
   `npm run build:web` and publishes `dist`; it does not compile C++.
3. In Vercel, set **`BACKEND_URL=https://your-service.onrender.com`** before
   deploying. Use just the origin, without `/api` or other paths. This is a public
   API address, not a secret. Changing it requires a new frontend deployment.
4. In Render, set **`ALLOWED_ORIGINS=https://your-project.vercel.app`** and redeploy
   the service. Use exact frontend origins without trailing slashes. Add a custom
   domain or specific Vercel preview URLs as comma-separated entries if needed;
   unrelated origins are rejected. Use the Vercel URL as the public site link.

On arrival the frontend requests `/api/health` directly from Render. That HTTP
request wakes a sleeping free service. Startup responses and connection failures
are retried for up to two minutes; afterward the editor offers a retry through
**Render scene**. Polling stops on success, so an open tab does not continually
keep the service awake. After a minute without a health check, clicking Render
checks the connection again; click again once ready. The saved preview stays
visible until the user starts a render, including after the backend wakes.

Render requests go directly to the API with an explicit CORS allowlist, preserving
streaming and cancellation without a Vercel function or proxy timeout. The browser
never navigates to Render's startup screen. See [Render's free-service behavior](https://render.com/docs/free)
and [Vercel's project configuration](https://vercel.com/docs/project-configuration/vercel-json).

To build the static frontend yourself:

```sh
BACKEND_URL=https://your-service.onrender.com npm run build:web
```

The default PNG was rendered from `createScene('candy')` using the project's C++
renderer at 640 × 360 and 16 samples, then converted from PPM to PNG. It is an
example only; downloads become available after the user completes a render.

#### Single-container deployment (optional)

Local `npm run dev` still serves both frontend and backend on one origin. To run
that same arrangement in Docker, explicitly enable frontend serving:

```sh
docker build -t ray-studio .
docker run --rm -p 5173:5173 -e SERVE_FRONTEND=true ray-studio
```

The Docker build compiles C++ in a separate stage; the runtime runs as an unprivileged
user. Point your HTTPS proxy at port 5173, preserve the request Host header, disable
response buffering for `/api/render`, and configure the proxy to allow long-running
streamed responses without a fixed response-duration limit.
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

## Tools and Technologies

* C++11 for ray tracing logic
* ImageMagick for PPM to PNG conversion
* Node.js built-in HTTP server for the scene editor and rendering API
* ffmpeg for frame stitching into animations

## License

This project is for educational and portfolio purposes only.
