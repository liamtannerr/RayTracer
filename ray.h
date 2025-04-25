#ifndef RAY_H
#define RAY_H

#include "vec3.h"

class ray {

    public:
        ray() {}

        //Create a new ray
        ray(const point3& origin, const vec3& direction) : orig(origin), dir(direction) {}

        //Get the ray origin
        const point3& origin() const { return orig; }
        //Get the direction of the ray
        const vec3& direction() const { return dir; }

        /*No setters needed. Rays should be immutable for our purposes*/

        //Compute P(t) = origin + t * direction
        point3 at(double t) const {
            return orig + t*dir;
        }

        //Hide class variables
        private:
            point3 orig;
            vec3 dir;

};

#endif