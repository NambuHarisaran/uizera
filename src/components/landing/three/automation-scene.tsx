"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges, Grid, Line, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

const ORANGE = "#FA4616";
const BLUE = "#0067DF";
const GOLD = "#FFB40E";
const INK = "#14181d";

/** Screen-faced robot head — the club mascot. Idles with a nod and blinks. */
function Bot() {
  const head = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (head.current) {
      head.current.rotation.z = Math.sin(t * 0.8) * 0.05;
      head.current.rotation.x = Math.sin(t * 0.6) * 0.06;
      head.current.position.y = Math.sin(t * 1.1) * 0.08;
    }
    if (eyes.current) {
      // Blink roughly every 3.4s
      const blink = t % 3.4 > 3.22 ? 0.1 : 1;
      eyes.current.scale.y = THREE.MathUtils.lerp(eyes.current.scale.y, blink, 0.4);
    }
  });

  return (
    <group ref={head}>
      {/* Head */}
      <RoundedBox args={[1.6, 1.35, 1.3]} radius={0.24} smoothness={6}>
        <meshStandardMaterial color={ORANGE} roughness={0.35} metalness={0.05} />
      </RoundedBox>
      {/* Face screen */}
      <RoundedBox args={[1.1, 0.78, 0.1]} radius={0.08} smoothness={4} position={[0, -0.02, 0.64]}>
        <meshStandardMaterial color="#ffffff" roughness={0.25} />
      </RoundedBox>
      {/* Eyes */}
      <group ref={eyes} position={[0, 0.02, 0.71]}>
        <mesh position={[-0.24, 0, 0]}>
          <boxGeometry args={[0.13, 0.26, 0.04]} />
          <meshStandardMaterial color={INK} roughness={0.4} />
        </mesh>
        <mesh position={[0.24, 0, 0]}>
          <boxGeometry args={[0.13, 0.26, 0.04]} />
          <meshStandardMaterial color={INK} roughness={0.4} />
        </mesh>
      </group>
      {/* Ears */}
      <mesh position={[-0.9, 0, 0]}>
        <boxGeometry args={[0.14, 0.5, 0.5]} />
        <meshStandardMaterial color={BLUE} roughness={0.4} />
      </mesh>
      <mesh position={[0.9, 0, 0]}>
        <boxGeometry args={[0.14, 0.5, 0.5]} />
        <meshStandardMaterial color={BLUE} roughness={0.4} />
      </mesh>
      {/* Antenna */}
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.36, 12]} />
        <meshStandardMaterial color={INK} roughness={0.5} />
      </mesh>
      <AntennaTip />
    </group>
  );
}

function AntennaTip() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.18;
    ref.current.scale.setScalar(s);
  });
  return (
    <mesh ref={ref} position={[0, 1.12, 0]}>
      <sphereGeometry args={[0.11, 16, 16]} />
      <meshStandardMaterial color={GOLD} roughness={0.3} />
    </mesh>
  );
}

interface NodeSpec {
  position: [number, number, number];
  color: string;
  size: number;
}

const NODES: NodeSpec[] = [
  { position: [2.5, 1.15, -0.5], color: BLUE, size: 0.52 },
  { position: [-2.7, 0.85, -0.3], color: GOLD, size: 0.46 },
  { position: [2.2, -1.25, 0.4], color: ORANGE, size: 0.44 },
  { position: [-2.3, -1.05, 0.6], color: "#ffffff", size: 0.4 },
  { position: [0.4, 2.2, -1.1], color: BLUE, size: 0.38 },
  { position: [-0.8, -2.1, -0.7], color: ORANGE, size: 0.36 },
];

/** A workflow "activity" block orbiting the bot, wired back to it. */
function WorkflowNode({ position, color, size }: NodeSpec) {
  const ref = useRef<THREE.Mesh>(null);
  const speed = useMemo(() => 0.3 + Math.random() * 0.5, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * speed;
    ref.current.rotation.y += delta * speed * 0.7;
  });

  return (
    <group position={position}>
      <RoundedBox ref={ref} args={[size, size, size]} radius={size * 0.16} smoothness={4}>
        <meshStandardMaterial color={color} roughness={0.35} />
        <Edges scale={1.02} color={INK} threshold={15} />
      </RoundedBox>
    </group>
  );
}

/** Inner group spins; outer group tilts toward the pointer for parallax. */
function Constellation() {
  const tilt = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (spin.current) spin.current.rotation.y += delta * 0.14;
    if (tilt.current) {
      tilt.current.rotation.x = THREE.MathUtils.lerp(
        tilt.current.rotation.x,
        state.pointer.y * -0.16,
        0.06
      );
      tilt.current.rotation.y = THREE.MathUtils.lerp(
        tilt.current.rotation.y,
        state.pointer.x * 0.22,
        0.06
      );
    }
  });

  return (
    <group ref={tilt}>
      <Bot />
      <group ref={spin}>
        {NODES.map((node, i) => (
          <group key={i}>
            <WorkflowNode {...node} />
            <Line
              points={[
                [0, 0, 0],
                node.position,
              ]}
              color={BLUE}
              lineWidth={1}
              dashed
              dashSize={0.14}
              gapSize={0.1}
              transparent
              opacity={0.45}
            />
          </group>
        ))}
        {/* Orbit ring */}
        <mesh rotation-x={Math.PI / 2}>
          <torusGeometry args={[3.05, 0.012, 8, 120]} />
          <meshBasicMaterial color={BLUE} transparent opacity={0.3} />
        </mesh>
      </group>
    </group>
  );
}

/** Drifting orange specks for depth. */
function Particles({ count = 130 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 11;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 7;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.045} color={ORANGE} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

export default function AutomationScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.7, 7.6], fov: 40 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: "pan-y" }}
    >
      <ambientLight intensity={1.15} />
      <directionalLight position={[4, 6, 5]} intensity={1.3} />
      <directionalLight position={[-5, -2, 3]} intensity={0.35} color={BLUE} />
      <Constellation />
      <Particles />
      <Grid
        position={[0, -2.4, 0]}
        args={[12, 12]}
        cellSize={0.55}
        cellThickness={0.6}
        cellColor="#9aa7b0"
        sectionSize={2.75}
        sectionThickness={1.1}
        sectionColor={ORANGE}
        fadeDistance={17}
        fadeStrength={2.5}
        infiniteGrid
      />
    </Canvas>
  );
}
