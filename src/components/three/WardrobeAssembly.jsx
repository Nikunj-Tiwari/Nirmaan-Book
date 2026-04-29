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
 */
export function WardrobeAssembly({ modules, material, roomDimensions, onModuleHover }) {
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

  const isMulti = wallType === 'l-shape' || wallType === 'u-shape';

  const { wallA, wallB, wallC } = useMemo(() => {
    if (!modules || modules.length === 0) return { wallA: [], wallB: [], wallC: [] };

    const modsA = modules.filter((m) => !m.wall || m.wall === 'A');
    const modsB = isMulti ? modules.filter((m) => m.wall === 'B') : [];
    const modsC = wallType === 'u-shape' ? modules.filter((m) => m.wall === 'C') : [];

    // Layout a row of modules along X, centered at 0
    const layoutRow = (mods) => {
      const totalW = mods.reduce((s, m) => s + m.width, 0);
      let cursor = -mm(totalW) / 2;
      return mods.map((mod, i) => {
        const halfW = mm(mod.width) / 2;
        const xCenter = cursor + halfW;
        cursor += mm(mod.width);
        return { module: mod, xCenter, key: mod.wallKey || `${mod.id}-${i}` };
      });
    };

    return { wallA: layoutRow(modsA), wallB: layoutRow(modsB), wallC: layoutRow(modsC) };
  }, [modules, isMulti, wallType]);

  /**
   * ModuleMesh local convention (unchanged):
   *   - Width centred on local X=0
   *   - Height bottom at Y=0, top at Y=height
   *   - Depth centred on Z=0 (back panel at z=-depth/2, front face at z=+depth/2)
   *
   * To place Wall A with FRONT FACE toward camera (+Z):
   *   position = [xCenter, 0, +depthM/2]
   *   (back panel sits at z=0, front face at z=+depthM — facing the camera)
   *
   * To place Wall B modules (left side, perpendicular):
   *   After rotation [0, +PI/2, 0]:
   *     local X → world -Z (width runs away from back wall toward camera)
   *     local Z → world +X (depth runs toward the left side wall)
   *   position:
   *     x = -(widthAM/2) - depthM/2  => places back of module flush against left side wall
   *     z = -xCenter                  => distributes modules along Z (away from corner)
   *                                      Note: xCenter is negative at the start (left end)
   *                                      so -xCenter is positive = toward camera. Good.
   *
   * Wall C (right side):
   *   After rotation [0, -PI/2, 0]:
   *     local X → world +Z
   *     local Z → world -X
   *   position:
   *     x = +(widthAM/2) + depthM/2
   *     z = -xCenter  (same logic)
   */

  return (
    <group>
      {/* ── Wall A — back wall, interior faces camera ─────────────────── */}
      <group>
        {wallA.map(({ module, xCenter, key }) => (
          <ModuleMesh
            key={key}
            material={material}
            module={module}
            position={[xCenter, 0, depthM / 2]}
            onHover={onModuleHover}
          />
        ))}
      </group>

      {/* ── Wall B — left perpendicular, runs along +Z into room ──────── */}
      {wallB.length > 0 && (
        <group>
          {wallB.map(({ module, xCenter, key }) => (
            <ModuleMesh
              key={key}
              material={material}
              module={module}
              position={[
                -(widthAM / 2) - depthM / 2, // flush against left side wall
                0,
                -xCenter, // distribute along Z (into room)
              ]}
              rotation={[0, Math.PI / 2, 0]}
              onHover={onModuleHover}
            />
          ))}
        </group>
      )}

      {/* ── Wall C — right perpendicular, runs along +Z into room ─────── */}
      {wallC.length > 0 && (
        <group>
          {wallC.map(({ module, xCenter, key }) => (
            <ModuleMesh
              key={key}
              material={material}
              module={module}
              position={[widthAM / 2 + depthM / 2, 0, -xCenter]}
              rotation={[0, -Math.PI / 2, 0]}
              onHover={onModuleHover}
            />
          ))}
        </group>
      )}
    </group>
  );
}

export default WardrobeAssembly;
