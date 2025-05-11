import * as THREE from './build/three.module.js';
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.155/examples/jsm/loaders/GLTFLoader.js";
import {decreaseHealth} from './level2_survival_mode.js';

// Setting up 3D model loader
const loader = new GLTFLoader();

function loadAndAddModel(path, position, scale, scene, callback) {
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

export function addSperm(position, vector, scene, type, healthpoints) {
    if (type == 0) { // Sperm
        loadAndAddModel("3DModels/sperm.glb", position, 0.5, scene, (model, animations) => {
            model.userData.cell_type = "sperm";
            vector.push(model);
    
            // Enabling raycasting on each mesh subobject to know which model to delete
            model.traverse((child) => {
                if (child.isMesh) {
                    child.userData.parentModel = model;
                }
            });
    
            // Adding animations
            if (animations && animations.length) {
                const mixer = new THREE.AnimationMixer(model);
                animations.forEach(animation => mixer.clipAction(animation).play());
                model.userData.mixer = mixer;
            }
        });
    }
    else { // Leukocyte
        loadAndAddModel("3DModels/leukocyte.glb", position, 20, scene, (model, animations) => {
            model.userData.cell_type = "leukocyte";
            model.userData.health = healthpoints;
            vector.push(model);
    
            // Enabling raycasting on each mesh subobject to know which model to delete
            model.traverse((child) => {
                if (child.isMesh) {
                    child.userData.parentModel = model;
                }
            });
    
            // Adding animations
            if (animations && animations.length) {
                const mixer = new THREE.AnimationMixer(model);
                animations.forEach(animation => mixer.clipAction(animation).play());
                model.userData.mixer = mixer;
            }
        });
    }
}

export function updateSperms(sperms, deltaTime, camera, rotationSpeed) {
    sperms.forEach(sperm => {
        // Updating rotation
        // Rotating smoothly towards the camera
        const targetQuaternion = new THREE.Quaternion();
        // Cloning the camera's position
        const targetPosition = camera.position.clone();
        sperm.lookAt(targetPosition);
        // Capturing the desired rotation
        targetQuaternion.copy(sperm.quaternion);

        // Reverting to the previous rotation
        if (sperm.userData.previousQuaternion != null) {
            sperm.quaternion.copy(sperm.userData.previousQuaternion);
        }
        else {
            sperm.quaternion.copy(sperm.quaternion);
        }
        
        // Smoothly interpolating toward the desired rotation
        sperm.quaternion.slerp(targetQuaternion, deltaTime * rotationSpeed);

        // Saving the current rotation for the next frame
        sperm.userData.previousQuaternion = sperm.quaternion.clone();


        // Updating movement
        // Moving forward
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(sperm.quaternion);
        forward.normalize();

        // Adding separation to avoid sperm from touching each other
        const separationForce = new THREE.Vector3();
        const separationRadius = 2;

        sperms.forEach(other => {
            if (other !== sperm) {
                // Calculating distance from this sperm to every other sperm
                const distance = sperm.position.distanceTo(other.position);
                if (distance < separationRadius && distance > 0.001) { 
                    // Distance > 0.001 is added to avoid dividing by zero when two sperms are in the same position
                    // The closer they are, the bigger the separation force becomes
                    const push = new THREE.Vector3().subVectors(sperm.position, other.position)
                                                    .normalize()
                                                    .multiplyScalar(1 / distance);
                    separationForce.add(push);
                }
            }
        });
        // Adding separation if they are too close
        const finalDirection = forward.clone();
        if (separationForce.lengthSq() > 0) {
            // Multiplying by 0.5 to make the force less strong
            separationForce.normalize().multiplyScalar(0.5);
            finalDirection.add(separationForce).normalize();
        }
        // Applying movement
        sperm.position.add(finalDirection.multiplyScalar(deltaTime * rotationSpeed));

        // Updating animation
        if (sperm.userData.mixer) {
            sperm.userData.mixer.update(deltaTime);
        }
        // Damaging player if too close
        const distanceToPlayer = sperm.position.distanceTo(camera.position);
        if (distanceToPlayer < 1) {
            decreaseHealth();
        }
    });
}