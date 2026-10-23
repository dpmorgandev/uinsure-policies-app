using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Uinsure.Policies.Architecture.Tests.Support;
using Xunit;

namespace Uinsure.Policies.Architecture.Tests;

// Launch profiles, read from the source file, because WebApplicationFactory never reads launchSettings.json:
// 'https' first (dotnet run's default) on 7080 and 5080, 'http' on 5080 for the loop and Postman, both
// Development, and neither trusting forwarded headers from any proxy. The behaviour proof is the HITL run.
public sealed class LaunchProfileTests
{
    private static readonly string LaunchSettings =
        RepoPaths.Combine("src", "Uinsure.Policies.Api", "Properties", "launchSettings.json");

    [Fact]
    public void Https_is_the_first_launch_profile_on_7080_and_5080()
    {
        var (name, profile) = Profiles().First();

        Assert.Equal("https", name);
        Assert.Equal("Project", profile.GetProperty("commandName").GetString());
        Assert.Equal("https://localhost:7080;http://localhost:5080", profile.GetProperty("applicationUrl").GetString());
    }

    [Fact]
    public void Http_launch_profile_serves_5080_only()
    {
        var profile = Assert.Single(Profiles(), entry => entry.Name == "http").Profile;

        Assert.Equal("Project", profile.GetProperty("commandName").GetString());
        Assert.Equal("http://localhost:5080", profile.GetProperty("applicationUrl").GetString());
    }

    [Fact]
    public void Https_and_http_profiles_run_in_Development_and_never_enable_forwarded_headers_for_any_proxy()
    {
        var profiles = Profiles();

        Assert.Equal(["https", "http"], profiles.Select(entry => entry.Name));
        Assert.All(profiles, entry =>
        {
            var environment = entry.Profile.GetProperty("environmentVariables");
            Assert.Equal("Development", environment.GetProperty("ASPNETCORE_ENVIRONMENT").GetString());
            Assert.False(environment.TryGetProperty("ASPNETCORE_FORWARDEDHEADERS_ENABLED", out _), $"Profile '{entry.Name}' trusts forwarded headers from any proxy.");
        });
    }

    // Visual Studio reads <solution name without extension>.slnLaunch beside the solution, so a file named after
    // the full 'Uinsure.Policies.slnx' is never read and the 'API and web' profile never reaches the dropdown.
    [Fact]
    public void Solution_launch_profile_file_is_named_after_the_solution_without_its_extension_and_holds_the_API_and_web_profile()
    {
        var solution = Assert.Single(Directory.GetFiles(RepoPaths.Root, "*.slnx"));
        var stale = solution + ".slnLaunch";

        Assert.False(File.Exists(stale), $"{RepoPaths.Relative(stale)} is a name Visual Studio never reads; only one profile file may exist.");
        Assert.True(File.Exists(SolutionLaunchProfile), $"{RepoPaths.Relative(SolutionLaunchProfile)} does not exist.");

        var projects = ApiAndWebProjects();
        var api = Assert.Single(projects, project => project.GetProperty("Path").GetString() == ApiProjectPath);
        Assert.Equal("Start", api.GetProperty("Action").GetString());
        Assert.Equal("http", api.GetProperty("DebugTarget").GetString());
        var web = Assert.Single(projects, project => project.GetProperty("Path").GetString() == WebProjectPath);
        Assert.Equal("Start", web.GetProperty("Action").GetString());
    }

    // The JavaScript SDK's F5 targets are the browser configurations in the project's .vscode/launch.json; the
    // profile's Docket.Web entry selects one by name, else VS can't resolve its remembered debugger.
    [Fact]
    public void API_and_web_profile_debugs_the_web_app_in_one_browser_launch_configuration_on_the_dev_server_port()
    {
        Assert.True(File.Exists(WebLaunchJson), $"{RepoPaths.Relative(WebLaunchJson)} does not exist: Docket.Web has no browser debug target.");
        var port = DevServerPort();
        var configurations = WebLaunchConfigurations();

        var web = Assert.Single(ApiAndWebProjects(), project => project.GetProperty("Path").GetString() == WebProjectPath);
        Assert.True(web.TryGetProperty("DebugTarget", out var debugTarget), "The Docket.Web entry names no DebugTarget.");
        var configuration = Assert.Single(configurations, entry => entry.GetProperty("name").GetString() == debugTarget.GetString());

        Assert.Equal("4170", port);
        Assert.Equal("launch", configuration.GetProperty("request").GetString());
        Assert.Contains(configuration.GetProperty("type").GetString(), new[] { "edge", "chrome" });
        Assert.Equal($"http://localhost:{port}", configuration.GetProperty("url").GetString());
    }

    private const string ApiProjectPath = @"src\Uinsure.Policies.Api\Uinsure.Policies.Api.csproj";
    private const string WebProjectPath = @"src\web\Docket.Web.esproj";

    private static readonly string SolutionLaunchProfile = RepoPaths.Combine("Uinsure.Policies.slnLaunch");
    private static readonly string WebLaunchJson = RepoPaths.Combine("src", "web", ".vscode", "launch.json");
    private static readonly string WebProject = RepoPaths.Combine("src", "web", "Docket.Web.esproj");

    private static JsonElement[] ApiAndWebProjects()
    {
        using var json = JsonDocument.Parse(File.ReadAllText(SolutionLaunchProfile));
        var profile = Assert.Single(json.RootElement.EnumerateArray(), entry => entry.GetProperty("Name").GetString() == "API and web");
        return [.. profile.GetProperty("Projects").EnumerateArray().Select(project => project.Clone())];
    }

    private static JsonElement[] WebLaunchConfigurations()
    {
        var options = new JsonDocumentOptions { CommentHandling = JsonCommentHandling.Skip, AllowTrailingCommas = true };
        using var json = JsonDocument.Parse(File.ReadAllText(WebLaunchJson), options);
        return [.. json.RootElement.GetProperty("configurations").EnumerateArray().Select(entry => entry.Clone())];
    }

    private static string DevServerPort()
    {
        var command = XDocument.Load(WebProject).Descendants("StartupCommand").Single().Value;
        var match = Regex.Match(command, @"--port (\d+)");
        Assert.True(match.Success, $"The StartupCommand '{command}' sets no --port.");
        return match.Groups[1].Value;
    }

    private static (string Name, JsonElement Profile)[] Profiles()
    {
        using var json = JsonDocument.Parse(File.ReadAllText(LaunchSettings));
        return [.. json.RootElement.GetProperty("profiles").EnumerateObject()
            .Select(profile => (profile.Name, profile.Value.Clone()))];
    }
}
