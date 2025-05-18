// ------------------------------- IMPORTS -------------------------------
import * as THREE from "three";
import { OrbitControls } from "./build/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.155/examples/jsm/loaders/GLTFLoader.js";

// ------------------------------- SETUP -------------------------------
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 2, 10);
camera.lookAt(0, 0, -50);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
// Add the renderer to the current document
document.body.appendChild(renderer.domElement);

// For orbit controls, to move around the scene
var controls = new OrbitControls(camera, renderer.domElement);

// ------------------------------- MAIN CODE -------------------------------

// Add an ambient light to the scene
// const light = new THREE.AmbientLight(0xffffff, 1);
// scene.add(light);

// Add a directional light to the scene
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 0, 1);
scene.add(directionalLight);

const loader = new GLTFLoader();
const enemies = [];

// Array of tuples with path to the model and scale of the model
const enemyModels = [
    { path: "3DModels/leukocyte.glb", scale: 70 },
    { path: "3DModels/leukocyte_simple.glb", scale: 0.25 },
    { path: "3DModels/leukocyte_angry.glb", scale: 2 },
];

let sperm;
const spermSpeed = 0.5;
const movementLimits = { x: 12, y: 7 };
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
};

const mixers = []; // Stores animation mixers (for sperm movement)

spawnSperm();

const clock = new THREE.Clock(); // clock for frame rate independent motion
startEnemySpawner();
animate(); // Start the animation loop

// ------------------------------- FUNCTIONS -------------------------------

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta(); // Get time delta for smooth animation
    // Update animations
    const speedFactor = 2.5; // Adjust this value to make the animation faster
    mixers.forEach((mixer) => mixer.update(delta * speedFactor));
    controls.update();
    updatesperm();
    updateEnemies(delta);

    renderer.render(scene, camera);
}

function spawnSperm() {
    loader.load("3DModels/sperm.glb", (gltf) => {
        sperm = gltf.scene;
        sperm.position.set(0, -2, -6);
        sperm.scale.setScalar(0.8);
        // Rotate the sperm so it faces away from the camera
        sperm.rotation.y = Math.PI;
        scene.add(sperm);

        // Set up animation mixer
        const mixer = new THREE.AnimationMixer(sperm);
        gltf.animations.forEach((clip) => {
            console.log(clip);
            const action = mixer.clipAction(clip);
            action.play(); // Play the animation
        });
        mixers.push(mixer);
    });
}

function spawnEnemy() {
    // Randomly select an enemy model by generating a random index between 0 and enemyModels.length-1
    const model = enemyModels[Math.floor(Math.random() * enemyModels.length)];

    // Load the selected model
    loader.load(model.path, (gltf) => {
        const enemy = gltf.scene;
        const randomScale = (Math.random() + 0.5) * model.scale;
        enemy.scale.setScalar(randomScale);

        // Randomize position at the horizon
        enemy.position.set(
            Math.random() * 30 - 15, // Random x position between -15 and 15
            Math.random() * 20 - 10, // Random y position between -10 and 10
            -100
        );

        // Random rotation
        enemy.rotation.set(
            Math.random() * 2 * Math.PI,
            Math.random() * 2 * Math.PI,
            Math.random() * 2 * Math.PI
        );

        scene.add(enemy);
        enemies.push(enemy);
    });
}

// Update the position of all enemies every frame and remove them when they reach behind the camera
function updateEnemies(delta) {
    // Iterate backwards to safely remove enemies while iterating
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // Move the enemy towards the screen (positive z-axis)
        enemy.position.z += delta * 50;

        // Rotate the enemy
        enemy.rotation.x += delta * 0.5;
        enemy.rotation.y += delta * 0.5;

        // Remove the enemy when it reaches behind the camera
        if (enemy.position.z > camera.position.z + 5) {
            scene.remove(enemy); // Remove the enemy from the scene
            enemies.splice(i, 1); // Remove the enemy from the array
        }
    }
}

// Spawns a new enemy every 200ms
function startEnemySpawner() {
    setInterval(spawnEnemy, 200);
}

function updatesperm() {
    if (!sperm) return;

    if (keys.ArrowUp && sperm.position.y < movementLimits.y)
        sperm.position.y += spermSpeed;
    if (keys.ArrowDown && sperm.position.y > -movementLimits.y)
        sperm.position.y -= spermSpeed;
    if (keys.ArrowLeft && sperm.position.x > -movementLimits.x)
        sperm.position.x -= spermSpeed;
    if (keys.ArrowRight && sperm.position.x < movementLimits.x)
        sperm.position.x += spermSpeed;

    // Keep the camera centered on the sperm
    camera.position.set(sperm.position.x, sperm.position.y + 3, 10);
    camera.lookAt(sperm.position.x, sperm.position.y, -50);
}

// Load a 3D model from a path and return a promise that resolves with the loaded model
function load3DModel(path) {
    return new Promise((resolve, reject) => {
        loader.load(path, (gltf) => {
        resolve(gltf.scene);
        });
    });
}

// (From class) This function is called when the window is resized
function MyResize() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
}

// ------------------------------- EVENT LISTENERS -------------------------------

// Link the resize of the window to the update of the camera
window.addEventListener("resize", MyResize);
window.addEventListener("keydown", (event) => {
    if (event.key in keys) keys[event.key] = true;
});
window.addEventListener("keyup", (event) => {
    if (event.key in keys) keys[event.key] = false;
});