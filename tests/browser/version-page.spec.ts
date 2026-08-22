import { expect, test } from './support/harness';
import type { Page, Response } from '@playwright/test';

/**
 * /version says what the site is serving, and says the same thing the site serves.
 *
 * The page reads `version.json` at build time and the site serves that same file at
 * /version.json — one generation, copied. The point of checking it in a browser is that
 * "one generation, copied" is a claim about the build script, and this is where it stops
 * being a claim: the page is read, the file is fetched, and the two are compared.
 *
 * It is also the first page of this site nothing links to. That is deliberate and it is
 * not what these checks are about — a page reachable only by its address still has to
 * work, in both languages, for a reader arriving with the address.
 */
interface Served {
    release: string | null;
    commit: string | null;
    built: string;
}

const PAGES: ReadonlyArray<{ path: string; heading: string; built: string; previousHeading: string }> = [
    { path: '/version', heading: 'Latest release', built: 'Built', previousHeading: 'Previous releases' },
    { path: '/fr/version', heading: 'Dernière release', built: 'Construit le', previousHeading: 'Releases précédentes' },
];

async function cell(page: Page, field: string): Promise<string> {
    return (await page.locator(`[data-field="${field}"]`).innerText()).trim();
}

for (const { path, heading, built, previousHeading } of PAGES) {

    test(`${path} answers, and wears the site's clothes`, async ({ page }) => {
        const response: Response | null = await page.goto(path);

        // Asked for without the trailing slash, on purpose: that is the address a reader is
        // given, and a directory-format build serves it only because the host resolves it.
        expect(response?.status(), `${path} did not answer`).toBe(200);

        // The same heading and the same claim as the landing page — not similar ones. Both
        // come from one component now, and this is what says the extraction held.
        await expect(page.locator('h1')).toHaveText(/JustDummies/);
        await expect(page.locator('.mark')).toBeVisible();
        await expect(page.getByRole('heading', { name: heading })).toBeVisible();
        await expect(page.locator('.tagline')).toHaveText(/.+/);
    });

    test(`${path} shows what /version.json serves`, async ({ page }) => {
        await page.goto(path);

        const served: Served = await (await page.request.get('/version.json')).json();

        // The whole reason this page is checked in a browser rather than read off disk.
        expect(await cell(page, 'release')).toBe(served.release ?? '#null');
        expect(await cell(page, 'commit')).toBe(served.commit ?? '#null');
        expect(await cell(page, 'built')).toBe(served.built);
    });

    test(`${path} carries its own label on every row`, async ({ page }) => {
        await page.goto(path);

        // The labels are the one thing on this page that is translated, so the French page
        // showing an English one is the failure this catches — and it is invisible to every
        // check that only compares values.
        await expect(page.getByRole('rowheader', { name: built, exact: true })).toBeVisible();
    });

    test(`${path} shows what the last release changed`, async ({ page }) => {
        await page.goto(path);

        const note = page.locator('.latest');

        // No heading of its own to check here: the release note sits under the page's single
        // "Latest release" heading (checked above, in the `heading` test), alongside the build
        // facts table.

        // The tag names the release, and it is the same string /version.json reports as
        // `release` on a build cut from that tag. Only its shape is asserted against this
        // file: this page is built from a branch as often as from a tag, and on a branch the
        // two differ for a reason — see the check below.
        await expect(note.locator('.version')).toHaveText(/^release\/\d{4}-\d{2}-\d{2}T/);
        await expect(note.locator('time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/);

        /*
         * AND THEN THE CARD IS HELD TO ITSELF, which neither shape above can do.
         *
         * A `release/*` tag is a UTC timestamp read off the clock at the moment of tagging
         * (ADR-0001), and the section it heads is retitled with that same tag and dated the
         * same day, in one edit — the release-notes skill's step 2. So the day the tag encodes
         * and the day the card prints are one fact written twice, and the only way they come
         * apart is that one of them is wrong.
         *
         * That is not a hypothetical shape. "November 31, 2026" is a month name, a
         * one-or-two-digit day and four more digits, so it satisfied the generator's own
         * pattern and reached this page as `datetime="2026-11-31"` — a day the calendar does
         * not have, over a line of text reading "December 1", on a page whose whole job is to
         * say when something shipped. Both regexes above passed it.
         */
        const tag: string = (await note.locator('.version').innerText()).trim();
        const tagged: string = /^release\/(\d{4}-\d{2}-\d{2})T/.exec(tag)?.[1] ?? '';
        const iso: string = (await note.locator('time').getAttribute('datetime')) ?? '';

        expect(iso, `${path} dates the note ${iso}, under the tag ${tag}, which names ${tagged}`).toBe(tagged);

        /*
         * And the spelling beside the attribute says the same day the attribute does.
         *
         * Not the same assertion re-worded: `datetime` is the machine's copy of the date and
         * the text is `formatReleaseDate`'s, and everything that can separate the two does it
         * silently. A formatter that lost its `timeZone: 'UTC'` prints the day before for
         * every reader west of Greenwich, because an ISO date parses to midnight UTC.
         *
         * THE DIGITS, NOT THE SPELLING. "August 19, 2026" and "19 août 2026" are one fact in
         * two languages, and only the numbers in them are this check's business. Reformatting
         * `iso` here with `new Date` would prove nothing either: it rolls a day over exactly
         * the way the page did, so the check and the defect would agree. A month name carries
         * no digits, so the day and the year are the only numbers the text can hold, and `\D`
         * on both sides is what keeps the 2 of a day from matching inside 2026.
         */
        const [year, , dayOfMonth]: readonly string[] = iso.split('-');
        const spelled: string = (await note.locator('time').innerText()).trim();

        expect(spelled, `${path} dates the note ${iso} and spells it "${spelled}"`).toMatch(
            new RegExp(`(^|\\D)${Number(dayOfMonth)}(\\D|$)`),
        );
        expect(spelled, `${path} dates the note ${iso} and spells it "${spelled}"`).toMatch(
            new RegExp(`(^|\\D)${year}(\\D|$)`),
        );

        // A rubric with no bullets under it is what a parser that swallowed a list looks
        // like from here, and it is invisible to a check that only asks whether the section
        // rendered. The emoji is the label's own, arriving already translated.
        const rubrics = note.locator('.rubric');

        expect(await rubrics.count()).toBeGreaterThan(0);

        for (const rubric of await rubrics.all()) {
            await expect(rubric.locator('.rubric-label')).toHaveText(/\S/);
            expect(await rubric.locator('.bullets li').count()).toBeGreaterThan(0);
        }
    });

    test(`${path} links the note to its own release, in a new tab, safely`, async ({ page }) => {
        await page.goto(path);

        const link = page.locator('.latest .release-foot a');
        const tag: string = (await page.locator('.latest .version').innerText()).trim();

        // The card names the tag; the link has to name the same one. Built from that string
        // rather than hard-coded, so a check that passes proves the page agrees with itself
        // rather than proving both agree with this file. The GitHub releases page gives every
        // listed release an `id="release-<tag>"` anchor (verified against the live listing),
        // so the link stays on that shared page rather than a release's own.
        await expect(link).toHaveAttribute('href', `https://github.com/Reefact/justdummies.io/releases#release-${tag}`);
        await expect(link).toHaveAttribute('target', '_blank');

        // `noopener` is the half that matters: without it the opened tab keeps a handle on
        // this one through `window.opener`, and can navigate it.
        await expect(link).toHaveAttribute('rel', /noopener/);
    });

    test(`${path} keeps the note out of the table's claim`, async ({ page }) => {
        await page.goto(path);

        // The table says what this build IS; the note says what shipped LAST. They are the
        // same fact only on a build cut from a release tag, and every build on a branch is
        // the case that would expose the two being conflated — a `#null` release above a
        // note that names a tag has to read as two statements, not as one contradiction.
        //
        // So what is asserted is the separation itself: the note sits outside the table,
        // rather than as a fourth row inside it.
        await expect(page.locator('.build .facts .latest')).toHaveCount(0);
        await expect(page.locator('.latest .facts')).toHaveCount(0);
    });

    test(`${path} shows the 5 previous releases, each without its own GitHub link`, async ({ page }) => {
        await page.goto(path);

        await expect(page.getByRole('heading', { name: previousHeading, exact: true })).toBeVisible();

        const cards = page.locator('.previous .cards .release');

        expect(await cards.count()).toBe(5);

        // A "Voir sur GitHub" repeated identically five times would be five copies of the same
        // fact — these cards carry no link of their own, only the section's closing one does.
        await expect(page.locator('.previous .cards .release-foot')).toHaveCount(0);
    });

    test(`${path} closes the previous-releases section with one link past the last one shown`, async ({ page }) => {
        await page.goto(path);

        const link = page.locator('.previous .view-all a');

        // Named the way "5 releases" is named elsewhere on this site (releaseNotes.releases),
        // so the count in the sentence and the number of cards above it can't drift apart
        // silently — a page showing 5 cards and a link saying "4 more" would satisfy every
        // other check here.
        expect(await link.innerText()).toMatch(/5/);

        // Anchored past the last of the 5 cards shown, not at the GitHub releases page's top —
        // a reader who keeps going lands exactly where this page's own listing stops.
        await expect(link).toHaveAttribute('href', /^https:\/\/github\.com\/Reefact\/justdummies\.io\/releases#release-release\//);
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', /noopener/);
    });

}

/**
 * The two languages publish one release — the same one, rubric for rubric and bullet for
 * bullet.
 *
 * ONLY A PAIR OF PAGES CAN SAY THIS, which is why it sits outside the loop above rather than
 * inside it. Each pass of that loop sees one locale and has nothing to hold it against, so a
 * French card carrying one of the five bullets its English twin carries satisfies every
 * assertion in it: every rubric still has a label, and every rubric still has a bullet.
 *
 * The join is positional all the way down. `site-release.json` holds one release with a locale
 * key per language, and the card draws whichever list belongs to the reader — so a rubric
 * written with three bullets in English and one in French renders as a complete page and a
 * short one, which is the half-translated page §6.4 exists to prevent. The generator refuses
 * that before it writes the file; this is the same claim asked of the rendered pages, where a
 * reader is the one who would meet it.
 *
 * COUNTS AND THE TAG, NEVER THE WORDS. The rubric labels and the prose are translated, so two
 * locales showing the same strings would be the defect rather than the proof — that is the
 * comparison release-notes.spec.ts makes for the library's pages, and it is the opposite of
 * this one. What has to be identical here is which release is being described, and the shape
 * of the description.
 */
test('/version and /fr/version publish the same release, bullet for bullet', async ({ page }) => {
    interface Shape {
        tag: string;
        date: string | null;
        bullets: number[];
    }

    async function shapeOf(path: string): Promise<Shape> {
        await page.goto(path);

        const note = page.locator('.latest');

        return {
            tag: (await note.locator('.version').innerText()).trim(),
            date: await note.locator('time').getAttribute('datetime'),
            bullets: await note
                .locator('.rubric')
                .evaluateAll((rubrics: Element[]) =>
                    rubrics.map((rubric: Element) => rubric.querySelectorAll('.bullets li').length),
                ),
        };
    }

    const english: Shape = await shapeOf('/version');
    const french: Shape = await shapeOf('/fr/version');

    expect(english.bullets.length, '/version shows no rubric to compare').toBeGreaterThan(0);
    expect(french.tag, `/fr/version publishes ${french.tag} where /version publishes ${english.tag}`).toBe(english.tag);
    expect(
        french.date,
        `/fr/version dates ${english.tag} ${french.date}, and /version dates it ${english.date}`,
    ).toBe(english.date);
    expect(
        french.bullets,
        `/version reads ${english.bullets.join('/')} bullets per rubric and /fr/version reads ${french.bullets.join('/')}`,
    ).toEqual(english.bullets);
});

test('the commit links to the commit, in a new tab, safely', async ({ page }) => {
    await page.goto('/version');

    const served: Served = await (await page.request.get('/version.json')).json();
    const link = page.locator('[data-field="commit"] a');

    if (served.commit === null) {
        // A build with no git behind it has nothing to link to, and the page says `#null`
        // rather than pointing at a commit that does not exist.
        await expect(link).toHaveCount(0);

        return;
    }

    await expect(link).toHaveAttribute('href', `https://github.com/Reefact/justdummies.io/commit/${served.commit}`);
    await expect(link).toHaveAttribute('target', '_blank');

    // `noopener` is the half that matters: without it the opened tab keeps a handle on this
    // one through `window.opener`, and can navigate it.
    await expect(link).toHaveAttribute('rel', /noopener/);
});

test('/version needs no script to say anything', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await page.goto('/version');

    // The page fetches nothing and runs nothing, which is why this holds. It is worth
    // asserting rather than assuming: the day somebody makes the figures live, this is what
    // says the reader without scripting was left behind.
    await expect(page.locator('[data-field="release"]')).toHaveText(/.+/);
    await expect(page.locator('[data-field="commit"]')).toHaveText(/.+/);
    await expect(page.locator('[data-field="built"]')).toHaveText(/.+/);

    // The note is read out of a file at build time like the figures above it, so it is here
    // for the same reason they are: nothing on this page may become a thing a reader without
    // scripting is left out of.
    expect(await page.locator('.latest .bullets li').count()).toBeGreaterThan(0);

    await context.close();
});

/**
 * The note is the widest thing this page holds, and this page is not in layout.spec.ts's
 * sweep — it is a deliberate orphan nothing links to, and that sweep covers what a reader
 * can reach.
 *
 * It still has to survive a phone. The hazard is specific and it is new: a release tag is a
 * 28-character timestamp with nowhere to break, set in mono as a heading, sitting in a flex
 * row beside a date that must not wrap — the same shape as the commit hash in the table
 * above, which took this page sideways once already.
 *
 * The measurement is layout.spec.ts's, for its reason: `100vw` includes a classic
 * scrollbar's width and the browser doing the measuring may draw overlay scrollbars that
 * take none, so `scrollWidth` against `clientWidth` is what cannot be fooled.
 */
for (const width of [320, 360] as const) {

    for (const path of ['/version', '/fr/version'] as const) {

        test(`${path} does not scroll sideways at ${width}px`, async ({ page }) => {
            await page.setViewportSize({ width, height: 900 });
            await page.goto(path);

            const overflow: { scrollWidth: number; clientWidth: number } = await page.evaluate(() => ({
                scrollWidth: document.documentElement.scrollWidth,
                clientWidth: document.documentElement.clientWidth,
            }));

            expect(
                overflow.scrollWidth,
                `${path} is ${overflow.scrollWidth - overflow.clientWidth}px wider than its viewport at ${width}px`,
            ).toBeLessThanOrEqual(overflow.clientWidth);
        });

    }

}
