// ------------------------------- IMPORTS -------------------------------

import * as THREE from 'three';
import { Cube, SquaredPyramid, Dodecahedron, createPolygons } from './Polygon.js';

// -------------------------- SETUP & VARIABLES --------------------------

const crosshair = document.getElementById('crosshair');
const guiContainer = document.getElementById('gui-container');

// Creating the scene
var scene = new THREE.Scene( );
// Creating the webgl renderer
var renderer = new THREE.WebGLRenderer( );
renderer.setSize(window.innerWidth,window.innerHeight);
// Adding the renderer to the current document
document.body.appendChild(renderer.domElement );
var ratio = window.innerWidth/window.innerHeight;

// Creating the perspective camera
var camera = new THREE.PerspectiveCamera(45,ratio,0.00001,1000);
var Pos = new THREE.Vector3(0,0,0);
camera.position.set(Pos.x,Pos.y,Pos.z);
var Dir = new THREE.Vector3(0,0,1);
camera.lookAt(Dir.x,Dir.y,Dir.z); 

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
 // Movement units per second
const speed = 5;


const clock = new THREE.Clock();

// Displaying the crosshair and Score
document.getElementById('crosshair').style.display = 'block';
document.getElementById('score').style.display = 'block';

// ------------------------------- MAIN CODE -------------------------------

// Creating the floor
var material_floor = new THREE.MeshBasicMaterial({color: 0xff00ff, wireframe: true});
var geometry_floor = new THREE.CylinderGeometry(1, 1, 0.1, 20);

var Floor = new THREE.Mesh(geometry_floor,material_floor);
Floor.position.y=-1;
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



//create the material of the floor
var material_floor = new THREE.MeshPhongMaterial();
material_floor.shininess=100;
material_floor.color=  new THREE.Color(0xffffff);

// Mapping for colour
var color_map = new THREE.TextureLoader().load('textures/meat.jpg');
color_map.wrapS = color_map.wrapT = THREE.RepeatWrapping;
color_map.repeat.set(4, 4);
material_floor.map = color_map;

// Normal mapping
var normal_map = new THREE.TextureLoader().load('textures/tileable.jpg');
normal_map.wrapS = normal_map.wrapT = THREE.RepeatWrapping;
normal_map.repeat=new THREE.Vector2(4,4);

material_floor.normalMap= normal_map;


var geometry_floor = new THREE.BoxGeometry(30,0.5,30);
var meshFloor= new THREE.Mesh( geometry_floor, material_floor );
meshFloor.position.y-=10;
meshFloor.receiveShadow=true;
scene.add( meshFloor );


let polygons = createPolygons(positions, scene, 'Random', 8);

// ------------------------------- FUNCTIONS -------------------------------

function shoot() {
    // Updating raycaster from camera position to its direction
    raycaster.set(camera.position, Dir.clone().normalize());

    // Checking intersection of raycaster with polygons
    const intersects = raycaster.intersectObjects(polygons.map(polygon => polygon.mesh));

    if (intersects.length > 0) {
        const hitObject = intersects[0].object;

        // Updating score
        score += 1;
        document.getElementById('score').innerText = `Score: ${score}`;
      
        // Removing polygon from scene and array
        scene.remove(hitObject);
        const index = polygons.indexOf(hitObject);
        if (index > -1) polygons.splice(index, 1);
    }
}

function updateMovement(delta) {
    // This will store the total movement direction
    let moveVector = new THREE.Vector3(); 

    // Getting the forward direction based on where the camera is pointing
    let forward = new THREE.Vector3();
    camera.getWorldDirection(forward);

    // Creating a right vector perpendicular to forward and up
    let right = new THREE.Vector3();
    right.crossVectors(forward, camera.up); // (Right = Forward * Up)

    // Adding or subtracting directions depending on which keys are pressed
    if (moveForward) moveVector.add(forward);
    if (moveBackward) moveVector.sub(forward);
    if (moveLeft) moveVector.sub(right);
    if (moveRight) moveVector.add(right);

    // Normalising the resulting direction and scaling by speed and frame delta time
    moveVector.normalize().multiplyScalar(speed * delta);
    
    // Applying the movement to the camera position
    Pos.add(moveVector);
}

// Final update loop
var MyUpdateLoop = function ( )
{
    var delta = clock.getDelta();

    // Updating polygons rotation
    polygons.forEach(polygon => polygon.update());

    // Updating the camera position
    camera.position.set(Pos.x,Pos.y,Pos.z);
    camera.lookAt(Pos.x+Dir.x,Pos.y+Dir.y,Pos.z+Dir.z);
    camera.updateProjectionMatrix();

    updateMovement(delta);

    // Call the render with the scene and the camera
    renderer.render(scene,camera);
    requestAnimationFrame(MyUpdateLoop);

};
requestAnimationFrame(MyUpdateLoop);

function addLighting() {
    const cameraLight = new THREE.PointLight(new THREE.Color(1,1,1), 0.5);
    camera.add(cameraLight);
    scene.add(camera);

    const ambientLight = new THREE.AmbientLight(new THREE.Color(1,1,1), 0.2);
    scene.add(ambientLight);
}

// This function is called when the window is resized
var MyResize = function ( )
{
    //get the new sizes
    var width = window.innerWidth;
    var height = window.innerHeight;
    //then update the renderer
    renderer.setSize(width,height);
    //and update the aspect ratio of the camera
    camera.aspect = width/height;

    //update the projection matrix given the new values
    camera.updateProjectionMatrix();

    //and finally render the scene again
    renderer.render(scene,camera);
};


// ------------------------------- EVENT LISTENERS -------------------------------

// Adding an event listener for click event to request pointer lock
pointerLockElement.addEventListener('click', () => {
    pointerLockElement.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
    // pointerLockEnabled = true if the document's pointer is locked to our canvas, false otherwise
    pointerLockEnabled = (document.pointerLockElement === pointerLockElement);
});

//link the resize of the window to the update of the camera
window.addEventListener( 'resize', MyResize);

// Shoot when left clicking
window.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // (Left click)
        shoot();
    }
});

window.addEventListener('mousemove', (event) => { // Listening for the mouse movement when the pointer is locked
    
    if (!pointerLockEnabled) return; // Not updating if menu is open

    // (Checking all in case the browser doesn't support one of them)
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    yaw -= movementX * 0.002;
    pitch -= movementY * 0.002;

    // Pitch is limited to 90º to prevent camera from flipping upside down
    const maxPitch = Math.PI / 2;
    pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));

    // Recalculating direction vector
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
