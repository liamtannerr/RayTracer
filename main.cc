#include <iostream>
#include <vec3.h>
#include <colour.h>

int main (){

    //Create inital square image dimensions
    int imgWidth = 256;
    int imgHeight = 256;

    //Create header for image file
    std::cout <<"P3\n" <<imgWidth << ' ' << imgHeight << "\n255\n";

    //Fill the image row by row
    for(int j = 0; j < imgHeight; j++){
        //Create a progress bar for long renders
        std::clog << "\rScanlines remaining: " << (imgHeight - j) << ' ' << std::flush;
        for(int i = 0; i < imgWidth; i++){
            //Create pixel colours using vec3 class
            auto pixel_colour = colour(double(i) / (imgWidth - 1), double(j) / (imgHeight - 1), 0);
            //Write using colour.h
            write_colour(std::cout, pixel_colour);
        }
    }

    std::clog << "\rDone.                      \n";
}