#ifndef HITTABLE_LIST_H
#define HITTABLE_LIST_H

#include "rtweekend.h"
#include "scene_element.h"

#include <vector>



class scene_element_list : public scene_element{

    public:
        std::vector<shared_ptr<scene_element>> objects;

        scene_element_list() {}
        scene_element_list(shared_ptr<scene_element> object) { add(object); }

        void clear() {objects.clear(); }

        void add(shared_ptr<scene_element> object) {
            objects.push_back(object);
        }

        bool hit(const ray& r, interval ray_t, hit_record& rec) const override {
            hit_record temp_rec;
            bool hit_anything = false;
            auto closest_so_far = ray_t.max;

            for (const auto& object : objects){
                if (object->hit(r, interval(ray_t.min, closest_so_far), temp_rec)) {
                    hit_anything = true;
                    closest_so_far = temp_rec.t;
                    rec = temp_rec;
                }
            }
            return hit_anything;
        }

};

#endif
