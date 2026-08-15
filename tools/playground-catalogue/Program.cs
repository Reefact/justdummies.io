using JustDummies;
using JustDummies.PlaygroundCatalogueGenerator;

if (args.Length < 2) {
    Console.Error.WriteLine("usage: JustDummies.PlaygroundCatalogue <generated-output-dir> <exclusion-file>");
    return 1;
}

var outputDir       = args[0];
var exclusionPath   = args[1];
var libraryAssembly = typeof(Any).Assembly;
var assemblyDir     = Path.GetDirectoryName(libraryAssembly.Location)!;
var docPath         = Path.Combine(assemblyDir, "JustDummies.xml");

if (!File.Exists(docPath)) {
    Console.Error.WriteLine($"error: no XML documentation file found at '{docPath}'.");
    Console.Error.WriteLine("The JustDummies package is expected to ship one next to its assembly (lib/<tfm>/JustDummies.xml).");
    Console.Error.WriteLine("The playground's help text (specification §10.7) depends on it — this is a hard failure, not a per-member warning.");
    return 1;
}

var docs = DocComments.Load(docPath);

ManualExclusions manualExclusions;
try {
    manualExclusions = ManualExclusions.Load(exclusionPath);
} catch (Exception ex) {
    Console.Error.WriteLine($"error: could not load '{exclusionPath}': {ex.Message}");
    return 1;
}

WalkResult result;
try {
    result = new CatalogueWalker(libraryAssembly, docs, manualExclusions).Walk();
} catch (Exception ex) {
    Console.Error.WriteLine($"error: {ex.Message}");
    return 1;
}

// Self-check (specification §10.5): the descriptor key set and the dispatch key set must be
// identical — a bug in either emitter, independently, would otherwise ship silently.
var descriptorKeys = result.EntryPoints.Concat(result.Members).Select(e => e.Key).ToHashSet();
var dispatchKeys    = result.EntryPoints.Concat(result.Members).Select(e => e.Key).ToHashSet();
if (!descriptorKeys.SetEquals(dispatchKeys)) {
    Console.Error.WriteLine("error: descriptor and dispatch key sets disagree — this is a generator bug.");
    return 1;
}

Directory.CreateDirectory(outputDir);
File.WriteAllText(Path.Combine(outputDir, "PlaygroundCatalogue.Descriptors.g.cs"), DescriptorEmitter.Emit(result));
File.WriteAllText(Path.Combine(outputDir, "PlaygroundCatalogue.Dispatch.g.cs"), DispatchEmitter.Emit(result));
File.WriteAllText(Path.Combine(outputDir, "PlaygroundCatalogue.Excluded.g.md"), ExclusionReport.Emit(result));

if (result.UnusedManualExclusions.Count > 0) {
    Console.WriteLine($"warning: {result.UnusedManualExclusions.Count} stale entr(ies) in '{exclusionPath}' matched nothing — see the excluded-members report.");
}

Console.WriteLine(
    $"catalogued {result.EntryPoints.Count} entry point(s) and {result.Members.Count} chain step(s) " +
    $"across {result.ReceiverTypes.Count} receiver type(s); " +
    $"{result.AutoExcluded.Count} auto-excluded, {result.ManuallyExcluded.Count} manually excluded.");

return 0;
