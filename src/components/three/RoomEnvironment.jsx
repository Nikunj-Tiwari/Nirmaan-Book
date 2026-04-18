import React from 'react';
import { Environment, Grid, Lightformer, Text } from '@react-three/drei';

const mmToMeters = (value) => value / 1000;

export function RoomEnvironment({ width, height, depth }) {
  const w = mmToMeters(width);
  const h = mmToMeters(height);
  const d = mmToMeters(depth);

  return (
    <group>
      <ambientLight intensity={0.45} />
      <directionalLight
        castShadow
        intensity={1.35}
        position={[3.4, 4.8, 3.6]}
        shadow-camera-far={12}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-mapSize={[2048, 2048]}
      />
      <rectAreaLight
        intensity={1.6}
        width={3.2}
        height={2.2}
        position={[0, Math.max(h, 2.4), 1.4]}
      />
      <Environment resolution={64}>
        <Lightformer intensity={2.4} position={[0, 3.2, 1.8]} scale={[4, 2, 1]} />
        <Lightformer intensity={1.4} position={[-2.4, 2.2, -1.6]} scale={[2, 2, 1]} />
      </Environment>

      {/* Floor */}
      <mesh receiveShadow position={[0, -0.025, 0]}>
        <boxGeometry args={[w * 1.5, 0.05, d * 1.5]} />
        <meshStandardMaterial color="#eceee9" roughness={0.82} />
      </mesh>

      {/* Back Wall */}
      <mesh receiveShadow position={[0, h / 2, -d / 2]}>
        <boxGeometry args={[w * 1.2, h, 0.05]} />
        <meshStandardMaterial color="#f6f4ef" roughness={0.76} />
      </mesh>

      {/* Left Wall */}
      <mesh receiveShadow position={[-w / 2, h / 2, 0]}>
        <boxGeometry args={[0.05, h, d]} />
        <meshStandardMaterial color="#eeece6" roughness={0.78} />
      </mesh>

      {/* Right Wall (Translucent) */}
      <mesh receiveShadow position={[w / 2, h / 2, 0]}>
        <boxGeometry args={[0.05, h, d]} />
        <meshStandardMaterial color="#eeece6" roughness={0.78} transparent opacity={0.28} />
      </mesh>

      <Grid
        args={[Math.max(w * 2, d * 2), Math.max(w * 2, d * 2)]}
        cellColor="#c8cec3"
        cellSize={0.25}
        fadeDistance={5}
        fadeStrength={1.5}
        position={[0, 0.002, 0]}
        sectionColor="#96a08f"
        sectionSize={1}
      />

      <Text
        color="#566052"
        fontSize={0.08}
        maxWidth={1.8}
        position={[0, 0.035, d / 2 + 0.1]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {`${width}mm W x ${depth}mm D`}
      </Text>
    </group>
  );
}

export default RoomEnvironment;
