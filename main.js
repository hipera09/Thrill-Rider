import * as THREE from 'three';
import { A, KeyDisplay } from './utils.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';



function main() {
    {
        const canvas = document.querySelector('#c');
        const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

        const fov = 60;
        const aspect = 2;
        const near = 0.1;
        const far = 100;
        const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.position.set(0, 0, 0);
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('Skyblue')
        let bike;


        const planeSize = 400;

        const loader = new THREE.TextureLoader();
        const texture = loader.load('https://threejs.org/manual/examples/resources/images/checker.png');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        const repeats = planeSize / 2;
        texture.repeat.set(repeats, repeats);

        const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
        const planeMat = new THREE.MeshPhongMaterial({
            map: texture
        });

        const mesh = new THREE.Mesh(planeGeo, planeMat);
        mesh.rotation.x = Math.PI * -.5;
        scene.add(mesh);

        // Função para carregar o objeto com GLTFLoader
        function loadBike() {
            return new Promise((resolve, reject) => {
                const loader2 = new GLTFLoader();
                loader2.load('textures/ktm_450_exc.glb', (gltf) => {
                    bike = gltf.scene;
                    bike.position.set(0, 0.31, 0);
                    scene.add(bike);
                    resolve(bike); // Resolvendo a Promise com o objeto bike
                }, undefined, (error) => {
                    reject(error); // Rejeitando a Promise em caso de erro
                });
            });
        }


        //Orbit Controls
        const orbitControls = new OrbitControls(camera, renderer.domElement);
        orbitControls.enableDamping = true
        orbitControls.minDistance = 5
        orbitControls.maxDistance = 15
        orbitControls.enablePan = false
        orbitControls.maxPolarAngle = Math.PI / 2 - 0.05
        orbitControls.update();


        // CONTROL KEYS
        const keysPressed = {};
        const keyDisplayQueue = new KeyDisplay();

        function updateObjectPosition() {
            const speed = 0.5; // Velocidade de movimento do objeto

            // Verifica tecla W (para frente)
            if (keysPressed['w']) {
                bike.position.z += speed; // Move o objeto para trás
            }

            // Verifica tecla A (para a esquerda)
            if (keysPressed['a']) {
                bike.position.x += speed; // Move o objeto para a esquerda
            }

            // Verifica tecla S (para trás)
            if (keysPressed['s']) {
                bike.position.z -= speed; // Move o objeto para frente
            }

            // Verifica tecla D (para a direita)
            if (keysPressed['d']) {
                bike.position.x -= speed; // Move o objeto para a direita
            }
        }

        document.addEventListener('keydown', (event) => {
            keyDisplayQueue.down(event.key);
            keysPressed[event.key.toLowerCase()] = true;
        },);

        document.addEventListener('keyup', (event) => {
            keyDisplayQueue.up(event.key);
            keysPressed[event.key.toLowerCase()] = false;
        },);

        const clock = new THREE.Clock();

        // Função para carregar e gerar um objeto no mapa
        function loadAndGenerateObject(objectPath, scale) {
            const loader3 = new GLTFLoader();
            loader3.load(objectPath, (gltf) => {
                const object = gltf.scene;
                // Ajusta a escala do objeto
                object.scale.set(scale, scale, scale);

                // Gera a posição aleatória do objeto dentro do mapa
                const randomX = Math.random() * 100; // Largura do mapa
                const randomZ = Math.random() * 100; // Altura do mapa
                const position = new THREE.Vector3(randomX, 0.5, randomZ);
                object.position.copy(position);

                // Gera a orientação aleatória do objeto
                const randomRotation = Math.random() * Math.PI * 2; // Ângulo aleatório em radianos
                object.rotation.y = randomRotation;

                // Adiciona o objeto à cena
                scene.add(object);
            }, undefined, (error) => {
                console.error(error);
            });
        }

        // Função para gerar múltiplos objetos aleatoriamente no mapa
        function generateObjects(objectPath, numObjects, scale) {
            for (let i = 0; i < numObjects; i++) {
                loadAndGenerateObject(objectPath, scale);
            }
        }

        // Chamada para gerar múltiplos objetos (pedras, por exemplo)
        const stonePath = '/textures/stone_03.glb'; // Caminho para o arquivo GLB da pedra
        const numStones = 20; // Número de pedras a serem geradas
        const scaleStone = 3; // Fator de escala (2 para dobrar o tamanho)
        generateObjects(stonePath, numStones, scaleStone);

        // Chamada para gerar múltiplos objetos (árvores, por exemplo)
        const treePath = '/textures/oak_trees.glb'; // Caminho para o arquivo GLB da árvore
        const numTrees = 10; // Número de árvores a serem geradas
        const scaleTree = 8; // Fato
        generateObjects(treePath, numTrees, scaleTree);


        const cameraDistance = 6; // Distância da câmera em relação ao objeto
        const cameraHeight = 3; // Altura da câmera em relação ao objeto

        // Função de atualização da câmera
        function updateCamera() {
            if (!bike) {
                console.log("A bike ainda não foi carregada, trate esse caso");
                return;
            }
            console.log(bike.position);
            const cameraOffset = new THREE.Vector3(0, cameraHeight, -cameraDistance);
            const cameraPosition = bike.position.clone().add(cameraOffset);
            camera.position.copy(cameraPosition);
            camera.lookAt(bike.position);

        }

        // Carrega a bike usando a Promise
        loadBike().then(() => {
            // Chama a função para atualizar a câmera após a bike ser carregada
            updateCamera();
        }).catch((error) => {
            console.error(error);
        });

        //0x963d19
        const color = new THREE.Color(0xffffff);
        const intensity = 1;
        const light = new THREE.AmbientLight(color, intensity);
        scene.add(light);


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
        requestAnimationFrame(render);
    }
}
main();