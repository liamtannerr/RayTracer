#include <iostream>

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

            auto r = double(i) / (imgWidth - 1);
            auto g = double(j) / (imgHeight - 1);
            auto b = 1.0;

            int ir = int(255.999 * r);
            int ig = int(255.999 * g);
            int ib = int(255.999 * b);

            std::cout << ir << ' ' << ig << ' ' << ib << '\n';
        }
    }

    std::clog << "\rDone.                      \n";
}