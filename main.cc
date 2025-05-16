#include <iostream>
#include "vec3.h"
#include "colour.h"
#include "ray.h"


double hit_sphere(const point3& center, double radius, const ray& r) {
    vec3 oc = center - r.origin();
    auto a = r.direction().length_squared();
    auto h = dot(r.direction(), oc);
    auto c = oc.length_squared() - radius*radius;
    auto discriminant = h*h - a*c;

    if (discriminant < 0){
        return -1.0;
    } else {
        return (h - std::sqrt(discriminant)) / a;
    }
}

colour ray_colour(const ray& r) {
    auto t = hit_sphere(point3(0,0,-1), 0.5, r);
    if (t > 0.0){
        vec3 N = unit_vector(r.at(t) - vec3(0,0,-1));
        std::clog << "\033[32mRed: " << N.x() + 1 << " Green: " << 0 << " Blue: " << N.y() + 1 << "\033[0m\n";        
        return 0.5 * colour(N.x() + 1, 0, N.y() + 1);
    }

    vec3 unit_direction = unit_vector(r.direction());
    auto a = 0.5*(unit_direction.y() + 1.0);
    auto blue = colour(0.5, 0.7, 1.0);
    auto white = colour(1.0, 1.0, 1.0);
    return (1.0-a)*white + a*blue;
}

int main (){

    //image

    auto aspect_ratio = 16.0/ 9.0;
    int image_width = 400;

    //Calculate the image height based on the aspect ratio and ensure it's at least 1
    int image_height = int(image_width / aspect_ratio);
    image_height = (image_height < 1) ? 1 : image_height;

    //Camera

    auto focal_length = 1.0;
    auto viewport_height = 2.0;
    //Can't just use aspect_ratio as image_width / image_height might not be exactly 16.0 / 9.0
    auto viewport_width = viewport_height * (double(image_width) / image_height);
    auto camera_center = point3(0, 0, 0);

    //Calculate the vectors across the horizontal and down the vertical viewport edges.
    auto viewport_u = vec3(viewport_width, 0, 0);
    auto viewport_v = vec3(0, -viewport_height, 0);

    //Calculate the horizontal and vertical delta vectors from pixel to pixel
    auto pixel_delta_u = viewport_u / image_width;
    auto pixel_delta_v = viewport_v / image_height;

    //Calculate the location of the upper left pixel
    auto viewport_upper_left = camera_center - vec3(0, 0, focal_length) - (viewport_u + viewport_v)/2;
    auto centre_top_left_pixel = viewport_upper_left + (pixel_delta_u + pixel_delta_v)/2;

    //Create header for image file
    std::cout <<"P3\n" <<image_width << ' ' << image_height << "\n255\n";
    //Render

    //Fill the image row by row
    for(int j = 0; j < image_height; j++){
        //Create a progress bar for long renders
        std::clog << "\rScanlines remaining: " << (image_height - j) << ' ' << "\n" << std::flush;
        for(int i = 0; i < image_width; i++){
            auto pixel_center = centre_top_left_pixel + (i * pixel_delta_u) + (j * pixel_delta_v);
            auto ray_direction = pixel_center - camera_center;
            ray r(camera_center, ray_direction);

            colour pixel_colour = ray_colour(r);
            //std::clog << "Red: " << pixel_colour.x() << " Blue: " << pixel_colour.y() << " Green: " << pixel_colour.z() << "\n";
            write_colour(std::cout, pixel_colour);
        }
    }

    std::clog << "\rDone.                      \n";
}