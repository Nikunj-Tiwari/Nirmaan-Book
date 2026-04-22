import React from 'react';
import { Environment, Grid, Text } from '@react-three/drei';

const mmToMeters = (value) => value / 1000;

/**
 * RoomEnvironment
 * Renders walls, floor, ceiling, and a high-quality PBR lighting rig.
 */
export function RoomEnvironment({ width, height, depth }) {
  const w = mmToMeters(width);
  const h = mmToMeters(height);
  const d = mmToMeters(depth);

  // Room shell extends a bit beyond the wardrobe footprint
  const roomW = w * 1.6;
  const roomD = d * 3.5;

  return (
    <group>
      {/* ── Lighting ───────────────────────────────────────────────── */}
      <ambientLight intensity={0.4} />

      {/* Key directional light (sun-like, casts sharp shadows) */}
      <directionalLight
        castShadow
        intensity={1.2}
        position={[3.5, 5.0, 4.0]}
        shadow-camera-far={16}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      />

      {/* Fill light from opposite side (soft, no shadows) */}
      <pointLight intensity={0.7} position={[-3, h * 0.8, 2]} color="#ffe8c8" />

      {/* Ceiling bounce light */}
      <rectAreaLight
        intensity={1.8}
        width={roomW}
        height={roomD * 0.6}
        position={[0, h + 0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        color="#ffffff"
      />

      {/* Environment map — apartment preset gives warm, realistic IBL */}
      <Environment preset="apartment" />

      {/* ── Room Geometry ──────────────────────────────────────────── */}

      {/* Floor */}
      <mesh receiveShadow position={[0, -0.02, 0]}>
        <boxGeometry args={[roomW, 0.04, roomD]} />
        <meshStandardMaterial color="#dedad4" roughness={0.88} metalness={0.02} />
      </mesh>

      {/* Back wall (behind wardrobe) */}
      <mesh receiveShadow position={[0, h / 2, -d / 2 - 0.03]}>
        <boxGeometry args={[roomW, h * 1.15, 0.06]} />
        <meshStandardMaterial color="#f4f1eb" roughness={0.82} />
      </mesh>

      {/* Left side wall */}
      <mesh receiveShadow position={[-roomW / 2, h / 2, 0]}>
        <boxGeometry args={[0.06, h * 1.15, roomD]} />
        <meshStandardMaterial color="#efece5" roughness={0.8} />
      </mesh>

      {/* Right side wall — slightly transparent so camera angle reveal wardrobe */}
      <mesh receiveShadow position={[roomW / 2, h / 2, 0]}>
        <boxGeometry args={[0.06, h * 1.15, roomD]} />
        <meshStandardMaterial color="#efece5" roughness={0.8} transparent opacity={0.22} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, h + 0.02, 0]}>
        <boxGeometry args={[roomW, 0.04, roomD]} />
        <meshStandardMaterial color="#f8f6f2" roughness={0.9} />
      </mesh>

      {/* Floor grid (subtle) */}
      <Grid
        args={[roomW, roomD]}
        cellColor="#c4c0ba"
        cellSize={0.25}
        fadeDistance={7}
        fadeStrength={2}
        position={[0, 0.001, 0]}
        sectionColor="#a09c96"
        sectionSize={1}
      />

      {/* Dimension label on floor */}
      <Text
        color="#8a8680"
        fontSize={0.07}
        maxWidth={2.0}
        position={[0, 0.025, d / 2 + 0.18]}
        rotation={[-Math.PI / 2, 0, 0]}
        anchorX="center"
        anchorY="middle"
      >
        {`${width}mm W × ${height}mm H × ${depth}mm D`}
      </Text>
    </group>
  );
}

export default RoomEnvironment;
