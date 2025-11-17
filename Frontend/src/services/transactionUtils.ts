/**
 * Utility functions for transaction data handling
 */

/**
 * Builds a transaction feature array from individual values
 * @param time - Time in seconds (or use Date.now() / 1000)
 * @param vFeatures - Array of 28 V features (V1-V28)
 * @param amount - Transaction amount
 * @returns Array of 30 features in correct order: [Time, V1...V28, Amount]
 */
export function buildTransactionFeatures(
  time: number,
  vFeatures: number[],
  amount: number
): number[] {
  if (vFeatures.length !== 28) {
    throw new Error(`Expected 28 V features, got ${vFeatures.length}`);
  }
  return [time, ...vFeatures, amount];
}

/**
 * Creates a sample transaction with default/zero values for testing
 * @param amount - Transaction amount (default: 100)
 * @returns Array of 30 features
 */
export function createSampleTransaction(amount: number = 100): number[] {
  const time = Date.now() / 1000; // Current timestamp in seconds
  const vFeatures = Array(28).fill(0); // Default V features (you'd get real values)
  return buildTransactionFeatures(time, vFeatures, amount);
}

/**
 * Validates transaction features array
 * @param features - Array of features to validate
 * @returns true if valid, throws error if invalid
 */
export function validateTransactionFeatures(features: number[]): boolean {
  if (!Array.isArray(features)) {
    throw new Error('Features must be an array');
  }
  if (features.length !== 30) {
    throw new Error(`Expected 30 features, got ${features.length}`);
  }
  if (!features.every(f => typeof f === 'number' && !isNaN(f))) {
    throw new Error('All features must be valid numbers');
  }
  return true;
}

