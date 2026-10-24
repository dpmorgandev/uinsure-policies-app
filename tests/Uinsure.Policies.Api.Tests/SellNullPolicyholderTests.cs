using System.Text.Json.Nodes;
using Uinsure.Policies.Api.Tests.Builders;
using Uinsure.Policies.Api.Tests.Support;
using Xunit;

namespace Uinsure.Policies.Api.Tests;

// SELL-4's input: a null element in policyholders is a shape error, not a holder. Strict input makes it a
// 400 ValidationProblemDetails keyed policyholders[i] (the index of the null element), with no ruleId, checked
// before the request is mapped, so nothing is stored. bug-002 N5: on main each body answered 500.
public sealed class SellNullPolicyholderTests : IClassFixture<PoliciesApiFactory>
{
    private readonly PoliciesApiFactory _factory;

    public SellNullPolicyholderTests(PoliciesApiFactory factory)
    {
        _factory = factory;
        _factory.ResetClock();
    }

    [Fact]
    [Trait("Rule", "SELL-4")]
    public async Task Policyholders_of_only_a_null_element_is_rejected_with_400_keyed_policyholders_0()
    {
        using var client = _factory.CreateClient();
        var body = new SellPolicyRequestBuilder("SELL4-NULL-ONLY").Build();
        body["policyholders"] = new JsonArray((JsonNode?)null);

        using var response = await client.PostPolicy(body);

        var errors = await ProblemAssert.ValidationErrors(response);
        ProblemAssert.HasError(errors, "policyholders[0]");
        await client.AssertNotStored("SELL4-NULL-ONLY");
    }

    // The valid holder at index 0 is not reported; only the null element at index 1 is.
    [Fact]
    [Trait("Rule", "SELL-4")]
    public async Task Null_element_after_a_valid_policyholder_is_rejected_with_400_keyed_policyholders_1()
    {
        using var client = _factory.CreateClient();
        var body = new SellPolicyRequestBuilder("SELL4-NULL-SECOND").Build();
        body["policyholders"] = new JsonArray(new PolicyholderBuilder().WithName("Grace", "Hopper").Build(), null);

        using var response = await client.PostPolicy(body);

        var errors = await ProblemAssert.ValidationErrors(response);
        ProblemAssert.HasError(errors, "policyholders[1]");
        Assert.False(errors.TryGetProperty("policyholders[0]", out _), $"errors reports the valid holder at index 0: {errors}");
        await client.AssertNotStored("SELL4-NULL-SECOND");
    }
}
