import * as THREE from "three";
import { OrbitControls } from "./build/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.155/examples/jsm/loaders/GLTFLoader.js";

// Creating the scene
var scene = new THREE.Scene( );

// Creating the webgl renderer
var renderer = new THREE.WebGLRenderer( );
renderer.setSize(window.innerWidth,window.innerHeight);
// Enabling shadow map rendering
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// Adding the renderer to the current document
document.body.appendChild(renderer.domElement);

// Creating the perspective camera
var ratio = window.innerWidth/window.innerHeight;
const camera = new THREE.PerspectiveCamera(45, ratio, 0.1, 1000);
camera.position.set(0, 40, 50);
camera.lookAt(0, 0, 0);

// Setting up orbit controls
var controls = new OrbitControls(camera, renderer.domElement);

// Setting up lights
addLighting();

// Setting up texture loader
const textureLoader = new THREE.TextureLoader();

// Setting up 3D model loader
const loader = new GLTFLoader();

// Global variables for objects
let chair, desk, sofa;

// Global variables for clicking objects
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null;

///////////////////////////////////////////////////////////////////////////////////    

// Loading chair
loadAndAddModel("3DModels/chair.glb", new THREE.Vector3(-10, 0, -15), 10, (model) => {
    chair = model;
    chair.rotation.y = Math.PI ;
});

// Loading desk
loadAndAddModel("3DModels/desk.glb", new THREE.Vector3(-10, 0, -20), 10, (model) => {
    desk = model;
});

// Loading sofa
loadAndAddModel("3DModels/sofa.glb", new THREE.Vector3(15, 0, 0), 0.1, (model) => {
    sofa = model;
    sofa.name = "sofa";
});

// Loading floor
textureLoader.load('textures/floor.jpg', function (texture) {
    // Loading texture
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 5);
    const floorMaterial = new THREE.MeshStandardMaterial({ map: texture });

    // Creating floor
    const floorGeometry = new THREE.PlaneGeometry(50, 50);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.name = "floor";
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);
});

// Loading wall
textureLoader.load('textures/wall.jfif', function (texture) {
    // Loading texture
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 3);
    const wallMaterial = new THREE.MeshStandardMaterial({ map: texture });

    // Creating wall
    const wallGeometry = new THREE.PlaneGeometry(50, 30);
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.name = "wall";
    wall.position.y = 15;
    wall.position.z = -25;
    wall.receiveShadow = true;
    scene.add(wall);
});

// Loading brick wall
textureLoader.load('textures/brick.jfif', function (texture) {
    // Loading texture
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 3);
    const wallMaterial = new THREE.MeshStandardMaterial({ map: texture });

    // Creating wall
    const wallGeometry = new THREE.PlaneGeometry(50, 30);
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.name = "wall";
    wall.position.y = 15;
    wall.position.x = 25;
    wall.rotation.y = -Math.PI / 2;
    wall.receiveShadow = true;
    scene.add(wall);
});
/////////////////////////////////////////////////////////////////////////////////// 


function loadAndAddModel(path, position, scale, callback) {
    loader.load(path, (gltf) => {
        const model = gltf.scene;
        model.position.copy(position);
        model.scale.setScalar(scale);

        // Enabling shadows on all mesh children
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        scene.add(model);
        callback(model);
    });
}

function addLighting() {
    // Adding a soft ambient light inside a room
    const ambientLight = new THREE.AmbientLight(new THREE.Color(1, 1, 1), 0.5);
    scene.add(ambientLight);

    // Adding a point light from the ceiling
    const pointLight = new THREE.PointLight(new THREE.Color(1, 1, 1), 0.8, 100);
    pointLight.position.set(0, 30, 0);
    // Enabling shadow casting for point light
    pointLight.castShadow = true;
    // Setting up shadow quality
    pointLight.shadow.mapSize.width = 1024;
    pointLight.shadow.mapSize.height = 1024;
    // Correcting shadow acne
    pointLight.shadow.bias = -0.005;
    scene.add(pointLight);

    // Adding a small light that follows the camera
    const cameraLight = new THREE.PointLight(new THREE.Color(1, 1, 1), 0.2);
    camera.add(cameraLight);
    scene.add(camera);
}

// Function that detects when an object is clicked on
function onMouseClick(event) {
    // Normalising mouse coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Getting all intersected objects
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        // Highlighting clicked object 
        const clickedMesh = intersects[0].object;
        highlightObject(clickedMesh);
    }
}

// Function that highlights an object
function highlightObject(object) {
    // Unhighlighting the previously clicked object
    if (selectedObject && selectedObject.material && selectedObject.material.emissive) {
        selectedObject.material.emissive.setHex(0x000000);
    }

    if (object.name != "floor" && object.name != "wall") {
        selectedObject = object;

        if (selectedObject && selectedObject.material && selectedObject.material.emissive) {
            selectedObject.material.emissive.setHex(0x777777);
        }
    }
    else {
        selectedObject = null;
    }
}

// Function that moves an object based on the pressed key
function handleKeyDown(event) {
    // Only moving if something is selected
    if (!selectedObject) return;

    const speed = 2;
    const rotationSpeed = 0.1;
    if (!isPartOfSofa(selectedObject)) {
        switch (event.key.toLowerCase()) {
            case "w":
                selectedObject.position.z -= speed;
                break;
            case "s":
                selectedObject.position.z += speed;
                break;
            case "a":
                selectedObject.position.x -= speed;
                break;
            case "d":
                selectedObject.position.x += speed;
                break;
            case "r":
                selectedObject.rotation.y += rotationSpeed;
                break;
        }
    }
    else {
        switch (event.key.toLowerCase()) {
            case "w":
                selectedObject.position.y += speed;
                break;
            case "s":
                selectedObject.position.y -= speed;
                break;
            case "a":
                selectedObject.position.x -= speed;
                break;
            case "d":
                selectedObject.position.x += speed;
                break;
            case "r":
                selectedObject.rotation.z += rotationSpeed;
                break;
        }
    }
}

function isPartOfSofa(object) {
    while (object) {
        if (object.name === "sofa") return true;
        object = object.parent;
    }
    return false;
}

// Final update loop
const clock = new THREE.Clock();
var MyUpdateLoop = function ( )
{
    var delta = clock.getDelta();
    controls.update();
    // Call the render with the scene and the camera
    renderer.render(scene,camera);
    requestAnimationFrame(MyUpdateLoop);

};
requestAnimationFrame(MyUpdateLoop);


// This function is called when the window is resized
var MyResize = function ( )
{
    // get the new sizes
    var width = window.innerWidth;
    var height = window.innerHeight;
    // then update the renderer
    renderer.setSize(width,height);
    // and update the aspect ratio of the camera
    camera.aspect = width/height;

    // update the projection matrix given the new values
    camera.updateProjectionMatrix();

    // and finally render the scene again
    renderer.render(scene,camera);
};

// Link the resize of the window to the update of the camera
window.addEventListener("resize", MyResize);
// Linking the mouse click to the defined function
window.addEventListener('click', onMouseClick, false);
// Linking pressing a key to the defined function
window.addEventListener("keydown", handleKeyDown);
