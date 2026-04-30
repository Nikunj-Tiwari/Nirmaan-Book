import React, { useRef, useCallback, useMemo, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import ModuleMesh from './ModuleMesh';

const mm = (v) => v / 1000;

/**
 * DraggableModuleMesh
 *
 * Wraps ModuleMesh with full 3D drag-to-position.
 * - Projects mouse onto the wall's plane (XY for Wall A, YZ for B/C)
 * - Only allows dragging along the wall surface (X for Wall A, Z for B/C)
 * - Snaps to the wall (height stays 0, no depth change)
 * - Disables OrbitControls while dragging
 */
function DraggableModuleMesh({
  module,
  material,
  basePosition, // [x, y, z] — computed layout position
  rotationY,
  wallAxis, // 'x' | 'z' — which axis is free to drag along
  wallFixedX, // fixed X for B/C walls
  wallFixedZ, // fixed Z for A wall
  orbitRef,
  onHover,
  onClick,
  onPositionChange, // (wallKey, axis, value) => void
}) {
  const { camera, gl } = useThree();
  const groupRef = useRef();

  // Drag state
  const isDragging = useRef(false);
  const dragPlane = useRef(new THREE.Plane());
  const dragStartIntersection = useRef(new THREE.Vector3());
  const dragStartModulePos = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());
  const currentOffset = useRef({ x: module.posX || 0, z: module.posZ || 0 });

  // Keep ref in sync with latest props (update outside of render path)
  React.useEffect(() => {
    currentOffset.current = { x: module.posX || 0, z: module.posZ || 0 };
  }, [module.posX, module.posZ]);

  // Actual world position = base + override
  const worldPos = useMemo(
    () => [
      basePosition[0] + (module.posX || 0),
      basePosition[1],
      basePosition[2] + (module.posZ || 0),
    ],
    [basePosition, module.posX, module.posZ]
  );

  const getMouseNDC = useCallback(
    (e) => {
      const rect = gl.domElement.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
      };
    },
    [gl]
  );

  const handlePointerDown = useCallback(
    (e) => {
      e.stopPropagation();
      isDragging.current = true;

      // Disable orbit while dragging
      if (orbitRef?.current) orbitRef.current.enabled = false;

      // Set up the drag constraint plane
      // Wall A: plane is XY (normal = Z), free axis = X
      // Wall B/C: plane is YZ (normal = X), free axis = Z
      const normal = wallAxis === 'x' ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);

      const coplanar = new THREE.Vector3(...worldPos);
      dragPlane.current.setFromNormalAndCoplanarPoint(normal, coplanar);

      // Record starting intersection point
      const ndc = getMouseNDC(e);
      raycaster.current.setFromCamera(ndc, camera);
      raycaster.current.ray.intersectPlane(dragPlane.current, dragStartIntersection.current);

      // Record starting module position
      dragStartModulePos.current.set(...worldPos);

      gl.domElement.setPointerCapture(e.pointerId);
    },
    [camera, gl, worldPos, wallAxis, orbitRef, getMouseNDC]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDragging.current) return;

      const ndc = getMouseNDC(e);
      raycaster.current.setFromCamera(ndc, camera);

      const hit = new THREE.Vector3();
      const didHit = raycaster.current.ray.intersectPlane(dragPlane.current, hit);
      if (!didHit) return;

      const delta = hit.clone().sub(dragStartIntersection.current);

      if (wallAxis === 'x') {
        // Wall A: slide left/right along X
        const newX = currentOffset.current.x + delta.x;
        onPositionChange?.(module.wallKey, 'posX', newX);
      } else {
        // Wall B/C: slide forward/backward along Z
        const newZ = currentOffset.current.z + delta.z;
        onPositionChange?.(module.wallKey, 'posZ', newZ);
      }
    },
    [camera, wallAxis, module.wallKey, onPositionChange, getMouseNDC]
  );

  const handlePointerUp = useCallback(
    (e) => {
      isDragging.current = false;
      if (orbitRef?.current) orbitRef.current.enabled = true;
      gl.domElement.releasePointerCapture(e.pointerId);
    },
    [orbitRef, gl]
  );

  return (
    <group
      ref={groupRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Drag handle highlight — thin vertical stripe shown when hovered */}
      <ModuleMesh
        module={module}
        material={material}
        position={worldPos}
        rotationY={rotationY}
        onHover={onHover}
        onClick={onClick}
      />
    </group>
  );
}

/**
 * WardrobeAssembly — Room-oriented placement
 *
 * All modules are freely draggable along their wall.
 * Overrides are stored as posX (Wall A, horizontal) or posZ (Wall B/C, depth).
 */
export function WardrobeAssembly({
  modules,
  material,
  roomDimensions,
  orbitRef,
  onModuleHover,
  onModuleClick,
  onModuleDrag,
}) {
  const {
    width = 2400,
    height = 2400,
    depth = 600,
    wallType = 'single',
    width2 = 0,
    width3 = 0,
  } = roomDimensions;

  const depthM = mm(depth);
  const widthAM = mm(width);

  const { wallA, wallB, wallC } = useMemo(() => {
    if (!modules || modules.length === 0) return { wallA: [], wallB: [], wallC: [] };

    const modsA = modules.filter((m) => !m.wall || m.wall === 'A');
    const modsB = wallType !== 'single' ? modules.filter((m) => m.wall === 'B') : [];
    const modsC = wallType === 'u-shape' ? modules.filter((m) => m.wall === 'C') : [];

    // Wall A: default center layout — user can drag from here
    const layoutA = (mods) => {
      const totalW = mods.reduce((s, m) => s + (m.width || 600), 0);
      let cursor = -mm(totalW) / 2;
      return mods.map((mod, i) => {
        const mmWidth = mm(mod.width || 600);
        const xCenter = cursor + mmWidth / 2;
        cursor += mmWidth;
        return {
          module: mod,
          basePos: [xCenter, 0, depthM / 2],
          key: mod.wallKey || `A-${mod.id}-${i}`,
        };
      });
    };

    // Wall B/C: default stack from corner — user can drag from here
    const layoutPerp = (mods, prefix, startZ = 0) => {
      let cursor = startZ;
      return mods.map((mod, i) => {
        const mmWidth = mm(mod.width || 600);
        const zCenter = cursor + mmWidth / 2;
        cursor += mmWidth;
        return {
          module: mod,
          baseZ: zCenter,
          key: mod.wallKey || `${prefix}-${mod.id}-${i}`,
        };
      });
    };

    return {
      wallA: layoutA(modsA),
      wallB: layoutPerp(modsB, 'B'),
      wallC: layoutPerp(modsC, 'C'),
    };
  }, [modules, wallType, depthM]);

  return (
    <group>
      {/* ── Wall A — Main back wall ── drag along X ───────────────────── */}
      {wallA.map(({ module, basePos, key }) => (
        <DraggableModuleMesh
          key={key}
          module={module}
          material={material}
          basePosition={basePos}
          rotationY={(module.rotation || 0) * (Math.PI / 180)}
          wallAxis="x"
          orbitRef={orbitRef}
          onHover={onModuleHover}
          onClick={onModuleClick}
          onPositionChange={onModuleDrag}
        />
      ))}

      {/* ── Wall B — Left side wall ── drag along Z ───────────────────── */}
      {wallB.map(({ module, baseZ, key }) => (
        <DraggableModuleMesh
          key={key}
          module={module}
          material={material}
          basePosition={[-(widthAM / 2) + depthM / 2, 0, baseZ]}
          rotationY={Math.PI / 2 + (module.rotation || 0) * (Math.PI / 180)}
          wallAxis="z"
          orbitRef={orbitRef}
          onHover={onModuleHover}
          onClick={onModuleClick}
          onPositionChange={onModuleDrag}
        />
      ))}

      {/* ── Wall C — Right side wall ── drag along Z ──────────────────── */}
      {wallC.map(({ module, baseZ, key }) => (
        <DraggableModuleMesh
          key={key}
          module={module}
          material={material}
          basePosition={[widthAM / 2 - depthM / 2, 0, baseZ]}
          rotationY={-Math.PI / 2 + (module.rotation || 0) * (Math.PI / 180)}
          wallAxis="z"
          orbitRef={orbitRef}
          onHover={onModuleHover}
          onClick={onModuleClick}
          onPositionChange={onModuleDrag}
        />
      ))}
    </group>
  );
}

export default WardrobeAssembly;
