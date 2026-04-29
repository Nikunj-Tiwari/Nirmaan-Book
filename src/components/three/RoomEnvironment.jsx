import React from 'react';
import { Environment, Grid, Text } from '@react-three/drei';
import * as THREE from 'three';

const mm = (v) => v / 1000;

/**
 * RoomEnvironment — Realistic bedroom simulation
 *
 * Camera sits at +Z looking toward -Z (toward the back wall).
 * Wardrobe is placed against the back wall at z = 0 (its front face at z = +depthM).
 * Room extends from z = 0 (back wall) to z = +roomDepth (in front, near camera).
 *
 * For L-shape: Wall A is the back wall, Wall B's back is the left side wall.
 * For U-shape: Wall A back + Wall B left + Wall C right.
 */
export function RoomEnvironment({ width, height, depth, wallType, width2 = 0, width3 = 0 }) {
  const w = mm(width);
  const h = mm(height);
  const d = mm(depth);
  const w2 = mm(width2);
  const w3 = mm(width3);

  const isL = wallType === 'l-shape';
  const isU = wallType === 'u-shape';

  // Total wardrobe footprint width
  const totalW = isU ? w + w2 + w3 : isL ? w + w2 : w;

  // Room dimensions — extends well in front of the wardrobe so camera is inside the room
  const roomW = Math.max(totalW * 1.5, totalW + 2.4);
  const roomD = Math.max(d + 3.0, 4.5); // depth of floor: wardrobe depth + open room in front
  const roomH = h * 1.05;

  // The wardrobe back sits at z = 0. The back wall is just behind it (z = -0.06).
  // The room floor extends from z = 0 (wardrobe back) forward to z = +roomD.
  // We center the floor at z = roomD/2.
  const floorCenterZ = roomD / 2;
  const wallCenterZ = roomD / 2;

  // Left edge of total wardrobe (for placing left side wall)
  const leftEdge = isU ? -(w / 2 + w2) : isL ? -(w / 2 + w2) : -w / 2;
  const rightEdge = isU ? w / 2 + w3 : w / 2;

  // Floor material — warm oak wood tone
  const floorColor = '#c8b89a';
  const floorRoughness = 0.65;

  // Wall paint color — warm white
  const wallColor = '#f0ece5';
  const wallRoughness = 0.88;

  // Baseboard height
  const bh = 0.1;
  const bt = 0.025;

  return (
    <group>
      {/* ── Lighting ───────────────────────────────────────────────────── */}

      {/* Ambient fill */}
      <ambientLight intensity={0.65} />

      {/* Key light from upper-front, casts shadows on wardrobe */}
      <directionalLight
        castShadow
        intensity={1.6}
        position={[2, h * 1.2, roomD * 0.8]}
        shadow-camera-far={20}
        shadow-camera-left={-roomW}
        shadow-camera-right={roomW}
        shadow-camera-top={roomH + 1}
        shadow-camera-bottom={-1}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
      />

      {/* Warm fill from left */}
      <pointLight intensity={0.7} position={[-roomW * 0.4, h * 0.7, roomD * 0.5]} color="#ffe4c0" />

      {/* Cool fill from right */}
      <pointLight intensity={0.5} position={[roomW * 0.4, h * 0.6, roomD * 0.4]} color="#ddeeff" />

      {/* Ceiling bounce */}
      <rectAreaLight
        intensity={2.0}
        width={roomW}
        height={roomD}
        position={[0, roomH - 0.05, floorCenterZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        color="#fff8f0"
      />

      {/* Environment IBL */}
      <Environment preset="apartment" />

      {/* ── Floor ─────────────────────────────────────────────────────── */}
      <mesh receiveShadow position={[0, -0.02, floorCenterZ]}>
        <boxGeometry args={[roomW, 0.04, roomD]} />
        <meshStandardMaterial color="#d8c9b0" roughness={0.6} metalness={0.01} />
      </mesh>

      {/* Floor plank lines (subtle) */}
      <Grid
        args={[roomW, roomD]}
        cellColor="#c4b498"
        cellSize={0.18}
        cellThickness={0.4}
        fadeDistance={12}
        fadeStrength={1.5}
        position={[0, 0.002, floorCenterZ]}
        sectionColor="#b0a080"
        sectionSize={0.9}
        sectionThickness={0.8}
      />

      {/* ── Ceiling ───────────────────────────────────────────────────── */}
      <mesh position={[0, roomH + 0.03, floorCenterZ]}>
        <boxGeometry args={[roomW, 0.06, roomD]} />
        <meshStandardMaterial color="#f8f6f2" roughness={0.95} />
      </mesh>

      {/* ── BACK WALL — Wall A (always present) ─────────────────────── */}
      {/* The back wall runs full width behind the wardrobe */}
      <mesh receiveShadow position={[0, h / 2, -0.03]}>
        <boxGeometry args={[roomW, roomH + 0.1, 0.06]} />
        <meshStandardMaterial color={wallColor} roughness={wallRoughness} />
      </mesh>

      {/* Baseboard on back wall */}
      <mesh position={[0, bh / 2, bt / 2]}>
        <boxGeometry args={[roomW, bh, bt]} />
        <meshStandardMaterial color="#e8e3db" roughness={0.75} />
      </mesh>

      {/* ── LEFT SIDE WALL ────────────────────────────────────────────── */}
      {/* For L/U shape, the left wall is further left; for single it's at -roomW/2 */}
      <mesh receiveShadow position={[-(roomW / 2), h / 2, floorCenterZ]}>
        <boxGeometry args={[0.06, roomH + 0.1, roomD]} />
        <meshStandardMaterial color={wallColor} roughness={wallRoughness} />
      </mesh>

      {/* Baseboard on left wall */}
      <mesh position={[-(roomW / 2 - bt / 2), bh / 2, floorCenterZ]}>
        <boxGeometry args={[bt, bh, roomD]} />
        <meshStandardMaterial color="#e8e3db" roughness={0.75} />
      </mesh>

      {/* ── RIGHT SIDE WALL (semi-transparent to see inside) ─────────── */}
      <mesh receiveShadow position={[roomW / 2, h / 2, floorCenterZ]}>
        <boxGeometry args={[0.06, roomH + 0.1, roomD]} />
        <meshStandardMaterial
          color={wallColor}
          roughness={wallRoughness}
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* ── L-SHAPE: extra left side wall behind Wall B ───────────────── */}
      {(isL || isU) && w2 > 0 && (
        <>
          {/* The left side wall that Wall B modules back onto */}
          <mesh receiveShadow position={[-(w / 2 + w2) - 0.03, h / 2, d * 0.5]}>
            <boxGeometry args={[0.06, roomH + 0.1, d + 0.3]} />
            <meshStandardMaterial color={wallColor} roughness={wallRoughness} />
          </mesh>
          {/* Baseboard */}
          <mesh position={[-(w / 2 + w2 - bt / 2), bh / 2, d * 0.5]}>
            <boxGeometry args={[bt, bh, d + 0.3]} />
            <meshStandardMaterial color="#e8e3db" roughness={0.75} />
          </mesh>
        </>
      )}

      {/* ── U-SHAPE: extra right side wall behind Wall C ──────────────── */}
      {isU && w3 > 0 && (
        <>
          <mesh receiveShadow position={[w / 2 + w3 + 0.03, h / 2, d * 0.5]}>
            <boxGeometry args={[0.06, roomH + 0.1, d + 0.3]} />
            <meshStandardMaterial color={wallColor} roughness={wallRoughness} />
          </mesh>
          <mesh position={[w / 2 + w3 - bt / 2, bh / 2, d * 0.5]}>
            <boxGeometry args={[bt, bh, d + 0.3]} />
            <meshStandardMaterial color="#e8e3db" roughness={0.75} />
          </mesh>
        </>
      )}

      {/* ── Dimension label on floor ──────────────────────────────────── */}
      <Text
        color="#9a9490"
        fontSize={0.06}
        maxWidth={3}
        position={[0, 0.025, d + 0.5]}
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
