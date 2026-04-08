export const generateBOM = (modules, material, accessories) => {
  // Count occurrences of each module type
  const moduleCounts = modules.reduce((counts, mod) => {
    counts[mod.name] = (counts[mod.name] || 0) + 1;
    return counts;
  }, {});

  return {
    modules: Object.entries(moduleCounts).map(([name, count]) => ({
      name,
      count,
    })),
    material: material ? material.name : 'Not Selected',
    accessories: accessories.map((acc) => acc.name),
  };
};
