using System.Net;
using System.Reflection;
using System.Text.Json;
using System.Xml.Linq;
using Uinsure.Policies.Api.Tests.Support;
using Xunit;

namespace Uinsure.Policies.Api.Tests;

// bug-002 N5 (inv-009 #16, I21): the API project declares one version (a <Version> property in its csproj),
// the built assembly carries it, and the OpenAPI document's info.version is that version rather than the
// generator's default. The csproj is read from source, found from the solution file above the test output.
// Traited SELL-4 as the node's one rule, so the node's rule filter runs this reproduction with the other.
public sealed class OpenApiVersionTests : IClassFixture<PoliciesApiFactory>
{
    private const string SolutionFile = "Uinsure.Policies.slnx";
    private const string ApiProject = "src/Uinsure.Policies.Api/Uinsure.Policies.Api.csproj";

    private readonly PoliciesApiFactory _factory;

    public OpenApiVersionTests(PoliciesApiFactory factory)
    {
        _factory = factory;
        _factory.ResetClock();
    }

    [Fact]
    [Trait("Rule", "SELL-4")]
    public async Task OpenApi_info_version_is_the_version_the_API_project_declares()
    {
        var declared = DeclaredApiVersion();
        var informational = typeof(Program).Assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion;
        Assert.Equal(declared, informational?.Split('+')[0]);
        using var client = _factory.CreateClient();

        using var response = await client.GetAsync("/openapi/v1.json", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal(declared, document.RootElement.GetProperty("info").GetProperty("version").GetString());
    }

    // Exactly one non-empty <Version> property in the API csproj. Package versions are attributes under
    // central package management, so they are not <Version> elements and are not counted.
    private static string DeclaredApiVersion()
    {
        var project = XDocument.Load(Path.Combine(RepoRoot(), ApiProject));
        var versions = project.Descendants("Version").Select(element => element.Value.Trim()).ToList();
        Assert.True(versions.Count == 1, $"{ApiProject} declares {versions.Count} <Version> properties; expected exactly one.");
        Assert.False(string.IsNullOrWhiteSpace(versions[0]), $"{ApiProject} declares an empty <Version>.");
        return versions[0];
    }

    private static string RepoRoot()
    {
        for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
        {
            if (File.Exists(Path.Combine(directory.FullName, SolutionFile)))
            {
                return directory.FullName;
            }
        }

        throw new InvalidOperationException($"{SolutionFile} was not found above {AppContext.BaseDirectory}.");
    }
}
