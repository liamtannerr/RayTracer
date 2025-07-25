#ifndef VEC3_H
#define VEC3_H

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

        bool near_zero() const {
            // Return true if the vector is close to zero in all dimensions.
            auto s = 1e-8;
            return (std::fabs(e[0]) < s) && (std::fabs(e[1]) < s) && (std::fabs(e[2]) < s);
        }

        static vec3 random() {
            return vec3(random_double(), random_double(), random_double());
        }
    
        static vec3 random(double min, double max) {
            return vec3(random_double(min,max), random_double(min,max), random_double(min,max));
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

inline vec3 random_in_unit_disk() {
    while (true) {
        auto p = vec3(random_double(-1,1), random_double(-1,1), 0);
        if (p.length_squared() < 1)
            return p;
    }
}

inline vec3 random_unit_vector() {
    while (true) {
        auto p = vec3::random(-1,1);
        auto lensq = p.length_squared();
        //Ensure no randome vectors round to 0
        if (1e-160 < lensq && lensq <= 1)
            return p / sqrt(lensq);
    }
}

inline vec3 random_on_hemisphere(const vec3& normal) {
    vec3 on_unit_sphere = random_unit_vector();
    if (dot(on_unit_sphere, normal) > 0.0) // In the same hemisphere as the normal
        return on_unit_sphere;
    else
        return -on_unit_sphere;
}

inline vec3 reflect(const vec3& v, const vec3& n) {
    return v - 2*dot(v,n)*n;
}

inline vec3 refract(const vec3& uv, const vec3& n, double etai_over_etat) {
    auto cos_theta = std::fmin(dot(-uv, n), 1.0);
    vec3 r_out_perp =  etai_over_etat * (uv + cos_theta*n);
    vec3 r_out_parallel = -std::sqrt(std::fabs(1.0 - r_out_perp.length_squared())) * n;
    return r_out_perp + r_out_parallel;
}


#endif