import * as THREE from 'three';
import { KeyDisplay } from './utils.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as CANNON from './node_modules/cannon-es/dist/cannon-es.js';


function main() {

    const world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -10, 0)
    });

    let bikeBody;
    let boxBody;
    let threeObject;
    let bike;

    const timeStep = 1 / 60;

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
        const controls = new PointerLockControls(camera, document.body);

        // Adicione os controles à cena
        scene.add(controls.getObject());

        // Defina um evento para quando os controles são ativados
        controls.addEventListener('lock', () => {
            console.log('Pointerlock ativado');
        });

        // Defina um evento para quando os controles são desativados
        controls.addEventListener('unlock', () => {
            console.log('Pointerlock desativado');
        });

        // Adicione um listener para o evento de clique para ativar os controles
        document.addEventListener('click', () => {
            controls.lock();
        });

        // Adicione um listener para o evento de tecla para desativar os controles (Esc)
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape') {
                controls.unlock();
            }
        });

        // CRIA O CHÃO
        function createGround() {
            const groundGeo = new THREE.PlaneGeometry(200, 200, 200, 200);
            groundGeo.computeBoundingBox();

            let disMap = new THREE.TextureLoader().load("./textures/heightmap-01.png");
            disMap.wrapS = disMap.wrapT = THREE.RepeatWrapping;
            disMap.repeat.set(1, 1);

            const groundTexture = new THREE.TextureLoader().load("./textures/Grass_005_BaseColor.jpg");
            groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
            groundTexture.repeat.set(10, 10);

            const groundMat = new THREE.MeshStandardMaterial({
                map: groundTexture,
                //displacementMap: disMap,
                displacementScale: 12,
            });

            mesh.geometry = groundGeo;
            mesh.material = groundMat;

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
        const mesh = new THREE.Mesh();
        createGround();

        const groundBody = new CANNON.Body({
            shape: new CANNON.Plane(),
            //mass: 03
            type: CANNON.Body.STATIC
        });

        world.addBody(groundBody);
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

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


        const bikeBody = new CANNON.Body({
            shape: new CANNON.Box(new CANNON.Vec3(2, 2, 2)),
            mass: 5
        });
        world.addBody(bikeBody);

        // CONTROL KEYS
        const keysPressed = {};
        const keyDisplayQueue = new KeyDisplay();

        function updateObjectPosition() {
            const speed = 0.5; // Velocidade de movimento do objeto

            // Verifica tecla W (para frente)
            if (keysPressed['w']) {
                bike.position.z += speed;  // Move o objeto para trás
            }

            // Verifica tecla A (para a esquerda)
            if (keysPressed['a']) {
                bike.position.x += speed;
                //angle += rotationSpeed;
                //bike.rotation.y = THREE.MathUtils.clamp(angle, -Math.PI, Math.PI);

            }

            // Verifica tecla S (para trás)
            if (keysPressed['s']) {
                bike.position.z -= speed; // Move o objeto para frente
            }

            // Verifica tecla D (para a direita)
            if (keysPressed['d']) {
                bike.position.x -= speed;
                //angle -= rotationSpeed;
                //bike.rotation.y = THREE.MathUtils.clamp(angle, -Math.PI, Math.PI);

            }

            // Verifica tecla Space pra cima 
            if (keysPressed[' ']) {
                bike.position.y += speed; // Move o objeto para a cima
            }

            // Verifica tecla Shift pra baixo 
            if (keysPressed['shift']) {
                bike.position.y -= speed; // Move o objeto para a baixo
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
                const randomX = Math.random() * (larguraDoMapa - 20); // Largura do mapa
                const randomZ = Math.random() * (comprimentoDoMapa - 20); // Comprimento do mapa
                const position = new THREE.Vector3(randomX - 100, 0.31, randomZ - 100);
                object.position.copy(position);

                // Gera a orientação aleatória do objeto
                const randomRotation = Math.random() * Math.PI * 2; // Ângulo aleatório em radianos
                object.rotation.y = randomRotation;

                // Adiciona o objeto à cena
                scene.add(object);

                threeObject = object;

                // Cria o corpo rígido do Cannon.js para o objeto
                const boxShape = new CANNON.Box(new CANNON.Vec3(4, 4, 4)); // Você pode ajustar o tamanho do corpo
                const boxBody = new CANNON.Body({ mass: 1, shape: boxShape });
                boxBody.position.copy(position); // Copia a posição do objeto Three.js para o corpo Cannon.js
                boxBody.quaternion.copy(object.quaternion); // Copia a rotação do objeto Three.js para o corpo Cannon.js

                // Adiciona o corpo rígido ao mundo Cannon.js
                world.addBody(boxBody);

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
        const scaleStone = 8; // Fator de escala (2 para dobrar o tamanho)
        generateObjects(stonePath, numStones, scaleStone);

        // Chamada para gerar múltiplos objetos (árvores, por exemplo)
        const treePath = '/textures/oak_trees.glb'; // Caminho para o arquivo GLB da árvore
        const numTrees = 15; // Número de árvores a serem geradas
        const scaleTree = 8; // Fato
        generateObjects(treePath, numTrees, scaleTree);


        const cameraDistance = -0.4; // Distância da câmera em relação ao objeto
        const cameraHeight = 1.3; // Altura da câmera em relação ao objeto
        const cameraDirection = new THREE.Vector3(0, 0.8, 1);


        // Função de atualização da câmera
        function updateCamera() {
            if (!bike) {
                console.log("A bike ainda não foi carregada, trate esse caso");
                return;
            }
            // Atualiza o vetor de direção da bicicleta
            const cameraOffset = new THREE.Vector3(0, cameraHeight, cameraDistance);
            // Define a posição da câmera para estar atrás da bicicleta na direção do vetor bikeDirection
            const cameraPosition = bike.position.clone().add(cameraOffset);
            camera.position.copy(cameraPosition);
            const lookAtPosition = bike.position.clone().add(cameraDirection); // Usando o vetor cameraDirection
            //camera.lookAt(lookAtPosition);
        }
        // Carrega a bike usando a Promise
        loadBike().then(() => {
            // Chama a função para atualizar a câmera após a bike ser carregada
            updateCamera();
        }).catch((error) => {
            console.error(error);
        });

        // // Adicione os eventos para detectar a tecla de rotação
        // document.addEventListener('keydown', (event) => {
        //     if (event.key === 'a' || 'd') {
        //         isRotating = true;
        //     }
        // });

        // document.addEventListener('keyup', (event) => {
        //     if (event.key === 'a' || 'd') {
        //         isRotating = false;
        //     }
        // });


        // Crie a luz direcional correspondente ao sol
        const color = new THREE.Color(0xffffff);
        const intensity = 1; // Ajuste a intensidade 
        const light = new THREE.PointLight(color, intensity);
        light.castShadow = true;
        light.shadow.mapSize.width = 1024; // Tamanho horizontal do shadow map
        light.shadow.mapSize.height = 1024; // Tamanho vertical do shadow map
        light.position.set(200, 100, 0); // Posição da luz 
        scene.add(light);

        // Helper para visualizar a direção da luz 
        const helper = new THREE.PointLight(light);
        scene.add(helper);

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

        // Chamada para carregar a bike usando a Promise
        loadBike().then(() => {
            // Agora que a bike está carregada, podemos iniciar a função de renderização
            requestAnimationFrame(render);
        }).catch((error) => {
            console.error(error);
        });

        function render() {
            world.step(timeStep);

            if (resizeRendererToDisplaySize(renderer)) {
                const canvas = renderer.domElement;
                camera.aspect = canvas.clientWidth / canvas.ClienteHeight;
                camera.uptadeProjectionMatrix;
            }

            // Chamada para carregar a bike usando a Promise
            loadBike().then(() => {
                // Agora que a bike está carregada, podemos copiar sua posição e rotação
                bikeBody.position.copy(bike.position);
                bikeBody.quaternion.copy(bike.quaternion);
            }).catch((error) => {
                console.error(error);
            });

            // console.log(bike.position);
            mesh.position.copy(groundBody.position);
            mesh.quaternion.copy(groundBody.quaternion);

            if (bike) {
                bikeBody.position.copy(bike.position);
                bikeBody.quaternion.copy(bike.quaternion);
            }

            if (threeObject && boxBody) {
                threeObject.position.copy(boxBody.position);
                threeObject.quaternion.copy(boxBody.quaternion);
            }

            updateObjectPosition();
            updateCamera();
            renderer.render(scene, camera);
            requestAnimationFrame(render);
        }
    }
}
main();