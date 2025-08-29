/**
 * Safe Monitoring Wrapper
 * This file provides a safe interface to the monitoring systems
 * handling both server and client environments safely
 */

// Default stub implementations
const defaultMonitoring = {
  captureException: (error, context) => {
    logger.error('[Monitoring Stub]', error, context);
  },
  captureMessage: (message, level = 'info') => {
    logger.info(`[Monitoring Stub ${level}]`, message);
  },
  setUser: () => {},
  trackPerformance: () => {},
  initialize: () => {}
};

// Lazy loaded monitoring
let monitoringModule = null;

export async function getMonitoring() {
  // If already loaded, return it
  if (monitoringModule) return monitoringModule;
  
  try {
    // Only load in production
    if (process.env.NODE_ENV === 'production') {
      // Dynamic import to avoid build-time issues
      const module = await import('./monitoring-production');
      monitoringModule = module.default || module;
      return monitoringModule;
    }
  } catch (err) {
    logger.error('Failed to load monitoring module:', err);
  }
  
  // Return stub implementation if not production or loading failed
  return defaultMonitoring;
}

// Safe monitoring functions that work everywhere
export const safeMonitoring = {
  captureException: async (error, context) => {
    const monitoring = await getMonitoring();
    return monitoring.trackError?.(error, context) || 
           monitoring.captureException?.(error, context);
  },
  
  captureMessage: async (message, level = 'info', context) => {
    const monitoring = await getMonitoring();
    return monitoring.captureMessage?.(message, level, context);
  },
  
  setUser: async (user) => {
    const monitoring = await getMonitoring();
    return monitoring.setUser?.(user);
  },
  
  trackPerformance: async (name, value, unit = 'ms') => {
    const monitoring = await getMonitoring();
    return monitoring.trackPerformance?.(name, value, unit);
  },
  
  initialize: async () => {
    const monitoring = await getMonitoring();
    return monitoring.initialize?.();
  }
};

export default safeMonitoring;
