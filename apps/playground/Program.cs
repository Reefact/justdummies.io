using JustDummies.Playground;

using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

// No HttpClient is registered, and that is deliberate: the playground makes no network call at
// all (§18.4). Everything it shows is computed in the browser by the library itself, so there is
// nothing to fetch and no endpoint to expose.
WebAssemblyHostBuilder builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

await builder.Build().RunAsync();
