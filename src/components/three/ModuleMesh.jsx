import React from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';

const mmToMeters = (value) => value / 1000;

/** A single wood/laminate panel */
function Panel({ color, roughness, position, size, opacity = 1 }) {
  return (
    <mesh castShadow receiveShadow position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={roughness || 0.72}
        metalness={0.02}
        transparent={opacity < 1}
        opacity={opacity}
      />
      <Edges color="#1a1a18" threshold={18} />
    </mesh>
  );
}

/** Chrome/metal pull handle (horizontal bar) */
function Handle({ position, length }) {
  return (
    <mesh castShadow position={position} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.009, 0.009, length, 16]} />
      <meshStandardMaterial color="#c8c0b4" roughness={0.22} metalness={0.88} />
    </mesh>
  );
}

/** Garment hanging rail */
function Rail({ position, length }) {
  return (
    <mesh castShadow position={position} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.014, 0.014, length, 20]} />
      <meshStandardMaterial color="#c0bdb5" roughness={0.18} metalness={0.92} />
    </mesh>
  );
}

/** A Door panel placed just in front of the cabinet face */
function Door({ color, roughness, x, yCenter, w, h, depth }) {
  const doorZ = depth / 2 + 0.016;
  const handleLen = Math.min(h * 0.22, 0.28);
  return (
    <group>
      <Panel
        color={color}
        roughness={roughness}
        position={[x, yCenter, doorZ]}
        size={[w, h, 0.019]}
      />
      <Handle position={[x + w * 0.38, yCenter, doorZ + 0.026]} length={handleLen} />
    </group>
  );
}

export function ModuleMesh({ module, material, position, rotationY = 0, onHover, onClick }) {
  const [hovered, setHovered] = React.useState(false);

  const width = mmToMeters(module.width);
  const height = mmToMeters(module.height);
  const depth = mmToMeters(module.depth);
  const pt = 0.018; // panel thickness in metres
  const innerW = width - pt * 2;
  const innerD = Math.max(depth - pt * 2, depth * 0.92);

  const baseColor = material?.hex || '#F0EDE8';

  // Dynamically adjust roughness based on finish type for realism
  const finishType = (material?.sub || '').toLowerCase();
  const baseRoughness = finishType.includes('textured')
    ? 0.82
    : finishType.includes('wood')
      ? 0.45
      : 0.72; // Default for solid

  const roughness = material?.roughness || baseRoughness;
  const moduleType = (module.type || '').toLowerCase();
  const layout = module.layout || {};

  // Fix: THREE.Color.getHexString() returns without '#' — must prepend
  const highlightColor = hovered
    ? '#' + new THREE.Color(baseColor).clone().multiplyScalar(1.18).getHexString()
    : baseColor;

  // ── Derived layout values ─────────────────────────────────────────────
  const numShelves = layout.shelves || 0;
  const numDrawers = layout.drawers || 0;
  const numHang = layout.hang || 0;
  const numShoe = layout.shoe || 0;
  const numCubbies = layout.cubbies || 0;
  const isCorner = layout.corner === true;

  // ── Helper: evenly spaced shelves ─────────────────────────────────────
  const renderShelves = (count, yStart, yEnd, color, rgh) => {
    if (count <= 0) return null;
    const span = yEnd - yStart;
    return Array.from({ length: count }, (_, j) => {
      const sy = yStart + (span / (count + 1)) * (j + 1);
      return (
        <Panel
          key={`sh-${j}`}
          color={color}
          roughness={rgh}
          position={[0, sy, 0]}
          size={[innerW, pt, innerD]}
        />
      );
    });
  };

  // ── Helper: stacked drawers from bottom ───────────────────────────────
  const renderDrawers = (count, yStart, yEnd, color, rgh) => {
    if (count <= 0) return null;
    const zoneH = yEnd - yStart;
    const drawerH = zoneH / count;
    const faceH = Math.max(drawerH - 0.012, 0.06);
    return Array.from({ length: count }, (_, j) => {
      const cy = yStart + drawerH * j + drawerH / 2;
      return (
        <group key={`dr-${j}`}>
          {/* Drawer face */}
          <Panel
            color={color}
            roughness={rgh}
            position={[0, cy, depth / 2 + 0.012]}
            size={[innerW, faceH, 0.022]}
          />
          {/* Pull handle */}
          <Handle position={[0, cy, depth / 2 + 0.036]} length={Math.min(innerW * 0.42, 0.26)} />
        </group>
      );
    });
  };

  // ── Helper: angled shoe shelves ────────────────────────────────────────
  const renderShoeRack = (count, yStart, yEnd, color, rgh) => {
    if (count <= 0) return null;
    const span = yEnd - yStart;
    return Array.from({ length: count }, (_, j) => {
      const sy = yStart + (span / (count + 1)) * (j + 1);
      return (
        <Panel
          key={`shoe-${j}`}
          color={color}
          roughness={rgh}
          position={[0, sy, 0]}
          size={[innerW, pt * 1.2, innerD]}
        />
      );
    });
  };

  // ── CORNER special case ───────────────────────────────────────────────
  if (isCorner) {
    // Render as an L-shaped pair of panels rather than a box
    const armW = width / 2;
    return (
      <group
        position={position}
        rotation-y={rotationY}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover?.(module);
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover?.(null);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onClick?.(module);
        }}
      >
        {/* Left arm — horizontal */}
        <Panel
          color={highlightColor}
          roughness={roughness}
          position={[-armW / 2, height / 2, 0]}
          size={[armW, height, depth]}
        />
        {/* Right arm — perpendicular */}
        <Panel
          color={highlightColor}
          roughness={roughness}
          position={[armW / 4, height / 2, -depth / 2]}
          size={[pt, height, depth]}
        />
        {/* Floor, top */}
        <Panel
          color={highlightColor}
          roughness={roughness}
          position={[0, pt / 2, 0]}
          size={[width, pt, depth]}
        />
        <Panel
          color={highlightColor}
          roughness={roughness}
          position={[0, height - pt / 2, 0]}
          size={[width, pt, depth]}
        />
        {/* Shelves */}
        {renderShelves(numShelves, pt, height - pt, highlightColor, roughness)}
      </group>
    );
  }

  // ── Standard cabinet structure ─────────────────────────────────────────
  // Determine zone boundaries based on what's inside
  // Hanging zone occupies top portion; drawers/shelves fill rest
  let hangZoneTop = height - pt;
  let hangZoneBottom = height * 0.55; // half height by default for single hang
  if (numHang >= 2) {
    // Double hang: two equal zones stacked
    hangZoneTop = height - pt;
    hangZoneBottom = height * 0.5;
  }
  const storageZoneTop = numHang > 0 ? hangZoneBottom - 0.02 : height - pt;
  const storageZoneBot = pt;

  return (
    <group
      position={position}
      rotation-y={rotationY}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover?.(module);
      }}
      onPointerOut={() => {
        setHovered(false);
        onHover?.(null);
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onClick?.(module);
      }}
    >
      {/* ── Carcass ────────────────────────────────────────────────── */}
      {/* Left side panel */}
      <Panel
        color={highlightColor}
        roughness={roughness}
        position={[-width / 2 + pt / 2, height / 2, 0]}
        size={[pt, height, depth]}
      />
      {/* Right side panel */}
      <Panel
        color={highlightColor}
        roughness={roughness}
        position={[width / 2 - pt / 2, height / 2, 0]}
        size={[pt, height, depth]}
      />
      {/* Bottom panel */}
      <Panel
        color={highlightColor}
        roughness={roughness}
        position={[0, pt / 2, 0]}
        size={[innerW, pt, depth]}
      />
      {/* Top panel */}
      <Panel
        color={highlightColor}
        roughness={roughness}
        position={[0, height - pt / 2, 0]}
        size={[innerW, pt, depth]}
      />
      {/* Back panel */}
      <Panel
        color={highlightColor}
        roughness={roughness}
        position={[0, height / 2, -depth / 2 + pt / 2]}
        size={[innerW, height - pt * 2, pt]}
      />

      {/* ── Hanging Zones ──────────────────────────────────────────── */}
      {numHang >= 1 && (
        <>
          {/* Rail for top hang section */}
          <Rail position={[0, height * (numHang >= 2 ? 0.88 : 0.78), 0]} length={innerW * 0.9} />
          {/* Top-hang door pair */}
          <Door
            color={highlightColor}
            roughness={roughness}
            x={-innerW * 0.25}
            yCenter={height * (numHang >= 2 ? 0.75 : 0.65)}
            w={innerW * 0.495}
            h={height * (numHang >= 2 ? 0.48 : 0.56)}
            depth={depth}
          />
          <Door
            color={highlightColor}
            roughness={roughness}
            x={innerW * 0.25}
            yCenter={height * (numHang >= 2 ? 0.75 : 0.65)}
            w={innerW * 0.495}
            h={height * (numHang >= 2 ? 0.48 : 0.56)}
            depth={depth}
          />
        </>
      )}

      {numHang >= 2 && (
        <>
          {/* Second (bottom) hanging rail */}
          <Rail position={[0, height * 0.42, 0]} length={innerW * 0.9} />
        </>
      )}

      {/* ── Shelves in storage zone ─────────────────────────────────── */}
      {numHang === 0 &&
        numDrawers === 0 &&
        numShoe === 0 &&
        numShelves > 0 &&
        renderShelves(numShelves, storageZoneBot, storageZoneTop, highlightColor, roughness)}

      {numHang > 0 &&
        numShelves > 0 &&
        numDrawers === 0 &&
        // Shelves below the hanging zone
        renderShelves(numShelves, storageZoneBot, storageZoneTop, highlightColor, roughness)}

      {/* ── Drawers (take bottom zone, shelves may be above) ─────────── */}
      {numDrawers > 0 &&
        numShelves === 0 &&
        renderDrawers(numDrawers, storageZoneBot, storageZoneTop, highlightColor, roughness)}

      {numDrawers > 0 && numShelves > 0 && (
        <>
          {/* Split: shelves on upper half, drawers on lower half */}
          {renderShelves(
            numShelves,
            (storageZoneBot + storageZoneTop) / 2,
            storageZoneTop,
            highlightColor,
            roughness
          )}
          {renderDrawers(
            numDrawers,
            storageZoneBot,
            (storageZoneBot + storageZoneTop) / 2,
            highlightColor,
            roughness
          )}
        </>
      )}

      {/* ── Shoe rack tiers ─────────────────────────────────────────── */}
      {numShoe > 0 &&
        renderShoeRack(numShoe, storageZoneBot, storageZoneTop * 0.7, highlightColor, roughness)}

      {/* ── Specialty: cubbies grid ──────────────────────────────────── */}
      {numCubbies > 0 &&
        (() => {
          const cols = 2;
          const rows = Math.ceil(numCubbies / cols);
          const cW = innerW / cols;
          const cH = storageZoneTop / rows;
          const dividers = [];
          // Vertical divider down the middle
          dividers.push(
            <Panel
              key="vdiv"
              color={highlightColor}
              roughness={roughness}
              position={[0, storageZoneTop / 2, 0]}
              size={[pt, storageZoneTop, innerD]}
            />
          );
          // Horizontal shelf-dividers
          for (let r = 1; r < rows; r++) {
            dividers.push(
              <Panel
                key={`hdiv-${r}`}
                color={highlightColor}
                roughness={roughness}
                position={[0, r * cH, 0]}
                size={[innerW, pt, innerD]}
              />
            );
          }
          return dividers;
        })()}

      {/* ── Top shelf above hanging (always, if space) ───────────────── */}
      {numHang > 0 && (
        <Panel
          color={highlightColor}
          roughness={roughness}
          position={[0, height * 0.96, 0]}
          size={[innerW, pt, innerD]}
        />
      )}
    </group>
  );
}

export default ModuleMesh;
