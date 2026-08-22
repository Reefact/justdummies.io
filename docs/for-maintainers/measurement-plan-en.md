# The measurement plan

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](measurement-plan-fr.md)

What each measurement is for, across all three lanes. Written before the events were, because the
usual way an analytics property becomes useless is that events are added one at a time, each one
sensible on its own, until nobody can say what any of them answers.

**The rule for adding one:** name the question first. If the question is already answered by an event
that exists, or if no decision would change whichever way the answer came out, the event does not get
added. An unread dimension is not free — it is one more thing every later reader has to rule out.

## The three lanes

| Lane | What it carries | Consent | Who it covers |
|---|---|---|---|
| Cloudflare Web Analytics | visits, and whether pages load quickly (§15.1) | not required | everyone |
| The Worker collector on `/_event` | the dimensioned exit events (§15.2) | not required | everyone |
| Google Analytics 4 | the journey between the two (ADR-0018) | **required** | those who accept |

The first two are the totals; the third is the explanation. **Read a rate against lane two, never
against lane three** — lane three's denominator is the consenting fraction, so a conversion rate
computed there is a rate among people who accepted analytics, which is not a fact about the page.

## The events lane two counts

Two, and they are the two exits whose **rate** has to be readable. Lane two is the only lane a rate
may be computed against, so an exit measured in lane three alone is an exit whose denominator is the
consenting fraction — which is not a fact about the page.

| Event | Fires when | Fields | The question |
|---|---|---|---|
| `install-command-copied` | a command is copied | `placement`, `variant`, `ordinal` | which moment convinced them, and by which door? |
| `download-fab-clicked` | the floating download control is clicked | `placement` | does a permanent call to action on every page earn its place? |

`locale` travels with both. The names are kebab-case here and snake_case in lane three because each
lane keeps its own convention: GA4 reports on an event name it also uses for its own, and the
collector writes a blob nobody else reads.

**A variant is carried by the event that has one.** A copy has two doors behind it — the CLI and the
Package Manager Console — and which one was taken is precisely what §15.2 asks for. The download
control has one door, so it sends no variant and the collector records an empty one rather than an
invented word ([ADR-0023](adr/0023-an-event-carries-a-variant-only-when-it-has-a-door-to-choose-en.md)).

**The download control reports the section it was clicked from**, not the exact page — `home`, `api`,
`release-notes`, `not-found`. That is the granularity the decision is taken at: a floating control is
kept or dropped across `/api/`, never on one entry page of it. The exact address is lane three's to
give, and it gives it without being asked.

## The events lane three reports

`content_locale` is attached to every one of them, so it is not repeated below. It is the document's
own language — the locale the reader chose — and not the browser's, which GA4 already reports as
`language`. What is wanted is which half of the site convinced somebody, not where they were sitting.

| Event | Fires when | Parameters | The question |
|---|---|---|---|
| `scene_view` | a scene has held the middle of the viewport for about a second | `scene_name`, `act`, `scene_ordinal` | where do readers stop? |
| `act_reached` | the first scene of an act is read | `act` | the three-step funnel |
| `install_command_copied` | a command is copied — the same DOM event lane two listens to | `placement`, `variant`, `scene_ordinal` | which moment convinced them? |
| `install_variant_switched` | the CLI ↔ Package Manager tab is switched | `placement`, `variant` | is the default tab the right one? |
| `nuget_link_clicked` | a NuGet link is followed | `placement`, `variant`, `link_url` | the exit nobody was watching |
| `download_fab_clicked` | the floating download link is clicked | `placement` | is a permanent call to action on every page pulling its weight, or visual noise? |
| `playground_started` | the hero's Run button is pressed | — | the strongest intent on the page: agreeing to download the runtime |
| `comparison_narrowed` | the positioning page's selector is used | `competitor` | who are we being compared against? |
| `view_search_results` | the API search settles on a term | `search_term` | what is being looked for, and not found |

`install_command_copied` is the **key event**. It and `download_fab_clicked` are the two reported in
both lanes at once, deliberately: lane two counts every one of them, lane three explains the path
taken to it, and each pair is read together rather than one half instead of the other.

`download_fab_clicked` carries the section as its `placement` because that is what lane two can hold;
this lane already knows the exact page, since GA4 attaches the address to everything it reports. The
parameter is sent anyway, so the same key joins the two lanes — which is the way the plan says to
read them.

`view_search_results` carries text a visitor typed. It is the only event here that does, which is why
it is named twice before anyone can consent to it: on the banner itself, and in the privacy page's
analytics section. Disclosing it on the banner rather than only behind the link is deliberate —
consent to something a visitor has to follow a link to discover is not informed consent. The event
keeps GA4's own recommended name, which is what puts it in the site-search report rather than among
custom events nobody opens.

## What has to be registered in the GA4 console

**Not optional, and not retroactive.** A parameter that is not registered as a custom definition is
collected but not reportable, and registering it later does not backfill — the history before it was
registered stays unreadable. Register these before the first real traffic, not after the first
question.

Custom dimensions, event-scoped: `placement`, `variant`, `scene_name`, `act`, `content_locale`,
`competitor`, `link_url`. Seven of the fifty a standard property allows.

`download_fab_clicked` adds none: it reports under `placement`, which is on that list already. An
event that needs no new definition is an event whose history is readable from its first day, which is
the only kind this section can promise.

Custom metric: `scene_ordinal`.

**`scene_ordinal` is a metric and never a dimension**, and that is §15.3 applied here rather than a
preference. The page went from eleven scenes to fourteen once already and the final exit changed
ordinal; a funnel keyed on position would have made the two periods incomparable. The collector makes
the same separation by writing the ordinal among its doubles and never among its indexes. Group by
`scene_name`; read `scene_ordinal` only to sort a table.

## The settings that are part of the plan

* **Enhanced measurement: page views on browser history events must be OFF.** The landing page
  intercepts every in-page anchor click and pushes history state, so left on, each chevron click
  reports a page view. Nothing in this repository can detect it — see ADR-0018's Risks.
* Advertising personalisation off. **Google Signals stays off, which on a new property means leaving
  it alone rather than switching it off** — it ships disabled and offers to be enabled. Since June
  2026 it governs only demographic enrichment, not the flow to Google Ads, and it withholds figures
  behind sampling thresholds at low traffic.
* **Retention: 14 months for event data, 14 months for user data, and "reset on new activity" left
  on.** That makes it a sliding window — a visitor's data is erased fourteen months after their
  *last* visit rather than after collection — which is what the privacy page states, in those words.
  Change one and the other has to change with it.
* An internal-traffic filter for the maintainer.

## What is deliberately not measured

* **No scroll depth of our own.** Enhanced measurement's `scroll` is left on and is enough. On the
  landing page `scene_view` says the same thing far better, in the units the page is actually built
  from — but scenes exist only there, and on the twenty-odd other routes `scroll` is the only signal
  of whether a page was read at all. The setting is per stream rather than per page, so switching it
  off to avoid a redundancy on two pages would remove the only answer on all the others. Read
  `scene_view` on the narrative and `scroll` everywhere else; they are two granularities of one
  question, not two answers to it.
* **Nothing the playground is given.** §15.1 states that what is typed there is never recorded, and the
  playground runs entirely in the browser — there is no server to send it to.
* **No advertising signals, ever.** They are denied permanently rather than following consent, and the
  content policy names no advertising host, so a change of mind fails a check rather than shipping.
