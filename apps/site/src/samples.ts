/**
 * Access to what the build produced: the validated expressions, and what running
 * them returned.
 *
 * Neither file in `generated/` is written by hand. The code comes from the snippet
 * project, which compiles it with the library's analyzers enabled; the values come
 * from executing those same expressions under a pinned seed. A page asks for an
 * identifier and gets both, so displaying an expression that was never compiled, or
 * a value nobody produced, is not something a page is able to do.
 *
 * An unknown identifier throws rather than rendering nothing. It happens at build
 * time, which turns a typo into a failed build instead of a blank space on a page.
 */
import samplesDocument from './generated/sample-values.json';
import snippetsDocument from './generated/snippets.json';

const code: Record<string, string> = snippetsDocument;
const drawn: Record<string, string[]> = samplesDocument.values;

/** The seed every displayed value was drawn under. */
export const sampleSeed: number = samplesDocument.seed;

export function snippet(id: string): string {
    const found: string | undefined = code[id];

    if (found === undefined) {
        throw new Error(
            `No snippet "${id}". It has to exist between // <snippet:${id}> markers in tools/snippet-validation/Snippets.`,
        );
    }

    return found;
}

export function sampleValues(id: string): string[] {
    const found: string[] | undefined = drawn[id];

    if (found === undefined || found.length === 0) {
        throw new Error(`No generated value for "${id}". tools/sample-values has to run the expression and emit it.`);
    }

    return found;
}

export function sampleValue(id: string): string {
    return sampleValues(id)[0]!;
}
