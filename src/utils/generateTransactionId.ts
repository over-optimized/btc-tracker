/**
 * Utility for generating stable, deterministic transaction IDs
 * that remain consistent across CSV re-imports
 */

export interface TransactionData {
  exchange: string;
  date: Date;
  usdAmount: number;
  btcAmount: number;
  type: string;
  reference?: string; // Strike reference ID, Coinbase transaction hash, etc.
  price?: number;
}

/**
 * Simple hash function for creating deterministic IDs from strings
 * Based on Java's String.hashCode() algorithm
 */
function simpleHash(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash);
}

/**
 * Normalize amounts to avoid floating point precision issues
 */
function normalizeAmount(amount: number): string {
  return amount.toFixed(8);
}

/**
 * Generate a stable transaction ID based on transaction content
 * Priority order:
 * 1. Use reference field if available (Strike, some Coinbase exports)
 * 2. Create content-based hash from key transaction details
 */
export function generateStableTransactionId(data: TransactionData): string {
  const exchange = data.exchange.toLowerCase();

  // Priority 1: Use reference if available (Strike Reference, Coinbase hash, etc.)
  if (data.reference && data.reference.trim()) {
    const cleanReference = data.reference.trim().replace(/[^a-zA-Z0-9-_]/g, '');
    return `${exchange}-ref-${cleanReference}`;
  }

  // Priority 2: Create deterministic hash from transaction content
  const dateStr = data.date.toISOString().split('T')[0]; // YYYY-MM-DD format
  const timeStr = data.date.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS format

  // Create composite string with key identifying information
  const composite = [
    exchange,
    dateStr,
    timeStr,
    data.type.toLowerCase(),
    normalizeAmount(data.usdAmount),
    normalizeAmount(data.btcAmount),
    data.price ? normalizeAmount(data.price) : '',
  ].join('|');

  const hash = simpleHash(composite);
  const hashStr = hash.toString(36); // Base-36 for shorter IDs

  return `${exchange}-${hashStr}`;
}

/**
 * Validate that a transaction ID is properly formatted
 */
export function isValidTransactionId(id: string): boolean {
  // Format: exchange-type-identifier or exchange-hash
  const pattern = /^[a-z]+-(?:ref-[a-zA-Z0-9-_]+|[a-z0-9]+)$/;
  return pattern.test(id);
}

/**
 * Extract exchange name from transaction ID
 */
export function getExchangeFromId(id: string): string {
  const parts = id.split('-');
  return parts[0] || 'unknown';
}

/**
 * Check if transaction ID uses reference-based generation
 */
export function isReferenceBasedId(id: string): boolean {
  return id.includes('-ref-');
}

/**
 * Generate multiple IDs and check for collisions (useful for testing)
 */
export function detectIdCollisions(transactions: TransactionData[]): string[] {
  const idMap = new Map<string, number>();
  const collisions: string[] = [];

  transactions.forEach((tx, index) => {
    const id = generateStableTransactionId(tx);
    if (idMap.has(id)) {
      collisions.push(
        `Collision at index ${index}: ID "${id}" already used by index ${idMap.get(id)}`,
      );
    } else {
      idMap.set(id, index);
    }
  });

  return collisions;
}

// Export for testing purposes
export { normalizeAmount, simpleHash };

/**
 * Create the generateTransactionId.ts file in src/utils/ directory
 * This utility should be imported by exchangeParsers.ts
 */
