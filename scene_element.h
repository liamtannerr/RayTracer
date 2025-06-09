#ifndef SCENE_ELEMENT_H
#define SCENE_ELEMENT_H


class hit_record{
    public:
        point3 p;
        vec3 normal;
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

         virtual bool hit(const ray& r, double ray_tmin, double ray_tmax, hit_record& rec) const = 0;
};



#endif