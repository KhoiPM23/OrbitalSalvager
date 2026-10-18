import * as THREE from 'three';
import { SpaceEngine } from '../physics/spaceEngine';
import { AsteroidHazard, GravityAnomaly, SalvageItem, ShipState, WreckageHazard } from '../physics/types';
import { ProceduralTextures } from './textures';

interface Particle3D {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
  mesh?: THREE.Mesh;
}

export class SpaceView3D {
  private canvas: HTMLCanvasElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  // Camera tracking
  private cameraTarget = new THREE.Vector3(600, 350, 0);
  private cameraPos = new THREE.Vector3(600, 200, 520);
  private screenShakeAmount = 0;

  // Scene Objects
  private playerShipGroup = new THREE.Group();
  private shieldMesh!: THREE.Mesh;
  private engineLight!: THREE.PointLight;
  private engineCoreLight!: THREE.PointLight;
  private exhaustParticles: Particle3D[] = [];

  // Dynamic mesh pools mapped by ID
  private asteroidMeshes = new Map<string, THREE.Mesh>();
  private wreckageMeshes = new Map<string, THREE.Group>();
  private salvageMeshes = new Map<string, THREE.Group>();
  private recoveryBayGroup = new THREE.Group();
  private gravityWellGroups = new Map<string, THREE.Group>();

  // Tether 3D Mesh
  private tetherMesh: THREE.Mesh | null = null;

  // Slingshot Trajectory Line
  private trajectoryLine: THREE.Line | null = null;

  // Target Lock Reticle 3D
  private lockReticleGroup = new THREE.Group();

  // Animation & Time
  private clock = new THREE.Clock();
  private animTimer = 0;

  // Deep Starfield
  private starfieldPoints!: THREE.Points;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const width = canvas.width || 1200;
    const height = canvas.height || 700;

    // 1. Scene & Environment
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#030712'); // Deep cosmic void
    this.scene.fog = new THREE.FogExp2('#030712', 0.00045);

    // 2. Camera: Angled 3D Perspective (Cinematic 3D look down)
    this.camera = new THREE.PerspectiveCamera(54, width / height, 1, 4000);
    this.camera.position.set(600, 200, 520);
    this.camera.lookAt(600, 350, 0);

    // 3. Renderer with ACES ToneMapping & High Quality Shading
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lighting Rig
    this.setupLighting();

    // 5. Starfield & Deep Space Skybox
    this.setupStarfield();

    // 6. Player Ship 3D Model
    this.setupPlayerShip();

    // 7. Tactical HUD 3D Reticle
    this.setupLockReticle();

    // Resize Handler
    window.addEventListener('resize', () => this.handleResize());
  }

  private setupLighting(): void {
    // Ambient cosmic fill light
    const ambientLight = new THREE.AmbientLight(new THREE.Color('#1e293b'), 1.2);
    this.scene.add(ambientLight);

    // Primary Solar Directional Key Light
    const sunLight = new THREE.DirectionalLight(new THREE.Color('#ffffff'), 2.6);
    sunLight.position.set(800, -600, 900);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 100;
    sunLight.shadow.camera.far = 2500;
    const d = 1000;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    this.scene.add(sunLight);

    // Subtle blue rim light from galactic plane
    const rimLight = new THREE.DirectionalLight(new THREE.Color('#38bdf8'), 0.8);
    rimLight.position.set(-600, 700, -200);
    this.scene.add(rimLight);
  }

  private setupStarfield(): void {
    const starCount = 3000;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const colorChoices = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#93c5fd'),
      new THREE.Color('#fef08a'),
      new THREE.Color('#a855f7'),
      new THREE.Color('#38bdf8')
    ];

    for (let i = 0; i < starCount; i++) {
      // Spread stars in an immense 3D dome behind the playfield
      positions[i * 3] = (Math.random() - 0.5) * 3600 + 600;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3000 + 350;
      positions[i * 3 + 2] = -150 - Math.random() * 1200;

      const c = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });

    this.starfieldPoints = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starfieldPoints);

    // Add deep space nebula cloud planes
    for (let n = 0; n < 3; n++) {
      const nebGeo = new THREE.PlaneGeometry(1200, 800);
      const nebColor = n === 0 ? '#1e1b4b' : (n === 1 ? '#042f2e' : '#311042');
      const nebMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(nebColor),
        transparent: true,
        opacity: 0.18,
        depthWrite: false
      });
      const nebMesh = new THREE.Mesh(nebGeo, nebMat);
      nebMesh.position.set(300 + n * 350, 200 + n * 180, -400 - n * 150);
      nebMesh.rotation.z = n * 0.8;
      this.scene.add(nebMesh);
    }
  }

  private setupPlayerShip(): void {
    this.playerShipGroup = new THREE.Group();

    // 1. Fuselage Chassis (Futuristic Sleek Interceptor)
    const hullTexture = ProceduralTextures.getHullTexture();
    const hullMat = new THREE.MeshStandardMaterial({
      map: hullTexture,
      roughness: 0.35,
      metalness: 0.8,
      color: 0xffffff
    });

    // Custom tapered aerodynamic fuselage geometry
    const shipShape = new THREE.Shape();
    shipShape.moveTo(0, 24);      // Nose tip
    shipShape.lineTo(7, 4);       // Upper starboard
    shipShape.lineTo(16, -14);    // Starboard wing tip
    shipShape.lineTo(4, -8);      // Engine starboard root
    shipShape.lineTo(0, -5);      // Rear center notch
    shipShape.lineTo(-4, -8);     // Engine port root
    shipShape.lineTo(-16, -14);   // Port wing tip
    shipShape.lineTo(-7, 4);      // Upper port
    shipShape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: 6,
      bevelEnabled: true,
      bevelThickness: 2.5,
      bevelSize: 1.8,
      bevelOffset: 0,
      bevelSegments: 3
    };

    const fuselageGeo = new THREE.ExtrudeGeometry(shipShape, extrudeSettings);
    fuselageGeo.center();
    const fuselageMesh = new THREE.Mesh(fuselageGeo, hullMat);
    fuselageMesh.castShadow = true;
    fuselageMesh.receiveShadow = true;
    this.playerShipGroup.add(fuselageMesh);

    // 2. Cockpit Canopy (Dark Glass with glare)
    const canopyGeo = new THREE.SphereGeometry(3.6, 16, 12);
    canopyGeo.scale(1.1, 2.2, 0.9);
    const canopyMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a192f,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.6,
      transparent: true,
      opacity: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });
    const canopyMesh = new THREE.Mesh(canopyGeo, canopyMat);
    canopyMesh.position.set(0, 2, 4.5);
    this.playerShipGroup.add(canopyMesh);

    // 3. Dual Engine Ion Nozzles
    const nozzleGeo = new THREE.CylinderGeometry(2.0, 2.8, 4.5, 12);
    const nozzleMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.2
    });
    nozzleGeo.rotateX(Math.PI / 2);

    const portNozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    portNozzle.position.set(-6, -12, 0);
    this.playerShipGroup.add(portNozzle);

    const starNozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    starNozzle.position.set(6, -12, 0);
    this.playerShipGroup.add(starNozzle);

    // 4. Navigation Wingtip LEDs
    const ledGeo = new THREE.SphereGeometry(1.2, 8, 8);
    const portLedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 }); // Red
    const portLed = new THREE.Mesh(ledGeo, portLedMat);
    portLed.position.set(-15, -13, 1);
    this.playerShipGroup.add(portLed);

    const starLedMat = new THREE.MeshBasicMaterial({ color: 0x22c55e }); // Green
    const starLed = new THREE.Mesh(ledGeo, starLedMat);
    starLed.position.set(15, -13, 1);
    this.playerShipGroup.add(starLed);

    // 5. Thruster Dynamic Lights
    this.engineLight = new THREE.PointLight(0x00e5ff, 0, 80);
    this.engineLight.position.set(0, -16, 0);
    this.playerShipGroup.add(this.engineLight);

    this.engineCoreLight = new THREE.PointLight(0xffaa00, 0, 45);
    this.engineCoreLight.position.set(0, -14, 0);
    this.playerShipGroup.add(this.engineCoreLight);

    // 6. Deflector Force-field Shield Bubble (3D Geodesic Sphere)
    const shieldGeo = new THREE.IcosahedronGeometry(26, 3);
    const shieldMat = new THREE.MeshPhysicalMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.25,
      roughness: 0.1,
      metalness: 0.1,
      wireframe: false,
      depthWrite: false
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.playerShipGroup.add(this.shieldMesh);

    // Wireframe overlay for hexagonal shield lattice
    const shieldWireGeo = new THREE.IcosahedronGeometry(26.2, 2);
    const shieldWireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.2
    });
    const shieldWireMesh = new THREE.Mesh(shieldWireGeo, shieldWireMat);
    this.shieldMesh.add(shieldWireMesh);

    this.scene.add(this.playerShipGroup);
  }

  private setupLockReticle(): void {
    this.lockReticleGroup = new THREE.Group();

    // 4 Corner brackets in 3D
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      linewidth: 2,
      depthTest: false
    });

    const sz = 18;
    const c = 6;
    const makeCorner = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1, y1, 0),
        new THREE.Vector3(x2, y2, 0),
        new THREE.Vector3(x3, y3, 0)
      ]);
      return new THREE.Line(geo, lineMat);
    };

    this.lockReticleGroup.add(makeCorner(-sz, -sz + c, -sz, -sz, -sz + c, -sz));
    this.lockReticleGroup.add(makeCorner(sz - c, -sz, sz, -sz, sz, -sz + c));
    this.lockReticleGroup.add(makeCorner(-sz, sz - c, -sz, sz, -sz + c, sz));
    this.lockReticleGroup.add(makeCorner(sz - c, sz, sz, sz, sz, sz - c));

    // Central diamond
    const diamondGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -4, 0),
      new THREE.Vector3(4, 0, 0),
      new THREE.Vector3(0, 4, 0),
      new THREE.Vector3(-4, 0, 0),
      new THREE.Vector3(0, -4, 0)
    ]);
    this.lockReticleGroup.add(new THREE.Line(diamondGeo, lineMat));

    this.lockReticleGroup.visible = false;
    this.scene.add(this.lockReticleGroup);
  }

  private isScreenShakeEnabled = true;

  public setScreenShakeEnabled(enabled: boolean): void {
    this.isScreenShakeEnabled = enabled;
    if (!enabled) {
      this.screenShakeAmount = 0;
    }
  }

  public triggerShake(intensity: number): void {
    if (!this.isScreenShakeEnabled) return;
    this.screenShakeAmount = Math.max(this.screenShakeAmount, intensity);
  }

  private handleResize(): void {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || 700;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  public render(engine: SpaceEngine): void {
    const delta = this.clock.getDelta();
    this.animTimer += delta;

    const shipBody = engine.getShipBody();
    const shipState = engine.getShipState();
    const salvageMap = engine.getSalvageBodies();
    const mission = engine.getCurrentMission();

    // 1. Sync Player Ship Position & Rotation (2D Physics to 3D Space)
    // Matter.js: (x, y) where Y is down. In Three.js: (x, -y, 0)
    const sx = shipBody.position.x;
    const sy = -shipBody.position.y;
    this.playerShipGroup.position.set(sx, sy, 0);

    // Angle: In Matter.js, 0 is right, Math.PI/2 is down.
    // Convert to Three.js Euler Z rotation
    this.playerShipGroup.rotation.z = -shipBody.angle - Math.PI / 2;

    // Subtle 3D roll banking when turning
    const targetRoll = (shipState.isTurningLeft ? 0.35 : (shipState.isTurningRight ? -0.35 : 0));
    this.playerShipGroup.rotation.y = THREE.MathUtils.lerp(this.playerShipGroup.rotation.y, targetRoll, 0.15);

    // 2. Thruster & Engine Lighting
    if (shipState.isThrusting && shipState.fuel > 0) {
      this.engineLight.intensity = 3.5 + Math.random() * 2.5;
      this.engineCoreLight.intensity = 2.0 + Math.random() * 1.5;

      // Spawn 3D exhaust particles
      const exhaustAngle = -shipBody.angle - Math.PI / 2;
      for (let i = 0; i < 2; i++) {
        const spread = (Math.random() - 0.5) * 0.4;
        const velMag = 180 + Math.random() * 120;
        this.exhaustParticles.push({
          position: new THREE.Vector3(
            sx - Math.sin(exhaustAngle) * 16 + (Math.random() - 0.5) * 6,
            sy - Math.cos(exhaustAngle) * 16 + (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 4
          ),
          velocity: new THREE.Vector3(
            -Math.sin(exhaustAngle + spread) * velMag,
            -Math.cos(exhaustAngle + spread) * velMag,
            (Math.random() - 0.5) * 20
          ),
          color: Math.random() > 0.4 ? new THREE.Color('#00e5ff') : new THREE.Color('#ffaa00'),
          size: 2.2 + Math.random() * 2.5,
          life: 0,
          maxLife: 0.28 + Math.random() * 0.2
        });
      }
    } else {
      this.engineLight.intensity = THREE.MathUtils.lerp(this.engineLight.intensity, 0, 0.2);
      this.engineCoreLight.intensity = THREE.MathUtils.lerp(this.engineCoreLight.intensity, 0, 0.2);
    }

    // 3. Deflector Force-field Shield
    if (shipState.shield > 0) {
      this.shieldMesh.visible = true;
      const shieldRatio = shipState.shield / 100;
      const pulse = Math.sin(this.animTimer * 5) * 0.08;
      (this.shieldMesh.material as THREE.MeshPhysicalMaterial).opacity = Math.min(0.65, shieldRatio * 0.4 + pulse);
      this.shieldMesh.rotation.y += delta * 0.8;
      this.shieldMesh.rotation.z += delta * 0.5;
    } else {
      this.shieldMesh.visible = false;
    }

    // 4. Update Exhaust Particles
    this.updateParticles(delta);

    // 5. Sync Asteroids
    this.syncAsteroids(mission.asteroids);

    // 5.5 Sync 3D Derelict Wreckage & Navigation Buoys
    this.syncWreckage(mission.wreckage);

    // 6. Sync Salvage Cargo & Satellites
    this.syncSalvageItems(salvageMap);

    // 7. Sync Recovery Bay (Mothership Dock)
    this.syncRecoveryBay(mission.recoveryBay);

    // 8. Sync Gravity Wells
    this.syncGravityWells(engine.getGravityWells());

    // 9. Dynamic 3D Tether Cable
    this.updateTether(engine);

    // 10. Slingshot Trajectory Prediction Line
    this.updateTrajectory(engine);

    // 11. Target Lock Reticle
    this.updateLockReticle(shipState, salvageMap);

    // 12. Camera Smooth Tracking & Dynamic Parallax
    this.updateCamera(sx, sy, delta);

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  private updateParticles(delta: number): void {
    for (let i = this.exhaustParticles.length - 1; i >= 0; i--) {
      const p = this.exhaustParticles[i];
      p.life += delta;
      if (p.life >= p.maxLife) {
        if (p.mesh) {
          this.scene.remove(p.mesh);
          p.mesh.geometry.dispose();
        }
        this.exhaustParticles.splice(i, 1);
        continue;
      }

      p.position.addScaledVector(p.velocity, delta);

      if (!p.mesh) {
        const pGeo = new THREE.SphereGeometry(p.size, 6, 6);
        const pMat = new THREE.MeshBasicMaterial({
          color: p.color,
          transparent: true,
          opacity: 1.0
        });
        p.mesh = new THREE.Mesh(pGeo, pMat);
        this.scene.add(p.mesh);
      }

      p.mesh.position.copy(p.position);
      const alpha = 1 - p.life / p.maxLife;
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = alpha;
      const s = alpha * 1.2;
      p.mesh.scale.set(s, s, s);
    }
  }

  private syncAsteroids(asteroids: AsteroidHazard[]): void {
    const { diffuse, bump } = ProceduralTextures.getAsteroidTextures();

    for (const ast of asteroids) {
      let mesh = this.asteroidMeshes.get(ast.id);
      if (!mesh) {
        // Deformed 3D Icosahedron
        const geo = new THREE.IcosahedronGeometry(ast.radius, 2);
        // Randomize vertex heights for realistic rocky crags
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const vx = pos.getX(i);
          const vy = pos.getY(i);
          const vz = pos.getZ(i);
          const noise = 1 + (Math.sin(vx * 0.1) * Math.cos(vy * 0.1) * Math.sin(vz * 0.1)) * 0.25;
          pos.setXYZ(i, vx * noise, vy * noise, vz * noise);
        }
        geo.computeVertexNormals();

        const mat = new THREE.MeshStandardMaterial({
          map: diffuse,
          bumpMap: bump,
          bumpScale: 3.5,
          roughness: 0.85,
          metalness: 0.15
        });

        mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.asteroidMeshes.set(ast.id, mesh);
        this.scene.add(mesh);
      }

      mesh.position.set(ast.x, -ast.y, 0);
      // Realistic slow 3D tumbling in space
      mesh.rotation.x += 0.003;
      mesh.rotation.y += 0.005;
      mesh.rotation.z += 0.002;
    }
  }

  private syncWreckage(wreckage?: WreckageHazard[]): void {
    if (!wreckage) return;
    const hullTex = ProceduralTextures.getHullTexture();
    const solarTex = ProceduralTextures.getSolarTexture();

    for (const wrk of wreckage) {
      let group = this.wreckageMeshes.get(wrk.id);
      if (!group) {
        group = new THREE.Group();

        if (wrk.type === 'HULL_FRAGMENT') {
          const geo = new THREE.BoxGeometry(wrk.width, wrk.height, 8);
          const mat = new THREE.MeshStandardMaterial({
            map: hullTex,
            roughness: 0.6,
            metalness: 0.8
          });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.castShadow = true;
          group.add(mesh);
        } else if (wrk.type === 'SOLAR_BOOM') {
          const geo = new THREE.PlaneGeometry(wrk.width, wrk.height);
          const mat = new THREE.MeshStandardMaterial({
            map: solarTex,
            roughness: 0.2,
            metalness: 0.9,
            side: THREE.DoubleSide
          });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.castShadow = true;
          group.add(mesh);
        } else {
          // BEACON_BUOY
          const buoyGeo = new THREE.CylinderGeometry(4, 6, 18, 8);
          buoyGeo.rotateX(Math.PI / 2);
          const buoyMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 });
          const buoyMesh = new THREE.Mesh(buoyGeo, buoyMat);
          group.add(buoyMesh);

          const lightGeo = new THREE.SphereGeometry(2.5, 8, 8);
          const lightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
          const lightMesh = new THREE.Mesh(lightGeo, lightMat);
          lightMesh.name = 'buoyLight';
          lightMesh.position.set(0, 0, 10);
          group.add(lightMesh);
        }

        this.wreckageMeshes.set(wrk.id, group);
        this.scene.add(group);
      }

      group.position.set(wrk.x, -wrk.y, -4);
      group.rotation.z = wrk.rotation + this.animTimer * 0.05;

      const light = group.getObjectByName('buoyLight') as THREE.Mesh;
      if (light) {
        const mat = light.material as THREE.MeshBasicMaterial;
        mat.color.setHex(Math.sin(this.animTimer * 4) > 0 ? 0xef4444 : 0x450a0a);
      }
    }
  }

  private syncSalvageItems(
    salvageMap: Map<string, { body: Matter.Body; item: SalvageItem }>
  ): void {
    const solarTex = ProceduralTextures.getSolarTexture();
    const hullTex = ProceduralTextures.getHullTexture();

    for (const [id, entry] of salvageMap.entries()) {
      let group = this.salvageMeshes.get(id);
      if (!group) {
        group = new THREE.Group();

        // 1. Central Cargo Pod Chassis
        const podGeo = new THREE.BoxGeometry(22, 16, 12);
        const podMat = new THREE.MeshStandardMaterial({
          map: hullTex,
          roughness: 0.4,
          metalness: 0.7
        });
        const podMesh = new THREE.Mesh(podGeo, podMat);
        podMesh.castShadow = true;
        group.add(podMesh);

        // 2. Solar Panel Array Wings
        const solarGeo = new THREE.PlaneGeometry(16, 10);
        const solarMat = new THREE.MeshStandardMaterial({
          map: solarTex,
          roughness: 0.1,
          metalness: 0.85,
          side: THREE.DoubleSide
        });
        const leftWing = new THREE.Mesh(solarGeo, solarMat);
        leftWing.position.set(-18, 0, 0);
        group.add(leftWing);

        const rightWing = new THREE.Mesh(solarGeo, solarMat);
        rightWing.position.set(18, 0, 0);
        group.add(rightWing);

        // 3. Glowing Transponder Beacon
        const beaconGeo = new THREE.SphereGeometry(2.0, 8, 8);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
        const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
        beaconMesh.position.set(0, 0, 7);
        group.add(beaconMesh);

        this.salvageMeshes.set(id, group);
        this.scene.add(group);
      }

      const bp = entry.body.position;
      group.position.set(bp.x, -bp.y, 0);
      group.rotation.z = -entry.body.angle;

      // When salvaged (docked), dim and sink into the bay
      if (entry.item.isSalvaged) {
        group.position.z = -8;
        group.scale.set(0.7, 0.7, 0.7);
      } else {
        group.position.z = Math.sin(this.animTimer * 2 + bp.x) * 3; // Zero-g bobbing
        group.scale.set(1, 1, 1);
      }
    }
  }

  private syncRecoveryBay(bay: { x: number; y: number; width: number; height: number }): void {
    if (this.recoveryBayGroup.children.length === 0) {
      const hazardTex = ProceduralTextures.getHazardTexture();
      hazardTex.repeat.set(bay.width / 64, 1);

      // Docking Platform Base Frame
      const baseGeo = new THREE.BoxGeometry(bay.width, bay.height, 10);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.6,
        metalness: 0.8
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.z = -6;
      this.recoveryBayGroup.add(baseMesh);

      // Hazard Warning Rim Stripes
      const rimGeo = new THREE.PlaneGeometry(bay.width, 10);
      const rimMat = new THREE.MeshStandardMaterial({
        map: hazardTex,
        roughness: 0.5,
        side: THREE.DoubleSide
      });
      const topRim = new THREE.Mesh(rimGeo, rimMat);
      topRim.position.set(0, bay.height / 2, 0);
      this.recoveryBayGroup.add(topRim);

      const botRim = new THREE.Mesh(rimGeo, rimMat);
      botRim.position.set(0, -bay.height / 2, 0);
      this.recoveryBayGroup.add(botRim);

      // Holographic Tractor Guidance Plane
      const guideGeo = new THREE.PlaneGeometry(bay.width - 20, bay.height - 20);
      const guideMat = new THREE.MeshBasicMaterial({
        color: 0x00ffaa,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const guideMesh = new THREE.Mesh(guideGeo, guideMat);
      guideMesh.position.z = -1;
      this.recoveryBayGroup.add(guideMesh);

      // Runway Guidance Beacons
      const runwayCount = 6;
      for (let i = 0; i < runwayCount; i++) {
        const beaconGeo = new THREE.SphereGeometry(2.5, 8, 8);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa });
        const bLeft = new THREE.Mesh(beaconGeo, beaconMat);
        const bRight = new THREE.Mesh(beaconGeo, beaconMat);
        const yPos = -bay.height / 2 + (i / (runwayCount - 1)) * bay.height;
        bLeft.position.set(-bay.width / 2 + 6, yPos, 4);
        bRight.position.set(bay.width / 2 - 6, yPos, 4);
        this.recoveryBayGroup.add(bLeft);
        this.recoveryBayGroup.add(bRight);
      }

      this.scene.add(this.recoveryBayGroup);
    }

    this.recoveryBayGroup.position.set(bay.x + bay.width / 2, -(bay.y + bay.height / 2), 0);
  }

  private syncGravityWells(wells: GravityAnomaly[]): void {
    const singTex = ProceduralTextures.getSingularityTexture();

    for (const gw of wells) {
      let group = this.gravityWellGroups.get(gw.id);
      if (!group) {
        group = new THREE.Group();

        // 1. Swirling 3D Accretion Disc Plane
        const discGeo = new THREE.PlaneGeometry(gw.radius * 1.8, gw.radius * 1.8);
        const discMat = new THREE.MeshBasicMaterial({
          map: singTex,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        const discMesh = new THREE.Mesh(discGeo, discMat);
        group.add(discMesh);

        // 2. Gravitational Event Horizon Sphere (Pure Black Light Absorption)
        const coreGeo = new THREE.SphereGeometry(18, 24, 24);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        group.add(coreMesh);

        // 3. Glowing Photon Lensing Ring
        const ringGeo = new THREE.TorusGeometry(22, 1.8, 16, 48);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        group.add(ringMesh);

        this.gravityWellGroups.set(gw.id, group);
        this.scene.add(group);
      }

      group.position.set(gw.x, -gw.y, 0);
      group.rotation.z += 0.015; // Swirling vortex motion
    }
  }

  private updateTether(engine: SpaceEngine): void {
    const tether = engine.getTetherConstraint();
    const shipState = engine.getShipState();

    if (tether && tether.bodyA && tether.bodyB) {
      const p1 = new THREE.Vector3(tether.bodyA.position.x, -tether.bodyA.position.y, 0);
      const p2 = new THREE.Vector3(tether.bodyB.position.x, -tether.bodyB.position.y, 0);

      // Catenary sag in zero-g based on tension
      const tension = shipState.tetherTension;
      const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const sagAmount = (1 - Math.min(1, tension)) * 14;
      midPoint.z += sagAmount;

      const curve = new THREE.QuadraticBezierCurve3(p1, midPoint, p2);
      const tubeGeo = new THREE.TubeGeometry(curve, 16, 1.4, 6, false);

      // Tension strain color: Cyan (slack) -> Amber -> Red (snapping danger)
      const color = tension > 0.8 ? 0xef4444 : (tension > 0.45 ? 0xf59e0b : 0x00e5ff);

      if (!this.tetherMesh) {
        const mat = new THREE.MeshBasicMaterial({ color, wireframe: false });
        this.tetherMesh = new THREE.Mesh(tubeGeo, mat);
        this.scene.add(this.tetherMesh);
      } else {
        this.tetherMesh.geometry.dispose();
        this.tetherMesh.geometry = tubeGeo;
        (this.tetherMesh.material as THREE.MeshBasicMaterial).color.setHex(color);
        this.tetherMesh.visible = true;
      }
    } else if (this.tetherMesh) {
      this.tetherMesh.visible = false;
    }
  }

  private updateTrajectory(engine: SpaceEngine): void {
    const pts2D = engine.predictTrajectory(36, 1.2);
    if (pts2D.length > 2) {
      const v3Points = pts2D.map(pt => new THREE.Vector3(pt.x, -pt.y, 2));
      const lineGeo = new THREE.BufferGeometry().setFromPoints(v3Points);

      if (!this.trajectoryLine) {
        const lineMat = new THREE.LineDashedMaterial({
          color: 0x00e5ff,
          dashSize: 6,
          gapSize: 4,
          transparent: true,
          opacity: 0.55
        });
        this.trajectoryLine = new THREE.Line(lineGeo, lineMat);
        this.trajectoryLine.computeLineDistances();
        this.scene.add(this.trajectoryLine);
      } else {
        this.trajectoryLine.geometry.dispose();
        this.trajectoryLine.geometry = lineGeo;
        this.trajectoryLine.computeLineDistances();
        this.trajectoryLine.visible = true;
      }
    } else if (this.trajectoryLine) {
      this.trajectoryLine.visible = false;
    }
  }

  private updateLockReticle(
    shipState: ShipState,
    salvageMap: Map<string, { body: Matter.Body; item: SalvageItem }>
  ): void {
    if (shipState.lockedTargetId) {
      const entry = salvageMap.get(shipState.lockedTargetId);
      if (entry && !entry.item.isSalvaged) {
        const bp = entry.body.position;
        this.lockReticleGroup.position.set(bp.x, -bp.y, 8);
        this.lockReticleGroup.rotation.z += 0.02;
        this.lockReticleGroup.visible = true;
        return;
      }
    }
    this.lockReticleGroup.visible = false;
  }

  private updateCamera(targetX: number, targetY: number, delta: number): void {
    // Smooth camera damping towards player ship
    const forwardX = targetX;
    const forwardY = targetY;

    this.cameraTarget.x = THREE.MathUtils.lerp(this.cameraTarget.x, forwardX, 0.08);
    this.cameraTarget.y = THREE.MathUtils.lerp(this.cameraTarget.y, forwardY, 0.08);

    // Camera sits behind and above in 3D perspective
    const desiredCamX = this.cameraTarget.x;
    const desiredCamY = this.cameraTarget.y - 120;
    const desiredCamZ = 460;

    // Apply Screen Shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.screenShakeAmount > 0) {
      shakeX = (Math.random() - 0.5) * this.screenShakeAmount;
      shakeY = (Math.random() - 0.5) * this.screenShakeAmount;
      this.screenShakeAmount = Math.max(0, this.screenShakeAmount - delta * 30);
    }

    this.cameraPos.x = THREE.MathUtils.lerp(this.cameraPos.x, desiredCamX + shakeX, 0.08);
    this.cameraPos.y = THREE.MathUtils.lerp(this.cameraPos.y, desiredCamY + shakeY, 0.08);
    this.cameraPos.z = THREE.MathUtils.lerp(this.cameraPos.z, desiredCamZ, 0.08);

    this.camera.position.copy(this.cameraPos);
    this.camera.lookAt(this.cameraTarget.x, this.cameraTarget.y + 35, 0);

    // Parallax background starfield slightly with camera
    if (this.starfieldPoints) {
      this.starfieldPoints.position.x = this.camera.position.x * 0.15;
      this.starfieldPoints.position.y = this.camera.position.y * 0.15;
    }
  }
}
