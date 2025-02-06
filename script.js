import * as THREE from './node_modules/three/build/three.module.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);

document.getElementById('canvaContainer')?.appendChild(renderer.domElement);

camera.position.set(0, 10, 0);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 1;
controls.maxDistance = 50;
controls.maxPolarAngle = Math.PI / 2;
controls.enabled = false;

let points = [];
let isShapeClosed = false;
let buildingMesh = null;
let lineGeometry, lineMaterial, line;

// OpenStreetMap Background
const tileServerURL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const tileCoords = { x: 19294, y: 24641, z: 16 };
const texture = new THREE.TextureLoader().load(
  tileServerURL.replace('{z}', tileCoords.z).replace('{x}', tileCoords.x).replace('{y}', tileCoords.y)
);

const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshBasicMaterial({ map: texture })
);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function drawLines() {
    if(!isShapeClosed){
        if (line) scene.remove(line);
        if (points.length < 2) return;

        lineGeometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p.x, 0.01, p.y)));
        lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        line = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(line);
    }
}

function onMouseClick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(plane);

  if (intersects.length > 0) {
    const point = intersects[0].point;
    points.push(new THREE.Vector2(point.x, point.z));
    drawLines();
  }

  document.getElementById('myButton')?.classList.remove('disabled');

  if (points.length > 2 && points[0].distanceTo(points[points.length - 1]) < 0.2) {
    isShapeClosed = true;
    createHeightInput();
    createBuilding(1);
    controls.enabled = true;
  }
}

renderer.domElement.addEventListener('click', onMouseClick);
function createHeightInput() {
    const heightInput = document.createElement('input');
    heightInput.id = 'heightInput';
    heightInput.type = 'range';
    heightInput.min = '0';
    heightInput.max = '10';
    heightInput.step = '0.1';
    heightInput.value = '0';



    const valueDisplay = document.createElement('span');
    valueDisplay.id = 'heightValue';
    valueDisplay.textContent = heightInput.value;



    document.body.appendChild(heightInput);
    document.body.appendChild(valueDisplay);

    heightInput.addEventListener('input', (e) => {
        const height = parseFloat(e.target.value);
        valueDisplay.textContent = height; // Update displayed value
        createBuilding(height);
    });
}
function createBuilding(height) {
    if (buildingMesh) {
        scene.remove(buildingMesh);
    }

    const shape = new THREE.Shape(points.map(p => new THREE.Vector2(p.x, -p.y)));

    const extrudeSettings = {
        steps: 1,
        depth: height,
        bevelEnabled: false
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshPhongMaterial({ color: 0x808080, side: THREE.DoubleSide });
    buildingMesh = new THREE.Mesh(geometry, material);
    
    buildingMesh.rotation.x = -Math.PI / 2; 

    buildingMesh.position.set(0, 0, 0);

    scene.add(buildingMesh);
}


const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

function animate() {
  requestAnimationFrame(animate);
  if (controls.enabled) {
    controls.update();
  }
  renderer.render(scene, camera);
}
animate();