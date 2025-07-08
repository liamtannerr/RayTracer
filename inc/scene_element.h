#ifndef SCENE_ELEMENT_H
#define SCENE_ELEMENT_H

#include "rtweekend.h"
#include "interval.h"

class material;

class hit_record{
    public:
        point3 p;
        vec3 normal;
        shared_ptr<material> mat;
        double t;
        bool front_face;

        void set_face_normal(const ray& r, const vec3& outward_normal){
            front_face = dot(r.direction(), outward_normal) < 0;
            normal = front_face ? outward_normal : -outward_normal;
        }
};

class scene_element{
    public:
         virtual ~scene_element() = default;

         virtual bool hit(const ray& r, interval ray_t, hit_record& rec) const = 0;
};



#endif