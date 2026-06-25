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

/** Chrome/metal pull handle (vertical bar) */
function Handle({ position, height }) {
  return (
    <mesh castShadow position={position}>
      <cylinderGeometry args={[0.009, 0.009, height, 16]} />
      <meshStandardMaterial color="#c8c0b4" roughness={0.22} metalness={0.88} />
    </mesh>
  );
}

/** Garment hanging rail — runs along X axis */
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
  const doorZ = depth / 2 + 0.012;
  const handleLen = Math.min(h * 0.18, 0.22);
  const handleY = yCenter; // vertically centered on door
  return (
    <group>
      <Panel
        color={color}
        roughness={roughness}
        position={[x, yCenter, doorZ]}
        size={[w - 0.004, h - 0.004, 0.018]}
      />
      {/* Vertical handle */}
      <Handle position={[x + w * 0.38, handleY, doorZ + 0.025]} height={handleLen} />
    </group>
  );
}

export function ModuleMesh({ module, material, position, rotationY = 0, onHover, onClick }) {
  const [hovered, setHovered] = React.useState(false);

  const width = mmToMeters(module.width || 600);
  const height = mmToMeters(module.height || 2400);
  const depth = mmToMeters(module.depth || 600);
  const pt = 0.018; // panel thickness in metres
  const innerW = width - pt * 2;
  const innerD = depth - pt;

  // Color: per-module override > global material
  const baseColor = module.colorOverride || material?.hex || '#5C3822';

  // Roughness based on finish type
  const finishType = (material?.sub || '').toLowerCase();
  const baseRoughness = finishType.includes('textured')
    ? 0.82
    : finishType.includes('wood')
      ? 0.45
      : 0.72;

  const roughness = material?.roughness || baseRoughness;
  const moduleType = (module.type || '').toLowerCase();
  const layout = module.layout || {};

  const highlightColor = hovered
    ? '#' + new THREE.Color(baseColor).clone().multiplyScalar(1.15).getHexString()
    : baseColor;

  // ── Derived layout values ──────────────────────────────────────────────
  const numShelves = layout.shelves || 0;
  const numDrawers = layout.drawers || 0;
  const numHang = layout.hang || 0;
  const numShoe = layout.shoe || 0;
  const numCubbies = layout.cubbies || 0;
  const isCorner = layout.corner === true;

  /**
   * isOpenFront — true for all 'hanging' type modules.
   * Also force true for any module whose ID starts with "OW" (Open Wardrobe),
   * since some like OW/SW 10 might be typed as 'drawers' but are physically open-front.
   */
  const isOpenFront = moduleType === 'hanging' || module.id.startsWith('OW');

  // ── Helper: evenly spaced shelves ──────────────────────────────────────
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

  // ── Helper: stacked drawers from bottom ────────────────────────────────
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
            position={[0, cy, depth / 2 + 0.006]}
            size={[innerW - 0.006, faceH, 0.018]}
          />
          {/* Pull handle — short horizontal bar */}
          <mesh position={[0, cy, depth / 2 + 0.032]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.006, 0.006, Math.min(innerW * 0.3, 0.18), 12]} />
            <meshStandardMaterial color="#c8c0b4" roughness={0.22} metalness={0.88} />
          </mesh>
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
          position={[0, sy, innerD * 0.1]}
          size={[innerW, pt * 1.2, innerD]}
        />
      );
    });
  };

  // ── CORNER special case ────────────────────────────────────────────────
  if (isCorner) {
    const stdD = 0.6; // standard wardrobe depth
    const backX = -width / 2;
    const backZ = -0.3; // Local Z for back wall

    // Left arm dimensions (faces right)
    const leftArmW = stdD;
    const leftArmD = depth;
    const leftOpeningD = depth - stdD; // 1.05 - 0.6 = 0.45

    // Right arm dimensions (faces forward)
    const rightArmW = width - stdD; // 1.05 - 0.6 = 0.45
    const rightArmD = stdD;

    const topShelfY = height - pt - height * 0.15;

    // Identify specific corner module
    const is20A = module.id === 'OW 20A' || module.id === 'OW 20 A';
    const is20B = module.id === 'OW 20B' || module.id === 'OW 20 B';
    const is21A = module.id === 'OW 21A' || module.id === 'OW 21 A';
    const is21B = module.id === 'OW 21B' || module.id === 'OW 21 B';

    const hasSwingDoor = is20A || is21A;
    const leftHasShelves = is20B || is21B; // 21B says "open", photo shows shelves in left arm? Wait, 21B says "open", let's assume it matches 20B's interior
    const leftHasHang = is20A || is21A; // "hang left, swing door"

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
        {/* CARCASS */}
        {/* Left Wall Panel */}
        <Panel
          color={highlightColor}
          roughness={roughness}
          position={[backX + pt / 2, height / 2, backZ + depth / 2]}
          size={[pt, height, depth]}
        />
        {/* Back Wall Panel */}
        <Panel
          color={highlightColor}
          roughness={roughness}
          position={[0, height / 2, backZ + pt / 2]}
          size={[width, height, pt]}
        />
        {/* Right Wall Panel */}
        <Panel
          color={highlightColor}
          roughness={roughness}
          position={[width / 2 - pt / 2, height / 2, backZ + stdD / 2]}
          size={[pt, height, stdD]}
        />
        {/* Front End Panel (Left Arm) */}
        <Panel
          color={highlightColor}
          roughness={roughness}
          position={[backX + stdD / 2, height / 2, backZ + depth - pt / 2]}
          size={[stdD, height, pt]}
        />
        {/* Top & Bottom - Left Arm */}
        <Panel
          color={highlightColor}
          roughness={roughness}
          position={[backX + stdD / 2, height - pt / 2, backZ + depth / 2]}
          size={[stdD, pt, depth]}
        />
        <Panel
          color={highlightColor}
          roughness={roughness}
          position={[backX + stdD / 2, pt / 2, backZ + depth / 2]}
          size={[stdD, pt, depth]}
        />
        {/* Top & Bottom - Right Arm (excluding the corner overlap) */}
        <Panel
          color={highlightColor}
          roughness={roughness}
          position={[backX + stdD + rightArmW / 2, height - pt / 2, backZ + stdD / 2]}
          size={[rightArmW, pt, stdD]}
        />
        <Panel
          color={highlightColor}
          roughness={roughness}
          position={[backX + stdD + rightArmW / 2, pt / 2, backZ + stdD / 2]}
          size={[rightArmW, pt, stdD]}
        />

        {/* L-SHAPE TOP SHELF (continuous) */}
        <Panel
          color={highlightColor}
          roughness={roughness}
          position={[backX + stdD / 2, topShelfY, backZ + depth / 2]}
          size={[stdD - pt * 2, pt, depth - pt * 2]}
        />
        <Panel
          color={highlightColor}
          roughness={roughness}
          position={[backX + stdD + rightArmW / 2, topShelfY, backZ + stdD / 2]}
          size={[rightArmW - pt, pt, stdD - pt * 2]}
        />

        {/* RIGHT ARM INTERIOR (Always hang below top shelf) */}
        <Rail
          position={[backX + stdD + rightArmW / 2, topShelfY - 0.05, backZ + stdD / 2]}
          length={rightArmW - pt}
        />

        {/* LEFT ARM INTERIOR */}
        {leftHasShelves && (
          <group>
            {/* 3 shelves below top shelf */}
            {[1, 2, 3].map((i) => {
              const y = pt + ((topShelfY - pt) / 4) * i;
              return (
                <Panel
                  key={`left-shelf-${i}`}
                  color={highlightColor}
                  roughness={roughness}
                  position={[backX + stdD / 2, y, backZ + depth / 2]}
                  size={[stdD - pt * 2, pt, depth - pt * 2]}
                />
              );
            })}
          </group>
        )}
        {leftHasHang && (
          <group>
            {/* Hanging rod along Z axis */}
            <mesh
              castShadow
              position={[backX + stdD / 2, topShelfY - 0.05, backZ + depth / 2]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.014, 0.014, depth - pt * 2, 20]} />
              <meshStandardMaterial color="#c0bdb5" roughness={0.18} metalness={0.92} />
            </mesh>
          </group>
        )}

        {/* LEFT ARM SWING DOOR */}
        {hasSwingDoor && (
          <group>
            <Panel
              color={highlightColor}
              roughness={roughness}
              position={[backX + stdD - pt / 2, height / 2, backZ + stdD + leftOpeningD / 2]}
              size={[pt, height - pt * 2, leftOpeningD]}
            />
            {/* Vertical handle on the door */}
            <Handle
              position={[backX + stdD + 0.012, height / 2, backZ + stdD + leftOpeningD * 0.8]}
              height={0.22}
            />
          </group>
        )}
      </group>
    );
  }

  // ── Standard cabinet — closed module zone geometry ─────────────────────
  // (used only when isOpenFront === false)
  const hangZoneTop = height - pt;
  const hangZoneBottom = numHang >= 2 ? height * 0.5 : height * 0.52;
  const storageZoneTop = numHang > 0 ? hangZoneBottom - 0.015 : height - pt;
  const storageZoneBot = pt;
  const doorW = innerW / 2;

  // ── Open-front interior renderer ────────────────────────────────────────
  //
  // All positions are expressed as a fraction of `interiorTop` (= height - pt)
  // matching the exact zone percentages from the product catalogue.
  //
  // Percentage reference (total internal height = 2400mm):
  //   OW/SW 01 → 6 shelves × ~16.6% each
  //   OW/SW 02 → top shelf 15% | upper hang 30% | mid shelf | lower hang 30%
  //   OW/SW 03 → top shelf 15% | hang 70%        | bottom shelf 15%
  //   OW/SW 04 → top shelf 15% | hang 55%        | mid shelf 15% | drawer 15%
  //   OW/SW 05 → top shelf 15% | hang 45%        | 3 bottom shelves 10% each
  //   OW/SW 06 → top shelf 15% | hang 45%        | drawer 10%  | 2 shelves 15% each
  //   OW/SW 07 → top shelf 15% | hang 45%        | shelf 15%   | drawer 7.5% | drawer 17.5%
  //   OW/SW 08 → top shelf 15% | hang 45%        | 2 drawers 12.5% each | bottom shelf 15%
  //   OW/SW 09 → identical to OW/SW 07 (width 450mm handled by module.width)
  //   OW/SW 10 → top shelf 15% | hang 40%        | 3 drawers 15% each
  //
  const interiorTop = height - pt;
  const interiorBot = pt;
  const H = interiorTop; // alias for brevity inside the helper

  /** Render a single asymmetric drawer face with horizontal handle */
  const drawerFace = (key, yBot, yTop) => {
    const cy = (yBot + yTop) / 2;
    const faceH = Math.max(yTop - yBot - 0.012, 0.06);
    return (
      <group key={key}>
        <Panel
          color={highlightColor}
          roughness={roughness}
          position={[0, cy, depth / 2 + 0.006]}
          size={[innerW - 0.006, faceH, 0.018]}
        />
        <mesh position={[0, cy, depth / 2 + 0.032]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.006, 0.006, Math.min(innerW * 0.3, 0.18), 12]} />
          <meshStandardMaterial color="#c8c0b4" roughness={0.22} metalness={0.88} />
        </mesh>
      </group>
    );
  };

  const shelf = (key, y) => (
    <Panel
      key={key}
      color={highlightColor}
      roughness={roughness}
      position={[0, y, 0]}
      size={[innerW, pt, innerD]}
    />
  );

  const rail = (key, y) => <Rail key={key} position={[0, y, 0]} length={innerW * 0.88} />;

  const halfRail = (key, xCenter, y, halfWidth) => (
    <Rail key={key} position={[xCenter, y, 0]} length={(halfWidth - pt) * 0.88} />
  );

  const renderOpenFrontInterior = () => {
    switch (module.id) {
      case 'OW/SW 01':
        return <>{renderShelves(numShelves, interiorBot, H, highlightColor, roughness)}</>;

      case 'OW/SW 02':
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail-upper', H * 0.73)}
            {shelf('mid', H * 0.48)}
            {rail('rail-lower', H * 0.28)}
          </>
        );

      case 'OW/SW 03':
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.8)}
            {shelf('bot', H * 0.15)}
          </>
        );

      case 'OW/SW 04':
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.82)}
            {shelf('mid', H * 0.3)}
            {renderDrawers(1, interiorBot, H * 0.15, highlightColor, roughness)}
          </>
        );

      case 'OW/SW 05':
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.83)}
            {renderShelves(3, interiorBot, H * 0.4, highlightColor, roughness)}
          </>
        );

      case 'OW/SW 06':
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.83)}
            {renderDrawers(1, H * 0.3, H * 0.4, highlightColor, roughness)}
            {shelf('bot1', H * 0.15)}
            {shelf('bot2', H * 0.3)}
          </>
        );

      case 'OW/SW 07':
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.83)}
            {shelf('mid', H * 0.4)}
            {shelf('bot', H * 0.25)}
            {drawerFace('dr-small', H * 0.175, H * 0.25)}
            {drawerFace('dr-large', interiorBot, H * 0.175)}
          </>
        );

      case 'OW/SW 08':
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.83)}
            {shelf('mid', H * 0.4)}
            {renderDrawers(2, H * 0.15, H * 0.4, highlightColor, roughness)}
            {shelf('bot', H * 0.15)}
          </>
        );

      case 'OW/SW 09':
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.83)}
            {shelf('mid', H * 0.4)}
            {shelf('bot', H * 0.25)}
            {renderDrawers(2, interiorBot, H * 0.25, highlightColor, roughness)}
          </>
        );

      case 'OW/SW 10':
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.83)}
            {/* Shelf above the drawer zone */}
            {shelf('mid', H * 0.45)}
            {/* 3 equal drawers stacked in zone 0%–45% */}
            {renderDrawers(3, interiorBot, H * 0.45, highlightColor, roughness)}
          </>
        );

      // ── OW/SW 11 ─────────────────────────────────────────────────────────
      // Top shelf 15% | hang 45% | 4 equal stacked drawers 10% each (zone 0%–40%)
      case 'OW/SW 11':
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.83)}
            {shelf('dr-cap', H * 0.4)}
            {renderDrawers(4, interiorBot, H * 0.4, highlightColor, roughness)}
          </>
        );

      // ── OW 12 ────────────────────────────────────────────────────────────
      // Top shelf 15% | hang 45% | 2 thin drawers SIDE-BY-SIDE (left+right) 5% zone
      // | 2 open shelves 15% each (at 15%, 30%)
      // The 2 drawers sit at the SAME Y (parallel, half-width each), not stacked.
      case 'OW 12': {
        const ow12DrBot = H * 0.3;
        const ow12DrTop = H * 0.4;
        const ow12DrCY = (ow12DrBot + ow12DrTop) / 2;
        const ow12DrFH = Math.max(ow12DrTop - ow12DrBot - 0.012, 0.06);
        const ow12HW = innerW / 2;
        const ow12LX = -ow12HW / 2;
        const ow12RX = ow12HW / 2;
        // Half-width shelf divider between the 2 parallel drawers
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.83)}
            {/* Vertical divider separating the 2 side-by-side drawers */}
            <Panel
              key="vdiv12"
              color={highlightColor}
              roughness={roughness}
              position={[0, ow12DrCY, 0]}
              size={[pt, ow12DrTop - ow12DrBot, innerD]}
            />
            {/* LEFT drawer face */}
            <group key="dr-left12">
              <Panel
                color={highlightColor}
                roughness={roughness}
                position={[ow12LX, ow12DrCY, depth / 2 + 0.006]}
                size={[ow12HW - pt - 0.006, ow12DrFH, 0.018]}
              />
              <mesh position={[ow12LX, ow12DrCY, depth / 2 + 0.032]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.006, 0.006, Math.min(ow12HW * 0.35, 0.1), 12]} />
                <meshStandardMaterial color="#c8c0b4" roughness={0.22} metalness={0.88} />
              </mesh>
            </group>
            {/* RIGHT drawer face */}
            <group key="dr-right12">
              <Panel
                color={highlightColor}
                roughness={roughness}
                position={[ow12RX, ow12DrCY, depth / 2 + 0.006]}
                size={[ow12HW - pt - 0.006, ow12DrFH, 0.018]}
              />
              <mesh position={[ow12RX, ow12DrCY, depth / 2 + 0.032]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.006, 0.006, Math.min(ow12HW * 0.35, 0.1), 12]} />
                <meshStandardMaterial color="#c8c0b4" roughness={0.22} metalness={0.88} />
              </mesh>
            </group>
            {/* 2 open shelves below the drawer zone */}
            {shelf('bot1', H * 0.15)}
            {shelf('bot2', H * 0.3)}
          </>
        );
      }

      // ── OW 13 ────────────────────────────────────────────────────────────
      // Top shelf 15% | upper hang 45% | bottom 40% SPLIT with vertical divider:
      //   LEFT:  1 drawer (top ~10% of split) + 1 open shelf below
      //   RIGHT: 1 short hanging rod filling the full split height
      case 'OW 13': {
        const s13Top = H * 0.4; // top of split zone
        const s13H = s13Top - interiorBot; // height of split zone (40%)
        const s13HalfW = innerW / 2;
        const s13LX = -s13HalfW / 2;
        const s13RX = s13HalfW / 2;
        // Drawer: top 25% of split (~10% total, i.e. 30%–40%)
        const s13DrBot = s13Top - s13H * 0.25; // ~30%
        const s13DrTop = s13Top; // 40%
        const s13DrCY = (s13DrBot + s13DrTop) / 2;
        const s13DrFH = Math.max(s13DrTop - s13DrBot - 0.012, 0.06);
        // 1 shelf in the remaining left zone (below drawer), placed at mid-point
        const s13ShelfY = interiorBot + (s13DrBot - interiorBot) * 0.5;
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail-upper', H * 0.83)}
            {shelf('split-cap', s13Top)}
            {/* Vertical centre divider from floor to split-cap */}
            <Panel
              key="vdiv13"
              color={highlightColor}
              roughness={roughness}
              position={[0, (s13Top + interiorBot) / 2, 0]}
              size={[pt, s13H, innerD]}
            />
            {/* LEFT: drawer face at top of split */}
            <group key="dr-left13">
              <Panel
                color={highlightColor}
                roughness={roughness}
                position={[s13LX, s13DrCY, depth / 2 + 0.006]}
                size={[s13HalfW - pt - 0.006, s13DrFH, 0.018]}
              />
              <mesh position={[s13LX, s13DrCY, depth / 2 + 0.032]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.006, 0.006, Math.min(s13HalfW * 0.4, 0.12), 12]} />
                <meshStandardMaterial color="#c8c0b4" roughness={0.22} metalness={0.88} />
              </mesh>
            </group>
            {/* LEFT: 1 shelf below drawer */}
            <Panel
              key="l-sh1-13"
              color={highlightColor}
              roughness={roughness}
              position={[s13LX, s13ShelfY, 0]}
              size={[s13HalfW - pt, pt, innerD]}
            />
            {/* RIGHT: short hanging rod spanning the full split zone height */}
            <Rail
              key="rail-right13"
              position={[s13RX, s13Top - 0.05, 0]}
              length={(s13HalfW - pt) * 0.88}
            />
          </>
        );
      }

      // ── OW/SW 14 ─────────────────────────────────────────────────────────
      // Section 1 (Top 15%):     1 full-width open shelf
      // Section 2 (Middle 55%):  Central vertical divider, split zone H*0.30–H*0.85
      //   RIGHT half: 4 equal cubbies (3 half-width horizontal boards, ~330mm each)
      //   LEFT half:  Bottom small cubby (~330mm) + top large hang zone (~990mm) + 1 rod
      //   Left dividing shelf aligns with the LOWEST right cubby board
      // Section 3 (Bottom 30%):  2 full-width equal stacked drawers (15% each)
      case 'OW/SW 14': {
        // Zone boundaries
        const s14STop = H * 0.85; // top of split zone = underside of top shelf
        const s14SBot = H * 0.3; // bottom of split zone = top of drawer zone
        const s14SH = s14STop - s14SBot; // 55% of H
        const s14HW = innerW / 2;
        const s14LX = -s14HW / 2;
        const s14RX = s14HW / 2;

        // RIGHT: 3 shelf boards dividing 55% zone into 4 equal cubbies (~13.75% each)
        // Boards at: s14SBot + s14SH/4, s14SBot + s14SH/2, s14SBot + 3*s14SH/4
        const s14RShelf1 = s14SBot + s14SH / 4; // lowest — also aligns with LEFT divider
        const s14RShelf2 = s14SBot + s14SH / 2;
        const s14RShelf3 = s14SBot + (3 * s14SH) / 4;

        // LEFT: 1 shelf aligns with s14RShelf1 (bottom of left zone = bottom of right zone)
        // Bottom cubby: s14SBot → s14RShelf1 (~330mm)
        // Top hang zone: s14RShelf1 → s14STop (~990mm)
        const s14LeftShelfY = s14RShelf1; // aligns exactly with lowest right board
        const s14RailY = s14STop - 0.06; // rod near top of left hanging zone

        return (
          <>
            {/* Section 1: full-width top shelf */}
            {shelf('top', H * 0.85)}

            {/* Vertical centre divider spanning the full 55% split zone */}
            <Panel
              key="vdiv14"
              color={highlightColor}
              roughness={roughness}
              position={[0, (s14STop + s14SBot) / 2, 0]}
              size={[pt, s14SH, innerD]}
            />

            {/* RIGHT: 3 horizontal boards → 4 equal cubbies */}
            <Panel
              key="r-sh1-14"
              color={highlightColor}
              roughness={roughness}
              position={[s14RX, s14RShelf1, 0]}
              size={[s14HW - pt, pt, innerD]}
            />
            <Panel
              key="r-sh2-14"
              color={highlightColor}
              roughness={roughness}
              position={[s14RX, s14RShelf2, 0]}
              size={[s14HW - pt, pt, innerD]}
            />
            <Panel
              key="r-sh3-14"
              color={highlightColor}
              roughness={roughness}
              position={[s14RX, s14RShelf3, 0]}
              size={[s14HW - pt, pt, innerD]}
            />

            {/* LEFT: 1 shelf at the same height as the lowest right board */}
            <Panel
              key="l-sh-14"
              color={highlightColor}
              roughness={roughness}
              position={[s14LX, s14LeftShelfY, 0]}
              size={[s14HW - pt, pt, innerD]}
            />
            {/* LEFT: hanging rod in the large top section */}
            <Rail key="rail-left14" position={[s14LX, s14RailY, 0]} length={(s14HW - pt) * 0.88} />

            {/* Section 3: full-width separator at bottom of split zone */}
            {shelf('split-floor14', s14SBot)}
            {/* 2 equal full-width stacked drawers in zone 0%–30% */}
            {renderDrawers(2, interiorBot, s14SBot, highlightColor, roughness)}
          </>
        );
      }

      // ── OW/SW 15 ─────────────────────────────────────────────────────────
      // Top shelf 15% | hang 40% | enclosed double-door cabinet 15%
      // | 1 mid-drawer 10% | 1 open bottom shelf 20%
      case 'OW/SW 15': {
        const cab15Top = H * 0.6;
        const cab15Bot = H * 0.45;
        const cab15CY = (cab15Top + cab15Bot) / 2;
        const cab15H = cab15Top - cab15Bot;
        const door15W = innerW / 2;
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.83)}
            {/* Floor of hang zone / ceiling of cabinet */}
            {shelf('hang-floor15', cab15Top)}
            {/* Enclosed double-door cabinet */}
            <Door
              color={highlightColor}
              roughness={roughness}
              x={-door15W / 2}
              yCenter={cab15CY}
              w={door15W}
              h={cab15H}
              depth={depth}
            />
            <Door
              color={highlightColor}
              roughness={roughness}
              x={door15W / 2}
              yCenter={cab15CY}
              w={door15W}
              h={cab15H}
              depth={depth}
            />
            {/* Floor of cabinet */}
            {shelf('cab-floor15', cab15Bot)}
            {/* 1 mid-drawer in 35%–45% zone */}
            {renderDrawers(1, H * 0.35, cab15Bot, highlightColor, roughness)}
            {shelf('dr-floor15', H * 0.35)}
            {/* Open bottom shelf — no divider, just the space 0%–35% */}
          </>
        );
      }

      // ── OW 16 ────────────────────────────────────────────────────────────
      // Top shelf 15% | hang 45% | 2 open shelves 12.5% each | 1 large drawer 15%
      // From bottom: drawer [0%–15%], shelf@15%, shelf@27.5%, shelf@40%, rail, top@85%
      case 'OW 16':
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.83)}
            {shelf('sh-top16', H * 0.4)}
            {shelf('sh-mid16', H * 0.275)}
            {shelf('sh-bot16', H * 0.15)}
            {renderDrawers(1, interiorBot, H * 0.15, highlightColor, roughness)}
          </>
        );

      // ── OW 17 ────────────────────────────────────────────────────────────
      // 450mm wide | Top shelf 15% | hang 45% | 1 open shelf 15% | 2 drawers 12.5% each
      case 'OW 17':
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.83)}
            {shelf('mid17', H * 0.4)}
            {shelf('bot17', H * 0.25)}
            {renderDrawers(2, interiorBot, H * 0.25, highlightColor, roughness)}
          </>
        );

      // ── OW 18 ────────────────────────────────────────────────────────────
      // 450mm wide | Top shelf 15% | hang 40% | 3 equal drawers 15% each
      case 'OW 18':
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.83)}
            {shelf('dr-cap18', H * 0.45)}
            {renderDrawers(3, interiorBot, H * 0.45, highlightColor, roughness)}
          </>
        );

      // ── OW 19 ────────────────────────────────────────────────────────────
      // 450mm wide | Top shelf 15% | 4 open shelves (3 boards at 55%,65%,75%)
      // | 3 equal drawers 15% each (zone 0%–45%)
      case 'OW 19':
        return (
          <>
            {shelf('top', H * 0.85)}
            {shelf('sh1-19', H * 0.75)}
            {shelf('sh2-19', H * 0.65)}
            {shelf('sh3-19', H * 0.55)}
            {shelf('dr-cap19', H * 0.45)}
            {renderDrawers(3, interiorBot, H * 0.45, highlightColor, roughness)}
          </>
        );

      // ── OW/SW 22 ─────────────────────────────────────────────────────────
      // Top shelf 15% | hang 45% | glass accessory shelf + 1 mid-drawer combined 15%
      // | 2 open shelves 12.5% each
      // Glass shelf at 37% (just above drawer in zone 25%–37%)
      case 'OW/SW 22': {
        const glass22Y = H * 0.37;
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.83)}
            {shelf('zone-top22', H * 0.4)}
            {/* Glass accessory shelf — thin translucent panel */}
            <mesh key="glass22" position={[0, glass22Y, 0]} castShadow receiveShadow>
              <boxGeometry args={[innerW, pt * 0.7, innerD]} />
              <meshStandardMaterial
                color="#b8d8e8"
                roughness={0.05}
                metalness={0.1}
                transparent
                opacity={0.45}
              />
            </mesh>
            {/* 1 drawer in zone 25%–37% */}
            {renderDrawers(1, H * 0.25, glass22Y, highlightColor, roughness)}
            {shelf('bot1-22', H * 0.125)}
            {shelf('bot2-22', H * 0.25)}
          </>
        );
      }

      // ══════════════════════════════════════════════════════════════════════
      // HELPERS used only inside the switch (defined once, used per case)
      // ══════════════════════════════════════════════════════════════════════

      // glassTray — thin translucent tray panel
      // solidTray — same shape but opaque (wood/laminate)
      // TrouserRack — 3 angled horizontal bars representing a pull-out trouser unit
      // shoeTier   — a single angled shelf panel (slightly offset in Z to show angle)

      // ── OW/SW 23 & OW/SW 41 ──────────────────────────────────────────────
      // Identical layout to OW/SW 23 but width=450mm (handled by module.width)
      // top shelf 15% | hang 45% | glass tray 5% | 1 drawer 10% | 2 shelves 12.5% each
      case 'OW/SW 23':
      case 'OW/SW 41': {
        const tray23Y = H * 0.37; // glass tray at 37%  (bottom of 40%–45% tray zone)
        const tray23TY = H * 0.4; // cap shelf at 40%
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.83)}
            {shelf('tray-cap', tray23TY)}
            {/* Glass jewellery tray — thin translucent panel */}
            <mesh key="glass-tray" position={[0, tray23Y, 0]} castShadow receiveShadow>
              <boxGeometry args={[innerW, pt * 0.6, innerD]} />
              <meshStandardMaterial
                color="#b8d8e8"
                roughness={0.04}
                metalness={0.12}
                transparent
                opacity={0.42}
              />
            </mesh>
            {/* 1 drawer in zone 27%–37% */}
            {renderDrawers(1, H * 0.27, tray23Y, highlightColor, roughness)}
            {shelf('bot1', H * 0.125)}
            {shelf('bot2', H * 0.27)}
          </>
        );
      }

      // ── OW/SW 42 ─────────────────────────────────────────────────────────
      // Structurally identical to OW/SW 23 but tray is SOLID wood (not glass)
      case 'OW/SW 42': {
        const tray42Y = H * 0.37;
        const tray42TY = H * 0.4;
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.83)}
            {shelf('tray-cap', tray42TY)}
            {/* Solid wood tray — opaque, full roughness */}
            <Panel
              key="solid-tray"
              color={highlightColor}
              roughness={roughness}
              position={[0, tray42Y, 0]}
              size={[innerW, pt * 1.2, innerD]}
            />
            {renderDrawers(1, H * 0.27, tray42Y, highlightColor, roughness)}
            {shelf('bot1', H * 0.125)}
            {shelf('bot2', H * 0.27)}
          </>
        );
      }

      // ── OW/SW 24 ─────────────────────────────────────────────────────────
      // top shelf 15% | hang 40% | glass tray 5% | 2 drawers 13.3% each | shelf 13.3%
      case 'OW/SW 24': {
        const tray24Y = H * 0.4; // tray at 40% (top of tray zone = 45%)
        const tray24T = H * 0.45;
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.83)}
            {shelf('tray-cap24', tray24T)}
            <mesh key="glass-tray24" position={[0, tray24Y, 0]} castShadow receiveShadow>
              <boxGeometry args={[innerW, pt * 0.6, innerD]} />
              <meshStandardMaterial
                color="#b8d8e8"
                roughness={0.04}
                metalness={0.12}
                transparent
                opacity={0.42}
              />
            </mesh>
            {/* 2 stacked drawers in zone 13.3%–40% */}
            {renderDrawers(2, H * 0.133, tray24Y, highlightColor, roughness)}
            {/* Open shelf at the base 0%–13.3% */}
            {shelf('bot24', H * 0.133)}
          </>
        );
      }

      // ── OW/SW 25 ─────────────────────────────────────────────────────────
      // top shelf 15% | hang 45% | accessory tray 5% | 2 drawers 10% each | shelf 15%
      case 'OW/SW 25': {
        const tray25Y = H * 0.37;
        const tray25T = H * 0.4;
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.83)}
            {shelf('tray-cap25', tray25T)}
            <mesh key="glass-tray25" position={[0, tray25Y, 0]} castShadow receiveShadow>
              <boxGeometry args={[innerW, pt * 0.6, innerD]} />
              <meshStandardMaterial
                color="#b8d8e8"
                roughness={0.04}
                metalness={0.12}
                transparent
                opacity={0.42}
              />
            </mesh>
            {/* 2 stacked drawers in zone 15%–37% */}
            {renderDrawers(2, H * 0.15, tray25Y, highlightColor, roughness)}
            {/* Open shelf at base 0%–15% */}
            {shelf('bot25', H * 0.15)}
          </>
        );
      }

      // ── OW/SW 26 & OW/SW 27 ──────────────────────────────────────────────
      // top shelf 15% | hang 40% | glass tray 5% | 3 drawers 13.3% each  (no open base)
      // OW/SW 27 is structurally identical to OW/SW 26
      case 'OW/SW 26':
      case 'OW/SW 27': {
        const tray26Y = H * 0.4;
        const tray26T = H * 0.45;
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.83)}
            {shelf('tray-cap26', tray26T)}
            <mesh key="glass-tray26" position={[0, tray26Y, 0]} castShadow receiveShadow>
              <boxGeometry args={[innerW, pt * 0.6, innerD]} />
              <meshStandardMaterial
                color="#b8d8e8"
                roughness={0.04}
                metalness={0.12}
                transparent
                opacity={0.42}
              />
            </mesh>
            {/* 3 stacked drawers fill zone 0%–40% */}
            {renderDrawers(3, interiorBot, tray26Y, highlightColor, roughness)}
          </>
        );
      }

      // ── OW/SW 28 ─────────────────────────────────────────────────────────
      // top shelf 15% | upper hang 42.5% | trouser rack unit 42.5% (no separate rod)
      case 'OW/SW 28': {
        // Trouser rack: 3 evenly spaced angled bars in the lower zone
        const tr28Bot = interiorBot;
        const tr28Top = H * 0.425;
        const tr28Span = tr28Top - tr28Bot;
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail-upper', H * 0.83)}
            {/* Separator shelf at top of trouser rack zone */}
            {shelf('rack-cap28', tr28Top)}
            {/* Trouser rack — 3 pull-out bars at angled intervals */}
            {[0.25, 0.5, 0.75].map((f, i) => (
              <mesh
                key={`tr28-${i}`}
                position={[0, tr28Bot + tr28Span * f, innerD * 0.05]}
                rotation={[Math.PI * 0.08, 0, 0]}
                castShadow
              >
                <cylinderGeometry args={[0.008, 0.008, innerW * 0.88, 14]} />
                <meshStandardMaterial color="#c0bdb5" roughness={0.18} metalness={0.92} />
              </mesh>
            ))}
          </>
        );
      }

      // ── OW/SW 29 ─────────────────────────────────────────────────────────
      // top shelf 15% | upper hang 40% | 1 mid-drawer 10% | trouser rack 35%
      case 'OW/SW 29': {
        const tr29Bot = interiorBot;
        const tr29Top = H * 0.35;
        const tr29Span = tr29Top - tr29Bot;
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail-upper', H * 0.83)}
            {shelf('hang-floor29', H * 0.45)}
            {/* 1 drawer in 35%–45% zone */}
            {renderDrawers(1, H * 0.35, H * 0.45, highlightColor, roughness)}
            {/* Separator shelf at top of trouser zone */}
            {shelf('rack-cap29', tr29Top)}
            {/* Trouser rack — 3 bars */}
            {[0.25, 0.5, 0.75].map((f, i) => (
              <mesh
                key={`tr29-${i}`}
                position={[0, tr29Bot + tr29Span * f, innerD * 0.05]}
                rotation={[Math.PI * 0.08, 0, 0]}
                castShadow
              >
                <cylinderGeometry args={[0.008, 0.008, innerW * 0.88, 14]} />
                <meshStandardMaterial color="#c0bdb5" roughness={0.18} metalness={0.92} />
              </mesh>
            ))}
          </>
        );
      }

      // ── OW/SW 30 & OW 30 ─────────────────────────────────────────────────
      // top shelf 15% | upper hang 45% | bottom 40% SPLIT:
      //   LEFT:  1 drawer (top) + 2 open shelves below
      //   RIGHT: trouser rack unit (no separate rod)
      // OW 30 in modules.js uses id 'OW 30' — keep both
      case 'OW/SW 30':
      case 'OW 30': {
        const s30Top = H * 0.4;
        const s30H = s30Top - interiorBot;
        const s30HalfW = innerW / 2;
        const s30LX = -s30HalfW / 2;
        const s30RX = s30HalfW / 2;
        const s30DrBot = s30Top - s30H * 0.25;
        const s30DrTop = s30Top;
        const s30DrCY = (s30DrBot + s30DrTop) / 2;
        const s30DrFH = Math.max(s30DrTop - s30DrBot - 0.012, 0.06);
        const s30ShY = interiorBot + (s30DrBot - interiorBot) * 0.5;
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail-upper', H * 0.83)}
            {shelf('split-cap30', s30Top)}
            {/* Vertical centre divider */}
            <Panel
              key="vdiv30"
              color={highlightColor}
              roughness={roughness}
              position={[0, (s30Top + interiorBot) / 2, 0]}
              size={[pt, s30H, innerD]}
            />
            {/* LEFT: drawer face */}
            <group key="dr-left30">
              <Panel
                color={highlightColor}
                roughness={roughness}
                position={[s30LX, s30DrCY, depth / 2 + 0.006]}
                size={[s30HalfW - pt - 0.006, s30DrFH, 0.018]}
              />
              <mesh position={[s30LX, s30DrCY, depth / 2 + 0.032]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.006, 0.006, Math.min(s30HalfW * 0.4, 0.12), 12]} />
                <meshStandardMaterial color="#c8c0b4" roughness={0.22} metalness={0.88} />
              </mesh>
            </group>
            {/* LEFT: 1 shelf below drawer */}
            <Panel
              key="l-sh30"
              color={highlightColor}
              roughness={roughness}
              position={[s30LX, s30ShY, 0]}
              size={[s30HalfW - pt, pt, innerD]}
            />
            {/* RIGHT: trouser rack — 3 bars filling the split zone */}
            {[0.25, 0.5, 0.75].map((f, i) => (
              <mesh
                key={`tr30-${i}`}
                position={[s30RX, interiorBot + s30H * f, innerD * 0.05]}
                rotation={[Math.PI * 0.08, 0, 0]}
                castShadow
              >
                <cylinderGeometry args={[0.007, 0.007, (s30HalfW - pt) * 0.88, 14]} />
                <meshStandardMaterial color="#c0bdb5" roughness={0.18} metalness={0.92} />
              </mesh>
            ))}
          </>
        );
      }

      // ── OW/SW 31 ─────────────────────────────────────────────────────────
      // 450mm wide | top shelf 15% | 6 angled shoe tiers (each ~14.1%, filling 85%)
      case 'OW/SW 31': {
        const shoe31Bot = interiorBot;
        const shoe31Top = H * 0.85;
        const shoe31Span = shoe31Top - shoe31Bot;
        const shoe31Count = 6;
        return (
          <>
            {shelf('top', H * 0.85)}
            {/* 6 angled shoe tiers evenly spaced in zone 0%–85% */}
            {Array.from({ length: shoe31Count }, (_, i) => {
              const sy = shoe31Bot + (shoe31Span / (shoe31Count + 1)) * (i + 1);
              return (
                <mesh
                  key={`shoe31-${i}`}
                  position={[0, sy, innerD * 0.08]}
                  rotation={[Math.PI * 0.07, 0, 0]}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry args={[innerW, pt * 1.1, innerD]} />
                  <meshStandardMaterial color={highlightColor} roughness={roughness} />
                </mesh>
              );
            })}
          </>
        );
      }

      // ── OW/SW 32 ─────────────────────────────────────────────────────────
      // 450mm | top shelf 15% | 3 full shelves 10% each | vertical split 15% (2 cubbies)
      // | 2 angled shoe tiers 10% each at base 20%
      case 'OW/SW 32': {
        // Zones (bottom→top): shoe[0%–20%], split[20%–35%], shelves[35%–65%], top-shelf[85%]
        const shoe32Top = H * 0.2;
        const split32Bot = shoe32Top;
        const split32Top = H * 0.35;
        const split32H = split32Top - split32Bot;
        const shelves32Bot = split32Top;
        const shelves32Top = H * 0.85;
        const shoe32Span = shoe32Top - interiorBot;
        const hw32 = innerW / 2;
        return (
          <>
            {shelf('top', H * 0.85)}
            {/* 3 full-width open shelves in zone 35%–85% */}
            {renderShelves(3, shelves32Bot, shelves32Top, highlightColor, roughness)}
            {/* Shelf capping the split zone from above */}
            {shelf('split-cap32', split32Top)}
            {/* Vertical divider creating 2 half-width cubbies in 20%–35% */}
            <Panel
              key="vdiv32"
              color={highlightColor}
              roughness={roughness}
              position={[0, (split32Top + split32Bot) / 2, 0]}
              size={[pt, split32H, innerD]}
            />
            {/* Shelf at bottom of split zone */}
            {shelf('split-bot32', split32Bot)}
            {/* 2 angled shoe tiers at base 0%–20% */}
            {[0.33, 0.67].map((f, i) => (
              <mesh
                key={`shoe32-${i}`}
                position={[0, interiorBot + shoe32Span * f, innerD * 0.08]}
                rotation={[Math.PI * 0.07, 0, 0]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[innerW, pt * 1.1, innerD]} />
                <meshStandardMaterial color={highlightColor} roughness={roughness} />
              </mesh>
            ))}
          </>
        );
      }

      // ── OW/SW 33 ─────────────────────────────────────────────────────────
      // 450mm | top shelf 15% | 2 full shelves 10% each | split zone 30% (6 cubbies 3+3)
      // | 2 angled shoe tiers 17.5% each at base
      case 'OW/SW 33': {
        // Zones: shoe[0%–35%], split[35%–65%], shelves[65%–85%], top-shelf[85%]
        const shoe33Top = H * 0.35;
        const split33Bot = shoe33Top;
        const split33Top = H * 0.65;
        const split33H = split33Top - split33Bot;
        const shelves33Bot = split33Top;
        const shoe33Span = shoe33Top - interiorBot;
        const hw33 = innerW / 2;
        const hw33LX = -hw33 / 2;
        const hw33RX = hw33 / 2;
        return (
          <>
            {shelf('top', H * 0.85)}
            {/* 2 full-width shelves in zone 65%–85% */}
            {renderShelves(2, shelves33Bot, H * 0.85, highlightColor, roughness)}
            {/* Cap shelf above split zone */}
            {shelf('split-cap33', split33Top)}
            {/* Vertical divider */}
            <Panel
              key="vdiv33"
              color={highlightColor}
              roughness={roughness}
              position={[0, (split33Top + split33Bot) / 2, 0]}
              size={[pt, split33H, innerD]}
            />
            {/* 2 horizontal boards on each half → 3 cubbies per side (2 boards each) */}
            {[1, 2].map((i) => (
              <Panel
                key={`l-sh33-${i}`}
                color={highlightColor}
                roughness={roughness}
                position={[hw33LX, split33Bot + (split33H / 3) * i, 0]}
                size={[hw33 - pt, pt, innerD]}
              />
            ))}
            {[1, 2].map((i) => (
              <Panel
                key={`r-sh33-${i}`}
                color={highlightColor}
                roughness={roughness}
                position={[hw33RX, split33Bot + (split33H / 3) * i, 0]}
                size={[hw33 - pt, pt, innerD]}
              />
            ))}
            {/* Floor of split zone */}
            {shelf('split-bot33', split33Bot)}
            {/* 2 angled shoe tiers at base */}
            {[0.33, 0.67].map((f, i) => (
              <mesh
                key={`shoe33-${i}`}
                position={[0, interiorBot + shoe33Span * f, innerD * 0.08]}
                rotation={[Math.PI * 0.07, 0, 0]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[innerW, pt * 1.1, innerD]} />
                <meshStandardMaterial color={highlightColor} roughness={roughness} />
              </mesh>
            ))}
          </>
        );
      }

      // ── OW/SW 34 ─────────────────────────────────────────────────────────
      // 600mm | top shelf 15% | hang 45% | 2 drawers 10% each | 1 angled shoe tier 20%
      case 'OW/SW 34': {
        const shoe34Top = H * 0.2;
        const shoe34Span = shoe34Top - interiorBot;
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.83)}
            {shelf('draw-cap34', H * 0.4)}
            {/* 2 drawers in zone 20%–40% */}
            {renderDrawers(2, shoe34Top, H * 0.4, highlightColor, roughness)}
            {/* 1 angled shoe tier at base zone 0%–20% */}
            <mesh
              key="shoe34"
              position={[0, interiorBot + shoe34Span * 0.5, innerD * 0.08]}
              rotation={[Math.PI * 0.07, 0, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[innerW, pt * 1.1, innerD]} />
              <meshStandardMaterial color={highlightColor} roughness={roughness} />
            </mesh>
          </>
        );
      }

      // ── OW/SW 35 ─────────────────────────────────────────────────────────
      // 600mm | 4 open shelves top 40% | 2 stacked drawers mid 25% | 2 shoe tiers bottom 35%
      case 'OW/SW 35': {
        const shoe35Top = H * 0.35;
        const draw35Bot = shoe35Top;
        const draw35Top = H * 0.6;
        const shelf35Bot = draw35Top;
        const shoe35Span = shoe35Top - interiorBot;
        return (
          <>
            {/* 4 open shelves in zone 60%–100% */}
            {renderShelves(4, shelf35Bot, H, highlightColor, roughness)}
            {/* Shelf cap above drawer zone */}
            {shelf('draw-cap35', draw35Top)}
            {/* 2 stacked drawers in zone 35%–60% */}
            {renderDrawers(2, draw35Bot, draw35Top, highlightColor, roughness)}
            {/* Shelf cap above shoe zone */}
            {shelf('shoe-cap35', shoe35Top)}
            {/* 2 angled shoe tiers at base 0%–35% */}
            {[0.33, 0.67].map((f, i) => (
              <mesh
                key={`shoe35-${i}`}
                position={[0, interiorBot + shoe35Span * f, innerD * 0.08]}
                rotation={[Math.PI * 0.07, 0, 0]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[innerW, pt * 1.1, innerD]} />
                <meshStandardMaterial color={highlightColor} roughness={roughness} />
              </mesh>
            ))}
          </>
        );
      }

      // ── OW 36 ────────────────────────────────────────────────────────────
      // 600mm | top shelf 15% | hang 40% | 2 side-by-side half-width drawers 10%
      // | 3 full-width stacked drawers ~11.6% each
      case 'OW 36': {
        const sideDrBot = H * 0.35; // top of 3 full-width drawer zone
        const sideDrTop = H * 0.45; // bottom of hang zone
        const sideDrCY = (sideDrBot + sideDrTop) / 2;
        const sideDrFH = Math.max(sideDrTop - sideDrBot - 0.012, 0.06);
        const hw36 = innerW / 2;
        const lx36 = -hw36 / 2;
        const rx36 = hw36 / 2;
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.83)}
            {/* Separator between hang zone and side-by-side drawer row */}
            {shelf('hang-floor36', sideDrTop)}
            {/* Vertical divider for the side-by-side drawer row */}
            <Panel
              key="vdiv36"
              color={highlightColor}
              roughness={roughness}
              position={[0, sideDrCY, 0]}
              size={[pt, sideDrTop - sideDrBot, innerD]}
            />
            {/* LEFT half-width drawer */}
            <group key="dr-l36">
              <Panel
                color={highlightColor}
                roughness={roughness}
                position={[lx36, sideDrCY, depth / 2 + 0.006]}
                size={[hw36 - pt - 0.006, sideDrFH, 0.018]}
              />
              <mesh position={[lx36, sideDrCY, depth / 2 + 0.032]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.006, 0.006, Math.min(hw36 * 0.35, 0.1), 12]} />
                <meshStandardMaterial color="#c8c0b4" roughness={0.22} metalness={0.88} />
              </mesh>
            </group>
            {/* RIGHT half-width drawer */}
            <group key="dr-r36">
              <Panel
                color={highlightColor}
                roughness={roughness}
                position={[rx36, sideDrCY, depth / 2 + 0.006]}
                size={[hw36 - pt - 0.006, sideDrFH, 0.018]}
              />
              <mesh position={[rx36, sideDrCY, depth / 2 + 0.032]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.006, 0.006, Math.min(hw36 * 0.35, 0.1), 12]} />
                <meshStandardMaterial color="#c8c0b4" roughness={0.22} metalness={0.88} />
              </mesh>
            </group>
            {/* 3 full-width stacked drawers in zone 0%–35% */}
            {renderDrawers(3, interiorBot, sideDrBot, highlightColor, roughness)}
          </>
        );
      }

      // ── OW/SW 37 ─────────────────────────────────────────────────────────
      // 600mm | top shelf 15% | hang 45% | 2 side-by-side open cubbies 10%
      // | 3 full-width stacked drawers 10% each
      case 'OW/SW 37': {
        const cubbiesBot37 = H * 0.3; // top of drawer zone
        const cubbiesTop37 = H * 0.4; // bottom of hang zone
        const hw37 = innerW / 2;
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.83)}
            {/* Separator shelf between hang zone and cubby row */}
            {shelf('hang-floor37', cubbiesTop37)}
            {/* Vertical divider creating 2 side-by-side open cubbies */}
            <Panel
              key="vdiv37"
              color={highlightColor}
              roughness={roughness}
              position={[0, (cubbiesTop37 + cubbiesBot37) / 2, 0]}
              size={[pt, cubbiesTop37 - cubbiesBot37, innerD]}
            />
            {/* Shelf at bottom of cubby zone / top of drawer zone */}
            {shelf('cubby-bot37', cubbiesBot37)}
            {/* 3 full-width stacked drawers in zone 0%–30% */}
            {renderDrawers(3, interiorBot, cubbiesBot37, highlightColor, roughness)}
          </>
        );
      }

      // ── OW 38 ────────────────────────────────────────────────────────────
      // 450mm | top shelf 15% | hang 45% | split zone 20%:
      //   LEFT: 2 small stacked drawers   RIGHT: 1 solid door cabinet
      // | open bottom shelf 20%
      case 'OW 38': {
        const s38STop = H * 0.6; // bottom of hang zone / top of split zone
        const s38SBot = H * 0.4; // bottom of split zone / top of base shelf zone
        const s38SH = s38STop - s38SBot;
        const hw38 = innerW / 2;
        const lx38 = -hw38 / 2;
        const rx38 = hw38 / 2;
        const cab38CY = (s38STop + s38SBot) / 2;
        const cab38H = s38SH;
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail', H * 0.83)}
            {/* Separator shelf at top of split zone (bottom of hang zone) */}
            {shelf('hang-floor38', s38STop)}
            {/* Vertical divider */}
            <Panel
              key="vdiv38"
              color={highlightColor}
              roughness={roughness}
              position={[0, (s38STop + s38SBot) / 2, 0]}
              size={[pt, s38SH, innerD]}
            />
            {/* LEFT: 2 small stacked half-width drawers */}
            {Array.from({ length: 2 }, (_, j) => {
              const drH = s38SH / 2;
              const cy = s38SBot + drH * j + drH / 2;
              const faceH = Math.max(drH - 0.012, 0.06);
              return (
                <group key={`dr38-${j}`}>
                  <Panel
                    color={highlightColor}
                    roughness={roughness}
                    position={[lx38, cy, depth / 2 + 0.006]}
                    size={[hw38 - pt - 0.006, faceH, 0.018]}
                  />
                  <mesh position={[lx38, cy, depth / 2 + 0.032]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.006, 0.006, Math.min(hw38 * 0.35, 0.1), 12]} />
                    <meshStandardMaterial color="#c8c0b4" roughness={0.22} metalness={0.88} />
                  </mesh>
                </group>
              );
            })}
            {/* RIGHT: solid door cabinet (swing door on right half) */}
            <Door
              color={highlightColor}
              roughness={roughness}
              x={rx38}
              yCenter={cab38CY}
              w={hw38}
              h={cab38H}
              depth={depth}
            />
            {/* Bottom shelf at 20%–40% open area */}
            {shelf('base-cap38', s38SBot)}
            {/* Open base 0%–40% zone — just the open shelf panel */}
          </>
        );
      }

      // ── OW 39 ────────────────────────────────────────────────────────────
      // 450mm | top shelf 15% | upper hang 45% | bottom 40% SPLIT:
      //   BOTH halves identical: 1 half-width drawer (top) + 2 half-width open cubbies
      case 'OW 39': {
        const s39Top = H * 0.4;
        const s39H = s39Top - interiorBot;
        const hw39 = innerW / 2;
        const lx39 = -hw39 / 2;
        const rx39 = hw39 / 2;
        // Drawer zone: top 25% of split (~10% of total)
        const s39DrBot = s39Top - s39H * 0.25;
        const s39DrTop = s39Top;
        const s39DrCY = (s39DrBot + s39DrTop) / 2;
        const s39DrFH = Math.max(s39DrTop - s39DrBot - 0.012, 0.06);
        // 2 open cubbies below drawer: 1 shelf at midpoint of remaining zone
        const s39ShelfY = interiorBot + (s39DrBot - interiorBot) * 0.5;
        return (
          <>
            {shelf('top', H * 0.85)}
            {rail('rail-upper', H * 0.83)}
            {shelf('split-cap39', s39Top)}
            {/* Vertical centre divider */}
            <Panel
              key="vdiv39"
              color={highlightColor}
              roughness={roughness}
              position={[0, (s39Top + interiorBot) / 2, 0]}
              size={[pt, s39H, innerD]}
            />
            {/* LEFT side: drawer + 1 shelf (creating 2 cubbies) */}
            {[lx39, rx39].map((xPos, side) => (
              <group key={`side39-${side}`}>
                {/* Drawer face */}
                <Panel
                  color={highlightColor}
                  roughness={roughness}
                  position={[xPos, s39DrCY, depth / 2 + 0.006]}
                  size={[hw39 - pt - 0.006, s39DrFH, 0.018]}
                />
                <mesh position={[xPos, s39DrCY, depth / 2 + 0.032]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.006, 0.006, Math.min(hw39 * 0.35, 0.1), 12]} />
                  <meshStandardMaterial color="#c8c0b4" roughness={0.22} metalness={0.88} />
                </mesh>
                {/* 1 shelf creating 2 open cubbies below the drawer */}
                <Panel
                  color={highlightColor}
                  roughness={roughness}
                  position={[xPos, s39ShelfY, 0]}
                  size={[hw39 - pt, pt, innerD]}
                />
              </group>
            ))}
          </>
        );
      }

      // ── OW/SW 40 ─────────────────────────────────────────────────────────
      // 600mm | top shelf 15% | FULL vertical split 85% to floor:
      //   LEFT:  hang zone (top ~50% of split) + 3 half-width stacked drawers (bottom ~50%)
      //   RIGHT: 5 equal open half-width cubbies (4 horizontal boards)
      case 'OW 40':
      case 'OW/SW 40': {
        const s40Top = H * 0.85; // top of split zone
        const s40Bot = interiorBot; // floor
        const s40H = s40Top - s40Bot;
        const hw40 = innerW / 2;
        const lx40 = -hw40 / 2;
        const rx40 = hw40 / 2;
        // LEFT: top 50% = hang, bottom 50% = 3 drawers
        const lHangBot40 = s40Bot + s40H * 0.5; // boundary between hang and drawers
        const lRailY40 = s40Top - 0.06; // rod near top of hang zone
        return (
          <>
            {/* Full-width top shelf */}
            {shelf('top', H * 0.85)}
            {/* Vertical divider from floor to top shelf */}
            <Panel
              key="vdiv40"
              color={highlightColor}
              roughness={roughness}
              position={[0, (s40Top + s40Bot) / 2, 0]}
              size={[pt, s40H, innerD]}
            />
            {/* LEFT: hanging rod in the top half */}
            <Rail key="rail-left40" position={[lx40, lRailY40, 0]} length={(hw40 - pt) * 0.88} />
            {/* LEFT: separator shelf between hang and drawer zones */}
            <Panel
              key="l-sep40"
              color={highlightColor}
              roughness={roughness}
              position={[lx40, lHangBot40, 0]}
              size={[hw40 - pt, pt, innerD]}
            />
            {/* LEFT: 3 stacked half-width drawers in bottom 50% of left zone */}
            {Array.from({ length: 3 }, (_, j) => {
              const drH = (lHangBot40 - s40Bot) / 3;
              const cy = s40Bot + drH * j + drH / 2;
              const faceH = Math.max(drH - 0.012, 0.06);
              return (
                <group key={`dr40-${j}`}>
                  <Panel
                    color={highlightColor}
                    roughness={roughness}
                    position={[lx40, cy, depth / 2 + 0.006]}
                    size={[hw40 - pt - 0.006, faceH, 0.018]}
                  />
                  <mesh position={[lx40, cy, depth / 2 + 0.032]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.006, 0.006, Math.min(hw40 * 0.35, 0.1), 12]} />
                    <meshStandardMaterial color="#c8c0b4" roughness={0.22} metalness={0.88} />
                  </mesh>
                </group>
              );
            })}
            {/* RIGHT: 4 horizontal boards → 5 equal open cubbies */}
            {Array.from({ length: 4 }, (_, i) => (
              <Panel
                key={`r-cub40-${i}`}
                color={highlightColor}
                roughness={roughness}
                position={[rx40, s40Bot + (s40H / 5) * (i + 1), 0]}
                size={[hw40 - pt, pt, innerD]}
              />
            ))}
          </>
        );
      }

      default:
        // ── Generic fallback (any other hanging-type module) ──────────────
        if (numHang === 0 && numShelves > 0)
          return <>{renderShelves(numShelves, interiorBot, H, highlightColor, roughness)}</>;
        if (numHang >= 2 && numShelves === 0)
          return (
            <>
              <Rail position={[0, H * 0.95, 0]} length={innerW * 0.88} />
              <Rail position={[0, H * 0.5, 0]} length={innerW * 0.88} />
            </>
          );
        if (numHang === 1 && numShelves === 0 && numDrawers === 0)
          return <Rail position={[0, H * 0.88, 0]} length={innerW * 0.88} />;
        if (numHang === 1 && numShelves > 0 && numDrawers === 0)
          return (
            <>
              {shelf('top', H * 0.85)}
              {rail('rail', H * 0.83)}
              {renderShelves(numShelves - 1, interiorBot, H * 0.4, highlightColor, roughness)}
            </>
          );
        return null;
    }
  };

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
      {/* ── Carcass (shared by all module types) ──────────────────── */}
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
        position={[0, height / 2, -(depth / 2) + pt / 2]}
        size={[innerW, height - pt * 2, pt]}
      />

      {/* ══════════════════════════════════════════════════════════════
          OPEN-FRONT INTERIOR — type:'hanging'
          Rendered by renderOpenFrontInterior() which dispatches on
          module.id for exact zone geometry matching the catalogue.
          ══════════════════════════════════════════════════════════════ */}
      {isOpenFront && renderOpenFrontInterior()}

      {/* ══════════════════════════════════════════════════════════════
          CLOSED MODULE INTERIOR — all other types
          Retains full legacy door + zone logic.
          ══════════════════════════════════════════════════════════════ */}
      {!isOpenFront && (
        <>
          {/* ── Hanging zones ──────────────────────────────────── */}
          {numHang >= 1 && (
            <>
              {/* Rail for top hang section */}
              <Rail
                position={[0, numHang >= 2 ? hangZoneTop * 0.94 : hangZoneTop * 0.9, 0]}
                length={innerW * 0.88}
              />
              {/* Top-hang doors */}
              <Door
                color={highlightColor}
                roughness={roughness}
                x={-doorW / 2}
                yCenter={
                  numHang >= 2
                    ? (hangZoneTop + hangZoneBottom) / 2
                    : (hangZoneTop + storageZoneTop) / 2
                }
                w={doorW}
                h={numHang >= 2 ? hangZoneTop - hangZoneBottom : hangZoneTop - storageZoneTop}
                depth={depth}
              />
              <Door
                color={highlightColor}
                roughness={roughness}
                x={doorW / 2}
                yCenter={
                  numHang >= 2
                    ? (hangZoneTop + hangZoneBottom) / 2
                    : (hangZoneTop + storageZoneTop) / 2
                }
                w={doorW}
                h={numHang >= 2 ? hangZoneTop - hangZoneBottom : hangZoneTop - storageZoneTop}
                depth={depth}
              />
            </>
          )}

          {numHang >= 2 && (
            <>
              {/* Second (bottom) hanging rail */}
              <Rail position={[0, hangZoneBottom * 0.9, 0]} length={innerW * 0.88} />
            </>
          )}

          {/* ── Shelves in storage zone ─────────────────────── */}
          {numHang === 0 &&
            numDrawers === 0 &&
            numShoe === 0 &&
            numShelves > 0 &&
            renderShelves(numShelves, storageZoneBot, storageZoneTop, highlightColor, roughness)}

          {numHang > 0 &&
            numShelves > 0 &&
            numDrawers === 0 &&
            renderShelves(numShelves, storageZoneBot, storageZoneTop, highlightColor, roughness)}

          {/* ── Storage zone doors ──────────────────────────── */}
          {(numDrawers > 0 || numShelves > 0) && numHang === 0 && (
            <>
              <Door
                color={highlightColor}
                roughness={roughness}
                x={-doorW / 2}
                yCenter={(storageZoneBot + storageZoneTop) / 2}
                w={doorW}
                h={storageZoneTop - storageZoneBot}
                depth={depth}
              />
              <Door
                color={highlightColor}
                roughness={roughness}
                x={doorW / 2}
                yCenter={(storageZoneBot + storageZoneTop) / 2}
                w={doorW}
                h={storageZoneTop - storageZoneBot}
                depth={depth}
              />
            </>
          )}

          {/* ── Drawers ─────────────────────────────────────── */}
          {numDrawers > 0 &&
            numShelves === 0 &&
            renderDrawers(numDrawers, storageZoneBot, storageZoneTop, highlightColor, roughness)}

          {numDrawers > 0 && numShelves > 0 && (
            <>
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

          {/* ── Shoe rack tiers ─────────────────────────────── */}
          {numShoe > 0 &&
            renderShoeRack(
              numShoe,
              storageZoneBot,
              storageZoneTop * 0.7,
              highlightColor,
              roughness
            )}

          {/* ── Cubbies grid ────────────────────────────────── */}
          {numCubbies > 0 &&
            (() => {
              const cols = 2;
              const rows = Math.ceil(numCubbies / cols);
              const cH = storageZoneTop / rows;
              const dividers = [];
              dividers.push(
                <Panel
                  key="vdiv"
                  color={highlightColor}
                  roughness={roughness}
                  position={[0, storageZoneTop / 2, 0]}
                  size={[pt, storageZoneTop, innerD]}
                />
              );
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

          {/* ── Top shelf above hanging zone ─────────────────── */}
          {numHang > 0 && (
            <Panel
              color={highlightColor}
              roughness={roughness}
              position={[0, height * 0.97, 0]}
              size={[innerW, pt, innerD]}
            />
          )}
        </>
      )}
    </group>
  );
}

export default ModuleMesh;
