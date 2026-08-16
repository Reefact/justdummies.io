using JustDummies.Playground.Catalogue;

namespace JustDummies.Playground.Components;

/// <summary>One line of the chain the visitor is building: the method chosen for it, if any, and
/// the raw text of each of its arguments.</summary>
public sealed class ChainLinkState {

    public MemberDescriptor? Chosen { get; set; }

    /// <summary>Set after a replay of the chain: an argument-parse failure or the library's own
    /// refusal at this step, or null while the step ran cleanly.</summary>
    public string? Error { get; set; }

    /// <summary>Which argument <see cref="Error" /> is about, when it names one specific
    /// argument (a parse failure) rather than the whole call (a library refusal) — lets the UI
    /// point a screen reader at just the offending input instead of every input in the step.</summary>
    public int? ErrorArgumentIndex { get; set; }

    private readonly List<string> _arguments = new();

    public void ChooseMethod(MemberDescriptor chosen) {
        Chosen = chosen;
        _arguments.Clear();
        _arguments.AddRange(Enumerable.Repeat(string.Empty, chosen.Parameters.Count));
    }

    public string Argument(int index) => index < _arguments.Count ? _arguments[index] : string.Empty;

    public void SetArgument(int index, string value) {
        while (_arguments.Count <= index) {
            _arguments.Add(string.Empty);
        }

        _arguments[index] = value;
    }

    public IReadOnlyList<string> Arguments => _arguments;

}
