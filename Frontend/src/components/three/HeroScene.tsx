import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, RoundedBox, Sparkles } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const AMBER = "#f5a524";
const CONCRETE = "#5b6270";
const STEEL = "#9aa4b2";

function Tower() {
  const group = useRef<THREE.Group>(null);
  const blocks = useMemo(() => {
    const out: { pos: [number, number, number]; color: string; delay: number }[] = [];
    let i = 0;
    for (let y = 0; y < 7; y++) {
      for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
          if (Math.random() < 0.22 && y > 1) continue;
          const color = (x + y + z) % 4 === 0 ? AMBER : (x + z) % 2 === 0 ? CONCRETE : STEEL;
          out.push({ pos: [x * 0.62, y * 0.42 - 1.4, z * 0.62], color, delay: i++ * 0.03 });
        }
      }
    }
    return out;
  }, []);
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y = t * 0.18 + state.pointer.x * 0.4;
      group.current.rotation.x = -state.pointer.y * 0.15;
    }
    refs.current.forEach((m, i) => {
      const b = blocks[i];
      if (!m || !b) return;
      const p = Math.min(1, Math.max(0, (t - b.delay) / 0.9));
      const ease = 1 - Math.pow(1 - p, 3);
      m.position.y = b.pos[1] + (1 - ease) * 6 + Math.sin(t * 1.2 + i) * 0.015;
      const s = 0.4 + ease * 0.6;
      m.scale.setScalar(s);
    });
  });

  return (
    <group ref={group}>
      {blocks.map((b, i) => (
        <RoundedBox
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          args={[0.56, 0.36, 0.56]}
          radius={0.05}
          position={b.pos}
        >
          <meshStandardMaterial
            color={b.color}
            metalness={b.color === STEEL ? 0.8 : 0.2}
            roughness={b.color === AMBER ? 0.25 : 0.6}
            emissive={b.color === AMBER ? AMBER : "#000"}
            emissiveIntensity={b.color === AMBER ? 0.25 : 0}
          />
        </RoundedBox>
      ))}
    </group>
  );
}

function Ring({ r, speed, tilt }: { r: number; speed: number; tilt: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, d) => { if (ref.current) ref.current.rotation.z += d * speed; });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2 + tilt, 0, 0]}>
      <torusGeometry args={[r, 0.008, 16, 160]} />
      <meshBasicMaterial color={AMBER} transparent opacity={0.45} />
    </mesh>
  );
}

export default function HeroScene() {
  return (
    <Canvas camera={{ position: [4.2, 2.4, 4.8], fov: 40 }} dpr={[1, 2]}>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 4]} intensity={1.6} />
      <pointLight position={[-4, 2, -3]} color={AMBER} intensity={30} />
      <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.6}>
        <Tower />
      </Float>
      <Ring r={2.6} speed={0.25} tilt={0.2} />
      <Ring r={3.2} speed={-0.15} tilt={-0.3} />
      <Sparkles count={80} scale={8} size={2.2} speed={0.4} color={AMBER} />
      <Environment preset="city" />
    </Canvas>
  );
}
