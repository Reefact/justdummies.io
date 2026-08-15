using JustDummies.Playground;
using JustDummies.Playground.Localization;

using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

// No HttpClient is registered, and that is deliberate: the playground makes no network call at
// all (§18.4). Everything it shows is computed in the browser by the library itself, so there is
// nothing to fetch and no endpoint to expose.
WebAssemblyHostBuilder builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// One instance for the whole app — there is only ever one "scope" in a WASM client — read from
// the page's own `?lang=` the moment anything first injects it (see LocaleState's constructor).
builder.Services.AddScoped<LocaleState>();

await builder.Build().RunAsync();
