using System.Text.RegularExpressions;

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

var descriptorsText = DescriptorEmitter.Emit(result);
var dispatchText    = DispatchEmitter.Emit(result);

// Self-check (specification §10.5): the key set actually present in each *emitted* file must be
// identical — read back from the generated text itself, not from the shared WalkResult both
// emitters were fed, so an emitter bug that drops or duplicates a key is actually caught rather
// than trivially agreeing with itself.
var descriptorKeys = ExtractKeys(descriptorsText, new Regex("new MemberDescriptor\\(\"((?:[^\"\\\\]|\\\\.)*)\""));
var dispatchKeys    = ExtractKeys(dispatchText, new Regex("^\\s*\\[\"((?:[^\"\\\\]|\\\\.)*)\"\\]\\s*=\\s*\\(receiver", RegexOptions.Multiline));
if (!descriptorKeys.SetEquals(dispatchKeys)) {
    Console.Error.WriteLine("error: descriptor and dispatch key sets disagree — this is a generator bug.");
    foreach (var onlyInDescriptors in descriptorKeys.Except(dispatchKeys).OrderBy(k => k, StringComparer.Ordinal)) {
        Console.Error.WriteLine($"  only in descriptors: {onlyInDescriptors}");
    }
    foreach (var onlyInDispatch in dispatchKeys.Except(descriptorKeys).OrderBy(k => k, StringComparer.Ordinal)) {
        Console.Error.WriteLine($"  only in dispatch: {onlyInDispatch}");
    }
    return 1;
}

Directory.CreateDirectory(outputDir);
File.WriteAllText(Path.Combine(outputDir, "PlaygroundCatalogue.Descriptors.g.cs"), descriptorsText);
File.WriteAllText(Path.Combine(outputDir, "PlaygroundCatalogue.Dispatch.g.cs"), dispatchText);
File.WriteAllText(Path.Combine(outputDir, "PlaygroundCatalogue.Excluded.g.md"), ExclusionReport.Emit(result));

if (result.UnusedManualExclusions.Count > 0) {
    Console.WriteLine($"warning: {result.UnusedManualExclusions.Count} stale entr(ies) in '{exclusionPath}' matched nothing — see the excluded-members report.");
}

Console.WriteLine(
    $"catalogued {result.EntryPoints.Count} entry point(s) and {result.Members.Count} chain step(s) " +
    $"across {result.ReceiverTypes.Count} receiver type(s); " +
    $"{result.AutoExcluded.Count} auto-excluded, {result.ManuallyExcluded.Count} manually excluded.");

return 0;

static HashSet<string> ExtractKeys(string emittedText, Regex keyPattern) =>
    keyPattern.Matches(emittedText).Select(m => m.Groups[1].Value.Replace("\\\"", "\"").Replace("\\\\", "\\")).ToHashSet();
