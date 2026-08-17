/**
 * Whether the analytics lane is built into this artefact, and under which id.
 *
 * TWO VARIABLES, BECAUSE ONE OF THEM IS A MEMORY RATHER THAN A SWITCH. The id is
 * looked up once in the Google console and kept for good; the state is what decides.
 * Folding both into one variable would mean that turning the measurement off costs
 * the id, and that turning it back on means going to fetch it again — so the two
 * jobs are two variables, and only one of them is allowed to decide anything.
 *
 * BOTH ARE REQUIRED, WHICH IS STRICTER THAN THE AUDIENCE BEACON NEXT DOOR. A build
 * with no `PUBLIC_CF_BEACON_TOKEN` is a normal build with no beacon, because a
 * missing token can only ever measure less. A missing analytics state is different:
 * it leaves "is Google on?" answered by an absence, which is the exact ambiguity the
 * explicit word exists to remove. So absence fails the build rather than rounding
 * down to off.
 *
 * A TYPO FAILS RATHER THAN DISABLING. `true`, `yes`, `1` and `Enabled` are refused,
 * because a spelling that silently means "off" would give the explicit word none of
 * the explicitness it was chosen for.
 *
 * PUBLIC_ because both genuinely are: the id is rendered into every page of a build
 * that carries the tag and is meant to be read. Filed as secrets they would be
 * masked in build logs for no reason — the same reasoning the beacon token carries.
 *
 * NEVER IMPORT THIS FROM A CLIENT `<script>`. Vite would inline the id into a
 * bundled chunk, and a Google-shaped string under `_astro/` is precisely what
 * `scripts/verify-output.sh` refuses: it would be a host the policy cannot honestly
 * admit, in a file no document loads. Components read it in frontmatter and pass it
 * through an attribute.
 */

/** What the Google console hands out: `G-` and then its own alphanumeric run. */
const MEASUREMENT_ID = /^G-[A-Z0-9]{4,20}$/;

const HOW_TO_FIX =
    'Set both PUBLIC_GA_MEASUREMENT_ID (the G-… id from the Google Analytics console, kept even while the measurement is off) ' +
    'and PUBLIC_GA_MEASUREMENT_STATE (exactly "enabled" or "disabled"). ' +
    'See docs/for-maintainers/deployment-en.md, the step that turns the analytics lane on.';

function required(name: string, value: string | undefined): string {
    const present: string = (value ?? '').trim();

    if (present === '') {
        throw new Error(`${name} is not set, and this build expects it. ${HOW_TO_FIX}`);
    }

    return present;
}

const state: string = required('PUBLIC_GA_MEASUREMENT_STATE', import.meta.env.PUBLIC_GA_MEASUREMENT_STATE);
const id: string = required('PUBLIC_GA_MEASUREMENT_ID', import.meta.env.PUBLIC_GA_MEASUREMENT_ID);

if (state !== 'enabled' && state !== 'disabled') {
    throw new Error(`PUBLIC_GA_MEASUREMENT_STATE is "${state}", which is neither "enabled" nor "disabled". ${HOW_TO_FIX}`);
}

/**
 * Checked in both states on purpose. An id that has gone missing while the
 * measurement is off is a broken memory, and finding out on the day it is switched
 * back on is finding out too late.
 */
if (!MEASUREMENT_ID.test(id)) {
    throw new Error(`PUBLIC_GA_MEASUREMENT_ID is "${id}", which is not a Google Analytics measurement id. ${HOW_TO_FIX}`);
}

/**
 * The id when the lane is built in, and nothing at all when it is not.
 *
 * `undefined` rather than a flag beside the id, so that every caller has to decide
 * with the id in hand: there is no way to render the tag without having read that
 * the measurement is on, and no way to read that it is on without getting the id.
 */
export const googleAnalyticsId: string | undefined = state === 'enabled' ? id : undefined;
