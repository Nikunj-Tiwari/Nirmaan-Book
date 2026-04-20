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
      case 1: // Dimensions - always accessible
        return false;

      case 2: // Modules - require dimensions
        const hasDimensions = config.width && config.height && config.depth;
        return !hasDimensions;

      case 3: // Materials - require modules selected
        return totalModules === 0;

      case 4: // Hardware - require materials selected (any material/colour set)
        return !config.material || !config.colour;

      case 5: // Summary - require all steps complete
        const allComplete =
          config.width &&
          config.height &&
          config.depth &&
          totalModules > 0 &&
          config.material &&
          config.colour;
        return !allComplete;

      default:
        return false;
    }
  };

  // Get lock reason for UI messaging
  const getLockReason = (stepId) => {
    switch (stepId) {
      case 2:
        return 'Complete dimensions first';
      case 3:
        return 'Select modules first';
      case 4:
        return 'Select materials first';
      case 5:
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
