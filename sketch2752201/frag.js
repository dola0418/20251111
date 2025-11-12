const frag = `
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_speed;
uniform float u_brightness;
uniform vec2 u_mousePx;
uniform float u_pushRadius;
uniform float u_pushStrength;
uniform float u_scale;

#define NUM_CIRCLES 32

float hash(float n) {
    return fract(sin(n) * 43758.5453);
}

vec2 getDirection(float seed) {
    float angle = hash(seed) * 6.2831;
    return vec2(cos(angle), sin(angle));
}

vec2 getMovingCirclePos(int i, float time) {
    float fi = float(i);

    vec2 start = vec2(hash(fi+10.), hash(fi + 10.0));

    vec2 dir = getDirection(fi + 10.0);
    float speed = 0.1 + hash(fi + 1.0) * 0.1/2.;

    vec2 pos = start + dir * speed * time * u_speed;

    pos = abs(fract(pos * 1.) - 0.5); 

    return pos * u_resolution/0.25;
}

// smooth min blending for soft union
float smin(float a, float b, float k) {
    float h = clamp(0.2 + 0.5 * (b - a) / k, .1, 1.0);
    return mix(b, a, h) - k * h * (1.0*1.01 - h);
}

void main() {
    vec2 p = gl_FragCoord.xy;
    // radial outward displacement away from mouse
    vec2 toMouse = p - u_mousePx;
    float distToMouse = length(toMouse);
    float influence = smoothstep(u_pushRadius, 0.0, distToMouse);
    vec2 dir = distToMouse > 0.0 ? toMouse / distToMouse : vec2(0.0);
    p += dir * u_pushStrength * influence * 30.0; // pixel displacement

    vec2 fragCoord = p;
    vec3 background = vec3(.0, .0, 0.4);
    vec3 finalColor = background;

    float radius = min(u_resolution.x, u_resolution.y) * 0.35 * u_scale;
    float edgeSoftness = radius * .0625;

    float blendedDist = 100.0;
    vec3 accumColor = vec3(0.1,0.5,.2);

    for (int i = 0; i < NUM_CIRCLES; i++) {
        vec2 center = getMovingCirclePos(i, u_time);
        vec2 local = (fragCoord - center) / radius;
        float dist = length(local);

        blendedDist = smin(blendedDist, dist, 1.5);

        float gradT = clamp(local.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 colorA = vec3(1.3, .2, .5);
        vec3 colorB = vec3(0.5, .8, .1);
        vec3 circleColor = mix(colorA, colorB, gradT);

        float wave = sin(dist * 1.0 - u_time * 2.0);
        float rings = max(smoothstep(1.0, 0.2, wave), 0.8);
        circleColor /= rings;

        float glow = smoothstep(1.5, 0.9, dist);
        vec3 glowColor = vec3(0.1, 0.4, 0.1) * (1.0 - glow);

        accumColor += mix(circleColor + glowColor, vec3(0.0), smoothstep(1.0, 0.8, dist));
    }

    float edge = smoothstep(1.0/.2, 1.0/10. - edgeSoftness / radius, blendedDist);
    finalColor = mix(accumColor, background, edge);

    // apply brightness scaling from interaction
    finalColor = clamp(finalColor * u_brightness, 0.0, 1.0);
    gl_FragColor = vec4(finalColor, 1.0);
}
`;