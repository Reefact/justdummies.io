// The inline scripts of a built page, and the one place that decides what counts as one.
//
// WHY THIS IS A MODULE AND NOT A REGEX IN TWO FILES. generate-headers.mjs writes the hashes
// into the policy and verify-output.sh checks that every inline script has one. They have to
// agree exactly: a script the generator does not see gets no hash and is blocked at run time,
// and a script the checker does not see is one nothing verifies. They were two copies of one
// regex, and both copies were wrong in the same way twice over — first hashing a `<script>`
// that only ever appeared inside an HTML comment, then, once comments were stripped, mangling
// a script whose body contains `<!--`. Two copies cannot be held to a shared test; this can,
// and is (`--self-test` below).
//
// WHAT THE SCAN MODELS. The HTML tokenizer, in the only two states that matter here:
//
//   * in markup, `<!--` opens a comment which closes at the FIRST `-->`, and an unterminated
//     one comments out the rest of the document;
//   * inside a `<script>` element the content is script data, where `<!--` opens nothing. A
//     script whose body contains `<!--` executes in full, so its hash is over the full body.
//
// The precedence between those two is the whole point, and it is why this is a walk rather
// than a strip followed by a match: which construct opens first decides how the text after it
// is read, and no amount of pre-processing recovers that ordering once it is lost.
//
// KNOWN LIMIT, shared with every version of this that came before: the end of an open tag is
// found by the next `>`, so `<script data-x="a>b">` would be read short. No page here writes
// one, and Astro does not emit one.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const COMMENT_OPEN = '<!--';
const COMMENT_CLOSE = '-->';

/**
 * Every inline script body in the page, in document order, as the bytes a browser would
 * hash — no trimming, no re-indenting. A script with `src` is not inline, and an empty one
 * carries nothing to protect.
 */
export function inlineScriptBodies(html) {
    const lower = html.toLowerCase();
    const bodies = [];
    let at = 0;

    for (;;) {
        const comment = lower.indexOf(COMMENT_OPEN, at);
        const script = lower.indexOf('<script', at);

        if (comment === -1 && script === -1) {
            return bodies;
        }

        // Whichever opens first decides how what follows is read.
        if (script === -1 || (comment !== -1 && comment < script)) {
            const closed = lower.indexOf(COMMENT_CLOSE, comment + COMMENT_OPEN.length);

            if (closed === -1) {
                return bodies; // Unterminated: the rest of the document is comment.
            }
            at = closed + COMMENT_CLOSE.length;

            continue;
        }

        const openEnd = lower.indexOf('>', script);

        if (openEnd === -1) {
            return bodies;
        }

        const openTag = html.slice(script, openEnd + 1);
        const closeStart = lower.indexOf('</script', openEnd + 1);

        if (closeStart === -1) {
            return bodies;
        }

        const body = html.slice(openEnd + 1, closeStart);

        if (!/\ssrc\s*=/i.test(openTag) && body.length > 0) {
            bodies.push(body);
        }

        const closeEnd = lower.indexOf('>', closeStart);
        at = closeEnd === -1 ? html.length : closeEnd + 1;
    }
}

/** The base64 SHA-256 a `script-src` hash names, for one body. */
export function hashOf(body) {
    return createHash('sha256').update(body, 'utf8').digest('base64');
}

/** Every inline script hash in the page, deduplicated is the caller's business. */
export function inlineScriptHashes(html) {
    return inlineScriptBodies(html).map(hashOf);
}

/**
 * The rules above, asserted. Run by verify-output.sh, so a rewrite of the walk that loses one
 * of them fails a build rather than a policy.
 */
const CASES = [
    ['a plain inline script is found', '<script>ok</script>', ['ok']],
    ['a src script is not inline', '<script src="/a.js"></script>', []],
    ['an empty script carries nothing', '<script></script>', []],
    ['a commented-out script is not a script', '<!-- <script>no</script> -->', []],
    ['prose naming a tag inside a comment is not a script', '<!-- the plain <script> above --><p>body</p>', []],
    ['a comment closes at the first -->', '<!--<!---->:<script>ok</script>', ['ok']],
    ['an unterminated comment takes the rest', '<script>first</script><!-- <script>no</script>', ['first']],
    ['a bare --> opens nothing', 'a-->b<script>ok</script>', ['ok']],
    ['<!-- inside script data is script data', '<script>const s = "<!-- x -->";</script>', ['const s = "<!-- x -->";']],
    ['two scripts, both found', '<script>one</script><p/><script>two</script>', ['one', 'two']],
    ['a comment between two scripts hides neither', '<script>one</script><!--x--><script>two</script>', ['one', 'two']],
    ['case is not significant in the tag', '<SCRIPT>ok</SCRIPT>', ['ok']],
    ['a type attribute does not make it external', '<script type="importmap">{}</script>', ['{}']],
];

function selfTest() {
    let failed = 0;

    for (const [name, input, want] of CASES) {
        const got = inlineScriptBodies(input);
        const ok = got.length === want.length && got.every((b, i) => b === want[i]);

        if (!ok) {
            failed += 1;
            console.error(`  ✗ ${name}\n      want ${JSON.stringify(want)}\n      got  ${JSON.stringify(got)}`);
        }
    }

    if (failed > 0) {
        console.error(`inline-scripts: ${failed} of ${CASES.length} rules broken.`);
        process.exit(1);
    }
    console.log(`  ✓ the inline-script scan obeys the tokenizer (${CASES.length} rules)`);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
    if (process.argv[2] === '--self-test') {
        selfTest();
    } else {
        // Every hash in the files named, one per line — how verify-output.sh reads a page.
        for (const file of process.argv.slice(2)) {
            for (const hash of inlineScriptHashes(readFileSync(file, 'utf8'))) {
                console.log(hash);
            }
        }
    }
}
