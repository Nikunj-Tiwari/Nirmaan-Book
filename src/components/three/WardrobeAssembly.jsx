import React, { useMemo } from 'react';
import ModuleMesh from './ModuleMesh';

const mmToMeters = (value) => value / 1000;

/**
 * WardrobeAssembly
 * Lays out all modules left-to-right, centered on X=0.
 * The group is placed so modules sit ON the floor (Y=0)
 * and flush against the back wall (Z=0 → front face at +Z).
 */
export function WardrobeAssembly({ modules, material, roomDimensions, onModuleHover }) {
  const { depth } = roomDimensions;
  const depthM = mmToMeters(depth);

  const layout = useMemo(() => {
    if (!modules || modules.length === 0) return [];

    const totalWidth = modules.reduce((sum, mod) => sum + mod.width, 0);
    // Start from negative half-width so the whole assembly is centered on X=0
    let cursorX = -totalWidth / 2;

    return modules.map((mod, index) => {
      const centerX = cursorX + mod.width / 2;
      cursorX += mod.width;
      return {
        module: mod,
        // X: centred position in mm → metres
        x: mmToMeters(centerX),
        id: `${mod.id}-${index}`,
      };
    });
  }, [modules]);

  // The group sits at Z = -(depthM/2) so the back face is at the back wall (Z = -depthM/2)
  // and the front face is at Z = +depthM/2 (open toward the camera).
  // Each ModuleMesh builds itself with bottom at Y=0, so the group needs no Y offset.
  return (
    <group position={[0, 0, -depthM / 2]}>
      {layout.map((item) => (
        <ModuleMesh
          key={item.id}
          material={material}
          module={item.module}
          // x: centred, y: 0 (bottom on floor), z: half depth so mesh is centred in the group
          position={[item.x, 0, depthM / 2]}
          onHover={onModuleHover}
        />
      ))}
    </group>
  );
}

export default WardrobeAssembly;
