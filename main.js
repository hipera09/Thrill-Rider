import * as THREE from 'three';
import { KeyDisplay } from './utils.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

Ammo().then(main);

function main() {

    let physicsWorld, rigidBodies = [], tmpTrans, clock;
    let maxVerticalAngle = Math.PI * 0.5; // Ângulo vertical máximo (90 graus)

    tmpTrans = new Ammo.btTransform();

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
        let isRotating = false;
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

        document.addEventListener('mousemove', (event) => {
            if (controls.isLocked) {
              // Obtém a variação do mouse
              const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
              const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
        
              // Limita o ângulo vertical da câmera
              const newRotationX = controls.getObject().rotation.x - movementY * 0.002;
              controls.getObject().rotation.x = Math.max(-maxVerticalAngle, Math.min(maxVerticalAngle, newRotationX));
            }
          });       

        function setupPhysicsWorld() {
            let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
                dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
                overlappingPairCache = new Ammo.btDbvtBroadphase(),
                solver = new Ammo.btSequentialImpulseConstraintSolver();

            physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
            physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
        }


        setupPhysicsWorld();

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
                displacementMap: disMap,
                displacementScale: 12,
            });

            let pos = { x: 0, y: 0, z: 0 };
            let scale = { x: 50, y: 2, z: 50 };
            let quat = { x: 0, y: 0, z: 0, w: 1 };
            let mass = 0;

            let transform = new Ammo.btTransform();
            transform.setIdentity();

            transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
            transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

            const mesh = new THREE.Mesh(groundGeo, groundMat);

            const vertices = groundGeo.attributes.position.array;
            const indices = groundGeo.index.array;

            const AmmoMesh = new Ammo.btTriangleMesh(true, true);
            AmmoMesh.setScaling(new Ammo.btVector3(scale.x, scale.y, scale.z));

            for (let i = 0; i < indices.length; i += 3) {
                const vertex1 = new Ammo.btVector3(vertices[indices[i] * 3], vertices[indices[i] * 3 + 1], vertices[indices[i] * 3 + 2]);
                const vertex2 = new Ammo.btVector3(vertices[indices[i + 1] * 3], vertices[indices[i + 1] * 3 + 1], vertices[indices[i + 1] * 3 + 2]);
                const vertex3 = new Ammo.btVector3(vertices[indices[i + 2] * 3], vertices[indices[i + 2] * 3 + 1], vertices[indices[i + 2] * 3 + 2]);

                AmmoMesh.addTriangle(vertex1, vertex2, vertex3, false);
            }

            const colShape = new Ammo.btBvhTriangleMeshShape(AmmoMesh, true, true);
            colShape.setMargin(0.05);

            let localInertia = new Ammo.btVector3(0, 0, 0);
            colShape.calculateLocalInertia(mass, localInertia);

            let rbInfo = new Ammo.btRigidBodyConstructionInfo(0, null, colShape, localInertia);
            let body = new Ammo.btRigidBody(rbInfo);

            physicsWorld.addRigidBody(body);

            groundGeo.userData.ammoMesh = AmmoMesh;

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

        createGround();

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
                const position = new THREE.Vector3(randomX - 100, 10, randomZ - 100);
                object.position.copy(position);
                console.log(getHeightAtPosition(randomX, randomZ))

                // Gera a orientação aleatória do objeto
                const randomRotation = Math.random() * Math.PI * 2; // Ângulo aleatório em radianos
                object.rotation.y = randomRotation;

                // Adiciona o objeto à cena
                scene.add(object);

                let scale2 = { x: 2, y: 2, z: 2 };
                let quat = { x: 0, y: 0, z: 0, w: 1 };
                let mass = 1;

                let transform = new Ammo.btTransform();
                transform.setIdentity();
                transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
                transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
                let motionState = new Ammo.btDefaultMotionState(transform);

                let colShape = new Ammo.btBoxShape(new Ammo.btVector3(scale2.x * 0.5, scale2.y * 0.5, scale2.z * 0.5));
                colShape.setMargin(0.05);

                let localInertia = new Ammo.btVector3(0, 0, 0);
                colShape.calculateLocalInertia(mass, localInertia);

                let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
                let body = new Ammo.btRigidBody(rbInfo);

                physicsWorld.addRigidBody(body);

                object.userData.physicsBody = body;
                rigidBodies.push(object);

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
            //console.log(bike.position);
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

        // Adicione os eventos para detectar a tecla de rotação
        document.addEventListener('keydown', (event) => {
            if (event.key === 'a' || 'd') {
                isRotating = true;
            }
        });

        document.addEventListener('keyup', (event) => {
            if (event.key === 'a' || 'd') {
                isRotating = false;
            }
        });


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

        function updatePhysics(deltaTime) {
            physicsWorld.stepSimulation(deltaTime, 10);

            for (let i = 0; i < rigidBodies.length; i++) {
                let objThree = rigidBodies[i];
                let objAmmo = objThree.userData.physicsBody;
                let ms = objAmmo.getMotionState();
                if (ms) {
                    ms.getWorldTransform(tmpTrans);
                    let p = tmpTrans.getOrigin();
                    let q = tmpTrans.getRotation();
                    objThree.position.set(p.x(), p.y(), p.z());
                    objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
                }
            }
        }

        function render() {
            let deltaTime = clock.getDelta();
            if (resizeRendererToDisplaySize(renderer)) {
                const canvas = renderer.domElement;
                camera.aspect = canvas.clientWidth / canvas.ClienteHeight;
                camera.uptadeProjectionMatrix;
            }
            updateObjectPosition();
            updateCamera();
            updatePhysics(deltaTime);
            renderer.render(scene, camera);
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
    }
}
main();