// The recipe `dum generate Order` writes, before the one edit the second act is about.
//
// WHY IT IS COPIED HERE RATHER THAN READ OFF THE TOOL'S OUTPUT. Everything this site
// publishes is compiled with the library's analyzers enabled, and a figure lifted out of a
// temporary directory during the build would be the one exception. So the recipe lives in a
// compiled file like every other snippet — and `generate-tool-output.sh` runs the tool for
// real and fails the build if what it writes is no longer what is written here. Compiled,
// and still the tool's own words.
//
// The type is trimmed to what has to compile: the recipe, somewhere for it to point, and a
// draw. Its `With…` overloads are the neighbouring file's business, not this one's.

using JustDummies;

namespace JustDummies.SnippetValidation.Domain.Scaffolded;

/// <summary>
///     <see cref="Domain.AnyOrder" /> as the tool first wrote it — every guard it could read,
///     and a `reference` recipe that draws a string the domain will refuse.
/// </summary>
public sealed class AnyOrder : IAny<Order> {

    private readonly IAny<OrderReference> _reference;
    private readonly IAny<CustomerId>     _customerId;
    private readonly IAny<Money>          _total;
    private readonly IAny<OrderStatus>    _status;

    /// <summary>Creates the generator with a default recipe for every constructor parameter.</summary>
    // <snippet:scaffolded-recipe>
    public AnyOrder()
        : this(reference:  Any.String().NonEmpty().WithMaxLength(20).As(OrderReference.Create),
               customerId: Any.Guid().NonEmpty().As(CustomerId.Create),
               total:      Any.Decimal().Positive().As(Money.Create),
               status:     Any.Enum<OrderStatus>()) { }
    // </snippet:scaffolded-recipe>

    private AnyOrder(IAny<OrderReference> reference,
                     IAny<CustomerId>     customerId,
                     IAny<Money>          total,
                     IAny<OrderStatus>    status) {
        _reference  = reference;
        _customerId = customerId;
        _total      = total;
        _status     = status;
    }

    /// <summary>Produces one arbitrary <see cref="Order" />, or throws, which is the point.</summary>
    public Order Generate() {
        return new Order(_reference.Generate(),
                         _customerId.Generate(),
                         _total.Generate(),
                         _status.Generate());
    }

}
