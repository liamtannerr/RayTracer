# Ray Tracer

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

  * JSON scene file: define spheres, camera parameters, and image settings.
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

* Develop the front-end application to configure scene parameters and display renders.
* Host the back-end rendering service and front-end site on AWS free tier.

## Tools and Technologies

* C++11 for ray tracing logic
* ImageMagick for PPM to PNG conversion
* Express.js (Node.js) for rendering API
* ffmpeg for frame stitching into animations

## License

This project is for educational and portfolio purposes only.


