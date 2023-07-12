import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


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
        const orbitControls = new OrbitControls(camera, renderer.domElement);
        orbitControls.enableDamping = true
        orbitControls.minDistance = 5
        orbitControls.maxDistance = 15
        orbitControls.enablePan = false
        orbitControls.maxPolarAngle = Math.PI / 2 - 0.05
        orbitControls.update();
    }

    {
        const color = new THREE.Color(0x963d19);
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(0, 10, 0);
        light.target.position.set(-5, 0, 0);
        scene.add(light);
        scene.add(light.target);
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