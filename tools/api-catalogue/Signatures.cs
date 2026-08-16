using System.Reflection;

namespace JustDummies.ApiCatalogue;

/// <summary>
///     Renders reflected types and members as the C# a reader would type — never the CLR's own
///     spelling (<c>Decimal</c>, <c>Int32</c>, backtick arity) unless the reader would type that
///     too.
/// </summary>
internal static class Signatures {

    private static readonly Dictionary<string, string> AliasByClrName = new() {
        ["String"] = "string",
        ["Int32"] = "int",
        ["Int64"] = "long",
        ["Int16"] = "short",
        ["Boolean"] = "bool",
        ["Decimal"] = "decimal",
        ["Double"] = "double",
        ["Single"] = "float",
        ["Byte"] = "byte",
        ["SByte"] = "sbyte",
        ["Void"] = "void",
        ["Object"] = "object",
    };

    /// <summary>The raw reflected name, backtick arity included — the key <c>TypeCategory</c> is keyed by.</summary>
    public static string SimpleName(Type type) => type.Name;

    /// <summary>The declaration a reader would write: <c>public sealed class AnyString</c>, <c>public interface IAny&lt;T&gt;</c>.</summary>
    public static string TypeSignature(Type type) =>
        $"public {KindWord(type)} {Declared(type)}{ConstraintClauses(type.IsGenericType ? type.GetGenericArguments() : [])}";

    public static string Kind(Type type) => KindWord(type);

    private static string KindWord(Type type) {
        if (type.IsInterface) {
            return "interface";
        }

        if (type.IsEnum) {
            return "enum";
        }

        if (type.IsAbstract && type.IsSealed) {
            return "static class";
        }

        if (type.IsAbstract) {
            return "abstract class";
        }

        return type.IsSealed ? "sealed class" : "class";
    }

    /// <summary>The type's own name and generic parameters, with no base or interface list — <c>AnyArray&lt;T&gt;</c>, not what it implements.</summary>
    public static string Declared(Type type) {
        if (!type.IsGenericType) {
            return type.Name;
        }

        string bareName = type.Name[..type.Name.IndexOf('`')];
        string parameters = string.Join(", ", type.GetGenericArguments().Select(argument => argument.Name));

        return $"{bareName}<{parameters}>";
    }

    /// <summary>A base type worth stating on the page, or null for <see cref="object" /> and the other roots nobody declares against on purpose.</summary>
    public static string? MeaningfulBase(Type type) {
        Type? baseType = type.BaseType;

        if (baseType is null || baseType == typeof(object) || baseType == typeof(ValueType) || baseType == typeof(Enum) || baseType == typeof(Attribute)) {
            return null;
        }

        return Friendly(baseType);
    }

    /// <summary>Every interface the type declares — <c>GetInterfaces()</c> already flattens inherited ones, which is what a reader wants: what can I pass this as.</summary>
    public static string[] Implements(Type type) => type.GetInterfaces().Select(Friendly).ToArray();

    public static string MethodSignature(MethodInfo method, string? staticContext = null) {
        string genericParameters = method.IsGenericMethodDefinition
            ? $"<{string.Join(", ", method.GetGenericArguments().Select(argument => argument.Name))}>"
            : "";
        // `this` on the first parameter is what tells a reader `generator.As(factory)` is the
        // call, not `AnyExtensions.As(generator, factory)` — true of it, but not how anyone
        // holding an IAny<T> would ever spell it.
        bool isExtensionMethod = method.IsDefined(typeof(System.Runtime.CompilerServices.ExtensionAttribute), inherit: false);
        string parameters = string.Join(
            ", ",
            method.GetParameters().Select((parameter, index) => {
                string thisPrefix = isExtensionMethod && index == 0 ? "this " : "";

                return $"{thisPrefix}{Friendly(parameter.ParameterType)} {parameter.Name}";
            }));
        string call = $"{method.Name}{genericParameters}({parameters})";
        string constraints = method.IsGenericMethodDefinition ? ConstraintClauses(method.GetGenericArguments()) : "";

        return staticContext is null
            ? $"{Friendly(method.ReturnType)} {call}{constraints}"
            : $"static {Friendly(method.ReturnType)} {staticContext}.{call}{constraints}";
    }

    /// <summary>
    ///     The <c>where T : …</c> clauses a reader would type for a set of generic parameters —
    ///     <c>AnyEnum&lt;TEnum&gt;</c> only makes sense <c>where TEnum : struct, Enum</c>, and
    ///     that restriction is exactly the kind of fact a signature is for.
    /// </summary>
    private static string ConstraintClauses(Type[] genericParameters) {
        List<string> clauses = [];

        foreach (Type parameter in genericParameters) {
            GenericParameterAttributes attributes = parameter.GenericParameterAttributes;
            bool isValueType = (attributes & GenericParameterAttributes.NotNullableValueTypeConstraint) != 0;
            bool isReferenceType = (attributes & GenericParameterAttributes.ReferenceTypeConstraint) != 0;
            bool hasDefaultConstructor = (attributes & GenericParameterAttributes.DefaultConstructorConstraint) != 0;

            List<string> parts = [];

            if (isValueType) {
                parts.Add("struct");
            } else if (isReferenceType) {
                parts.Add("class");
            }

            // ValueType and Enum are both reported as "type constraints" for `where T : struct,
            // Enum` — ValueType is what `struct` already means in C# syntax, so printing it
            // again would say the same requirement twice in different words.
            parts.AddRange(
                parameter.GetGenericParameterConstraints()
                    .Where(constraint => constraint != typeof(ValueType))
                    .Select(Friendly));

            // A value type already has a parameterless constructor by definition; `new()` on
            // top of `struct` would be C# rejecting its own redundancy at compile time.
            if (hasDefaultConstructor && !isValueType) {
                parts.Add("new()");
            }

            if (parts.Count > 0) {
                clauses.Add($"where {parameter.Name} : {string.Join(", ", parts)}");
            }
        }

        return clauses.Count > 0 ? $" {string.Join(" ", clauses)}" : "";
    }

    public static string ConstructorSignature(ConstructorInfo constructor) {
        string parameters = string.Join(", ", constructor.GetParameters().Select(parameter => $"{Friendly(parameter.ParameterType)} {parameter.Name}"));

        return $"{constructor.DeclaringType!.Name}({parameters})";
    }

    public static string PropertySignature(PropertyInfo property) {
        string accessors = (property.CanRead ? "get; " : "") + (property.CanWrite ? "set; " : "");
        string prefix = (property.GetMethod ?? property.SetMethod)!.IsStatic ? "static " : "";

        return $"{prefix}{Friendly(property.PropertyType)} {property.Name} {{ {accessors}}}";
    }

    /// <summary>A type as a reader would write it in a signature — aliased primitives, <c>Nullable&lt;T&gt;</c> as <c>T?</c>, generics spelled out.</summary>
    public static string Friendly(Type type) {
        if (type.IsGenericParameter) {
            return type.Name;
        }

        Type? nullableUnderlying = Nullable.GetUnderlyingType(type);

        if (nullableUnderlying is not null) {
            return $"{Friendly(nullableUnderlying)}?";
        }

        if (type.IsArray) {
            return $"{Friendly(type.GetElementType()!)}[]";
        }

        if (type.IsGenericType) {
            string bareName = type.Name[..type.Name.IndexOf('`')];
            string arguments = string.Join(", ", type.GetGenericArguments().Select(Friendly));

            return $"{bareName}<{arguments}>";
        }

        return AliasByClrName.GetValueOrDefault(type.Name, type.Name);
    }

    /// <summary>A stable, readable identifier for anchors and search — <c>AnyDateTimeOffset</c> becomes <c>any-date-time-offset</c>.</summary>
    public static string Slug(string name) {
        string withoutArity = name.Contains('`') ? name[..name.IndexOf('`')] : name;
        System.Text.StringBuilder hyphenated = new();

        for (int index = 0; index < withoutArity.Length; index++) {
            char character = withoutArity[index];
            bool startsNewWord = index > 0 && char.IsUpper(character) && !char.IsUpper(withoutArity[index - 1]);

            if (startsNewWord) {
                hyphenated.Append('-');
            }

            hyphenated.Append(char.ToLowerInvariant(character));
        }

        return hyphenated.ToString();
    }
}
