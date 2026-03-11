export const FEATURE_FLAGS = {
  USE_MOCK_FALLBACK: String(import.meta.env.VITE_USE_MOCK_FALLBACK || 'true') === 'true',
};

