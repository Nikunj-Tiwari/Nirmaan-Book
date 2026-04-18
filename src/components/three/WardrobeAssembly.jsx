import React, { useMemo } from 'react';
import ModuleMesh from './ModuleMesh';

const mmToMeters = (value) => value / 1000;

export function WardrobeAssembly({ modules, material, roomDimensions, onModuleHover }) {
  const { depth } = roomDimensions;

  const layout = useMemo(() => {
    if (!modules || modules.length === 0) return [];

    const totalWidth = modules.reduce((sum, mod) => sum + mod.width, 0);
    let cursorX = -totalWidth / 2;

    return modules.map((mod, index) => {
      const centerX = cursorX + mod.width / 2;
      cursorX += mod.width;

      return {
        module: mod,
        x: mmToMeters(centerX),
        id: `${mod.id}-${index}`,
      };
    });
  }, [modules]);

  return (
    <group position={[0, 0, -mmToMeters(depth) / 2]}>
      {layout.map((item) => (
        <ModuleMesh
          key={item.id}
          material={material}
          module={item.module}
          position={[item.x, 0, mmToMeters(item.module.depth) / 2]}
          onHover={onModuleHover}
        />
      ))}
    </group>
  );
}

export default WardrobeAssembly;
