import * as THREE from 'three';
import {addSperm, updateSperms, loadAndAddModel} from './cells.js';

// -------------------------- SETUP & VARIABLES --------------------------

// Creating the scene
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
var ratio = window.innerWidth / window.innerHeight;

// Creating the perspective camera
var camera = new THREE.PerspectiveCamera(45, ratio, 0.01, 1000);
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

// GUI variables
let pointerLockEnabled = false;
var score = 0;
var health = 3;
var timeLeft = 120;
var timerInterval;
var lastDamageTime = 0;

// Rotation around the Y-Axis (horizontally)
var yaw = 0;
// Rotation around the X-Axis (vertically)
var pitch = 0;

// Movement variables
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;
const speed = 10;

const clock = new THREE.Clock();

// Displaying the crosshair and Score
document.getElementById('crosshair').style.display = 'block';
document.getElementById('score').style.display = 'block';
document.getElementById('health').style.display = 'block';
document.getElementById('timer').style.display = 'block';
document.getElementById('timer').innerText = `Time left: ${timeLeft}s`;

// Creating uterus
var meshUterus, meshTubes;
addUterus();

let sperms = [];
var spermsRotationSpeed = 5;
var gate1, gate2;
var material_uterus, geometry_uterus, geometry_tubes;
var finished = false;
var basePositionsUterus, basePositionsTubes;


// ------------------------------- MAIN CODE -------------------------------

startTimer();

// ------------------------------- FUNCTIONS -------------------------------

function fakeNoise(x, y, t) {
    return Math.sin(x * 0.3 + t) * Math.cos(y * 0.3 + t);
}

function addUterus() {
    material_uterus = new THREE.MeshPhongMaterial({
        shininess: 100,
        color: new THREE.Color(0xffffff),
        side: THREE.BackSide
    });

    // Mapping for colour
    var color_map = new THREE.TextureLoader().load('textures/meat.jpg');
    color_map.wrapS = color_map.wrapT = THREE.RepeatWrapping;
    color_map.repeat.set(10, 10);
    material_uterus.map = color_map;

    // Normal mapping
    var normal_map = new THREE.TextureLoader().load('textures/tileable.jpg');
    normal_map.wrapS = normal_map.wrapT = THREE.RepeatWrapping;
    normal_map.repeat = new THREE.Vector2(10, 10);

    material_uterus.normalMap = normal_map;

    // Uterus geometry
    geometry_uterus = new THREE.SphereGeometry(12.5, 16, 16);
    meshUterus = new THREE.Mesh(geometry_uterus, material_uterus);
    meshUterus.scale.set(1, 2, 1.5);
    meshUterus.rotation.x = Math.PI / 2;
    meshUterus.receiveShadow = true;
    scene.add(meshUterus);

    basePositionsUterus = geometry_uterus.attributes.position.array.slice();

}


function shoot() {
    // Not shooting if game is over
    if (health == 0) return;
    raycaster.set(camera.position, Dir.clone().normalize());

    // Collecting all meshes from all Sperm models
    const spermMeshes = sperms.flatMap(sperm => {
        const meshes = [];
        sperm.traverse(child => {
            if (child.isMesh) meshes.push(child);
        });
        return meshes;
    });

    // Checking if a sperm has been shot and removing it
    const intersects = raycaster.intersectObjects(spermMeshes);

    if (intersects.length > 0) {
        const hitObject = intersects[0].object;
        const sperm = hitObject.userData.parentModel;
        if (sperm) {
            if (sperm.userData.cell_type === "leukocyte") {
                // Reducing leukocyte's health by 1
                sperm.userData.health -= 1;

                let newColor;
                if (sperm.userData.health == 1) {
                    newColor = new THREE.Color(0xff0000);
                } else if (sperm.userData.health == 2) {
                    newColor = new THREE.Color(0xffff00);
                }
                // Updating colour
                if (newColor) {
                    sperm.traverse(child => {
                        if (child.isMesh) {
                            child.material = child.material.clone();
                            child.material.color = newColor;
                        }
                    });
                }

                if (sperm.userData.health <= 0) {
                    scene.remove(sperm);
                    const index = sperms.indexOf(sperm);
                    if (index > -1) sperms.splice(index, 1);
                    // Increasing score only when eliminated
                    score += 5;
                    document.getElementById('score').innerText = `Score: ${score}`;
                }
            } else { // It's a sperm, removing directly
                scene.remove(sperm);
                // Obtaining removed sperm index and removing from array
                const index = sperms.indexOf(sperm);
                if (index > -1) sperms.splice(index, 1);
                // Increasing score
                score += 2;
                document.getElementById('score').innerText = `Score: ${score}`;
            }
        }
    }
}

function updateMovement(delta) {
    // Not moving if game is over
    if  (health == 0) return;
    let moveVector = new THREE.Vector3();

    let forward = new THREE.Vector3();
    camera.getWorldDirection(forward);

    let right = new THREE.Vector3();
    right.crossVectors(forward, camera.up);

    if (moveForward) moveVector.add(forward);
    if (moveBackward) moveVector.sub(forward);
    if (moveLeft) moveVector.sub(right);
    if (moveRight) moveVector.add(right);
    if (moveUp) moveVector.y += 0.5;
    if (moveDown) moveVector.y -= 0.5;

    // Calculating new position
    moveVector.normalize().multiplyScalar(speed * delta);
    let newPos = Pos.clone().add(moveVector);

    const safetyMargin = 1;
    // Raycasting from current position towards movement direction
    const ray = new THREE.Raycaster(Pos, moveVector, 0, moveVector.length() + safetyMargin);
    if (!finished) {
        const intersects = ray.intersectObject(meshUterus, true);
        // Not moving if collision detected
        if (intersects.length > 0) return;
    }
    else {
        const intersects = ray.intersectObject(meshTubes, true);
        // Not moving if collision detected
        if (intersects.length > 0) return;
    }
    Pos.copy(newPos);
}

function startTimer() {
    timerInterval = setInterval(() => {
        if (health == 0) {
            document.getElementById('gameover').style.display = 'block';
            return;
        }
        if (finished) return;
        addEnemies();

        timeLeft--;
        // Update time left
        if (timeLeft > 0) {
            const timerElement = document.getElementById('timer');
            timerElement.textContent = `Time left: ${timeLeft}s`;
            if (timeLeft == 30) spermsRotationSpeed = 6;
        }
        else if (timeLeft == 0) {
            addGates();
        }
        else {
            // Time's out
            // Displaying time's out message
            //clearInterval(timerInterval);
            const timerElement = document.getElementById('timer');
            timerElement.style.left = '30%';
            timerElement.textContent = `Time's out! The tubes are open!`;
        }
    }, 1000); // (1 second)
}

export function decreaseHealth() {
    if (finished) return;
    const currentTime = performance.now();

    if (currentTime - lastDamageTime >= 1000) { // 1 second cooldown
        if (health > 0) health--;
        lastDamageTime = currentTime;

        const healthElement = document.getElementById('health');
        if (healthElement) {
            healthElement.textContent = `Health: ${health}`;
        }
    }
}

// Generates a random number between 10 and 20 or -10 and -20
function randomPos() {
    const sign = Math.random() < 0.5 ? -1 : 1;
    return sign * (10 + Math.random() * 10);
}

function addEnemies() {
    if (finished) return;
    var whitecellhealth = 2;
    if (score > 50) whitecellhealth = 3;
    if (timeLeft % 3 == 0) { // Adding a white cell every 3 seconds
        var offset = new THREE.Vector3(randomPos(), randomPos(), randomPos());
        var newPos = Pos.clone().add(offset);
        addSperm(newPos, sperms, scene, 1, whitecellhealth);
    }
    if (timeLeft % 10 == 0) { // Adding a sperm cell every 10 seconds
        var offset = new THREE.Vector3(randomPos(), randomPos(), randomPos());
        var newPos = Pos.clone().add(offset);
        addSperm(newPos, sperms, scene, 0, 2);
    } 
}

function addGates() {
    var material_gate = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
    var geometry_gate = new THREE.CylinderGeometry(1, 1, 0.1, 20);
    gate1 = new THREE.Mesh(geometry_gate, material_gate);
    gate1.position.y = -1;
    // Position and rotation
    gate1.position.set(0, 0, 24.5);
    gate1.rotation.x = Math.PI / 2;

    scene.add(gate1);

    gate2 = new THREE.Mesh(geometry_gate, material_gate);
    gate2.position.y = -1;
    // Position and rotation
    gate2.position.set(0, 0, -24.5);
    gate2.rotation.x = -Math.PI / 2;

    scene.add(gate2);
}

function checkGates() {
    const distanceTogate1 = gate1.position.distanceTo(camera.position);
    const distanceTogate2 = gate2.position.distanceTo(camera.position);

    if (distanceTogate1 < 1 || distanceTogate2 < 1) {
        sperms.forEach(cell => {
        scene.remove(cell);
        });

        var newpos = new THREE.Vector3(0, -20, -20);
        // Changing player position to 0,0,0)
        Pos.copy(newpos);
        
        var offset = new THREE.Vector3(0, 20, 20);
        // Adding tubes in (0,0,0)
        newpos = Pos.clone().add(offset);
        // Adding tubes
        geometry_tubes= new THREE.SphereGeometry(40, 60, 40);
        meshTubes = new THREE.Mesh(geometry_tubes, material_uterus);
        meshTubes.scale.set(1, 1, 1);
        meshTubes.receiveShadow = true;
        meshTubes.position.copy(newpos);
        scene.add(meshTubes);

        basePositionsTubes = geometry_tubes.attributes.position.array.slice();

        // Removing uterus and gates
        scene.remove(meshUterus);
        scene.remove(gate1);
        scene.remove(gate2);
        
        // 50% chance of adding egg cell
        if (Math.random() < 0.5) {
            // Adding egg cell
            loadAndAddModel("3DModels/cell.glb", newpos, 10, scene, (model, animations) => {});
             const gameoverElement = document.getElementById('gameover');
            gameoverElement.textContent = `Victory!`;
        }
        else {
            const gameoverElement = document.getElementById('gameover');
            gameoverElement.style.left = '50%';
            gameoverElement.style.fontSize = '32px';
            gameoverElement.textContent = `Oh no! You picked the wrong Fallopian tube`;
        }

        finished = true;
        document.getElementById('gameover').style.display = 'block';
    }

}

// Final update loop
var MyUpdateLoop = function () {
    var delta = clock.getDelta();
    // Get elapsed time for noise generation
    const elapsedTime = clock.getElapsedTime();
    
    camera.position.set(Pos.x, Pos.y, Pos.z);
    camera.lookAt(Pos.x + Dir.x, Pos.y + Dir.y, Pos.z + Dir.z);
    camera.updateProjectionMatrix();

    updateSperms(sperms, delta, camera, spermsRotationSpeed);

    // Updating player movement
    updateMovement(delta);

    // Deforming uterus
    if (meshUterus && geometry_uterus && basePositionsUterus) {
        const pos1 = geometry_uterus.attributes.position;
        for (let i = 0; i < pos1.count; i++) {
            // (vertex i * 3 because each vertex has 3 components)
            const ix = i * 3;
            const x = basePositionsUterus[ix];
            const y = basePositionsUterus[ix + 1];
            const z = basePositionsUterus[ix + 2];

            // Calculate displacement with Noise
            const displacement = fakeNoise(x, z, elapsedTime) * 0.1;
            // Apply noise on vertex to deform geometry
            pos1.setXYZ(i, x, y + displacement, z + displacement * 0.5);
        }

        pos1.needsUpdate = true;
        geometry_uterus.computeVertexNormals();

    }
    if (meshTubes && geometry_tubes && basePositionsTubes) {
        const pos2 = geometry_tubes.attributes.position;
        for (let i = 0; i < pos2.count; i++) {
            // (vertex i * 3 because each vertex has 3 components)
            const ix = i * 3;
            const x = basePositionsTubes[ix];
            const y = basePositionsTubes[ix + 1];
            const z = basePositionsTubes[ix + 2];

            // Calculate displacement with Noise
            const displacement = fakeNoise(x, z, elapsedTime) * 1;
            // Apply noise on vertex to deform geometry
            pos2.setXYZ(i, x, y + displacement, z + displacement * 0.5);
        }

        pos2.needsUpdate = true;
        geometry_tubes.computeVertexNormals();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(MyUpdateLoop);

    flashlight.position.copy(camera.position);
    flashlight.target.position.copy(camera.position.clone().add(Dir));

    checkGates();

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
    if (event.code === 'Space') moveUp = true;
    if (event.code === 'ShiftLeft') moveDown = true;
});

window.addEventListener('keyup', (event) => {
    if (event.code === 'KeyW') moveForward = false;
    if (event.code === 'KeyS') moveBackward = false;
    if (event.code === 'KeyA') moveLeft = false;
    if (event.code === 'KeyD') moveRight = false;
    if (event.code === 'Space') moveUp = false;
    if (event.code === 'ShiftLeft') moveDown = false;
});