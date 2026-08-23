/*
 * The consent decision, for both of this site's applications.
 *
 * WHY THIS FILE IS NOT PART OF EITHER APPLICATION. ADR-0025: the question belongs to
 * the origin rather than to a document. The Astro pages and the Blazor playground both
 * ask it and both act on the answer, and the parts that decide — the storage key, the
 * six-month retention, the tolerance for a fast clock, the re-check on every report and
 * the withdrawal path — are the promise ADR-0018 made. Two copies of that promise drift,
 * and the drift is silent in the worst direction: one document still reporting for a
 * visitor the other has already stopped reporting for. So there is one copy, and the two
 * banners are two views onto it.
 *
 * WHY IT IS PLAIN JAVASCRIPT IN `public/` rather than a module Astro bundles. A bundled
 * script is fingerprinted, and the playground's shell is a hand-written file that cannot
 * learn a new URL on every build. Served from `public/`, the address is `/consent.js` in
 * both documents and neither has to be told anything. What that costs is paid explicitly
 * rather than skipped: `generate-headers.mjs` gives it a revalidating cache rule, because
 * an unfingerprinted file cannot be cached forever, and `check-budgets.sh` counts it,
 * because a budget that quietly excludes part of what a visitor downloads reads as
 * complete while being short by whatever it skipped.
 *
 * WHAT IT DOES NOT DO. It knows nothing about scenes, acts, copy events or chains. It
 * publishes one question — may this document report — and one event for the moment the
 * answer becomes yes. Everything a particular application measures stays in that
 * application.
 *
 * IT LISTENS FOR A BANNER RATHER THAN RENDERING ONE. Every control it touches is named by
 * a data attribute, and a document that renders none is a document where this file wires
 * nothing and does nothing. That is what lets one file serve two toolchains, and it is
 * also the safe direction to fail in: a document that renders a banner but fails to load
 * this file starts no tag at all, because this file is the only caller that starts one.
 */
(function () {
    'use strict';

    /** Where the answer lives. One origin, so one key, read and written by both. */
    var STORAGE_KEY = 'jd:analytics-consent';

    /**
     * Six months, after which the banner asks again. It is the retention the CNIL
     * recommends for a consent record, and it doubles as the answer to the one thing
     * local storage cannot do: it has no expiry of its own, so the expiry has to be
     * part of the value and checked on the way out.
     */
    var REMEMBER_FOR_MS = 15778800000;

    /**
     * How far into the future a stored `at` is still trusted. A clock a few minutes fast
     * when a choice was written is ordinary drift; a record dated further out than that has
     * no genuine claim to being current, and untrusted is what keeps it from making the
     * six-month retention effectively permanent — `Date.now() - at` would otherwise stay
     * negative, and therefore under the retention window, for as long as `at` stays ahead.
     */
    var CLOCK_SKEW_TOLERANCE_MS = 300000;

    /**
     * How often a granted session re-checks the retention window on its own, so a tab that
     * never triggers a custom report and never goes hidden then visible still catches an
     * expiry. Not the retention window itself: `setTimeout` overflows its own 32-bit delay
     * long before six months, so this reschedules itself instead of trying to wait the whole
     * span in one call. A day is far tighter than the six-month window needs.
     */
    var EXPIRY_CHECK_MS = 86400000;

    /**
     * What this file tells its document when the answer becomes yes.
     *
     * DISPATCHED RATHER THAN CALLED BACK, which is the idiom `CopyableCommand` already
     * established here: the sender knows nothing about who is listening. It also removes an
     * ordering hazard that a registration API would have. This file and the application's
     * own script are two deferred scripts, and which runs first is not something either can
     * see; a listener is registered before the first reconciliation either way, because that
     * one waits for `DOMContentLoaded`.
     */
    var STARTED_EVENT = 'jd:consent-reporting';

    /**
     * The two globals `GoogleAnalytics.astro`'s bootstrap publishes, and the one the tag
     * publishes for itself.
     *
     * NAMED HERE RATHER THAN IMPORTED, because the bootstrap is an inline script in a
     * document rather than a module: what the two share is a window, and saying so plainly
     * is more honest than a type that implies a dependency the loader never resolves. A
     * document with no tag has none of them, and every use below is guarded.
     */
    var tag = window;

    var banner = null;
    var status = null;
    var reopen = null;

    var reporting = false;
    var returnFocusTo = null;
    var expiryCheck;

    /**
     * Whether the banner is up because the visitor asked for it, rather than because nothing
     * has been answered yet.
     *
     * The two are indistinguishable from the stored answer alone — a visitor reopening the
     * question from the privacy page has an answer on record by definition — so without this,
     * every reconciliation wants to close the dialogue they just opened. Those are not rare
     * events: coming back to the tab is one, and so is the periodic re-check. The question
     * would vanish mid-thought, with nothing announced and focus dropped to the body, and the
     * visitor would have to notice and press the control again.
     */
    var asking = false;

    /**
     * What `remembered()` falls back to when storage itself is the thing that failed.
     *
     * A browser that throws on `setItem` throws on `getItem` too, so without this a
     * choice `remember()` just made could not survive the page's own next read: the
     * following `visibilitychange` would find nothing, stop an accepted session mid-page,
     * and reopen a banner that was already answered. Storage is still consulted first
     * everywhere below — this is only reached when it has nothing to say.
     */
    var inMemoryAnswer;

    /**
     * Whether the last write attempt failed — set by `remember()`, read by `remembered()`.
     *
     * A failed write leaves the stored record stale rather than absent, and a stale record
     * still reads back successfully: without this, `remembered()` would trust it over the
     * fresher in-memory answer just because the read itself worked, letting a withdrawal
     * be undone by the grant still on disk. It has to be a flag rather than "prefer memory
     * whenever it is set": once storage is working again, a genuinely empty read — another
     * tab's `localStorage.clear()`, most notably — has to mean unanswered, not "fall back
     * to whatever this tab decided earlier."
     */
    var storageIsUnreliable = false;

    /**
     * Every read and every write is guarded. Local storage throws rather than returning
     * null in a browser configured to refuse it — so an unguarded read would take the
     * banner down with it and leave the page with a question nobody can answer.
     *
     * @returns {'granted'|'denied'|undefined} the live answer, or undefined for none
     */
    function remembered() {
        try {
            var raw = window.localStorage.getItem(STORAGE_KEY);

            if (raw === null) {
                return storageIsUnreliable ? inMemoryAnswer : undefined;
            }

            var parsed = JSON.parse(raw);

            if (
                parsed.v !== 1 ||
                (parsed.choice !== 'granted' && parsed.choice !== 'denied') ||
                !Number.isFinite(parsed.at) ||
                parsed.at > Date.now() + CLOCK_SKEW_TOLERANCE_MS
            ) {
                // A timestamp that fails to parse is not "very old" — `Date.now() - NaN` is
                // `NaN`, and `NaN > REMEMBER_FOR_MS` is false, so the retention check below
                // would wave a corrupted record through as a live grant. A timestamp dated
                // into the future has the same effect from the other side: the subtraction
                // stays negative, and therefore under the retention window, for as long as it
                // does — making the six-month re-prompt postponable by however far it is
                // dated out. Both are treated the same as any other malformed record: not a
                // valid answer at all.
                return inMemoryAnswer;
            }

            if (storageIsUnreliable) {
                return inMemoryAnswer;
            }

            // An answer older than the retention reads as no answer, so the banner
            // returns rather than a decade-old yes standing in for a live one.
            return Date.now() - parsed.at > REMEMBER_FOR_MS ? undefined : parsed.choice;
        } catch (refused) {
            return inMemoryAnswer;
        }
    }

    /** @param {'granted'|'denied'} choice */
    function remember(choice) {
        inMemoryAnswer = choice;

        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, choice: choice, at: Date.now() }));
            storageIsUnreliable = false;
        } catch (refused) {
            // Storage refused the write; the in-memory fallback above keeps the choice
            // for this page, and the banner will simply ask again next time.
            storageIsUnreliable = true;

            if (choice === 'denied') {
                // The in-memory fallback does not survive navigation — a fresh page starts
                // with none of it — so a grant already on record would otherwise still be
                // there to read, undoing this withdrawal the moment the visitor moves on.
                // Removing costs no quota the way writing does, so it succeeds even when the
                // write that prompted it could not; a granted choice has no such record to
                // strip, since the fail-closed default is already "not reporting".
                try {
                    window.localStorage.removeItem(STORAGE_KEY);
                } catch (alsoRefused) {
                    // Nothing more storage can do; this page's in-memory answer still holds.
                }
            }
        }
    }

    /**
     * Re-arms the periodic expiry re-check, on every call rather than only the first.
     *
     * Called from `start()` before its own guard, deliberately: that guard exists to stop
     * the tag being started twice, and reusing it here would also stop the schedule being
     * renewed twice — which is the one thing that has to happen every time, including on
     * the very call this function's own timeout makes back into `start()` once reporting is
     * already `true`. Without the split, the chain would fire once and never re-arm itself.
     */
    function scheduleExpiryCheck() {
        window.clearTimeout(expiryCheck);
        // Wrapped rather than passed by name, so the schedule cannot start supplying arguments
        // to a function that now reads its first one.
        expiryCheck = window.setTimeout(function () {
            applyDecision();
        }, EXPIRY_CHECK_MS);
    }

    function start() {
        if (tag.jdAnalyticsStart === undefined) {
            return;
        }

        scheduleExpiryCheck();

        if (reporting) {
            return;
        }

        reporting = true;
        tag.jdAnalyticsStart();

        // After the tag, never before: a listener that reports something held back has to
        // find a started tag when it runs.
        document.dispatchEvent(new CustomEvent(STARTED_EVENT));
    }

    /**
     * Withdrawal, which has to reach the loaded tag and not merely this file.
     *
     * Silencing the application's own reporting is the easy half. The hard half is that by
     * the time somebody withdraws, Google's own script may be loaded — and revoking the
     * consent signal alone does not stop it, it puts it into cookieless-ping mode, which is
     * the one behaviour ADR-0018 rejects by name. `jdAnalyticsStop` raises Google's
     * documented opt-out flag, which the tag reads before sending anything at all.
     */
    function stop() {
        reporting = false;
        window.clearTimeout(expiryCheck);

        if (tag.jdAnalyticsStop !== undefined) {
            tag.jdAnalyticsStop();
        }
    }

    function show() {
        if (banner === null) {
            return;
        }

        asking = true;
        returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        banner.hidden = false;
        banner.focus();
        // Called as well as observed, so a browser without `ResizeObserver` still reserves the
        // room. The observer refines it; this makes sure there is something to refine.
        publishBannerHeight();
    }

    /**
     * @param {'granted'|'denied'} choice
     * @param {string} announcement what the live region says afterwards, already translated
     */
    function answer(choice, announcement) {
        asking = false;
        remember(choice);

        if (banner !== null) {
            banner.hidden = true;
            publishBannerHeight();
        }

        if (status !== null) {
            status.textContent = announcement;
        }

        if (reopen !== null) {
            returnFocusTo = reopen;
        }

        if (returnFocusTo !== null) {
            returnFocusTo.focus();
            returnFocusTo = null;
        }

        if (choice === 'granted') {
            start();
        } else {
            stop();
        }
    }

    /**
     * Brings this document into line with the stored answer — the reporting and the
     * banner together, because they are two halves of one state and drifted apart twice.
     *
     * READ RATHER THAN REMEMBERED, and re-read rather than read once. The answer can
     * change without this document doing anything: another tab can write one, another
     * application on this origin can write one, and the six-month lifetime can expire
     * under a tab that simply stayed open. A decision consulted only at startup left this
     * page reporting under a grant that had run out, and left a second tab measuring while
     * its own banner still asked the question.
     *
     * Called from the three moments where the stored answer and this page can disagree:
     * startup, another document writing, and this one coming back into view — plus a fourth
     * that this function arms for itself, since none of the first three are guaranteed to
     * happen again before six months are up.
     *
     * GRANTING WAITS FOR A VISIBLE TAB; WITHDRAWING NEVER DOES. `storage` reaches every
     * open document at once — accepting with three tabs open would start three tags in
     * the same instant, and two of them would fire `config`'s page_view from a document
     * nobody was reading. `visibilitychange` already calls this again on the tab that
     * deferred, so nothing is lost, only held until there is a page to attribute it to.
     *
     * THE PERIODIC RE-ARM LIVES IN `start()` AND `stop()`, NOT HERE, even though this
     * function is what the schedule calls back into. Enhanced measurement's `scroll` — left
     * on by the measurement plan on every route but the narrative — is Google's own script
     * watching the page, answering to nothing this file calls; only the `ga-disable` flag
     * `stop()` raises actually silences it, so the schedule has to survive a tab that
     * outlives its own grant without anything else happening to call this function again.
     * It was tried here first, and missed the ordinary path entirely: a first visitor
     * clicking Accept calls `start()` directly, never through this function, and would have
     * gone unscheduled — the most common way a session ever begins.
     *
     * @param {boolean} [elsewhere] whether the answer arrived from another document
     */
    function applyDecision(elsewhere) {
        var decided = remembered();

        if (decided === 'granted' && document.visibilityState === 'visible') {
            start();
        } else if (decided !== 'granted') {
            stop();
        }

        if (banner === null) {
            return;
        }

        if (decided === undefined) {
            // Guarded on `hidden` so that a repeat call does not take focus a second time.
            if (banner.hidden) {
                show();
            }
        } else if (!asking || elsewhere === true) {
            // A question the visitor opened themselves is theirs to close, so the reconciliation
            // leaves it alone — except when the answer arrived from another document, which is
            // what `elsewhere` says. That one is not this tab overruling them: they have just
            // answered the same question somewhere else, and leaving it up here would ask twice.
            asking = false;
            banner.hidden = true;
            publishBannerHeight();
        }
    }

    /**
     * Publishes the banner's height, so the document can leave room for something out of flow.
     *
     * `position: fixed` means the layout does not know the banner exists: the page ends where it
     * always did and the banner lies on top of the footer, taking its clicks. Measured rather
     * than declared as a constant in the stylesheet, because the banner wraps to two lines at
     * some widths and three at others, and one number would be wrong at every width but one.
     *
     * Observed rather than measured once. The height is not settled when the banner is first
     * shown — a web font arriving re-wraps it — and it changes again on rotation, on resize and
     * at a new zoom level. Writing only on a change keeps that from feeding back into itself
     * through the scrollbar it can cause to appear.
     */
    function publishBannerHeight() {
        if (banner === null) {
            return;
        }

        var height = banner.hidden ? '0px' : banner.offsetHeight + 'px';

        if (document.documentElement.style.getPropertyValue('--jd-consent-height') !== height) {
            document.documentElement.style.setProperty('--jd-consent-height', height);
        }
    }

    /**
     * Finds this document's banner, whichever toolchain drew it, and wires it.
     *
     * DEFERRED TO `DOMContentLoaded` RATHER THAN RUN AT LOAD, and that is not only about the
     * markup existing. It is what makes the two scripts' order stop mattering: whichever of
     * this file and the application's own runs first, both have run by the time the first
     * reconciliation happens, so a listener for the started event is always registered before
     * the event can fire.
     *
     * The playground redraws its banner when a visitor switches language, so it is wired
     * again on demand — the element found here may not be the element on screen a moment
     * later. `jdConsentRewire` is how that document says so.
     */
    function wire() {
        var found = document.querySelector('[data-consent]');

        // Wired once per element. The playground replaces its banner rather than re-wording
        // it, so a second call is a second element and gets its own listeners; a second call
        // on the same element would only stack duplicates on the one already wired.
        if (found !== null && found === banner) {
            return;
        }

        banner = found;
        status = document.querySelector('[data-consent-status]');
        reopen = document.querySelector('[data-consent-reopen]');

        if (banner !== null) {
            if ('ResizeObserver' in window) {
                new ResizeObserver(publishBannerHeight).observe(banner);
            }

            var accept = banner.querySelector('[data-consent-accept]');
            var refuse = banner.querySelector('[data-consent-refuse]');
            var accepted = accept !== null && accept.dataset ? accept.dataset.announce || '' : '';
            var refused = refuse !== null && refuse.dataset ? refuse.dataset.announce || '' : '';

            if (accept !== null) {
                accept.addEventListener('click', function () {
                    answer('granted', accepted);
                });
            }

            if (refuse !== null) {
                refuse.addEventListener('click', function () {
                    answer('denied', refused);
                });
            }

            // Escape refuses rather than dismissing without an answer. Dismissing would
            // leave the question open and bring the banner back on the next page, which
            // reads as nagging; recording the refusal is what makes "no" as cheap as
            // "yes", which is the whole of the parity rule.
            banner.addEventListener('keydown', function (event) {
                if (event.key === 'Escape') {
                    answer('denied', refused);
                }
            });
        }

        applyDecision();

        // The privacy page's way back in. Hidden in the markup for the same reason the
        // banner is: a button that reopens a dialogue is dead without scripting.
        if (reopen !== null) {
            reopen.hidden = false;
            reopen.addEventListener('click', show);
        }
    }

    /**
     * The same answer, applied in every other document the visitor has open.
     *
     * `localStorage` is shared across an origin's documents but changing it notifies
     * nobody by itself — the `storage` event does, and it fires in every document except
     * the one that wrote. Without this, a visitor with the site open twice who withdraws
     * in one tab leaves the other still reporting, with Google still holding a granted
     * signal. The privacy page promises that refusing stops the collection; it does not
     * say "in this tab", and it should not have to. Since ADR-0025 it does not say "on the
     * site" either: the other document may be the playground.
     *
     * Symmetric on purpose: accepting elsewhere starts this tab too, so the two never
     * disagree in either direction. A cleared key reads as no consent, which stops —
     * and `key === null` is also a clear, the one `localStorage.clear()` sends instead of
     * naming this key on its own. A tab already reporting would otherwise never learn
     * everything was wiped, and would simply keep going.
     */
    window.addEventListener('storage', function (event) {
        if (event.key !== STORAGE_KEY && event.key !== null) {
            return;
        }

        // This event firing at all is proof a write just succeeded somewhere, whatever
        // this tab's own history of failed ones says — and without lowering the flag here,
        // a tab that once failed to write would keep preferring its own stale in-memory
        // answer over a value it can now read fresh and successfully, discarding exactly
        // the update this listener exists to react to.
        storageIsUnreliable = false;

        // The one caller that passes `elsewhere`: this answer came from another document, so a
        // banner the visitor had open here is closing because they answered, not despite it.
        applyDecision(true);
    });

    /**
     * And when this document comes back into view, because that is the moment a tab that
     * has been sitting for months is worth re-asking about. It is also the cheapest place
     * to notice an expiry: no timer to schedule, no cost while nobody is looking.
     */
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') {
            applyDecision();
        }
    });

    /**
     * What a document may ask of this file. Two functions and an event name, which is the
     * whole of the contract: an application says whether it may report, and hears when the
     * answer turns to yes.
     */
    window.jdConsent = {
        /**
         * Whether this document may report right now.
         *
         * RE-READ RATHER THAN TRUSTED FROM WHENEVER `start()` LAST RAN, which is why every
         * report goes through here rather than through a boolean. The six-month retention is
         * otherwise only ever rechecked on a storage event or on becoming visible again —
         * nothing revisits it for a tab that simply never goes anywhere, and scheduling a
         * timer for six months out isn't reliable either: that delay overflows `setTimeout`'s
         * own 32-bit limit long before it would fire. Every report already passes through one
         * place, so it costs nothing extra to ask.
         *
         * @returns {boolean}
         */
        reporting: function () {
            // Checked first so that an event fired between a refusal and the next page load
            // cannot queue up waiting for a `config` that is never coming.
            if (!reporting) {
                return false;
            }

            if (remembered() !== 'granted') {
                applyDecision();

                return false;
            }

            return true;
        },

        /**
         * Wires whatever banner is in the document now. Called by a document that redraws
         * its own — the playground, when a visitor switches language — and by nobody else.
         */
        rewire: function () {
            wire();
        },

        /** The event dispatched on `document` when reporting starts. */
        startedEvent: STARTED_EVENT,
    };

    /*
     * `complete` RATHER THAN `loading`, AND THE DIFFERENCE IS THE WHOLE ORDERING GUARANTEE.
     * A deferred script runs after parsing finishes, which means `readyState` is already
     * `interactive` by the time this line is reached — so testing for `loading` would take
     * the else branch and wire immediately, before the application's own deferred script
     * had necessarily run, and a listener for the started event registered a moment later
     * would miss the first reconciliation. Waiting for `DOMContentLoaded` puts both scripts
     * behind the same door. `complete` is the one state where that door has already closed.
     */
    if (document.readyState === 'complete') {
        wire();
    } else {
        document.addEventListener('DOMContentLoaded', wire);
    }
})();
