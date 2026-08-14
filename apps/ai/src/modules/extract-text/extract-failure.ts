/**
 * Thrown where we never managed to read the source: the scraper errored, the
 * platform served a login wall, the link is dead.
 *
 * A class rather than a message the catch block matches on — the point of the
 * shared `ExtractFailureCode` contract is that prose stays free to change, and
 * that has to hold inside the service too.
 *
 * The codes and the wire schema themselves live in `@mixer/contracts`, because
 * the API relays them and the mobile app renders from them.
 */
export class SourceUnreachableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SourceUnreachableError';
  }
}
