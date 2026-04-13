/**
 * Turn ID lifecycle management.
 * Assigns monotonically increasing turn IDs per session.
 * Detects stale responses (turnId < current active turn).
 */

export class TurnManager {
  private nextTurnId = 0;
  private activeTurnId = -1;

  /**
   * Allocate the next turn ID and mark it as active.
   */
  nextTurn(): number {
    const id = this.nextTurnId++;
    this.activeTurnId = id;
    return id;
  }

  /**
   * Check if a turn ID is stale (not the currently active turn).
   */
  isStale(turnId: number): boolean {
    return turnId < this.activeTurnId;
  }

  /**
   * Get the currently active turn ID.
   */
  getActiveTurnId(): number {
    return this.activeTurnId;
  }

  /**
   * Reset for a new session.
   */
  reset(): void {
    this.nextTurnId = 0;
    this.activeTurnId = -1;
  }
}
