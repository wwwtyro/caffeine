"use strict";


const Trackball = require('trackball-controller');
const dat = require('dat.gui');
const saveAs = require('file-saver').saveAs;
const createRenderer = require('./renderer');


const canvas = document.getElementById('render-canvas');
canvas.height = canvas.width = 512;


const renderer = createRenderer(canvas);


function reflow() {
  if (window.innerHeight > window.innerWidth) {
    canvas.style.width = '100%';
    canvas.style.height = `${canvas.clientWidth}px`;
  } else {
    canvas.style.height = '100%';
    canvas.style.width = `${canvas.clientHeight}px`;
  }
};


const Control = function() {
  this.resolution = 512;
  this.samples = 1;
  this.converge = true;
  this.antialias = true;
  this.saveButton = function() {
    canvas.toBlob(function(blob) {
      saveAs(blob, "caffeine.png");
    });
  }
  this.atom_roughness = 0.0;
  this.coffee_roughness = 0.0;
  this.light_radius = 4.0;
  this.light_intensity = 4.1;
  this.light_angle = 4.73;
  this.bounces = 3;
  this.focal_plane = 3.0;
  this.focal_length = 0.1;
}

const control = new Control();
const gui = new dat.GUI({width: 300});

gui.add(control, 'resolution', [128, 256, 512, 1024, 2048]).name('Resolution').onChange(function() {
  renderer.resize(control.resolution)
});
gui.add(control, 'samples').name('Samples/Frame').min(1).max(16).step(1);
gui.add(control, 'antialias').name('Antialias').onChange(renderer.reset);
gui.add(control, 'converge').name('Converge');
gui.add(control, 'atom_roughness').name('Atom Roughness').min(0).max(1).onChange(renderer.reset);
gui.add(control, 'coffee_roughness').name('Coffee Roughness').min(0).max(1).onChange(renderer.reset);
gui.add(control, 'light_radius').name('Light Radius').min(0.01).max(4.0).onChange(renderer.reset);
gui.add(control, 'light_intensity').name('Light Intensity').min(0.01).max(16.0).onChange(renderer.reset);
gui.add(control, 'light_angle').name('Light Angle').min(0).max(Math.PI*2).onChange(renderer.reset);
gui.add(control, 'bounces').name('Bounces').min(0).max(10).step(1).onChange(renderer.reset);
gui.add(control, 'focal_plane').name('Focal Plane').min(-5).max(5).onChange(renderer.reset);
gui.add(control, 'focal_length').name('Focal Length').min(0).max(1).onChange(renderer.reset);
gui.add(control, 'saveButton').name('Save Image');

const trackball = new Trackball(canvas, {
  drag: 0.05,
  onRotate: renderer.reset,
});

trackball.spin(17, 47);


function loop() {
  reflow();
  const eye = [0, 0, 10];
  const target = [0, 0, 0];
  for (let i = 0; i < control.samples; i++) {
    renderer.sample({
      eye: eye,
      target: target,
      model: trackball.rotation,
      atom_roughness: control.atom_roughness,
      coffee_roughness: control.coffee_roughness,
      light_radius: control.light_radius,
      light_intensity: control.light_intensity,
      light_angle: control.light_angle,
      bounces: control.bounces,
      focal_plane: control.focal_plane,
      focal_length: control.focal_length,
      antialias: control.antialias,
    });
  }
  renderer.display();
  if (!control.converge) renderer.reset();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
