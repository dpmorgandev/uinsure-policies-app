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

    // D2 (U10): in the 'API and web' profile Visual Studio runs Docket.Web's DebugTarget and never its
    // StartupCommand, so a browser target opens on a port nothing serves. The DebugTarget names a launch.json
    // configuration of type node that runs Vite itself, on the StartupCommand's port, failing rather than moving.
    [Fact]
    public void API_and_web_profile_debugs_the_web_app_in_a_node_configuration_that_runs_Vite_on_the_StartupCommand_port_with_strictPort()
    {
        Assert.True(File.Exists(WebLaunchJson), $"{RepoPaths.Relative(WebLaunchJson)} does not exist: Docket.Web has no debug target.");
        var port = DevServerPort();
        var configuration = WebDebugTarget();

        Assert.Equal("4170", port);
        Assert.Equal("node", configuration.GetProperty("type").GetString());
        Assert.Equal("launch", configuration.GetProperty("request").GetString());
        Assert.True(configuration.TryGetProperty("cwd", out var cwd), "The Vite configuration sets no cwd; its program path is relative to the project.");
        Assert.Equal("${workspaceFolder}", cwd.GetString()?.Replace('\\', '/').TrimEnd('/'));
        Assert.True(configuration.TryGetProperty("program", out var program), "The Vite configuration names no program.");
        Assert.Equal("node_modules/vite/bin/vite.js", ProjectRelative(program.GetString()));

        var args = Arguments(configuration);
        Assert.Equal(port, ArgumentValue(args, "--port"));
        Assert.Contains("--strictPort", args);
    }

    // D2 (U10): F5 opens the default browser through Vite's --open, not a VS-attached browser window.
    [Fact]
    public void API_and_web_profile_Vite_configuration_opens_the_default_browser()
    {
        Assert.True(File.Exists(WebLaunchJson), $"{RepoPaths.Relative(WebLaunchJson)} does not exist: Docket.Web has no debug target.");

        Assert.Contains("--open", Arguments(WebDebugTarget()));
    }

    // D2 (U10): the Edge configuration stays for Start New Instance, on the dev server port. These are the
    // assertions the D1 test made of the DebugTarget, kept for the Edge configuration it named.
    [Fact]
    public void Web_launch_json_keeps_one_Edge_launch_configuration_on_the_dev_server_port()
    {
        Assert.True(File.Exists(WebLaunchJson), $"{RepoPaths.Relative(WebLaunchJson)} does not exist: Docket.Web has no browser debug target.");
        var port = DevServerPort();

        var edge = Assert.Single(WebLaunchConfigurations(), entry => entry.GetProperty("type").GetString() == "edge");

        Assert.Equal("launch", edge.GetProperty("request").GetString());
        Assert.Equal($"http://localhost:{port}", edge.GetProperty("url").GetString());
    }

    private const string ApiProjectPath = @"src\Uinsure.Policies.Api\Uinsure.Policies.Api.csproj";

    // The web project's path comes from the slnx, so these follow it wherever the solution puts it. Properties,
    // not static fields, so a bad slnx fails the web tests alone and not the API profile tests in this class.
    private static string WebProjectPath => SolutionProjects.WebProjectPath().Replace('/', '\\');
    private static string WebProject => SolutionProjects.WebProjectFile();
    private static string WebLaunchJson => Path.Combine(SolutionProjects.WebProjectDirectory(), ".vscode", "launch.json");

    private static readonly string SolutionLaunchProfile = RepoPaths.Combine("Uinsure.Policies.slnLaunch");

    // The launch.json configuration the 'API and web' profile's Docket.Web entry names as its DebugTarget.
    private static JsonElement WebDebugTarget()
    {
        var web = Assert.Single(ApiAndWebProjects(), project => project.GetProperty("Path").GetString() == WebProjectPath);
        Assert.True(web.TryGetProperty("DebugTarget", out var debugTarget), "The Docket.Web entry names no DebugTarget.");
        return Assert.Single(WebLaunchConfigurations(), entry => entry.GetProperty("name").GetString() == debugTarget.GetString());
    }

    private static string[] Arguments(JsonElement configuration)
    {
        Assert.True(configuration.TryGetProperty("args", out var args), $"The '{configuration.GetProperty("name").GetString()}' configuration passes no args.");
        return [.. args.EnumerateArray().Select(arg => arg.GetString() ?? "")];
    }

    // '--port 4170' as two args, or '--port=4170' as one.
    private static string? ArgumentValue(string[] args, string flag)
    {
        var index = Array.IndexOf(args, flag);
        if (index >= 0)
        {
            return index + 1 < args.Length ? args[index + 1] : null;
        }

        return args.FirstOrDefault(arg => arg.StartsWith(flag + "=", StringComparison.Ordinal))?[(flag.Length + 1)..];
    }

    // A program path relative to the project: a leading '${workspaceFolder}/' or './' dropped, forward slashes.
    private static string? ProjectRelative(string? path)
    {
        var normalised = path?.Replace('\\', '/');
        foreach (var prefix in new[] { "${workspaceFolder}/", "./" })
        {
            if (normalised?.StartsWith(prefix, StringComparison.Ordinal) == true)
            {
                normalised = normalised[prefix.Length..];
            }
        }

        return normalised;
    }

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
