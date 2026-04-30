import React, { useMemo } from 'react';
import ModuleMesh from './ModuleMesh';

const mm = (v) => v / 1000;

/**
 * WardrobeAssembly — Room-oriented placement
 *
 * Coordinate system: Camera is at +Z, looking toward origin (-Z direction).
 * The back wall is at z = -0.03 (see RoomEnvironment).
 *
 * Wardrobe placement:
 *   Back face at z = 0 (flush against back wall)
 *   Front face (doors/interior opening) at z = +depthM (facing camera)
 *   ModuleMesh local origin = floor center of module
 *   => group position z = +depthM/2 (center of module depth)
 *
 * Wall A (main): modules along X, centered, back flush with back wall
 * Wall B (left):  rotated +90°Y, running along +Z from the left corner
 * Wall C (right): rotated -90°Y, running along +Z from the right corner
 *
 * wallOffsets: { B: mmOffset, C: mmOffset } — how far (in mm) from the corner
 * to start placing modules, so they don't overlap with Wall A.
 */
export function WardrobeAssembly({
  modules,
  material,
  roomDimensions,
  wallOffsets = { B: 0, C: 0 },
  onModuleHover,
  onModuleClick,
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

  const offsetB = mm(wallOffsets?.B || 0);
  const offsetC = mm(wallOffsets?.C || 0);

  const { wallA, wallB, wallC } = useMemo(() => {
    if (!modules || modules.length === 0) return { wallA: [], wallB: [], wallC: [] };

    const modsA = modules.filter((m) => !m.wall || m.wall === 'A');
    const modsB = wallType !== 'single' ? modules.filter((m) => m.wall === 'B') : [];
    const modsC = wallType === 'u-shape' ? modules.filter((m) => m.wall === 'C') : [];

    // Wall A: Centered at x=0, runs along X
    const layoutA = (mods) => {
      const totalW = mods.reduce((s, m) => s + (m.width || 600), 0);
      let cursor = -mm(totalW) / 2;
      return mods.map((mod, i) => {
        const mmWidth = mm(mod.width || 600);
        const halfW = mmWidth / 2;
        const xCenter = cursor + halfW;
        cursor += mmWidth;
        return { module: mod, xCenter, key: mod.wallKey || `A-${mod.id}-${i}` };
      });
    };

    // Wall B & C: Start from corner (z=0) + offset, run forward towards camera (+Z)
    const layoutPerp = (mods, prefix, startOffset) => {
      let cursor = startOffset; // start after user-defined offset
      return mods.map((mod, i) => {
        const mmWidth = mm(mod.width || 600);
        const halfW = mmWidth / 2;
        const zCenter = cursor + halfW;
        cursor += mmWidth;
        return { module: mod, zCenter, key: mod.wallKey || `${prefix}-${mod.id}-${i}` };
      });
    };

    return {
      wallA: layoutA(modsA),
      wallB: layoutPerp(modsB, 'B', offsetB),
      wallC: layoutPerp(modsC, 'C', offsetC),
    };
  }, [modules, wallType, depthM, offsetB, offsetC]);

  return (
    <group>
      {/* ── Wall A — Main back wall ───────────────────────────────────── */}
      <group>
        {wallA.map(({ module, xCenter, key }) => (
          <ModuleMesh
            key={key}
            material={material}
            module={module}
            position={[xCenter, 0, depthM / 2]}
            rotationY={(module.rotation || 0) * (Math.PI / 180)}
            onHover={onModuleHover}
            onClick={onModuleClick}
          />
        ))}
      </group>

      {/* ── Wall B — Left side wall ───────────────────────────────────── */}
      {wallB.length > 0 && (
        <group>
          {wallB.map(({ module, zCenter, key }) => {
            const baseRot = Math.PI / 2;
            const extraRot = (module.rotation || 0) * (Math.PI / 180);
            return (
              <ModuleMesh
                key={key}
                material={material}
                module={module}
                position={[-(widthAM / 2) + depthM / 2, 0, zCenter]}
                rotationY={baseRot + extraRot}
                onHover={onModuleHover}
                onClick={onModuleClick}
              />
            );
          })}
        </group>
      )}

      {/* ── Wall C — Right side wall ──────────────────────────────────── */}
      {wallC.length > 0 && (
        <group>
          {wallC.map(({ module, zCenter, key }) => {
            const baseRot = -Math.PI / 2;
            const extraRot = (module.rotation || 0) * (Math.PI / 180);
            return (
              <ModuleMesh
                key={key}
                material={material}
                module={module}
                position={[widthAM / 2 - depthM / 2, 0, zCenter]}
                rotationY={baseRot + extraRot}
                onHover={onModuleHover}
                onClick={onModuleClick}
              />
            );
          })}
        </group>
      )}
    </group>
  );
}

export default WardrobeAssembly;
