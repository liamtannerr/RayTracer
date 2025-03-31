#ifndef VEC3_H
#define VEC3_H

#include <cmath>
#include <iostream>

class vec3 {

    public: 
        //Create our vector here
        double e[3];

        //Initialize with 0, 0, 0 coordinates
        vec3() : e{0,0,0} {}
        //Initialize with specified coordinates
        vec3(double e0, double e1, double e2) : e{e0, e1, e2} {}

        //Access vector components
        double x() const { return e[0]; }
        double y() const { return e[1]; }
        double z() const { return e[2]; }

        //Negation here
        vec3 operator-() const { return vec3(-e[0], -e[1], -e[2]); }

        //Access vector components, immutable (read only)
        double operator[](int i) const { return e[i]; }
        //Access vector components, mutable (write access)
        double& operator[](int i) { return e[i]; }

        //Vector addition
        vec3& operator+=(const vec3& v){
            e[0] += v.e[0];
            e[1] += v.e[1];
            e[2] += v.e[2];
            return *this;
        }

        //Scalar multiplication
        vec3& operator *= (double t){
            e[0] *= t;
            e[1] *= t;
            e[2] *= t;
            return *this;
        }

        //Scalar division
        vec3& operator/=(double t){
            return *this *= 1/t;
        }

        //Length of the vector
        double length () const {
            return std::sqrt(length_squared());
        }

        //Helper for length function
        double length_squared() const {
            return e[0]*e[0] + e[1]*e[1] + e[2]*e[2];
        }
                


};