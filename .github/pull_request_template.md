<!--
  Please write this PR in ENGLISH: title, summary, changes, testing notes, and related issue references.
  See CONTRIBUTING.md -> "Language".

  Title: name the whole change in English. A single-intention PR mirrors its commit
  header (type(scope): description); a multi-intention PR uses a short descriptive
  title. Issue links go in "Related issues" below, not the title.
  See CONTRIBUTING.md -> "Pull request titles".

  Fill in the applicable sections below.
  Do not invent information.
  Only check testing items that were actually run.
  Delete a section only if it truly does not apply.
-->

## Summary

<!-- One or two sentences: what does this PR change, and why? -->

## Type of change

* [ ] Bug fix
* [ ] New feature
* [ ] Breaking change
* [ ] Refactoring
* [ ] Content / copy change
* [ ] Tests
* [ ] Documentation
* [ ] Build / CI / tooling

## Changes

<!-- Bullet list of the concrete changes made in this PR. Keep it factual. -->

*

## Testing

<!-- Check only the commands/tests that were actually run. Add details if something was not run. -->

* [ ] `pnpm check` (type-check the site)
* [ ] `pnpm build` (build the artefact)
* [ ] `./scripts/validate-snippets.sh`
* [ ] `./scripts/check-budgets.sh`
* [ ] `dotnet build` on the affected `.csproj`(s)
* [ ] Verified in a browser (`pnpm test:browser` or manual check)

## Documentation

<!-- State whether documentation was updated, or why no documentation change was needed. -->

* [ ] English/French pair under `docs/for-maintainers/` kept in sync (deployment guide, ADRs) — see CONTRIBUTING.md -> "Language"
* [ ] README / other docs updated
* [ ] No documentation change required

## Architecture decisions

<!-- Every pull request is checked against the ADR base (docs/for-maintainers/adr/). Most
     embark no architectural decision — tick the first box. Agents draft ADRs as
     `Proposed`; the maintainer accepts or supersedes. See docs/for-maintainers/adr/README.md. -->

* [ ] No architectural decision in this pull request
* [ ] New decision recorded — ADR drafted as `Proposed`: ADR-____

## Related issues

<!-- `Closes #NN` if this PR closes an issue (GitHub closes it on merge); `Refs: #NN` otherwise. -->
