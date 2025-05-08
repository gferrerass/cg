import * as THREE from 'three';
import { Cube, SquaredPyramid, Dodecahedron, createPolygons } from './Polygon.js';
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.155/examples/jsm/loaders/GLTFLoader.js";

// -------------------------- SETUP & VARIABLES --------------------------

const crosshair = document.getElementById('crosshair');
const guiContainer = document.getElementById('gui-container');

// Creating the scene
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
var ratio = window.innerWidth / window.innerHeight;

// Creating the perspective camera
var camera = new THREE.PerspectiveCamera(45, ratio, 0.00001, 1000);
var Pos = new THREE.Vector3(0, 0, 0);
camera.position.set(Pos.x, Pos.y, Pos.z);
var Dir = new THREE.Vector3(0, 0, 1);
camera.lookAt(Dir.x, Dir.y, Dir.z);

// Setting up lights
addLighting();

// Setting up Pointer Lock & First Person camera movement
const pointerLockElement = renderer.domElement; // Applying pointer lock to the canvas

// Setting up Raycaster for shooting
const raycaster = new THREE.Raycaster();

let pointerLockEnabled = false;
let score = 0;

// Rotation around the Y-Axis (horizontally)
var yaw = 0;
// Rotation around the X-Axis (vertically)
var pitch = 0;

// Movement variables
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
const speed = 10;

const clock = new THREE.Clock();

// Displaying the crosshair and Score
document.getElementById('crosshair').style.display = 'block';
document.getElementById('score').style.display = 'block';

// Setting up 3D model loader
const loader = new GLTFLoader();

let sperm;
let mixer; // For animation mixer

// ------------------------------- MAIN CODE -------------------------------

var material_floor = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true });
var geometry_floor = new THREE.CylinderGeometry(1, 1, 0.1, 20);
var Floor = new THREE.Mesh(geometry_floor, material_floor);
Floor.position.y = -1;
scene.add(Floor);

// Adding polygons
const positions = [
    [5, 0, 5],
    [-5, -2, 5],
    [5, -3, -5],
    [-5, -1, -5],
    [0, 1, 5],
    [0, 0, -5],
    [5, -1, 0],
    [-5, 2, 0],
];

loadAndAddModel("3DModels/sperm.glb", new THREE.Vector3(0, 0, 0), 0.1, (model, animations) => {
    sperm = model;
    if (animations && animations.length) {
        // Creating an animation mixer for the loaded animations
        mixer = new THREE.AnimationMixer(sperm);
        animations.forEach(animation => {
            mixer.clipAction(animation).play();
        });
    }
});

var material_floor = new THREE.MeshPhongMaterial({
    shininess: 100,
    color: new THREE.Color(0xffffff),
    side: THREE.BackSide
});

// Mapping for colour
var color_map = new THREE.TextureLoader().load('textures/meat.jpg');
color_map.wrapS = color_map.wrapT = THREE.RepeatWrapping;
color_map.repeat.set(10, 10);
material_floor.map = color_map;

// Normal mapping
var normal_map = new THREE.TextureLoader().load('textures/tileable.jpg');
normal_map.wrapS = normal_map.wrapT = THREE.RepeatWrapping;
normal_map.repeat = new THREE.Vector2(10, 10);

material_floor.normalMap = normal_map;

// Uterus geometry
var geometry_uterus = new THREE.SphereGeometry(50, 64, 64);
var meshSphere = new THREE.Mesh(geometry_uterus, material_floor);
meshSphere.scale.set(1, 2, 1.5);
meshSphere.rotation.x = Math.PI / 2;
meshSphere.receiveShadow = true;
scene.add(meshSphere);

let polygons = createPolygons(positions, scene, 'Random', 8);

// ------------------------------- FUNCTIONS -------------------------------

function loadAndAddModel(path, position, scale, callback) {
    loader.load(path, (gltf) => {
        const model = gltf.scene;
        model.position.copy(position);
        model.scale.setScalar(scale);

        model.castShadow = true;
        model.receiveShadow = true;

        scene.add(model);

        // Passing model and animations to the callback
        callback(model, gltf.animations);
    });
}

function shoot() {
    raycaster.set(camera.position, Dir.clone().normalize());
    const intersects = raycaster.intersectObjects(polygons.map(polygon => polygon.mesh));

    if (intersects.length > 0) {
        const hitObject = intersects[0].object;
        score += 1;
        document.getElementById('score').innerText = `Score: ${score}`;
        scene.remove(hitObject);
        const index = polygons.indexOf(hitObject);
        if (index > -1) polygons.splice(index, 1);
    }
}

function updateMovement(delta) {
    let moveVector = new THREE.Vector3();

    let forward = new THREE.Vector3();
    camera.getWorldDirection(forward);

    let right = new THREE.Vector3();
    right.crossVectors(forward, camera.up);

    if (moveForward) moveVector.add(forward);
    if (moveBackward) moveVector.sub(forward);
    if (moveLeft) moveVector.sub(right);
    if (moveRight) moveVector.add(right);

    moveVector.normalize().multiplyScalar(speed * delta);
    Pos.add(moveVector);
}

// Final update loop
var MyUpdateLoop = function () {
    var delta = clock.getDelta();

    polygons.forEach(polygon => polygon.update());

    camera.position.set(Pos.x, Pos.y, Pos.z);
    camera.lookAt(Pos.x + Dir.x, Pos.y + Dir.y, Pos.z + Dir.z);
    camera.updateProjectionMatrix();

    updateMovement(delta);

    // Updating the animations if there is an animation mixer
    if (mixer) mixer.update(delta);

    renderer.render(scene, camera);
    requestAnimationFrame(MyUpdateLoop);

    flashlight.position.copy(camera.position);
    flashlight.target.position.copy(camera.position.clone().add(Dir));
};
requestAnimationFrame(MyUpdateLoop);

function addLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(new THREE.Color(1, 1, 1), 0.2);
    scene.add(ambientLight);

    // Flashlight that follows the camera
    const flashlight = new THREE.SpotLight(0xffffff, 1, 100, Math.PI / 4, 0.9, 1);
    flashlight.castShadow = true;
    flashlight.position.copy(camera.position);
    flashlight.target.position.copy(camera.position.clone().add(Dir));
    scene.add(flashlight);
    scene.add(flashlight.target);

    window.flashlight = flashlight;
}

var MyResize = function () {
    var width = window.innerWidth;
    var height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
};


// ------------------------------- EVENT LISTENERS -------------------------------

window.addEventListener('resize', MyResize);
pointerLockElement.addEventListener('click', () => {
    pointerLockElement.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
    pointerLockEnabled = (document.pointerLockElement === pointerLockElement);
});

window.addEventListener('mousedown', (event) => {
    if (event.button === 0) shoot();
});

window.addEventListener('mousemove', (event) => {
    if (!pointerLockEnabled) return;
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    yaw -= movementX * 0.002;
    pitch -= movementY * 0.002;

    const maxPitch = Math.PI / 2;
    pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));

    Dir.x = Math.sin(yaw) * Math.cos(pitch);
    Dir.y = Math.sin(pitch);
    Dir.z = Math.cos(yaw) * Math.cos(pitch);
    Dir.normalize();
});

window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyW') moveForward = true;
    if (event.code === 'KeyS') moveBackward = true;
    if (event.code === 'KeyA') moveLeft = true;
    if (event.code === 'KeyD') moveRight = true;
});

window.addEventListener('keyup', (event) => {
    if (event.code === 'KeyW') moveForward = false;
    if (event.code === 'KeyS') moveBackward = false;
    if (event.code === 'KeyA') moveLeft = false;
    if (event.code === 'KeyD') moveRight = false;
});