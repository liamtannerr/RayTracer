# Ray Tracer – Work in Progress

## Overview

This repository contains a custom **C++ ray tracer** inspired by *Ray Tracing in One Weekend*. It features basic support for rendering 3D scenes with **spheres**, **camera movement**, and **materials** such as metal and dielectric surfaces. It also includes early experiments with generating **ray-traced animations** using `ffmpeg`.

Planned features include:
- Reflection and refraction
- Texturing and surface roughness
- More complex geometry
- Physically accurate lighting and shadows
- Optimized rendering using bounding volume hierarchies

## Ray Tracing Background

**Ray tracing** simulates the way light interacts with objects to produce highly realistic images. Rays are projected from a virtual camera into a scene, and their paths are traced as they bounce, refract, or are absorbed by surfaces. The pixel colors are determined based on these interactions.

This technique is widely used in **visual effects**, **animation**, and **photorealistic rendering** for games and simulations.

## Development Highlights

- Implementing vector algebra and basic geometry primitives
- Building a recursive ray-coloring function
- Designing a basic scene with light-absorbing, metallic, and transparent materials
- Creating simple animations by rendering frames and stitching them together using `ffmpeg`

## Demo Animations
![Screenshot 2025-07-06 at 12 31 08 AM](https://github.com/user-attachments/assets/7caa6b3d-d5ed-4c77-8b6f-eec18bcfa4f7)
![Screenshot 2025-07-07 at 7 41 30 PM](https://github.com/user-attachments/assets/71753d7a-ed54-4f6b-878b-272969097c07)
![Screenshot 2025-07-04 at 11 57 20 PM](https://github.com/user-attachments/assets/b00b040d-20d2-4a15-b7c1-b8f6edb2ab70)
<img width="1425" alt="Screenshot 2025-06-16 at 9 04 48 PM" src="https://github.com/user-attachments/assets/64d3e540-032c-4632-86d5-df502a2aa7a1" />
<img width="1658" alt="Screenshot 2025-06-15 at 8 30 29 PM" src="https://github.com/user-attachments/assets/cb8ec282-40d5-4c46-86e3-873b49c7074b" />
<img width="1658" alt="Screenshot 2025-06-15 at 8 30 17 PM" src="https://github.com/user-attachments/assets/87eba55e-5732-4ac7-ac7c-3324b6e360f9" />
<img width="1557" alt="Screenshot 2025-06-08 at 8 45 45 PM" src="https://github.com/user-attachments/assets/ee4f6084-97d1-4758-a10d-e7c4040dd33b" />


## Tools & Technologies

- **C++**
- **ffmpeg** for video creation
- **Object-Oriented Design**

## Status

This project is a **work in progress**. More features and optimizations will be added over time. The current goal is to complete a visually compelling animation using physically based rendering techniques.

## License

This project is for **educational and portfolio purposes** only.
