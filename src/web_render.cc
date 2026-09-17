// Separate entry point for the web app; the original main.cc stays independent.
#include "../inc/rtweekend.h"
#include "../inc/scene_element_list.h"
#include "../inc/sphere.h"
#include "../inc/camera.h"
#include "../inc/material.h"

int main() {
    camera cam;
    int height, count;
    double fx, fy, fz, tx, ty, tz, gr, gg, gb;
    // Only server-validated numeric data is sent through stdin.
    if (!(std::cin >> cam.image_width >> height >> cam.samples_per_pixel
        >> fx >> fy >> fz >> tx >> ty >> tz >> cam.vfov >> gr >> gg >> gb >> count)) return 1;
    if (cam.image_width < 160 || cam.image_width > 1280 || height < 90 || height > 720
        || cam.samples_per_pixel < 1 || cam.samples_per_pixel > 128 || count < 0 || count > 16) return 1;
    cam.aspect_ratio = double(cam.image_width) / height;
    cam.lookfrom = point3(fx, fy, fz);
    cam.lookat = point3(tx, ty, tz);
    cam.max_depth = 8;
    cam.defocus_angle = 0;
    scene_element_list world;
    world.add(make_shared<sphere>(point3(0, -1000, 0), 1000,
        make_shared<lambertian>(colour(gr, gg, gb))));
    for (int i = 0; i < count; ++i) {
        double x, y, z, radius, r, g, b, fuzz, index;
        int type;
        if (!(std::cin >> x >> y >> z >> radius >> type >> r >> g >> b >> fuzz >> index)) return 1;
        shared_ptr<material> mat;
        if (type == 0) mat = make_shared<lambertian>(colour(r, g, b));
        else if (type == 1) mat = make_shared<metal>(colour(r, g, b), fuzz);
        else if (type == 2) mat = make_shared<dielectric>(index);
        else return 1;
        world.add(make_shared<sphere>(point3(x, y, z), radius, mat));
    }
    cam.render(world);
}
