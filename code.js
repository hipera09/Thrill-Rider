import * as THREE from 'three';
import { KeyDisplay } from './utils.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';

function main() {
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  renderer.shadowMap.enabled = true;

  const fov = 60;
  const aspect = 2;
  const near = 0.1;
  const far = 200;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.shadowMap = true;
  camera.position.set(0, 2, 10);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('Skyblue');

  let bike;
  const rotationSpeed = 0.02; // Ajuste a velocidade de rotação conforme necessário
  let angle = 0;

  // CRIA O CHÃO
  function createGround() {
    const groundGeo = new THREE.PlaneGeometry(200, 200, 200, 200);

    let disMap = new THREE.TextureLoader().load("./textures/heightmap-01.png");
    disMap.wrapS = disMap.wrapT = THREE.RepeatWrapping;
    disMap.repeat.set(1, 1);

    const groundTexture = new THREE.TextureLoader().load("./textures/Grass_005_BaseColor.jpg");
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(10, 10); // Ajuste a repetição conforme necessário

    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTexture, // Aplique a textura ao material
      displacementMap: disMap,
      displacementScale: 12,
    });

    const mesh = new THREE.Mesh(groundGeo, groundMat);
    mesh.traverse((child) => {
      if (child.material) {
        child.material.metalness = 0;
      }
      if (child.isMesh) {
        child.receiveShadow = true;
      }
    });
    mesh.receiveShadow = true;
    scene.add(mesh);
    mesh.rotation.x = Math.PI * -0.5;
    mesh.position.y = -0.5;
  }

  // Cria um cilindro vermelho para teste
  function createCylinder() {
    const radiusTop = 0.5;
    const radiusBottom = 0.5;
    const height = 1;
    const radialSegments = 32;
    const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Cor vermelha
    const cylinder = new THREE.Mesh(geometry, material);
    scene.add(cylinder);
  }

  // Carrega a bike usando a Promise
  function loadBike() {
    return new Promise((resolve, reject) => {
      const loader2 = new GLTFLoader();
      loader2.load('textures/ktm_450_exc.glb', (gltf) => {
        bike = gltf.scene;
        bike.position.set(0, 20, 0);
        scene.add(bike);
        resolve(bike); // Resolvendo a Promise com o objeto bike
      }, undefined, (error) => {
        reject(error); // Rejeitando a Promise em caso de erro
      });
    });
  }

  // Função para obter altura do terreno em uma posição específica
  function getHeightAtPosition(x, z) {
    const groundGeo = new THREE.PlaneGeometry(200, 200, 200, 200);
    const normalizedX = (x / 200) - 0.5;
    const normalizedZ = (z / 200) - 0.5;
    const column = Math.floor((normalizedX + 0.5) * 200);
    const row = Math.floor((normalizedZ + 0.5) * 200);
    const vertexIndex = row * (200 + 1) + column;
    const positionAttribute = groundGeo.getAttribute("position");
    const alturaDoTerreno = positionAttribute.getY(vertexIndex);
    return alturaDoTerreno;
  }

  // Gera o terreno xadrezado
  function basicGround() {
    const loader = new THREE.TextureLoader();
    const texture = loader.load('https://threejs.org/manual/examples/resources/images/checker.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.repeat.set(10, 10);

    const groundGeo2 = new THREE.PlaneGeometry(200, 200, 200, 200);
    const planeMat = new THREE.MeshPhongMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(groundGeo2, planeMat);
    mesh.receiveShadow = true;
    //mesh.castShadow = true;
    mesh.rotation.x = Math.PI * -.5;
    scene.add(mesh);
  }

  // Ordem das chamadas de função
  createGround();
  basicGround();
  createCylinder();

  loadBike().then(() => {
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    // ...
  }).catch((error) => {
    console.error(error);
  });
  loadBike().then(() => {
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.minDistance = 5;
    orbitControls.maxDistance = 15;
    orbitControls.enablePan = false;
    orbitControls.maxPolarAngle = Math.PI / 2 - 0.05;
    orbitControls.update();

    document.addEventListener('keydown', (event) => {
      keyDisplayQueue.down(event.key);
      keysPressed[event.key.toLowerCase()] = true;
    });

    document.addEventListener('keyup', (event) => {
      keyDisplayQueue.up(event.key);
      keysPressed[event.key.toLowerCase()] = false;
    });

    const clock = new THREE.Clock();

    const stonePath = '/textures/stone_03.glb';
    const numStones = 30;
    const scaleStone = 3;
    generateObjects(stonePath, numStones, scaleStone);

    const treePath = '/textures/oak_trees.glb';
    const numTrees = 15;
    const scaleTree = 8;
    generateObjects(treePath, numTrees, scaleTree);

    const cameraDistance = 0.4;
    const cameraHeight = 1;
    const cameraDirection = new THREE.Vector3(0, 0.8, 1);
    }
    function updateCamera() {
      // ... Código anterior ...
    }

    //0x963d19
    const color = new THREE.Color(0xffffff);
    const intensity = 0.5;
    const light = new THREE.DirectionalLight(color, intensity);
    light.castShadow = true;
    light.shadowMapWidth = 1024;
    light.shadowMapHeight = 1024;
    light.position.set(50, 100, 0);
    const helper = new THREE.DirectionalLightHelper(light);
    light.target.position.set(0, 0, 0);
    scene.add(light);
    scene.add(helper);
    scene.add(light.target);

    function resizeRendererToDisplaySize(renderer) {
      const canvas = renderer.domElement;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const needResize = canvas.width !== width || canvas.height !== height;
      if (needResize) {
        renderer.setSize(width, height, false);
        return needResize;
      }
    }

    function render() {
      if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.ClienteHeight;
        camera.uptadeProjectionMatrix;
      }
      updateObjectPosition();
      updateCamera();
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }
  
    // Inicia a renderização
    requestAnimationFrame(render);
  }
main();
