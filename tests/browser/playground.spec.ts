import { expect, test } from './support/harness';
import type { Locator } from '@playwright/test';

import { watch, type PageComplaints } from './support/watch';

/**
 * Whether an element takes real space on the screen.
 *
 * `toBeHidden()` is the wrong tool for the one element that needs this: a closed diagnostic
 * message is `.visually-hidden`, which is a one-pixel clipped box rather than a `display: none`
 * one — deliberately, so `aria-describedby` on the field that caused it still resolves and a
 * screen reader never has to press anything to hear it. Playwright counts a one-pixel box as
 * visible, and it is right to: something is in the box tree. What is being asserted here is the
 * other thing, the one a sighted visitor would report — that there is nothing to look at.
 */
async function onScreen(locator: Locator): Promise<boolean> {
    const box = await locator.boundingBox();

    return box !== null && box.width > 2 && box.height > 2;
}

/**
 * The playground's builder works.
 *
 * This is the check with the least competition. `verify-output.sh` asserts that the
 * playground's `<base href>` matches where the playground was copied, which is a claim about
 * two strings agreeing; the failure it guards against is every asset answering 404 and the
 * page rendering nothing at all, with no error printed anywhere. Those are not the same
 * claim, and the deployment guide lists the blank playground in its troubleshooting table
 * because the difference has been met.
 *
 * So this one loads it and uses it. The library is compiled to WebAssembly and executes in
 * the browser with no backend behind it; if the chain is whole, a value comes back that
 * satisfies the constraints the page declares. These checks build the same chain
 * (`Any.String().StartingWith("ORD-")`) by driving the builder's own controls — the native
 * `<select>`s and inputs a visitor uses — never by injecting a pre-built expression.
 */
test.describe('the playground', () => {

    test('draws a value for a chain built entirely by selecting', async ({ page }) => {
        const complaints: PageComplaints = await watch(page);

        await page.goto('/playground/');

        const firstSelect = page.locator('.chain-link').nth(0).locator('select');
        await firstSelect.selectOption({ label: 'String()' });

        const secondSelect = page.locator('.chain-link').nth(1).locator('select');
        await secondSelect.selectOption({ label: 'StartingWith(prefix)' });
        await page.locator('.chain-link').nth(1).locator('input').fill('ORD-');

        await page.getByRole('button', { name: 'Generate' }).click();

        // `[\s\S]` rather than `.`: an unconstrained String() draws from the whole of ASCII
        // since preview.2 (control characters included), so the free part of the value can
        // legitimately contain a newline. `.` does not match one, and a value that happened
        // to draw one would fail this assertion for a reason that has nothing to do with
        // whether the chain actually ran.
        const value = page.locator('.playground-widget .result-bar .value');
        await expect(value).toHaveText(/^"ORD-[\s\S]*"$/);

        // Nothing may have 404'd on the way. This is the blank-page defect stated as an
        // assertion: the base href and the copy destination disagree, every asset misses, and
        // the page renders — empty, and quietly.
        expect(complaints.failed, 'the playground asked for something that was not there').toEqual([]);
        expect(complaints.errors, 'the playground threw while starting').toEqual([]);
    });

    test('draws again when asked, without changing the chain', async ({ page }) => {
        await page.goto('/playground/');

        // NonEmpty() rather than the bare unconstrained String(): an unconstrained draw can
        // legitimately come back as the empty string (specification-adjacent behaviour, not a
        // defect — a 0-length value renders a genuinely empty <output>, which several browsers
        // register as zero-size and therefore "not visible"). The constraint keeps this test's
        // visibility assertion meaningful on every draw rather than flaky roughly one press in
        // seventeen.
        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'String()' });
        await page.locator('.chain-link').nth(1).locator('select').selectOption({ label: 'NonEmpty()' });
        await page.getByRole('button', { name: 'Generate' }).click();

        const value = page.locator('.playground-widget .result-bar .value');
        await expect(value).toBeVisible();

        const drawn: string[] = [];
        const button = page.getByRole('button', { name: 'Generate again' });

        for (let press = 0; press < 10; press += 1) {
            await button.click();
            await expect(value).toBeVisible();
            drawn.push((await value.textContent()) ?? '');
        }

        expect(new Set(drawn).size, `ten presses drew one value: ${drawn[0]}`).toBeGreaterThan(1);

        // The chain itself never grew an extra line just from pressing Generate.
        await expect(page.locator('.chain-link')).toHaveCount(3);
    });

    test('offers only the methods valid for the type currently in hand', async ({ page }) => {
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'Int32()' });

        const secondOptions = await page
            .locator('.chain-link')
            .nth(1)
            .locator('select option')
            .allTextContents();

        // Positive() belongs to AnyInt32; NonEmpty() belongs to AnyString. Offering the wrong
        // one is the failure mode this catalogue's whole design (specification §10.4/§10.7)
        // exists to prevent.
        expect(secondOptions.some(o => o.startsWith('Positive'))).toBe(true);
        expect(secondOptions.some(o => o.startsWith('NonEmpty'))).toBe(false);
    });

    /**
     * What the library has and this form cannot ask for is named and refused, never omitted.
     *
     * This is the assertion behind that decision, and it is worth stating what breaks without
     * it: the catalogue's generator hides every member it cannot express, so the combo used to
     * read as the library's whole surface for the type in hand. A visitor looking for
     * `ListOf(...)` and not finding it learns the wrong thing — not "this page cannot do that"
     * but "JustDummies cannot do that", which is the one claim the playground must never make
     * on the library's behalf.
     *
     * Both halves are checked together on purpose. Disabled-and-listed is only correct while
     * the ordinary entries stay selectable; a regression that disabled the lot would satisfy
     * half of this test and leave the page unusable.
     */
    test('names the library methods it cannot offer, disabled, and leaves the rest selectable', async ({ page }) => {
        await page.goto('/playground/');

        const firstSelect = page.locator('.chain-link').nth(0).locator('select');

        // Any.ListOf<T>(IAny<T>) is real, documented and shipped — an open generic over a nested
        // generator, which is exactly what a flat form of text inputs has no way to ask for.
        const unavailable = firstSelect.locator('option').filter({ hasText: 'ListOf()' });
        await expect(unavailable).toHaveCount(1);
        await expect(unavailable).toBeDisabled();

        // The label carries the reason, and the reason names the playground rather than the
        // library. Greying an entry without saying why leaves a visitor to supply their own
        // explanation, and the available one is "this library is missing things".
        await expect(unavailable).toHaveText('ListOf() — not available in the playground');

        const supported = firstSelect.locator('option').filter({ hasText: /^String\(\)$/ });
        await expect(supported).toBeEnabled();
        await firstSelect.selectOption({ label: 'String()' });
        await expect(page.locator('.chain-link').nth(0).locator('.call')).toContainText('String');

        // And the same holds one step in, where the options are the ones the type in hand
        // carries: .OrNull() extends every generator in the library and none of them here.
        const secondSelect = page.locator('.chain-link').nth(1).locator('select');
        await expect(secondSelect.locator('option').filter({ hasText: 'OrNull()' })).toBeDisabled();
        await expect(secondSelect.locator('option').filter({ hasText: 'NonEmpty()' })).toBeEnabled();
    });

    /**
     * `OneOf` and `Except` take `params T[]`, and a chain step draws one field per parameter — so
     * for as long as a field meant one value, the catalogue had nowhere to put them and excluded
     * both, on every scalar builder in the library. They are asked for as one comma-separated
     * field now (ArgumentParsing's list form), and this walks the whole path that makes that work:
     * the step is offered at all, the field is cut into values, the library is handed a real
     * `string[]`, and the line the bar hands over spreads those values back into the call the way
     * a reader would have written it themselves.
     *
     * `OneOf` stands in for the pair here — `Except` reaches the identical parser, emitter and
     * field through the identical catalogue entry shape, differing only in what the library does
     * with the array once it has it.
     */
    test('takes a comma-separated list for a params argument, and spreads it back into the copied line', async ({ page }) => {
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'String()' });

        const step = page.locator('.chain-link').nth(1);
        await step.locator('select').selectOption({ label: 'OneOf(values)' });

        // Empty, as every freshly chosen step is — and a list says what it wants in its own
        // words rather than borrowing its element type's, which for a string list would be "a
        // text" and would be satisfied by exactly the one value a list is not.
        const flag = step.locator('.flag');
        await expect(flag).toHaveAttribute('aria-expanded', 'false');
        await flag.click();
        await expect(step.locator('.error')).toHaveText(/one or more values, separated by commas/);

        await step.locator('input').fill('red, green, blue');

        // Three values out of one field, each its own C# literal — and the space a visitor puts
        // after a comma is them formatting their list, not a character that joins the value.
        await expect(page.locator('.playground-widget .code-bar .code-text')).toHaveText(
            'string anyValue = Any.String().OneOf("red", "green", "blue").Generate();',
        );

        await page.getByRole('button', { name: 'Generate' }).click();
        await expect(page.locator('.playground-widget .result-bar .value')).toHaveText(/^"(red|green|blue)"$/);
    });

    /**
     * A sandbox cap must report itself, never apply itself silently — and a list field is where
     * that nearly stopped being true.
     *
     * The UI truncates raw input at a hard ceiling before the parser sees it, so a pathological
     * paste cannot be re-parsed and re-emitted on every keystroke. That ceiling was sized when a
     * field held one value of at most 200 characters: any 4,000-character residue was still far
     * over the limit, so the "too long" error always fired anyway. A list broke the reasoning —
     * fifty values of two hundred characters is a legal argument some ten thousand characters
     * long, so the ceiling cut legal input down to a SHORTER LIST THAT STILL PARSES: tail values
     * discarded, the last survivor severed mid-value, and not one message about any of it. It
     * also made the fifty-value cap unreachable, which is the exact defect the two-ceiling design
     * exists to prevent, arrived at from the other side.
     *
     * Both halves are asserted because fixing one alone is a way to be wrong: a ceiling raised
     * far enough to stop cutting would also be a ceiling that never reports, and a cap that fires
     * eagerly would refuse lists the parser accepts.
     */
    test('reports a list that is too long, and leaves a long but legal one untouched', async ({ page }) => {
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'String()' });

        const step = page.locator('.chain-link').nth(1);
        await step.locator('select').selectOption({ label: 'OneOf(values)' });
        const field = step.locator('input');

        // Sixty values of a hundred characters — over the fifty-value cap, and over six thousand
        // characters, which is what used to reach the parser as a compliant forty-value list.
        await field.fill(Array.from({ length: 60 }, (_, i) => `${i}`.padEnd(100, 'x')).join(', '));

        await step.locator('.flag').click();
        await expect(step.locator('.error')).toHaveText(/no more than 50 values/);

        // And a list that is long but entirely within both caps — thirty values of two hundred
        // characters, six thousand characters in all — arrives whole. The last value is the one
        // truncation took first, so its presence in the copied line is the assertion.
        const values = Array.from({ length: 30 }, (_, i) => `${i}`.padEnd(200, 'y'));
        await field.fill(values.join(', '));

        await expect(step.locator('.flag')).toHaveCount(0);
        await expect(page.locator('.playground-widget .code-bar .code-text')).toContainText(values[29]);
    });

    /**
     * §9.9's rule, restated for the card: a refusal is the demonstration defending itself, so
     * it is never only behind a control somebody has to press. The step that caused it carries
     * a flag — §13.4's "associated with the zone that provokes it" — and the library's own
     * wording is printed under the card at the same time, in the bar where a drawn value would
     * otherwise be, exactly as the landing page's hero prints the refusal it gets.
     */
    test('shows the library’s own refusal for a contradictory chain, unneutralised', async ({ page }) => {
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'String()' });
        await page.locator('.chain-link').nth(1).locator('select').selectOption({ label: 'StartingWith(prefix)' });
        await page.locator('.chain-link').nth(1).locator('input').fill('ORD-12345');
        await page.locator('.chain-link').nth(2).locator('select').selectOption({ label: 'WithMaxLength(length)' });
        await page.locator('.chain-link').nth(2).locator('input').fill('2');

        await expect(page.locator('.chain-link').nth(2).locator('.flag')).toBeVisible();

        const refusal = page.locator('.playground-widget .result-bar .refusal');

        await expect(refusal).toBeVisible();
        expect((await refusal.textContent())?.trim().length ?? 0).toBeGreaterThan(0);

        // And no value beside it: "→ produced" promises something drawn, and a refusal is not
        // one — the bar shows one or the other, never both.
        await expect(page.locator('.playground-widget .result-bar .value')).toHaveCount(0);
    });

    /**
     * The other kind of failure, which is this site's own text rather than the library's: an
     * argument that will not parse. That one IS folded behind the flag, and this is the check
     * that folding it did not put it out of reach — of a pointer, of a keyboard, or of a screen
     * reader, which gets it through `aria-describedby` whether or not the flag was ever pressed.
     */
    test('opens an unparsable argument’s explanation from the step’s flag, and closes it again', async ({ page }) => {
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'Int32()' });
        await page.locator('.chain-link').nth(1).locator('select').selectOption({ label: 'Between(minimum, maximum)' });

        // Nothing typed, deliberately: a step chosen a second ago has empty arguments, and an
        // empty argument is already one this playground cannot parse. It is the state every
        // freshly chosen step with parameters passes through, so it is the one worth checking —
        // and unlike a deliberately mistyped value it needs no field that accepts text, which
        // `Between`'s do not.
        const step = page.locator('.chain-link').nth(1);
        const flag = step.locator('.flag');
        const message = step.locator('.error');

        // Closed to begin with — the flag is the whole of what is on screen — but present in the
        // document, because the field that caused it points at it with aria-describedby and a
        // description that resolves to nothing is no description at all.
        await expect(flag).toHaveAttribute('aria-expanded', 'false');
        await expect(message).toHaveCount(1);
        expect(await onScreen(message), 'the message is on screen before its flag was pressed').toBe(false);

        const described = await step.locator('input').first().getAttribute('aria-describedby');
        expect(described, 'the offending field does not point at its own explanation').toBe(
            await message.getAttribute('id'),
        );

        await flag.click();
        await expect(flag).toHaveAttribute('aria-expanded', 'true');
        await expect(message).toHaveText(/this argument expects/);
        expect(await onScreen(message), 'pressing the flag put nothing on screen').toBe(true);

        // Escape, from wherever focus happens to be in the step — a disclosure a keyboard user
        // has to walk back to the opening control to dismiss is one they will leave open.
        await page.keyboard.press('Escape');
        await expect(flag).toHaveAttribute('aria-expanded', 'false');
        expect(await onScreen(message), 'Escape left the message on screen').toBe(false);

        // And the flag goes altogether once the step has something it can parse — with nothing
        // left to say, an open callout would sit under a line that is no longer wrong.
        await flag.click();
        expect(await onScreen(message)).toBe(true);

        await step.locator('input').first().fill('1');
        await step.locator('input').nth(1).fill('10');

        await expect(step.locator('.flag')).toHaveCount(0);
        await expect(step.locator('.error')).toHaveCount(0);
    });

    test('removing a step truncates the chain from there on', async ({ page }) => {
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'String()' });
        await page.locator('.chain-link').nth(1).locator('select').selectOption({ label: 'StartingWith(prefix)' });
        await page.locator('.chain-link').nth(1).locator('input').fill('ORD-');
        await page.locator('.chain-link').nth(2).locator('select').selectOption({ label: 'NonEmpty()' });

        await expect(page.locator('.chain-link')).toHaveCount(4);

        await page.locator('.chain-link').nth(1).locator('.delete').click();

        // Deleting StartingWith() also removed NonEmpty() after it and the trailing empty
        // selector collapses back to one: just the first line (String()) plus a fresh one.
        await expect(page.locator('.chain-link')).toHaveCount(2);
    });

    test('the doc for a chosen method is visible without hovering or focusing anything', async ({ page }) => {
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'String()' });

        const doc = page.locator('.chain-link').nth(0).locator('.doc');
        await expect(doc).toBeVisible();
        expect((await doc.textContent())?.trim().length ?? 0).toBeGreaterThan(0);

        // And it is drawn as the comment it reads like: the marker in the flow beside the text,
        // in the colour the site's own highlighter gives a `//`.
        await expect(doc.locator('.marker')).toHaveText('//');
        await expect(doc).toHaveClass(/tok-comment/);

        // Running on from the step it documents, the way a trailing comment does in C# — not on
        // a row of its own, which cost every chosen step a second line and pushed the chain that
        // much further from the shape the landing page shows.
        const call = page.locator('.chain-link').nth(0).locator('.prefix');
        const callBox = await call.boundingBox();
        const docBox = await doc.boundingBox();

        expect(callBox, 'the step is not rendered').not.toBeNull();
        expect(docBox, 'the comment is not rendered').not.toBeNull();
        expect(
            docBox!.y < callBox!.y + callBox!.height,
            'the comment starts below the step it documents rather than beside it',
        ).toBe(true);
    });

    /**
     * A chosen step is code, not a control. The `<select>` is how a step is chosen and it is
     * gone once one has been — what is left is the call, in the site's own token colours, and a
     * delete button to take it back out.
     *
     * The click on the card is not incidental: the select survives as long as it has focus, so
     * that a keyboard user arrowing through the options is not cut off at the first one (see
     * ChainLink.razor's ShowSelect). Moving focus off it is what settles the step.
     */
    test('replaces a chosen step’s combo with coloured code, leaving only the delete control', async ({ page }) => {
        await page.goto('/playground/');

        const step = page.locator('.chain-link').nth(0);

        await step.locator('select').selectOption({ label: 'String()' });
        await page.locator('.playground-widget .card').click({ position: { x: 5, y: 5 } });

        await expect(step.locator('select')).toHaveCount(0);
        await expect(step.locator('.call')).toBeVisible();
        await expect(step.locator('.call .tok-member')).toHaveText('String');
        await expect(step.locator('.delete')).toBeVisible();

        // The receiver opens the first line rather than sitting on one of its own, so the card
        // reads "Any.String()" the way the landing page's does.
        await expect(step.locator('.prefix')).toHaveText('Any.');
    });

    test('the help link opens the library’s repository in a new, unprivileged tab', async ({ page }) => {
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'String()' });

        const help = page.locator('.chain-link').nth(0).locator('a.help');
        await expect(help).toHaveAttribute('target', '_blank');
        const rel = await help.getAttribute('rel');
        expect(rel).toContain('noopener');
        await expect(help.locator('.visually-hidden')).toHaveText(/opens in a new tab/);
    });

    /**
     * The card's middle bar prints the chain as the one line that compiles — no comments, every
     * argument re-emitted as a real C# literal — and the copy button sits on that bar rather
     * than on the block above it. What is asserted here is that the promise holds both ways: the
     * clipboard matches the chain, and it matches the line the visitor was looking at when they
     * pressed. Home.razor builds both from one list of runs so they cannot drift, and this is
     * what notices if that ever stops being true.
     */
    test('copying the code puts the exact chain on the clipboard, with accessible feedback', async ({ page, context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'String()' });
        await page.locator('.chain-link').nth(1).locator('select').selectOption({ label: 'StartingWith(prefix)' });
        await page.locator('.chain-link').nth(1).locator('input').fill('ORD-');

        const printed = page.locator('.playground-widget .code-bar .code-text');

        // The assignment is part of what is copied, and its type is read off the catalogue's own
        // description of Generate() for the chain in hand rather than guessed from the entry
        // point — `string` here, and the one thing the chain's own text never spells out.
        await expect(printed).toHaveText('string anyValue = Any.String().StartingWith("ORD-").Generate();');

        await page.getByRole('button', { name: 'Copy code' }).click();

        const clipboard = await page.evaluate(() => navigator.clipboard.readText());

        expect(clipboard).toBe('string anyValue = Any.String().StartingWith("ORD-").Generate();');
        expect(clipboard, 'the clipboard and the printed line have drifted apart').toBe(
            await printed.textContent(),
        );

        await expect(page.locator('.playground-widget .visually-hidden[role="status"]')).toHaveText(/copied/);
    });

    /**
     * ADR-0004's rule, on the one control this card offers that cannot always act: an empty chain
     * formats to `Any.Generate();`, which is not a call the library has. The bar carrying it is
     * not drawn at all rather than drawn and refused.
     */
    test('prints no copyable line, and offers no copy, until there is a chain', async ({ page }) => {
        await page.goto('/playground/');

        await expect(page.locator('.playground-widget .card')).toBeVisible();
        await expect(page.locator('.playground-widget .code-bar')).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Copy code' })).toHaveCount(0);

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'String()' });

        await expect(page.locator('.playground-widget .code-bar')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Copy code' })).toBeVisible();
    });

    /**
     * The bar promises "this is the code", so it must not print a line with a hole in it. An
     * argument this playground could not parse has no literal form — what would stand in its place
     * is `Between(, )` — so the line is replaced by the reason and the copy button goes quiet.
     *
     * A library refusal is deliberately NOT that: `WithLength(2)` after `StartingWith("ORD-")`
     * compiles perfectly and throws when it runs, which is the demonstration §9.9 protects. The
     * line keeps printing there, and a reader who pastes it reproduces the refusal.
     */
    test('says so, and will not hand over a line, while an argument has no literal form', async ({ page }) => {
        await page.goto('/playground/');

        const bar = page.locator('.playground-widget .code-bar');
        const copy = page.getByRole('button', { name: 'Copy code' });

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'Int32()' });
        await expect(bar.locator('.code-text')).toBeVisible();
        await expect(copy).toBeEnabled();

        // Chosen a second ago, so its arguments are empty — and an empty argument is one this
        // playground cannot write down.
        await page.locator('.chain-link').nth(1).locator('select').selectOption({ label: 'Between(minimum, maximum)' });

        await expect(bar.locator('.not-compilable')).toBeVisible();
        await expect(bar.locator('.code-text')).toHaveCount(0);
        await expect(copy).toBeDisabled();

        await page.locator('.chain-link').nth(1).locator('input').first().fill('1');
        await page.locator('.chain-link').nth(1).locator('input').nth(1).fill('10');

        await expect(bar.locator('.code-text')).toHaveText('int anyValue = Any.Int32().Between(1, 10).Generate();');
        await expect(bar.locator('.not-compilable')).toHaveCount(0);
        await expect(copy).toBeEnabled();
    });

    test('keeps printing a line the library refuses, because that line compiles', async ({ page }) => {
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'String()' });
        await page.locator('.chain-link').nth(1).locator('select').selectOption({ label: 'StartingWith(prefix)' });
        await page.locator('.chain-link').nth(1).locator('input').fill('ORD-');
        await page.locator('.chain-link').nth(2).locator('select').selectOption({ label: 'WithLength(length)' });
        await page.locator('.chain-link').nth(2).locator('input').fill('2');

        // The refusal is in the bar below, and the code that provokes it is still on screen and
        // still copyable — blanking it would hide the very line the refusal is about.
        await expect(page.locator('.playground-widget .result-bar .refusal')).toBeVisible();
        await expect(page.locator('.playground-widget .code-bar .code-text')).toHaveText(
            'string anyValue = Any.String().StartingWith("ORD-").WithLength(2).Generate();',
        );
        await expect(page.locator('.playground-widget .code-bar .not-compilable')).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Copy code' })).toBeEnabled();
    });

    /**
     * The tick means "what you see is on your clipboard", so it has to go when what you see stops
     * being a line at all.
     *
     * The status was cleared only when the formatted text changed, which misses the one type
     * where invalidating an argument does not change it: `FormatArgumentLiteral` writes an
     * unparsable boolean as `false`, the same characters a valid `false` produces. Clearing the
     * field therefore disabled the button while leaving it wearing a success tick, with the live
     * region still announcing "copied to clipboard" next to a bar reading "Code does not
     * compile".
     */
    test('drops the copied tick when the line stops being writable', async ({ page, context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'Boolean()' });
        await page.locator('.chain-link').nth(1).locator('select').selectOption({ label: 'DifferentFrom(value)' });

        const argument = page.locator('.chain-link').nth(1).locator('input').first();
        const copy = page.getByRole('button', { name: 'Copy code' });
        const status = page.locator('.playground-widget .visually-hidden[role="status"]');

        await argument.fill('false');
        await expect(page.locator('.playground-widget .code-bar .code-text')).toHaveText(
            'bool anyValue = Any.Boolean().DifferentFrom(false).Generate();',
        );

        await copy.click();
        await expect(copy).toHaveAttribute('data-copied', '');
        await expect(status).toHaveText(/copied/);

        // Emptied — no longer parsable, and formatted to the very same `false` as before.
        await argument.fill('');

        await expect(page.locator('.playground-widget .code-bar .not-compilable')).toBeVisible();
        await expect(copy).toBeDisabled();
        await expect(copy).not.toHaveAttribute('data-copied', '');
        await expect(status).toHaveText('');
    });

    /**
     * A long argument stays inside the card on a phone.
     *
     * `FieldWidth` reaches for the widest rung on a Guid, which is around 300px — more than a
     * 375px viewport has left once the card's padding, the step's indent and `.DifferentFrom(`
     * have taken theirs. The card clips rather than scrolls, so the end of the field and the caret
     * with it were cut off the edge and stayed there while the visitor typed.
     */
    test('keeps a long argument field inside the card on a phone', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 780 });
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'Guid()' });
        await page.locator('.chain-link').nth(1).locator('select').selectOption({ label: 'DifferentFrom(value)' });

        const field = page.locator('.chain-link').nth(1).locator('input').first();

        await field.fill('3fa85f64-5717-4562-b3fc-2c963f66afa6');

        const card = await page.locator('.playground-widget .card').boundingBox();
        const box = await field.boundingBox();

        expect(card, 'the card is not rendered').not.toBeNull();
        expect(box, 'the field is not rendered').not.toBeNull();

        // The right edge is where the caret sits when the value is typed to its end, so it is the
        // edge that matters — one pixel of tolerance for sub-pixel layout, and nothing more.
        expect(
            box!.x + box!.width,
            `the field ends ${Math.round(box!.x + box!.width - (card!.x + card!.width))}px past the card`,
        ).toBeLessThanOrEqual(card!.x + card!.width + 1);
    });

    /**
     * A value carrying a backslash is printed as a verbatim literal, in both readings.
     *
     * `Any.StringMatching(...)` is an entry point, so a regular expression is something a visitor
     * types on their first step — and a regular literal writes one backslash as two. That is
     * correct C# and still a puzzle: the reader typed `\d+` and was handed `"\\d+"`. Worse, the
     * block above drew the raw field between plain quotes, so it printed `"\d+"`, which is not
     * valid C# at all — CS1009, unrecognised escape sequence.
     *
     * A verbatim literal needs no escaping, so both readings can print what was typed and both
     * compile. Verified against the compiler, not assumed: `@"\d+"` builds and yields the three
     * characters `\`, `d`, `+`.
     */
    test('prints a backslashed value as a verbatim literal, the same in the block and the bar', async ({ page, context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'StringMatching(pattern)' });
        await page.locator('.chain-link').nth(0).locator('input').fill(String.raw`\d+`);

        // The field keeps what was typed — the whole reason a verbatim literal is used rather
        // than an escaped one, which would have had to change the field to change the display.
        await expect(page.locator('.chain-link').nth(0).locator('input')).toHaveValue(String.raw`\d+`);

        // The block opens the literal with `@"`, so what it draws is C# and not CS1009.
        await expect(page.locator('.chain-link').nth(0).locator('.call .tok-string').first()).toHaveText('@"');

        const line = String.raw`string anyValue = Any.StringMatching(@"\d+").Generate();`;

        await expect(page.locator('.playground-widget .code-bar .code-text')).toHaveText(line);

        await page.getByRole('button', { name: 'Copy code' }).click();
        expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(line);
    });

    /**
     * A value with no backslash keeps the plain literal the landing page's card writes — the
     * verbatim form is used only where it buys something, since `@"ORD-"` is noisier than
     * `"ORD-"` for no gain.
     */
    test('leaves an ordinary value in a plain literal', async ({ page }) => {
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'String()' });
        await page.locator('.chain-link').nth(1).locator('select').selectOption({ label: 'StartingWith(prefix)' });
        await page.locator('.chain-link').nth(1).locator('input').fill('ORD-');

        await expect(page.locator('.chain-link').nth(1).locator('.call .tok-string').first()).toHaveText('"');
        await expect(page.locator('.playground-widget .code-bar .code-text')).toHaveText(
            'string anyValue = Any.String().StartingWith("ORD-").Generate();',
        );
    });

    /**
     * The declared type follows the chain rather than the entry point's name, and it is a C#
     * keyword where the language has one. `var` is the fallback for a receiver the catalogue does
     * not describe a Generate() for — it compiles, which is the whole reason it is the fallback —
     * and it can never appear over an empty chain, since the bar carrying it is not drawn then:
     * `var anyValue = null;` is not valid C# and this is why it cannot be produced.
     */
    test('declares the copied variable as the type the chain actually returns', async ({ page }) => {
        await page.goto('/playground/');

        const printed = page.locator('.playground-widget .code-bar .code-text');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'Int32()' });
        await expect(printed).toHaveText('int anyValue = Any.Int32().Generate();');

        // Constraining it does not change what comes back, and the declaration must not drift.
        await page.locator('.chain-link').nth(1).locator('select').selectOption({ label: 'Positive()' });
        await expect(printed).toHaveText('int anyValue = Any.Int32().Positive().Generate();');

        // A type with no C# keyword keeps its own name, unqualified, and takes the type colour
        // rather than the keyword one. Reached by deleting the first step rather than re-picking
        // it, because a chosen step is code and no longer a combo — the two gestures this card
        // trades for a block that reads as C#, exercised here on the way past.
        await page.locator('.chain-link').nth(0).locator('.delete').click();
        // Qualified, not bare: the line is meant to compile where it is pasted, and a project with
        // implicit usings disabled has no ambient `using System;` to resolve `Guid` against. The
        // same reason FormatArgumentLiteral already writes System.Guid.Parse(...) rather than
        // Guid.Parse(...) for an argument of that type.
        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'Guid()' });
        await expect(printed).toHaveText('System.Guid anyValue = Any.Guid().Generate();');
        await expect(printed.locator('.tok-type').first()).toHaveText('System.Guid');
    });

    test('a full keyboard-only pass reaches the select, the delete button and the next select', async ({ page }) => {
        await page.goto('/playground/');

        const select = page.locator('.chain-link').nth(0).locator('select');
        await select.focus();
        await expect(select).toBeFocused();
        await select.selectOption({ label: 'String()' });

        // String() takes no arguments, so the next stops are this step's own delete button and
        // help link, then the second line's select — proving the keyboard path is unbroken end
        // to end rather than merely present in the DOM.
        await page.keyboard.press('Tab');
        await expect(page.locator('.chain-link').nth(0).locator('.delete')).toBeFocused();

        await page.keyboard.press('Tab');
        await expect(page.locator('.chain-link').nth(0).locator('a.help')).toBeFocused();

        await page.keyboard.press('Tab');
        const secondSelect = page.locator('.chain-link').nth(1).locator('select');
        await expect(secondSelect).toBeFocused();
    });

    /**
     * A parameterized step's arguments are reachable by tabbing forward from the select that
     * chose it.
     *
     * They were not. The select survives as long as it holds focus, so that arrowing through the
     * options is not cut off at the first one — but at the moment Tab is pressed the browser
     * computes the next focusable from the DOM as it stands, and the arguments did not exist in it
     * yet. Focus went to the delete control, the arguments were then inserted *before* it by the
     * settling render, and forward tabbing never met them again.
     */
    test('tabs from a chosen method straight into its first argument', async ({ page }) => {
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'Int32()' });

        const select = page.locator('.chain-link').nth(1).locator('select');

        await select.focus();
        await select.selectOption({ label: 'Between(minimum, maximum)' });

        await page.keyboard.press('Tab');
        await expect(page.locator('.chain-link').nth(1).locator('input').first()).toBeFocused();

        await page.keyboard.press('Tab');
        await expect(page.locator('.chain-link').nth(1).locator('input').nth(1)).toBeFocused();
    });

    /**
     * Writability is a property of the arguments, not of how far the chain got before it stopped.
     *
     * ReplayChain halts at the first failing step and clears every later step's error, so a later
     * step's unparsable argument leaves no trace on it. Reading writability off those cleared
     * errors said the line was fine while `CodeSegments` was emitting `WithMaxLength()` — an
     * argument list with nothing in it — under a bar claiming the line compiles.
     */
    test('will not offer a line whose later step has an argument it could not parse', async ({ page }) => {
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'String()' });
        await page.locator('.chain-link').nth(1).locator('select').selectOption({ label: 'StartingWith(prefix)' });
        await page.locator('.chain-link').nth(1).locator('input').fill('ORD-12345');

        // Refused by the library from here on, which is what stops the replay.
        await page.locator('.chain-link').nth(2).locator('select').selectOption({ label: 'WithLength(length)' });
        await page.locator('.chain-link').nth(2).locator('input').fill('2');
        await expect(page.locator('.playground-widget .result-bar .refusal')).toBeVisible();

        // Chosen after the stop, so the replay never reaches it — and its argument is empty.
        await page.locator('.chain-link').nth(3).locator('select').selectOption({ label: 'WithMaxLength(length)' });

        await expect(page.locator('.playground-widget .code-bar .not-compilable')).toBeVisible();
        await expect(page.locator('.playground-widget .code-bar .code-text')).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Copy code' })).toBeDisabled();
    });

    test('says which version of the library it is running', async ({ page }) => {
        await page.goto('/playground/');

        // Beside the button now, in the landing page's own words — see
        // tests/browser/code-card-parity.spec.ts, which is what holds the two sentences equal.
        // Read off the loaded assembly rather than written beside it, so the claim cannot go
        // stale — the check is that the reading worked, not that a particular version shipped.
        await expect(page.locator('.playground-widget .live')).toHaveText(/Runs locally in your browser with JustDummies \S+/);
        await expect(page.locator('.playground-widget .live')).not.toHaveText(/unknown/);
    });

    test('shows no framework error banner', async ({ page }) => {
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'String()' });
        await expect(page.locator('.chain-link').nth(0).locator('.doc')).toBeVisible();

        // Blazor's own unhandled-error element. It ships in the markup and stays hidden; a
        // visible one means the runtime gave up, and it says so in a corner of the screen
        // rather than by failing to render.
        await expect(page.locator('#blazor-error-ui')).toBeHidden();
    });

    /**
     * The playground counts as part of the site, so it carries the same footer — rebuilt
     * in Blazor (Layout/MainLayout.razor) rather than shared, since Astro and Blazor have
     * no rendering system in common. What both halves must still agree on is that a link
     * back to the site survives `<base href="/playground/" />`: a bare "about" would
     * resolve to /playground/about, a page that does not exist, so the links are asserted
     * root-relative rather than merely present.
     */
    test('carries the site\'s footer, with links that survive its own <base href>', async ({ page }) => {
        await page.goto('/playground/');

        const footer = page.locator('.site-footer');

        await expect(footer).toBeVisible();
        await expect(footer.locator('a[href="/about/"]')).toBeVisible();
        await expect(footer.locator('a[href="/release-notes/"]')).toBeVisible();
        await expect(footer.locator('a[href="/privacy/"]')).toBeVisible();

        const repository = footer.locator('a[href="https://github.com/Reefact/justdummies.io"]');

        await expect(repository).toBeVisible();
        await expect(repository).toHaveAttribute('target', '_blank');
        await expect(repository).toHaveAttribute('rel', /noopener/);
    });

    test('carries the same footer on its own not-found page', async ({ page }) => {
        await page.goto('/playground/not-found');

        await expect(page.locator('.site-footer')).toBeVisible();
    });

    test('carries no footer inside the hero widget embedded in the landing page', async ({ page }) => {
        await page.goto('/playground/hero');

        // BareLayout, deliberately: the widget already sits inside a page that carries the
        // real footer around it, so a second one here would be a duplicate, not a match.
        await expect(page.locator('.site-footer')).toHaveCount(0);
    });

});
