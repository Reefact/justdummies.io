import type { ConsoleMessage, Page, Request, Response } from '@playwright/test';

/**
 * What a page complained about while it was loading.
 *
 * Every field here is something a visitor would meet and no on-disk check can see: a request
 * that came back 404, a script that threw, a rule the Content-Security-Policy refused. They
 * are collected rather than asserted, so each check decides what counts as a failure for it —
 * the playground's 404s are the blank-page defect, while a missing favicon on a content page
 * is not worth a red build.
 */
export interface PageComplaints {

    /** Requests the runtime answered with 400 or worse, as `status url`. */
    readonly failed: string[];

    /** Uncaught exceptions, one per thrown error. */
    readonly errors: string[];

    /** `console.error` output, which is where a framework reports what it survived. */
    readonly logged: string[];

    /** Content-Security-Policy refusals, as `directive blocked-uri`. */
    violations(): Promise<string[]>;

}

/**
 * Watch a page for everything it will not tell you by looking right.
 *
 * Call it before the first `goto`. The policy violations are read back through the page
 * rather than collected here, because a violation is a DOM event with no protocol-level
 * trace: the browser fires `securitypolicyviolation` at the document and nothing crosses
 * the wire, so the only place to hear it is inside the page.
 */
export async function watch(page: Page): Promise<PageComplaints> {
    const failed: string[] = [];
    const errors: string[] = [];
    const logged: string[] = [];

    page.on('response', (response: Response) => {
        if (response.status() >= 400) {
            failed.push(`${response.status()} ${response.url()}`);
        }
    });

    page.on('requestfailed', (request: Request) => {
        failed.push(`failed ${request.url()} (${request.failure()?.errorText ?? 'no reason given'})`);
    });

    page.on('pageerror', (error: Error) => {
        errors.push(error.message);
    });

    page.on('console', (message: ConsoleMessage) => {
        if (message.type() === 'error') {
            logged.push(message.text());
        }
    });

    await page.addInitScript(() => {
        const collected: string[] = [];

        (window as unknown as { __violations: string[] }).__violations = collected;

        document.addEventListener('securitypolicyviolation', (event: SecurityPolicyViolationEvent) => {
            collected.push(`${event.violatedDirective} ${event.blockedURI}`);
        });
    });

    return {
        failed,
        errors,
        logged,
        violations: (): Promise<string[]> =>
            page.evaluate(() => (window as unknown as { __violations: string[] }).__violations ?? []),
    };
}

/** The pages this suite visits, in both locales, as paths from the site root. */
export const PAGES: readonly string[] = ['/', '/fr/'];
