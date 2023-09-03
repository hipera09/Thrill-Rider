import * as THREE from 'three';
import { KeyDisplay } from './utils.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as CANNON from './node_modules/cannon-es/dist/cannon-es.js';


function main() {

    let maxVerticalAngle = Math.PI * 0.5; // Ângulo vertical máximo (90 graus)
    const world = new CANNON.World({
        gravity: new CANNON.Vec3(0,-10,0)
    });

    const timeStep = 1/60;


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

        // Carrega a bike usando a Promise
        {
            loadBike().then(() => {
                // Chama a função para atualizar a câmera após a bike ser carregada
                updateCamera();
            }).catch((error) => {
                console.error(error);
            });
        }

        //Movimentação
        {
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

            // CONTROL KEYS
            const keysPressed = {};
            const keyDisplayQueue = new KeyDisplay();

            document.addEventListener('keydown', (event) => {
                keyDisplayQueue.down(event.key);
                keysPressed[event.key.toLowerCase()] = true;
            },);

            document.addEventListener('keyup', (event) => {
                keyDisplayQueue.up(event.key);
                keysPressed[event.key.toLowerCase()] = false;
            },);
        }

        //Geração dos objetos no mapa
        {
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
        }

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

        createGround();
        createLight();

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
            let deltaTime = clock.getDelta();

            // Atualize a simulação física

            if (resizeRendererToDisplaySize(renderer)) {
                const canvas = renderer.domElement;
                camera.aspect = canvas.clientWidth / canvas.ClienteHeight;
                camera.uptadeProjectionMatrix;
            }
            updateObjectPosition();
            updateCamera();
            world.step(timeStep)
            renderer.render(scene, camera);
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
    }
}
main();

// Função para carregar e gerar mundo fisico
function initPhysics() {
    physicsWorld = new CANNON.World();
    physicsWorld.gravity.set(0, -10, 0); // Define a gravidade
    physicsWorld.broadphase = new CANNON.NaiveBroadphase(); // Define o método de detecção de colisões
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Carregue o mapa de altura (heightmap)
    const disMap = new THREE.TextureLoader().load('./textures/heightmap-01.png');
    disMap.wrapS = disMap.wrapT = THREE.RepeatWrapping;
    disMap.repeat.set(1, 1);
    const disMapImage = disMap.image;

    canvas.width = disMapImage.width;
    canvas.height = disMapImage.height;
    context.drawImage(disMapImage, 0, 0, disMapImage.width, disMapImage.height);

    const data = context.getImageData(0, 0, disMapImage.width, disMapImage.height).data;

    const dataArray = [];
    for (let i = 0; i < data.length; i += 4) {
        // Converte a cor para uma altura entre -1 e 1
        const height = ((data[i] + data[i + 1] + data[i + 2]) / 3 / 255) * 2 - 1;
        dataArray.push(height);
    }

    const groundShape = new CANNON.Heightfield(dataArray, {
        elementSize: larguraDoMapa / disMapImage.width,
    });

    const groundBody = new CANNON.Body({
        mass: 0,
        shape: groundShape,
    });

    groundBody.position.set(0, -10, 0);
    physicsWorld.addBody(groundBody);
}

function physics(){

}

// Função para carregar e gerar um objeto no mapa
function loadAndGenerateObject(objectPath, scale) {
    const loader3 = new GLTFLoader();
    loader3.load(objectPath, (gltf) => {
        const object = gltf.scene;
        const shape = new CANNON.Box(new CANNON.Vec3(scale * 0.5, scale * 0.5, scale * 0.5)); // Define a forma do corpo físico
        const body = new CANNON.Body({ mass: 1, shape }); // Cria o corpo físico

        // Configura a posição do corpo físico igual à posição da malha Three.js
        body.position.set(object.position.x, object.position.y, object.position.z);

        physicsWorld.addBody(body); // Adiciona o corpo físico ao mundo

        // Salva a referência da malha e do corpo físico
        body.mesh = object;
        rigidBodies.push(body);
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

    }, undefined, (error) => {
        console.error(error);
    });
}

// Função para atualizar a posição do objeto
function updateObjectPosition() {
    // Atualize o mundo físico (simulação)
    physicsWorld.step(1.0 / 60.0); // Passo de simulação de 60 FPS

    // Atualize a posição dos objetos Three.js baseada na simulação física
    for (let i = 0; i < rigidBodies.length; i++) {
        const body = rigidBodies[i];
        const mesh = body.mesh;
        const position = body.position;

        // Atualize a posição da malha com base na posição física
        mesh.position.copy(position);

        // Atualize a rotação da malha com base na rotação física
        mesh.quaternion.copy(body.quaternion);
    }
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

// Função de crição da luz
function createLight() {
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
}

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

// Função de criação do chão
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

// Função para gerar múltiplos objetos aleatoriamente no mapa
function generateObjects(objectPath, numObjects, scale) {
    for (let i = 0; i < numObjects; i++) {
        loadAndGenerateObject(objectPath, scale);
    }
}