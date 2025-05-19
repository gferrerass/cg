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

// LIGHTING
// Add an ambient light to the scene
const light = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(light);

// SpotLight pointing inside the vaginal canal
const canalLight = new THREE.SpotLight(0xffffff, 1, 200, Math.PI / 4, 0.9, 0.3);
canalLight.position.set(0, 2, 30); // In front of the canal
canalLight.target.position.set(0, 0, -50); // Aim deep inside the canal
scene.add(canalLight);
scene.add(canalLight.target);

// ------------------------------- MAIN CODE -------------------------------

// GUI variables
var score = 0;
var timeLeft = 60;
var timerInterval;
var gameFinished = false;

const loader = new GLTFLoader();
const enemies = [];

// Array of tuples with path to the model and scale of the model
const enemyModels = [
    { path: "3DModels/leukocyte.glb", scale: 90 },
    // { path: "3DModels/leukocyte_simple.glb", scale: 0.25 },
    // { path: "3DModels/leukocyte_angry.glb", scale: 2 },
];

let sperm;
const spermSpeed = 0.5;
const movementLimits = { left: -12, right: 12, top: 10.5, bottom: -11};
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
};

const mixers = []; // Stores animation mixers (for sperm movement)

let meshVaginalCanal;
addVaginalCanal();

// Display the score and timer
document.getElementById('score').style.display = 'block';
document.getElementById('timer').style.display = 'block';

spawnSperm();

const clock = new THREE.Clock(); // clock for frame rate independent motion
startEnemySpawner();
animate(); // Start the animation loop
startTimer(); // Start the timer countdown

// ------------------------------- FUNCTIONS -------------------------------

function animate() {
    //if (gameFinished) return; // Stop the animation loop if the game is finished
    if (gameFinished) {
        return; // Stop the animation loop if the game is finished
        // For orbit controls to work when the game is finished
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    } else {
        requestAnimationFrame(animate);
        const delta = clock.getDelta(); // Get time delta for smooth animation
        // Update animations
        const speedFactor = 2.5; // Speed of the sperm swim animation
        mixers.forEach((mixer) => mixer.update(delta * speedFactor));
        controls.update();
        updatesperm();
        updateEnemies(delta);

        renderer.render(scene, camera);
    }
}

function addVaginalCanal() {
    const canalMaterial = new THREE.MeshPhongMaterial({
        shininess: 200,
        color: 0xffc0cb, // Pink base color
        side: THREE.BackSide // Render the inside of the canal
    });

    // Texture mapping
    const texture = new THREE.TextureLoader().load('textures/liquid_pink.png'); // Wet skin texture
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 20); // Tiling repeat 10 times around the cilinder and 20 times along its length
    canalMaterial.map = texture;

    // Normal map for bumpiness
    const normalMap = new THREE.TextureLoader().load('textures/tileable.jpg'); // Bump normal map
    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(10, 20);
    canalMaterial.normalMap = normalMap;

    // The geometry is a long cylinder with a big opening and a small end
    const radiusTop = 25;   // opening
    const radiusBottom = 0; // end
    const height = 300; // length of the canal
    const radialSegments = 32;  // how many slices around the cilinder
    const heightSegments = 32;  // how many slices along the cilinder

    const geometry = new THREE.CylinderGeometry(
        radiusTop,
        radiusBottom,
        height,
        radialSegments,
        heightSegments,
        true // open-ended
    );

    meshVaginalCanal = new THREE.Mesh(geometry, canalMaterial);
    meshVaginalCanal.rotation.x = Math.PI / 2; // Align along the z-axis
    meshVaginalCanal.position.z = -80; // Position it in front of the camera
    meshVaginalCanal.position.y = -2; // Adjust height

    scene.add(meshVaginalCanal);
}

// Starts timer countdown and when it reaches 0, ends the game
function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        score++;
        document.getElementById('timer').innerText = `Time left: ${timeLeft}s`;
        document.getElementById('score').innerText = `Score: ${score}`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            gameFinished = true;
            const timerElement = document.getElementById('timer');
            timerElement.style.left = '23%';
            timerElement.textContent = `Time's out! You made it through the Vag-Crash!`;
            endGame(true); // Level passed, player wins
        }
    }, 1000);   // 1 second interval
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
            Math.random() * 25 - 14, // Random y position between -14 and 11
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
    // If the sperm model hasn't loaded yet, return
    if (!sperm) return;

    // Wrap the sperm in a hit box to check for collisions
    const spermCenter = sperm.localToWorld(new THREE.Vector3(0, 0.3, 0.5)); // Get sperm coordinates
    const spermSize = new THREE.Vector3(1.5, 1, 5.5); // Make custom hit box
    const spermBox = new THREE.Box3().setFromCenterAndSize(spermCenter, spermSize);

    // Visualize the hit box (debug) 
    // if (!sperm.customHelper) {
    //     const helper = new THREE.Box3Helper(spermBox, 0x00ff00);
    //     scene.add(helper);
    //     sperm.customHelper = helper;
    // } else {
    //     // Update the helper's box
    //     sperm.customHelper.box.copy(spermBox);
    //     sperm.customHelper.updateMatrixWorld(true);
    // }

    // Iterate backwards to safely remove enemies while iterating
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // Move the enemy towards the screen (positive z-axis)
        enemy.position.z += delta * 50;

        // Rotate the enemy
        enemy.rotation.x += delta * 0.5;
        enemy.rotation.y += delta * 0.5;
        
        // Create a bounding sphere for the enemy
        const boundingBox = new THREE.Box3().setFromObject(enemy);
        // Shrink the sphere to better fit the model
        const center = boundingBox.getCenter(new THREE.Vector3());
        const radius = boundingBox.getSize(new THREE.Vector3()).length() * 0.18;
        const enemySphere = new THREE.Sphere(center, radius);

        // Draw sphere helper (debug)
        // if (!enemy.sphereHelper) {
        //     const sphereGeo = new THREE.SphereGeometry(radius, 12, 12);
        //     const wireMat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        //     const helperMesh = new THREE.Mesh(sphereGeo, wireMat);
        //     helperMesh.position.copy(center);
        //     scene.add(helperMesh);
        //     enemy.sphereHelper = helperMesh;
        // } else {
        //     enemy.sphereHelper.position.copy(center);
        //     enemy.sphereHelper.scale.setScalar(radius / enemy.sphereHelper.geometry.parameters.radius);
        // }

        // Check for collision between the sperm and the enemy
        if (spermBox.intersectsSphere(enemySphere)) {
            // Collision detected
            clearInterval(timerInterval);   // Stop the timer
            gameFinished = true;    // Set game finished to true
            endGame(false);   // Player loses
            return;
        }
        
        // Remove the enemy when it reaches behind the camera
        if (enemy.position.z > camera.position.z + 5) {
            scene.remove(enemy); // Remove the enemy from the scene
            // if (enemy.sphereHelper) {   // Remove the sphere helper if it exists
            //     scene.remove(enemy.sphereHelper);
            // }
            enemies.splice(i, 1); // Remove the enemy from the array
        }
    }
}

// Spawns a new enemy every 200ms
function startEnemySpawner() {
    setInterval(spawnEnemy, 100);
}

function updatesperm() {
    if (!sperm) return;

    if (keys.ArrowUp && sperm.position.y < movementLimits.top) {
        sperm.position.y += spermSpeed;
    }
    if (keys.ArrowDown && sperm.position.y > movementLimits.bottom) {
        sperm.position.y -= spermSpeed;
    }
    if (keys.ArrowLeft && sperm.position.x > movementLimits.left) {
        sperm.position.x -= spermSpeed;
    }
    if (keys.ArrowRight && sperm.position.x < movementLimits.right) {
        sperm.position.x += spermSpeed;
    }

    // Keep the camera centered on the sperm
    camera.position.set(sperm.position.x, sperm.position.y + 3, 10);
    camera.lookAt(sperm.position.x, sperm.position.y, -50);
}

function endGame(win) {
    // Stop the timer
    clearInterval(timerInterval);

    if (win) {
        // Show win message
        document.getElementById('win').style.display = 'block';
    } else {
        // Show game over message
        document.getElementById('gameover').style.display = 'block';
    }
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