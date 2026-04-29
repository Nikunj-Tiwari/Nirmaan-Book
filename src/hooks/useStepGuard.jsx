import { useConfig } from '../store/ConfigContext';

/**
 * useStepGuard Hook
 * Prevents navigation to locked steps based on completion of previous steps.
 *
 * Step Lock Rules:
 * 1. Dimensions → Always accessible (first step)
 * 2. Modules → Locked until dimensions are set
 * 3. Materials → Locked until modules are selected
 * 4. Hardware → Locked until materials are selected
 * 5. Summary → Locked until all previous steps are complete
 */
export const useStepGuard = () => {
  const { config, derived } = useConfig();
  const { totalModules, validation } = derived;

  // Check if a step is locked
  const isStepLocked = (stepId) => {
    switch (stepId) {
      case 1: // Project - always accessible
      case 2: // Dimensions - always accessible
        return false;

      case 3: // Modules - require dimensions
        const hasDimensions = config.width && config.height && config.depth;
        return !hasDimensions;

      case 4: // Materials - require modules selected
        return totalModules === 0;

      case 5: // Hardware - require materials selected
        return !config.material || !config.colour;

      case 6: // Summary - require all previous steps complete
        const allComplete =
          config.width &&
          config.height &&
          config.depth &&
          totalModules > 0 &&
          config.material &&
          config.colour &&
          config.brand;
        return !allComplete;

      default:
        return false;
    }
  };

  // Get lock reason for UI messaging
  const getLockReason = (stepId) => {
    switch (stepId) {
      case 3:
        return 'Complete dimensions first';
      case 4:
        return 'Select modules first';
      case 5:
        return 'Select materials first';
      case 6:
        return 'Complete all steps first';
      default:
        return null;
    }
  };

  // Check if user can navigate to a step
  const canNavigateTo = (stepId) => !isStepLocked(stepId);

  return {
    isStepLocked,
    getLockReason,
    canNavigateTo,
  };
};
