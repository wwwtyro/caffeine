"use strict";


const glsl = require('glslify');
const REGL = require('regl');
const mat4 = require('gl-matrix').mat4;
const vec3 = require('gl-matrix').vec3;
const vec2 = require('gl-matrix').vec2;


module.exports = function(canvas) {

  const regl = REGL({
    canvas: canvas,
    extensions: ['OES_texture_float'],
    attributes: {
      preserveDrawingBuffer: true,
    },
  });


  const randsize = 1024;


  const dRand2Uniform = new Float32Array(randsize*randsize*2);
  for (let i = 0; i < randsize * randsize; i++) {
    const r = [Math.random(), Math.random()];
    dRand2Uniform[i * 2 + 0] = r[0];
    dRand2Uniform[i * 2 + 1] = r[1];
  }


  const tRand2Uniform = regl.texture({
    width: randsize,
    height: randsize,
    data: dRand2Uniform,
    type: 'float',
    format: 'luminance alpha',
    wrap: 'repeat',
  });


  const dRand2Normal = new Float32Array(randsize*randsize*2);
  for (let i = 0; i < randsize * randsize; i++) {
    const r = vec2.random([]);
    dRand2Normal[i * 2 + 0] = r[0];
    dRand2Normal[i * 2 + 1] = r[1];
  }


  const tRand2Normal = regl.texture({
    width: randsize,
    height: randsize,
    data: dRand2Normal,
    type: 'float',
    format: 'luminance alpha',
    wrap: 'repeat',
  });


  const dRand3Normal = new Float32Array(randsize*randsize*3);
  for (let i = 0; i < randsize * randsize; i++) {
    const r = vec3.random([]);
    dRand3Normal[i * 3 + 0] = r[0];
    dRand3Normal[i * 3 + 1] = r[1];
    dRand3Normal[i * 3 + 2] = r[2];
  }


  const tRand3Normal = regl.texture({
    width: randsize,
    height: randsize,
    data: dRand3Normal,
    type: 'float',
    format: 'rgb',
    wrap: 'repeat',
  });


  const pingpong = [
    regl.framebuffer({width: canvas.width, height: canvas.height, colorType: 'float'}),
    regl.framebuffer({width: canvas.width, height: canvas.height, colorType: 'float'}),
  ];


  let ping = 0;
  let count = 0;


  const cSample = regl({
    vert: glsl('./glsl/sample.vert'),
    frag: glsl('./glsl/sample.frag'),
    attributes: {
      position: [-1,-1, 1,-1, 1,1, -1,-1, 1,1, -1,1],
    },
    uniforms: {
      invpv: regl.prop('invpv'),
      eye: regl.prop('eye'),
      source: regl.prop('source'),
      tRand2Uniform: tRand2Uniform,
      tRand2Normal: tRand2Normal,
      tRand3Normal: tRand3Normal,
      model: regl.prop('model'),
      resolution: regl.prop('resolution'),
      rand: regl.prop('rand'),
      atom_roughness: regl.prop('atom_roughness'),
      coffee_roughness: regl.prop('coffee_roughness'),
      light_radius: regl.prop('light_radius'),
      light_intensity: regl.prop('light_intensity'),
      light_angle: regl.prop('light_angle'),
      bounces: regl.prop('bounces'),
      focal_plane: regl.prop('focal_plane'),
      focal_length: regl.prop('focal_length'),
      antialias: regl.prop('antialias'),
      randsize: randsize,
    },
    framebuffer: regl.prop('destination'),
    viewport: regl.prop('viewport'),
    depth: { enable: false },
    count: 6,
  });


  const cDisplay = regl({
    vert: glsl('./glsl/display.vert'),
    frag: glsl('./glsl/display.frag'),
    attributes: {
      position: [-1,-1, 1,-1, 1,1, -1,-1, 1,1, -1,1],
    },
    uniforms: {
      source: regl.prop('source'),
      count: regl.prop('count'),
    },
    framebuffer: regl.prop('destination'),
    viewport: regl.prop('viewport'),
    depth: { enable: false },
    count: 6,
  });


  function sample(opts) {
    const view = mat4.lookAt([], opts.eye, opts.target, [0, 1, 0]);
    const projection = mat4.perspective([], Math.PI/3, canvas.width/canvas.height, 0.1, 1000);
    const pv = mat4.multiply([], projection, view);
    const invpv = mat4.invert([], pv);

    cSample({
      invpv: invpv,
      eye: opts.eye,
      resolution: [canvas.width, canvas.height],
      rand: [Math.random(), Math.random()],
      model: opts.model,
      destination: pingpong[1 - ping],
      source: pingpong[ping],
      atom_roughness: opts.atom_roughness,
      coffee_roughness: opts.coffee_roughness,
      light_radius: opts.light_radius,
      light_intensity: opts.light_intensity,
      light_angle: opts.light_angle,
      bounces: opts.bounces,
      focal_plane: opts.focal_plane,
      focal_length: opts.focal_length,
      antialias: opts.antialias,
      viewport: {x: 0, y: 0, width: canvas.width, height: canvas.height},
    });
    count++;
    ping = 1 - ping;
  }


  function display() {
    cDisplay({
      destination: null,
      source: pingpong[ping],
      count: count,
      viewport: {x: 0, y: 0, width: canvas.width, height: canvas.height},
    });
  }


  function reset() {
    regl.clear({ color: [0,0,0,1], depth: 1, framebuffer: pingpong[0] });
    regl.clear({ color: [0,0,0,1], depth: 1, framebuffer: pingpong[1] });
    count = 0;
  }


  function resize(resolution) {
    canvas.height = canvas.width = resolution;
    pingpong[0].resize(canvas.width, canvas.height);
    pingpong[1].resize(canvas.width, canvas.height);
    reset();
  }


  return {
    sample: sample,
    display: display,
    reset: reset,
    resize: resize,
  };

}
