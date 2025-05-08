import * as THREE from './build/three.module.js';

export class Polygon {
  constructor(geometry, material, position, scene) {
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(position[0], position[1], position[2]);

    // Random initial angle of self-rotation
    this.mesh.rotation.x = Math.random() * Math.PI * 2;
    this.mesh.rotation.y = Math.random() * Math.PI * 2;
    this.mesh.rotation.z = Math.random() * Math.PI * 2;

    // Random self-rotation speed per frame
    this.rotationSpeedX = (Math.random() * 0.015 + 0.005);
    this.rotationSpeedY = (Math.random() * 0.015 + 0.005);
    this.rotationSpeedZ = (Math.random() * 0.015 + 0.005);

    // Random orbit speed around the platform per frame
    this.OrbitSpeed = (Math.random() * 0.002 + 0.0005) * (Math.random() < 0.5 ? -1 : 1); // They can orbit in both directions
    // Random orbit distance
    this.orbitDistance = Math.random() * 5 + 5;
    // Random initial orbit angle
    this.orbitAngle = Math.random() * Math.PI * 2;

    // Setting the centre of the platform to rotate around it
    this.centre = new THREE.Vector3(0, 0, 0);

    scene.add(this.mesh);
  }

  update() {
    this.mesh.rotation.x += this.rotationSpeedX;
    this.mesh.rotation.y += this.rotationSpeedY;
    this.mesh.rotation.z += this.rotationSpeedZ;

    // Update orbit angle
    this.orbitAngle += this.OrbitSpeed;

    // Calculate new position based on orbiting around the center
    this.mesh.position.x = this.centre.x + Math.cos(this.orbitAngle) * this.orbitDistance;
    this.mesh.position.z = this.centre.z + Math.sin(this.orbitAngle) * this.orbitDistance;
  }
}

export class Cube extends Polygon {
  constructor(position, scene) {
    const cubeMaterial = new THREE.MeshPhongMaterial({color: 0xff0000, wireframe: false});
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    super(cubeGeometry, cubeMaterial, position, scene);
  }
}

export class SquaredPyramid extends Polygon {
  constructor(position, scene) {
    const pyramidMaterial = new THREE.MeshPhongMaterial({color: 0x00ff00, wireframe: false});
    const pyramidGeometry = new THREE.ConeGeometry(1, 2, 4);
    super(pyramidGeometry, pyramidMaterial, position, scene);
  }
}

export class Dodecahedron extends Polygon {
  constructor(position, scene) {
    const dodecahedronMaterial = new THREE.MeshPhongMaterial({color: 0x0000ff, wireframe: false});
    const dodecahedronGeometry = new THREE.DodecahedronGeometry(1);
    super(dodecahedronGeometry, dodecahedronMaterial, position, scene);
  }
}

export function createPolygons(positions, scene, shape, nPolygons) {
  const polygons = [];
  if (nPolygons <= positions.length) {
    // Taking the first npolygons
    const selectedPositions = positions.slice(0, nPolygons);

    selectedPositions.forEach(pos => {
      let polygon;

      if (shape === 'Random') {
        const randomShape = Math.floor(Math.random() * 3);
        switch (randomShape) {
          case 0:
            polygon = new Cube(pos, scene);
            break;
          case 1:
            polygon = new SquaredPyramid(pos, scene);
            break;
          case 2:
            polygon = new Dodecahedron(pos, scene);
            break;
        }
      } else {
        switch (shape) {
          case 'Cube':
            polygon = new Cube(pos, scene);
            break;
          case 'SquaredPyramid':
            polygon = new SquaredPyramid(pos, scene);
            break;
          case 'Dodecahedron':
            polygon = new Dodecahedron(pos, scene);
            break;
        }
      }

      polygons.push(polygon);
    });
  }
  return polygons;
}



