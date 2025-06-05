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

**(Coming Soon)**  
Planned demos include:
- **Solar system orbit simulation** with camera movement
- **Reflective spheres** with dynamic lighting
- **Animated camera path** to showcase parallax and depth

## Tools & Technologies

- **C++**
- **ffmpeg** for video creation
- **Object-Oriented Design**
- **Makefiles** and custom rendering loops

## Status

This project is a **work in progress**. More features and optimizations will be added over time. The current goal is to complete a visually compelling animation using physically based rendering techniques.

## License

This project is for **educational and portfolio purposes** only.
