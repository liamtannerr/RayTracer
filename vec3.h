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

using point3 = vec3;

//Overload functions for vec3 operations

//Print a vector with cout
inline std::ostream& operator<<(std::ostream& out, const vec3& v) {
    return out << v.e[0] << ' ' <<v.e[1] << ' ' << v.e[2];
}

//Add two vcectors
inline vec3 operator+(const vec3& u, const vec3& v){
    return vec3(u.e[0] + v.e[0], u.e[1] + v.e[1], u.e[2] + v.e[2]);
}

//Subtract one vector from another
inline vec3 operator-(const vec3& u, const vec3& v){
    return vec3(u.e[0] - v.e[0], u.e[1] - v.e[1], u.e[2] - v.e[2]);

}

//Multiply two vectors
inline vec3 operator*(const vec3& u, const vec3& v){
    return vec3(u.e[0] * v.e[0], u.e[1] * v.e[1], u.e[2] * v.e[2]);

}

//Multiply a vector by a scalar
inline vec3 operator*(double t, const vec3& v) {
    return vec3(t*v.e[0], t*v.e[1], t*v.e[2]);
}

/*
Second overload for vector, scalar multiplication. 
Allows users to pass arguments in whichever order they please.
*/
inline vec3 operator*(const vec3& v, double t) {
    return t * v;
}

//Divide a vector by a scalar
inline vec3 operator/(const vec3& v, double t) {
    return (1/t) * v;
}

//Compute the dot product of two vectors
inline double dot(const vec3& u, const vec3& v) {
    return u.e[0] * v.e[0]
         + u.e[1] * v.e[1]
         + u.e[2] * v.e[2];
}

//Compute the cross product of two vectors
inline vec3 cross(const vec3& u, const vec3& v) {
    return vec3(u.e[1] * v.e[2] - u.e[2] * v.e[1],
                u.e[2] * v.e[0] - u.e[0] * v.e[2],
                u.e[0] * v.e[1] - u.e[1] * v.e[0]);
}

//Compute the unit vector 
inline vec3 unit_vector(const vec3& v) {
    return v / v.length();
}


#endif