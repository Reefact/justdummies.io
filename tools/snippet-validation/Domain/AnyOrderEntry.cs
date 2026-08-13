// Scaffolded by dum (JustDummies). This file is yours: read it, edit it, commit it.
// `dum generate Order --entry-point any --force` overwrites it.
// It needs C# 14: a static extension member is what reaches this spelling without touching the library.

// ---------------------------------------------------------------------------------------
// Written by hand here, and that is a fact about the pinned tool rather than about the
// file. `--entry-point any` landed after cli-v1.0.0-beta.1, which is the version
// .config/dotnet-tools.json pins and therefore the version generate-tool-output.sh runs. So
// this is the shape that tool will write once it is released — copied from the emitter's own
// approved output, with the namespace this project uses — and nothing on the site claims the
// tool produced it.
//
// When a `dum` carrying --entry-point is released: bump the pin, run
// `dum generate Order --entry-point any --force`, and this comment goes away with the
// hand-writing it explains.
// ---------------------------------------------------------------------------------------

using JustDummies;

namespace JustDummies.SnippetValidation.Domain;

/// <summary>Hangs <c>Any.Order()</c> off the library's own entry point.</summary>
public static class AnyOrderEntry {

    extension(Any) {

        /// <summary>Starts an arbitrary <c>Order</c>: constrain it through <c>With…</c>, then <c>Generate()</c>.</summary>
        public static AnyOrder Order() {
            return new AnyOrder();
        }

    }

}
