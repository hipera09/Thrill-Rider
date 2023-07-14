import * as THREE from 'three';
import { KeyDisplay } from './utils.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


function main() {

    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

    const fov = 60;
    const aspect = 2;
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 9, 35);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('Skyblue')

    {
        const planeSize = 200;

        const loader = new THREE.TextureLoader();
        const texture = loader.load('https://threejs.org/manual/examples/resources/images/checker.png');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        const repeats = planeSize / 2;
        texture.repeat.set(repeats, repeats);

        const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
        const planeMat = new THREE.MeshPhongMaterial({
            map: texture,
            side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(planeGeo, planeMat);
        mesh.rotation.x = Math.PI * -.5;
        scene.add(mesh);

    }

    {
        const loader = new GLTFLoader();
        loader.load('ktm_450_exc.glb', function (gltf) {
            const bike = gltf.scene;
            bike.position.set(0, 0.31, 0)
            scene.add(bike);
        }, undefined, function (error) {
            console.error(error);


            const gltfAnimations = gltf.animations;
            const mixer = new THREE.AnimationMixer(model);
            const animationsMap = new Map();
            gltfAnimations.filter(a => a.name != 'TPose').forEach((a) => {
                animationsMap.set(a.name, mixer.clipAction(a));
            });

            characterControls = new CharacterControls(model, mixer, animationsMap, OrbitControls, camera, 'Idle');

        });

    }

    {
        //Orbit Controls
        const orbitControls = new OrbitControls(camera, renderer.domElement);
        orbitControls.enableDamping = true
        orbitControls.minDistance = 5
        orbitControls.maxDistance = 15
        orbitControls.enablePan = false
        orbitControls.maxPolarAngle = Math.PI / 2 - 0.05
        orbitControls.update();
    }

    {
        // CONTROL KEYS
        const keysPressed = {};
        const keyDisplayQueue = new KeyDisplay();

        document.addEventListener('keydown', (event) => {
            keyDisplayQueue.down(event.key);
            if (event.shiftKey && characterControls) {
                characterControls.switchRunToggle();
            } else {
                keysPressed[event.key.toLowerCase()] = true;
            }
        }, false);

        document.addEventListener('keyup', (event) => {
            keyDisplayQueue.up(event.key);
            keysPressed[event.key.toLowerCase()] = false;
        }, false);

        const clock = new THREE.Clock();

    }
    //0x963d19
    {
        const color = new THREE.Color(0xffffff);
        const intensity = 1;
        const light = new THREE.AmbientLight(color, intensity);
        scene.add(light);
    }

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
        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}
main();