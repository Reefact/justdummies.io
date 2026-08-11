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
import toolDocument from './generated/tool-output.json';

const code: Record<string, string> = snippetsDocument;
const printed: Record<string, string> = toolDocument;
const drawn: Record<string, string[]> = samplesDocument.values;
const refused: Record<string, string> = samplesDocument.refusals;

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

/**
 * What a command printed when the build ran it.
 *
 * The site shows a terminal in the second act, and the recap in it is the tool reporting
 * which parameters it inferred and which guard it could not read. Recorded by running the
 * command, for the same reason the expressions are compiled and the values drawn: the
 * alternative is a transcription that is accurate on the day it is made.
 */
export function toolOutput(id: string): string {
    const found: string | undefined = printed[id];

    if (found === undefined) {
        throw new Error(`No recorded output for "${id}". scripts/generate-tool-output.sh has to run the command.`);
    }

    return found;
}

/**
 * What the domain said when it rejected an expression.
 *
 * Recorded by running it and catching what came out, exactly as the drawn values are
 * recorded by running theirs. A scene built on a refusal is built on the refusal
 * having happened, so the emitter fails the build if the expression is ever accepted
 * rather than letting the page keep its sentence and lose its evidence.
 */
export function refusal(id: string): string {
    const found: string | undefined = refused[id];

    if (found === undefined) {
        throw new Error(`No recorded refusal for "${id}". tools/sample-values has to run the expression and catch it.`);
    }

    return found;
}
