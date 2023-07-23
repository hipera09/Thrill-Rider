import * as THREE from 'three';
import { KeyDisplay } from './utils.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';



function main() {
    {
        const canvas = document.querySelector('#c');
        const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
        renderer.shadowMap.enabled = true;

        const larguraDoMapa = 200; // Defina a largura do mapa
        const comprimentoDoMapa = 200; // Defina o comprimento do mapa

        const fov = 60;
        const aspect = 2;
        const near = 0.1;
        const far = 200;
        const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.shadowMap = true;
        camera.position.set(0, 2, 10);
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('Skyblue')
        let bike;
        const rotationSpeed = 0.02; // Ajuste a velocidade de rotação conforme necessário
        let angle = 0;

        // CRIA O CHÃO
        function createGround() {

            const groundGeo = new THREE.PlaneGeometry(200, 200, 200, 200);

            let disMap = new THREE.TextureLoader().load("./textures/heightmap-01.png")

            disMap.wrapS = disMap.wrapT = THREE.RepeatWrapping;
            disMap.repeat.set(1, 1);

            const groundTexture = new THREE.TextureLoader().load("./textures/Grass_005_BaseColor.jpg");
            groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
            groundTexture.repeat.set(10, 10); // Ajuste a repetição conforme necessário



            const groundMat = new THREE.MeshStandardMaterial({
                map: groundTexture, // Aplique a textura ao material
                displacementMap: disMap,
                displacementScale: 12,
                //receiveShadow: true, // Permita que o material receba sombra
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
            mesh.rotation.x = Math.PI * -.5;
            mesh.position.y = -0.5;
        }

        //createGround();

        //chão xadrez

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
        basicGround();


        //cilindro teste
        {
            // Criando um cilindro
            const radiusTop = 5;
            const radiusBottom = 5;
            const height = 30;
            const radialSegments = 32;
            const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);

            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Cor vermelha

            const cylinder = new THREE.Mesh(geometry, material);
            cylinder.receiveShadow = true;
            cylinder.castShadow = true;
            scene.add(cylinder);

        }

        // Função para carregar o objeto com GLTFLoader
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


        function getHeightAtPosition(x, z) {
            const groundGeo = new THREE.PlaneGeometry(200, 200, 200, 200); // Usando 200 segmentos em cada direção

            // Normaliza as coordenadas X e Z entre -0.5 e 0.5 (pois a geometria do terreno é centrada no (0, 0))
            const normalizedX = (x / 200) - 0.5;
            const normalizedZ = (z / 200) - 0.5;

            // Calcula a posição do vértice correspondente às coordenadas X e Z
            const column = Math.floor((normalizedX + 0.5) * 200);
            const row = Math.floor((normalizedZ + 0.5) * 200);
            const vertexIndex = row * (200 + 1) + column;

            // Obtém o buffer de posição da geometria
            const positionAttribute = groundGeo.getAttribute("position");

            // Obtém a altura do terreno nesse vértice
            const alturaDoTerreno = positionAttribute.getY(vertexIndex);

            return alturaDoTerreno;
        }


        //Orbit Controls
        const orbitControls = new OrbitControls(camera, renderer.domElement);
        orbitControls.enableDamping = true
        orbitControls.minDistance = 5
        orbitControls.maxDistance = 15
        orbitControls.enablePan = false
        orbitControls.maxPolarAngle = Math.PI / 2 - 0.05
        orbitControls.update();

        // Função para atualizar a rotação da câmera de acordo com a rotação da bike
        function updateCameraRotation() {
            if (!bike) {
                console.log("A bike ainda não foi carregada");
                return;
            }

            const cameraOffset = new THREE.Vector3(0, cameraHeight, cameraDistance);
            const cameraPosition = bike.position.clone().add(cameraOffset);
            camera.position.copy(cameraPosition);

            const rotationOffset = new THREE.Vector3(0, 0, -1); // Vetor de deslocamento para trás da bike
            rotationOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), bike.rotation.y); // Rotaciona o vetor de acordo com a rotação da bike

            const lookAtPosition = bike.position.clone().add(rotationOffset);
            camera.lookAt(lookAtPosition);
        }

        // Função para atualizar a posição e rotação da bike
        function updateBikePositionAndRotation() {
            // CONTROL KEYS
            const keysPressed = {};
            const keyDisplayQueue = new KeyDisplay();
            const speed = 1; // Velocidade de movimento do objeto

            // Verifica tecla W (para frente)
            if (keysPressed['w']) {
                // Move o objeto para trás, considerando sua rotação atual
                bike.position.x += speed;
                bike.position.z += speed;
                console.log(Math.sin(bike.rotation.y));
            }

            // Verifica tecla A (para a esquerda)
            if (keysPressed['a']) {
                angle += rotationSpeed;
                bike.rotation.y = THREE.MathUtils.clamp(angle, -Math.PI);
            }

            // Verifica tecla S (para trás)
            if (keysPressed['s']) {
                // Move o objeto para frente, considerando sua rotação atual
                bike.position.x -= speed
                bike.position.z -= speed
                console.log(Math.sin(bike.rotation.y));
            }

            // Verifica tecla D (para a direita)
            if (keysPressed['d']) {
                angle -= rotationSpeed;
                bike.rotation.y = THREE.MathUtils.clamp(angle, -Math.PI);
            }

            // Verifica tecla Space pra cima 
            if (keysPressed[' ']) {
                bike.position.y += speed; // Move o objeto para a cima
            }

            // Verifica tecla Shift pra baixo 
            if (keysPressed['shift']) {
                bike.position.y -= speed; // Move o objeto para a baixo
            }
            document.addEventListener('keydown', (event) => {
                keyDisplayQueue.down(event.key);
                keysPressed[event.key.toLowerCase()] = true;
            },);

            document.addEventListener('keyup', (event) => {
                keyDisplayQueue.up(event.key);
                keysPressed[event.key.toLowerCase()] = false;
            },);
        }
        const clock = new THREE.Clock();

        // Função para carregar e gerar um objeto no mapa
        function loadAndGenerateObject(objectPath, scale) {
            const loader3 = new GLTFLoader();
            loader3.load(objectPath, (gltf) => {
                const object = gltf.scene;
                object.traverse((child) => {
                    // if (child.isMesh) child.material = angryTexture;
                    if (child.material) {
                        child.material.metalness = 0;
                    }
                    if (child.isMesh) {
                        child.castShadow = true;
                    }
                });

                // Ajusta a escala do objeto
                object.scale.set(scale, scale, scale);

                // Gera a posição aleatória do objeto dentro do mapa
                const randomX = Math.random() * (larguraDoMapa - 10); // Largura do mapa
                const randomZ = Math.random() * (comprimentoDoMapa - 10); // Comprimento do mapa
                const position = new THREE.Vector3(randomX - 100, 0.3, randomZ - 100);
                object.position.copy(position);
                console.log(getHeightAtPosition(randomX, randomZ))

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
        const numStones = 30; // Número de pedras a serem geradas
        const scaleStone = 10; // Fator de escala (2 para dobrar o tamanho)
        generateObjects(stonePath, numStones, scaleStone);

        // Chamada para gerar múltiplos objetos (árvores, por exemplo)
        const treePath = '/textures/oak_trees.glb'; // Caminho para o arquivo GLB da árvore
        const numTrees = 15; // Número de árvores a serem geradas
        const scaleTree = 8; // Fato
        generateObjects(treePath, numTrees, scaleTree);


        const cameraDistance = 0.4; // Distância da câmera em relação ao objeto
        const cameraHeight = 1; // Altura da câmera em relação ao objeto
        const cameraDirection = new THREE.Vector3(0, 0.8, 1);


        // Função de atualização da câmera
        function updateCamera() {
            if (!bike) {
                console.log("A bike ainda não foi carregada");
                return;
            }
            console.log(bike.position);
            // Atualiza o vetor de direção da bicicleta
            const cameraOffset = new THREE.Vector3(0, cameraHeight, cameraDistance);
            // Define a posição da câmera para estar atrás da bicicleta na direção do vetor bikeDirection
            const cameraPosition = bike.position.clone().add(cameraOffset);
            camera.position.copy(cameraPosition);
            const lookAtPosition = bike.position.clone().add(cameraDirection); // Usando o vetor cameraDirection
            camera.lookAt(lookAtPosition);
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
        const intensity = 0.5;
        const light = new THREE.DirectionalLight(color, intensity);
        light.castShadow = true;
        light.shadowMapWidth = 2048; // Tamanho horizontal do shadow map
        light.shadowMapHeight = 2048; // Tamanho vertical do shadow map
        light.position.set(110, 100, 0);
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
            updateBikePositionAndRotation();
            //updateCameraRotation();

            updateCamera();

            renderer.render(scene, camera);
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
    }
}
main();