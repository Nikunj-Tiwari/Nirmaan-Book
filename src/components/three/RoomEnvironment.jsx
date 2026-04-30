import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Grid, Text } from '@react-three/drei';
import * as THREE from 'three';

const mm = (v) => v / 1000;

/**
 * WallMesh — a single room wall that becomes transparent + gridded
 * when the camera crosses to the "wrong" side.
 */
function WallMesh({ position, args, normal, wallColor, wallRoughness }) {
  const matRef = useRef();
  const { camera } = useThree();

  useFrame(() => {
    if (!matRef.current) return;
    // Dot product of (camera - wall center) with the wall's outward normal
    const wallPos = new THREE.Vector3(...position);
    const toCam = new THREE.Vector3().subVectors(camera.position, wallPos);
    const dot = toCam.dot(new THREE.Vector3(...normal));
    // If camera is behind the wall (dot < 0), make it transparent + wireframe grid
    const behind = dot < 0.01;
    matRef.current.opacity = behind ? 0.06 : 1.0;
    matRef.current.wireframe = behind;
    matRef.current.needsUpdate = true;
  });

  return (
    <mesh receiveShadow position={position}>
      <boxGeometry args={args} />
      <meshStandardMaterial
        ref={matRef}
        color={wallColor}
        roughness={wallRoughness}
        transparent
        opacity={1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

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
  const roomD = Math.max(d + 3.0, 4.5);
  const roomH = h * 1.05;

  const floorCenterZ = roomD / 2;
  const wallCenterZ = roomD / 2;

  const leftEdge = -w / 2;
  const rightEdge = w / 2;

  const floorColor = '#c8b89a';
  const wallColor = '#f0ece5';
  const wallRoughness = 0.88;

  const bh = 0.1;
  const bt = 0.025;

  return (
    <group>
      {/* ── Lighting ───────────────────────────────────────────────────── */}
      <ambientLight intensity={0.65} />
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
      <pointLight intensity={0.7} position={[-roomW * 0.4, h * 0.7, roomD * 0.5]} color="#ffe4c0" />
      <pointLight intensity={0.5} position={[roomW * 0.4, h * 0.6, roomD * 0.4]} color="#ddeeff" />
      <rectAreaLight
        intensity={2.0}
        width={roomW}
        height={roomD}
        position={[0, roomH - 0.05, floorCenterZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        color="#fff8f0"
      />
      <Environment preset="apartment" />

      {/* ── Floor ─────────────────────────────────────────────────────── */}
      <mesh receiveShadow position={[0, -0.02, floorCenterZ]}>
        <boxGeometry args={[roomW, 0.04, roomD]} />
        <meshStandardMaterial color="#d8c9b0" roughness={0.6} metalness={0.01} />
      </mesh>
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

      {/* ── BACK WALL — Wall A (camera-adaptive transparency) ─────────── */}
      {/* Outward normal is +Z (faces camera) */}
      <WallMesh
        position={[0, h / 2, -0.03]}
        args={[roomW, roomH + 0.1, 0.06]}
        normal={[0, 0, 1]}
        wallColor={wallColor}
        wallRoughness={wallRoughness}
      />
      {/* Baseboard on back wall */}
      <mesh position={[0, bh / 2, bt / 2]}>
        <boxGeometry args={[roomW, bh, bt]} />
        <meshStandardMaterial color="#e8e3db" roughness={0.75} />
      </mesh>

      {/* ── LEFT SIDE WALL (camera-adaptive) ─────────────────────────── */}
      {/* Outward normal is +X */}
      <WallMesh
        position={[-(roomW / 2), h / 2, floorCenterZ]}
        args={[0.06, roomH + 0.1, roomD]}
        normal={[1, 0, 0]}
        wallColor={wallColor}
        wallRoughness={wallRoughness}
      />
      <mesh position={[-(roomW / 2 - bt / 2), bh / 2, floorCenterZ]}>
        <boxGeometry args={[bt, bh, roomD]} />
        <meshStandardMaterial color="#e8e3db" roughness={0.75} />
      </mesh>

      {/* ── RIGHT SIDE WALL (camera-adaptive) ────────────────────────── */}
      {/* Outward normal is -X */}
      <WallMesh
        position={[roomW / 2, h / 2, floorCenterZ]}
        args={[0.06, roomH + 0.1, roomD]}
        normal={[-1, 0, 0]}
        wallColor={wallColor}
        wallRoughness={wallRoughness}
      />

      {/* ── L-SHAPE: extra left side wall behind Wall B ───────────────── */}
      {(isL || isU) && (
        <>
          <WallMesh
            position={[-(w / 2) - 0.03, h / 2, (d + w2) * 0.5]}
            args={[0.06, roomH + 0.1, d + w2 + 0.3]}
            normal={[1, 0, 0]}
            wallColor={wallColor}
            wallRoughness={wallRoughness}
          />
          <mesh position={[-(w / 2 - bt / 2), bh / 2, (d + w2) * 0.5]}>
            <boxGeometry args={[bt, bh, d + w2 + 0.3]} />
            <meshStandardMaterial color="#e8e3db" roughness={0.75} />
          </mesh>
        </>
      )}

      {/* ── U-SHAPE: extra right side wall behind Wall C ──────────────── */}
      {isU && (
        <>
          <WallMesh
            position={[w / 2 + 0.03, h / 2, (d + w3) * 0.5]}
            args={[0.06, roomH + 0.1, d + w3 + 0.3]}
            normal={[-1, 0, 0]}
            wallColor={wallColor}
            wallRoughness={wallRoughness}
          />
          <mesh position={[w / 2 - bt / 2, bh / 2, (d + w3) * 0.5]}>
            <boxGeometry args={[bt, bh, d + w3 + 0.3]} />
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
