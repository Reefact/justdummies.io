/**
 * Colouring for the three kinds of code this site publishes, done at build time.
 *
 * WHY NOT A HIGHLIGHTER OFF THE SHELF. The two obvious ones — Shiki, Prism — colour by
 * writing `style="color:#…"` on every span, and this site is served under
 * `style-src 'self'` with no `unsafe-inline`. Every one of those attributes would be
 * dropped by the browser and the code would render in one colour, which is the failure mode
 * that looks exactly like nothing having been done. Shipping a grammar engine to colour
 * thirteen fixed snippets is also a great deal of machinery for a corpus that is compiled,
 * validated and known in advance.
 *
 * So this is a tokeniser for what the page actually contains, emitting classes that
 * `base.css` colours from the design tokens. No runtime, no dependency, no inline style.
 *
 * WHAT KEEPS IT HONEST. A highlighter that drops or reorders a character is a highlighter
 * that publishes code nobody wrote, and the corpus is exactly the code a reader will paste.
 * So every call checks itself: strip the tags back out of what it produced, undo the
 * escaping, and the result has to be the input, character for character. It throws at build
 * time when it is not — see `assertFaithful`.
 *
 * The token set is small on purpose. Six classes for C# is enough to give a reader the
 * shape of a line at a glance, and every class added is another rule that can be wrong
 * about a corpus nobody re-reads.
 */

/** What a fragment of code is, which decides how it is read and how it is coloured. */
export type Language =
    /** The library's own language: every published snippet. */
    | 'csharp'
    /** A line the reader is meant to type: an install command, a `dum` invocation. */
    | 'shell'
    /** What a command or a test run printed. Marked, never re-coloured — see below. */
    | 'output';

/**
 * The words C# reserves that this corpus uses. Deliberately not the full list: a keyword
 * the page never shows is a rule that can only ever fire by accident.
 */
const KEYWORDS: ReadonlySet<string> = new Set([
    'abstract',
    'bool',
    'byte',
    'catch',
    'class',
    'decimal',
    'double',
    'else',
    'false',
    'finally',
    'float',
    'get',
    'if',
    'int',
    'interface',
    'internal',
    'long',
    'namespace',
    'new',
    'null',
    'partial',
    'private',
    'public',
    'readonly',
    'record',
    'return',
    'sbyte',
    'sealed',
    'set',
    'short',
    'static',
    'string',
    'struct',
    'this',
    'throw',
    'true',
    'try',
    'using',
    'void',
    'where',
]);

/**
 * The rules, in the order they are tried. Order is the whole grammar here: a comment holds
 * quotes and a string holds slashes, so whichever is tried first wins the characters they
 * share, and both have to be tried before anything that could match inside them.
 *
 * Every pattern is sticky, so it matches at the cursor or not at all — a floating regex
 * would happily match a keyword three lines further down and swallow everything between.
 */
const CSHARP: ReadonlyArray<{ pattern: RegExp; token: string }> = [
    { pattern: /\/\/[^\n]*/y, token: 'comment' },
    { pattern: /@"(?:[^"]|"")*"/y, token: 'string' },
    { pattern: /"(?:\\.|[^"\\])*"/y, token: 'string' },
    { pattern: /'(?:\\.|[^'\\])*'/y, token: 'string' },
    { pattern: /\d[\d_]*(?:\.\d+)?[mdfuMDFUlL]*/y, token: 'number' },
    { pattern: /[A-Za-z_][A-Za-z0-9_]*/y, token: 'identifier' },
];

const SHELL: ReadonlyArray<{ pattern: RegExp; token: string }> = [
    { pattern: /--?[A-Za-z][A-Za-z0-9-]*/y, token: 'flag' },
    { pattern: /"(?:\\.|[^"\\])*"/y, token: 'string' },
    { pattern: /[^\s]+/y, token: 'word' },
];

/**
 * Recorded output is **marked, not coloured**. It is a transcript of something that ran, and
 * a transcript painted six colours starts to look like a thing the site composed. Two
 * markers only, and both are the run's own verdict: whether it passed and whether it failed.
 */
const OUTPUT: ReadonlyArray<{ pattern: RegExp; token: string }> = [
    { pattern: /\[FAIL\]/y, token: 'fail' },
    { pattern: /✓/y, token: 'ok' },
];

function escape(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wrap(token: string | undefined, text: string): string {
    const escaped: string = escape(text);

    return token === undefined ? escaped : `<span class="tok-${token}">${escaped}</span>`;
}

/** What the tokeniser remembers about the characters it has already passed. */
interface Position {
    /** The last non-space character emitted. A `.` before a name makes it a member. */
    previousCharacter: string;
    /** The last identifier or keyword emitted, which is how `new Order(` stays a type. */
    previousWord: string;
    /** Whether an opening parenthesis follows, which makes a name a call rather than a type. */
    followedByParenthesis: boolean;
    /**
     * Whether this sits inside an attribute list. `[Fact, Reproducible(Seed = 1)]` puts a
     * type in front of a parenthesis, which every other line on the page means a call by.
     */
    inAttribute: boolean;
}

/**
 * Which of the three an identifier is.
 *
 * C# spells types and methods the same way, so neither casing nor the word itself can
 * separate them — what separates them is where they sit. A name after a dot is something
 * called on something else; a name in front of a parenthesis is being called or being
 * declared; anything else that starts with a capital is a type. That is the distinction a
 * reader is already making as they read the line, and it is what the colours should follow.
 *
 * Two positions defeat the parenthesis rule and both are types: `new Order(` and the inside
 * of an attribute, `[Reproducible(Seed = …)]`.
 */
function classifyIdentifier(word: string, at: Position): string | undefined {
    if (KEYWORDS.has(word)) {
        return 'keyword';
    }

    if (at.previousCharacter === '.') {
        return 'member';
    }

    if (at.inAttribute) {
        return /^[A-Z]/.test(word) ? 'type' : undefined;
    }

    if (at.followedByParenthesis && at.previousWord !== 'new') {
        return 'member';
    }

    return /^[A-Z]/.test(word) ? 'type' : undefined;
}

function highlightCsharp(code: string): string {
    let at: number = 0;
    let out: string = '';
    let previousCharacter: string = '';
    let previousWord: string = '';
    // An attribute list is a `[` opening a line, closed by the next `]`. Every attribute on
    // this page is written that way, and nothing else on it opens a line with a bracket.
    let inAttribute: boolean = false;
    let atLineStart: boolean = true;

    while (at < code.length) {
        let matched: boolean = false;

        for (const rule of CSHARP) {
            rule.pattern.lastIndex = at;

            const found: RegExpExecArray | null = rule.pattern.exec(code);

            if (found === null) {
                continue;
            }

            const text: string = found[0];
            let token: string | undefined = rule.token;

            if (rule.token === 'identifier') {
                token = classifyIdentifier(text, {
                    previousCharacter,
                    previousWord,
                    followedByParenthesis: code[at + text.length] === '(',
                    inAttribute,
                });
                previousWord = text;
            }

            out += wrap(token, text);
            at += text.length;
            previousCharacter = '';
            atLineStart = false;
            matched = true;
            break;
        }

        if (!matched) {
            // Punctuation, whitespace, an operator: uncoloured, one character at a time.
            // Cheap, and it is what guarantees the loop always advances.
            const character: string = code[at]!;

            out += escape(character);
            at += 1;

            if (character === '\n') {
                atLineStart = true;
            } else if (character !== ' ' && character !== '\t') {
                if (character === '[' && atLineStart) {
                    inAttribute = true;
                } else if (character === ']') {
                    inAttribute = false;
                }

                previousCharacter = character;
                atLineStart = false;
            }
        }
    }

    return out;
}

function highlightShell(command: string): string {
    let at: number = 0;
    let out: string = '';
    // The first word is the program. Everything after it is what the program was asked for.
    let first: boolean = true;

    while (at < command.length) {
        let matched: boolean = false;

        for (const rule of SHELL) {
            rule.pattern.lastIndex = at;

            const found: RegExpExecArray | null = rule.pattern.exec(command);

            if (found === null) {
                continue;
            }

            const text: string = found[0];
            const token: string | undefined = rule.token === 'word' ? (first ? 'command' : undefined) : rule.token;

            out += wrap(token, text);
            at += text.length;
            first = false;
            matched = true;
            break;
        }

        if (!matched) {
            out += escape(command[at]!);
            at += 1;
        }
    }

    return out;
}

function highlightOutput(text: string): string {
    let at: number = 0;
    let out: string = '';

    while (at < text.length) {
        let matched: boolean = false;

        for (const rule of OUTPUT) {
            rule.pattern.lastIndex = at;

            const found: RegExpExecArray | null = rule.pattern.exec(text);

            if (found === null) {
                continue;
            }

            out += wrap(rule.token, found[0]);
            at += found[0].length;
            matched = true;
            break;
        }

        if (!matched) {
            out += escape(text[at]!);
            at += 1;
        }
    }

    return out;
}

/**
 * The guarantee, checked on every call rather than trusted.
 *
 * A tokeniser fails by losing a character, not by throwing: a greedy pattern eats a closing
 * brace, an escape is written twice, a rule consumes nothing and the loop skips a byte. None
 * of that is visible in a screenshot, and all of it publishes code that does not compile to
 * the reader who pastes it.
 *
 * So the output is read back: tags removed, entities undone, and the result compared to what
 * came in. This runs at build time, so a highlighter that breaks stops the build rather than
 * shipping.
 */
function assertFaithful(source: string, html: string, language: Language): void {
    const recovered: string = html
        .replace(/<span class="tok-[a-z]+">/g, '')
        .replace(/<\/span>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');

    if (recovered !== source) {
        throw new Error(
            `highlight(${language}) changed the code it was given, which means the page would publish something nobody wrote.\n` +
                `  in:  ${JSON.stringify(source)}\n` +
                `  out: ${JSON.stringify(recovered)}`,
        );
    }
}

/**
 * Colours a fragment, and returns HTML to be inserted with `set:html`.
 *
 * Safe to insert: every character of the input is escaped before it is wrapped, and the only
 * markup produced is `<span class="tok-…">`. The corpus is compiled source rather than
 * anything a visitor supplies, and this holds regardless.
 */
export function highlight(code: string, language: Language): string {
    const html: string =
        language === 'csharp' ? highlightCsharp(code) : language === 'shell' ? highlightShell(code) : highlightOutput(code);

    assertFaithful(code, html, language);

    return html;
}
