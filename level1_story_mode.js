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
let score = 0;
let timeLeft = 60;
let timerInterval;
let gameFinished = false;
let meshVaginalCanal; // To store the vaginal canal mesh
const loader = new GLTFLoader();
const clock = new THREE.Clock(); // clock for frame rate independent motion

// ENEMY VARIABLES
const enemies = [];
// Array of tuples with path to the model and scale of the model (only one model for now)
const enemyModels = [
    { path: "3DModels/leukocyte.glb", scale: 90 }
];
let difficulty = 0.4; // Increases over time
let enemySpeed = 50 * difficulty; // Speed of the enemies
const maxDifficulty = 1.00; // Maximum difficulty (the max in story mode is lower than in survival mode)
let spawnInterval = 100;    // Initial enemy spawn interval in milliseconds
let currentInterval = spawnInterval / difficulty; // Current enemy spawn interval based on difficulty
let spawner; // To store the spawn interval id

// SPERM VARIABLES
let sperm;
const spermSpeed = 0.5;  // Speed of the sperm movement
let spermAnimationSpeed = 2.5;  // Speed of the sperm swim animation
const movementLimits = { left: -12, right: 12, top: 10.5, bottom: -11};
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
};
const mixers = []; // Stores animation mixers (for sperm movement)
let shieldActive = false;   // Stores if the shield is active
let shieldTimeout = null;   // Timeout for the shield duration

// Display the score and timer
document.getElementById('score').style.display = 'block';
document.getElementById('timer').style.display = 'block';
document.getElementById('timer').innerText = `Time left: ${timeLeft}s`;

// Display the vaginal canal
addVaginalCanal();

// Display the sperm
spawnSperm();

// Start the animation loop
animate();

// Start the game (countdown and spawning of enemies)
startGame();

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
        const delta = clock.getDelta(); // Get time delta for frame rate independent motion
        // Update animations
        mixers.forEach((mixer) => mixer.update(delta * spermAnimationSpeed));
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

// Starts the game, starting the countdown and the spawning of enemies, and updating the score.
// If the countdown reaches 0, it ends the game as a win
function startGame() {
    timerInterval = setInterval(() => {
        if (score == 0) {   // Wait 1 second before spawning enemies
            // Start enemy spawner loop after 1 second
            enemySpawnerLoop();
        }
        // Update time left and score
        timeLeft--;
        score++;

        // Increase the difficulty slowly every second
        if (difficulty < maxDifficulty) {
            difficulty += 0.02; // Increase difficulty
            currentInterval = spawnInterval / difficulty; // Update the enemy spawn interval
            enemySpeed = 50 * difficulty;   // Update the enemy speed
        }

        // Increase the speed of the sperm swim animation
        spermAnimationSpeed += 0.04;

        // Display updated score and time left
        document.getElementById('timer').innerText = `Time left: ${timeLeft}s`;
        document.getElementById('score').innerText = `Score: ${score}`;

        // Check if time is up
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
        // Change the sperm color to a less bright white
        sperm.traverse((child) => {
            if (child.isMesh) {
                child.material.emissive = new THREE.Color(0xffffff);
                child.material.emissiveIntensity = 0.6;
            }
        });
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
    let isShield = false;   // Current enemy will be replaced by a shield
    if (!shieldActive && Math.random() < 0.014) { // 1/70 chance to spawn a shield
        isShield = true; 
    }

    let model;
    if (isShield) {
        model = { path: "3DModels/shield.glb", scale: 1.0 }; // Shield model
    } else {
        // Randomly select an enemy model by generating a random index between 0 and enemyModels.length-1
        model = enemyModels[Math.floor(Math.random() * enemyModels.length)];
    }

    // Load the selected model
    loader.load(model.path, (gltf) => {
        const enemy = gltf.scene;
        if (!isShield) {    // If the enemy is not a shield, set a random scale
            const randomScale = (Math.random() + 0.5) * model.scale;
            enemy.scale.setScalar(randomScale);
        } else {
            // If it's a shield, change the color to blue
            enemy.traverse((child) => {
                if (child.isMesh) {
                    child.material.emissive = new THREE.Color(0x00ffff);
                    child.material.emissiveIntensity = 0.8;
                }
            });
        }

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

        enemy.userData.isShield = isShield; // Store if the enemy is a shield

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

    // Iterate backwards to safely remove enemies while iterating
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // Move the enemy towards the screen (positive z-axis)
        enemy.position.z += delta * enemySpeed;

        // Rotate the enemy
        enemy.rotation.x += delta * 0.5;
        enemy.rotation.y += delta * 0.5;
        
        // Create a bounding sphere for the enemy
        const boundingBox = new THREE.Box3().setFromObject(enemy);
        // Shrink the sphere to better fit the model
        const center = boundingBox.getCenter(new THREE.Vector3());
        const radius = boundingBox.getSize(new THREE.Vector3()).length() * 0.18;
        const enemySphere = new THREE.Sphere(center, radius);

        // Check for collision between the sperm and the enemy
        if (spermBox.intersectsSphere(enemySphere)) {
            // Collision with shield
            if (enemy.userData.isShield) {
                // Activate the shield
                activateShield();
                scene.remove(enemy);    // Remove the shield from the scene
                enemies.splice(i, 1);   // Remove the shield from the array
                continue;
            }

            // Collision with enemy
            if (!shieldActive) {
                clearInterval(timerInterval);   // Stop the timer
                gameFinished = true;    // Set game finished to true
                endGame(false);   // Player loses
                return;
            } else {    // Shield is active, remove the enemy
                scene.remove(enemy);    // Remove the enemy from the scene
                enemies.splice(i, 1);   // Remove the enemy from the array
                score += 1;    // Increase score by 1
                document.getElementById('score').innerText = `Score: ${score}`; // Update score display
            }
        }
        
        // Remove the enemy when it reaches behind the camera
        if (enemy.position.z > camera.position.z + 5) {
            scene.remove(enemy); // Remove the enemy from the scene
            enemies.splice(i, 1); // Remove the enemy from the array
        }
    }
}

function activateShield() {
    shieldActive = true;

    // Change the sperm color to blue-ish to indicate the shield is active
    sperm.traverse((child) => {
        if (child.isMesh) {
            child.material.emissive = new THREE.Color(0x00ffff);
            child.material.emissiveIntensity = 0.8;
        }
    });

    if (shieldTimeout) clearTimeout(shieldTimeout);

    shieldTimeout = setTimeout(() => {
        shieldActive = false;
        // Change the sperm color back to white
        sperm.traverse((child) => {
            if (child.isMesh) {
                child.material.emissive = new THREE.Color(0xffffff);
                child.material.emissiveIntensity = 0.6;
            }
        });
    }, 5000); // Shield lasts 5 seconds
}

// Spawns an enemy every currentInterval milliseconds
function enemySpawnerLoop() {
    spawnEnemy();

    // Call the function again after the current interval
    spawner = setTimeout(enemySpawnerLoop, currentInterval);
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

    // Stop the enemy spawner
    clearInterval(spawner);

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
    let width = window.innerWidth;
    let height = window.innerHeight;
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