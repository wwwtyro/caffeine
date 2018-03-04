precision highp float;

uniform sampler2D source, tRand2Uniform, tRand2Normal, tRand3Normal;
uniform mat4 model, invpv;
uniform vec3 eye;
uniform vec2 resolution, rand;
uniform float atom_roughness, coffee_roughness;
uniform float light_radius, light_intensity, light_angle;
uniform float focal_plane, focal_length;
uniform float randsize;
uniform bool antialias;
uniform int bounces;


struct element {
  float radius;
  vec3 color;
};

const element H = element(0.310, vec3(1.000, 1.000, 1.000));
const element N = element(0.710, vec3(0.188, 0.314, 0.973));
const element C = element(0.730, vec3(0.565, 0.565, 0.565));
const element O = element(0.660, vec3(1.000, 0.051, 0.051));

struct atom {
  vec3 position;
  element element;
};


atom atoms[24];


void buildMolecule() {
  atoms[ 0] = atom(vec3(-3.3804130, -1.1272367,  0.5733036), H);
  atoms[ 1] = atom(vec3( 0.9668296, -1.0737425, -0.8198227), N);
  atoms[ 2] = atom(vec3( 0.0567293,  0.8527195,  0.3923156), C);
  atoms[ 3] = atom(vec3(-1.3751742, -1.0212243, -0.0570552), N);
  atoms[ 4] = atom(vec3(-1.2615018,  0.2590713,  0.5234135), C);
  atoms[ 5] = atom(vec3(-0.3068337, -1.6836331, -0.7169344), C);
  atoms[ 6] = atom(vec3( 1.1394235,  0.1874122, -0.2700900), C);
  atoms[ 7] = atom(vec3( 0.5602627,  2.0839095,  0.8251589), N);
  atoms[ 8] = atom(vec3(-0.4926797, -2.8180554, -1.2094732), O);
  atoms[ 9] = atom(vec3(-2.6328073, -1.7303959, -0.0060953), C);
  atoms[10] = atom(vec3(-2.2301338,  0.7988624,  1.0899730), O);
  atoms[11] = atom(vec3( 2.5496990,  2.9734977,  0.6229590), H);
  atoms[12] = atom(vec3( 2.0527432, -1.7360887, -1.4931279), C);
  atoms[13] = atom(vec3(-2.4807715, -2.7269528,  0.4882631), H);
  atoms[14] = atom(vec3(-3.0089039, -1.9025254, -1.0498023), H);
  atoms[15] = atom(vec3( 2.9176101, -1.8481516, -0.7857866), H);
  atoms[16] = atom(vec3( 2.3787863, -1.1211917, -2.3743655), H);
  atoms[17] = atom(vec3( 1.7189877, -2.7489920, -1.8439205), H);
  atoms[18] = atom(vec3(-0.1518450,  3.0970046,  1.5348347), C);
  atoms[19] = atom(vec3( 1.8934096,  2.1181245,  0.4193193), C);
  atoms[20] = atom(vec3( 2.2861252,  0.9968439, -0.2440298), N);
  atoms[21] = atom(vec3(-0.1687028,  4.0436553,  0.9301094), H);
  atoms[22] = atom(vec3( 0.3535322,  3.2979060,  2.5177747), H);
  atoms[23] = atom(vec3(-1.2074498,  2.7537592,  1.7203047), H);
}


vec2 randState = vec2(0);

vec2 rand2Uniform() {
  vec2 r2 = texture2D(tRand2Uniform, gl_FragCoord.xy/randsize + rand.xy + randState).ba;
  randState += r2;
  return r2;
}

vec2 rand2Normal() {
  vec2 r2 = texture2D(tRand2Normal, gl_FragCoord.xy/randsize + rand.xy + randState).ba;
  randState += r2;
  return r2;
}

vec3 rand3Normal() {
  vec3 r3 = texture2D(tRand3Normal, gl_FragCoord.xy/randsize + rand.xy + randState).rgb;
  randState == r3.xy;
  return r3;
}


bool raySphereIntersect(vec3 r0, vec3 rd, vec3 s0, float sr, out float t) {
  vec3 s0_r0 = r0 - s0;
  float b = 2.0 * dot(rd, s0_r0);
  float c = dot(s0_r0, s0_r0) - (sr * sr);
  float d = b * b - 4.0 * c;
  if (d < 0.0) return false;
  t = (-b - sqrt(d))*0.5;
  return t >= 0.0;
}

vec3 lightPos = vec3(cos(light_angle) * 8.0, 8, sin(light_angle) * 8.0);
const vec3 lightCol = vec3(1,1,0.5) * 6.0;
const vec3 ambient = vec3(0.01);

bool intersect(vec3 r0, vec3 rd, out vec3 pos, out vec3 norm, out vec3 color, out float roughness, out bool light) {
  float tmin = 1e38, t;
  bool hit = false;
  for (int i = 0; i < 24; i++) {
    vec3 s = vec3(model * vec4(atoms[i].position, 1));
    if (raySphereIntersect(r0, rd, s, atoms[i].element.radius * 1.2, t)) {
      if (t < tmin) {
        tmin = t;
        pos = r0 + rd * t;
        norm = normalize(pos - s);
        roughness = atom_roughness;
        color = atoms[i].element.color;
        light = false;
        hit = true;
      }
    }
  }
  t = (-2.0 - r0.y) / rd.y;
  if (t < tmin && t > 0.0) {
    tmin = t;
    pos = r0 + rd * t;
    norm = vec3(0,1,0);
    color = vec3(1, 0.40, 0.06125) * 0.25;
    roughness = coffee_roughness;
    light = false;
    hit = true;
  }
  if (raySphereIntersect(r0, rd, lightPos, light_radius, t)) {
    if (t < tmin) {
      tmin = t;
      pos = r0 + rd * t;
      norm = normalize(pos - lightPos);
      roughness = 0.0;
      color = lightCol;
      light = true;
      hit = true;
    }
  }
  return hit;
}



void main() {
  buildMolecule();

  vec3 src = texture2D(source, gl_FragCoord.xy/resolution).rgb;
  vec2 jitter = vec2(0);
  if (antialias) {
    jitter = rand2Uniform() - 0.5;
  }
  vec2 px = 2.0 * (gl_FragCoord.xy + jitter)/resolution - 1.0;
  vec3 ray = vec3(invpv * vec4(px, 1, 1));
  ray = normalize(ray);

  float t_fp = (focal_plane - eye.z)/ray.z;
  vec3 p_fp = eye + t_fp * ray;
  vec3 pos = eye + focal_length * vec3(rand2Normal() * rand2Uniform().x, 0);
  ray = normalize(p_fp - pos);

  vec3 accum = vec3(0);
  vec3 mask = vec3(1);

  for (int i = 0; i < 20; i++) {
    if (i > bounces) break;
    vec3 norm, color;
    float roughness;
    bool light;
    if (!intersect(pos, ray, pos, norm, color, roughness, light)) {
      accum += ambient * mask;
      break;
    }
    if (light) {
      accum += lightCol * mask;
      break;
    }
    mask *= color;
    vec3 _v3;
    float _f;
    vec3 lp = lightPos + rand3Normal() * light_radius;
    vec3 lray = normalize(lp - pos);
    if (intersect(pos + lray * 0.0001, lray, _v3, _v3, _v3, _f, light) && light) {
      float d = clamp(dot(norm, lray), 0.0, 1.0);
      d *= pow(asin(light_radius/distance(pos, lightPos)), 2.0);
      accum += d * light_intensity * lightCol * mask;
    }
    ray = normalize(mix(reflect(ray, norm), norm + rand3Normal(), roughness));
    pos = pos + 0.0001 * ray;
  }

  gl_FragColor = vec4(accum + src, 1.0);
}
