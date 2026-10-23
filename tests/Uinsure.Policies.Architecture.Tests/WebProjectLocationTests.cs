using System.Text.RegularExpressions;
using System.Xml.Linq;
using Uinsure.Policies.Architecture.Tests.Support;
using Xunit;

namespace Uinsure.Policies.Architecture.Tests;

// U10 (David 2026-10-23): the web project is named like the others. Docket.Web.esproj lives in
// src/Uinsure.Policies.Web, its tests in tests/Uinsure.Policies.Web.Tests, and the slnx lists it in the /src/
// solution folder beside the other src projects. The old folder names (written below only as segments, so this
// file never names them itself) survive only in receipts: trail records already committed.
public sealed class WebProjectLocationTests
{
    private const string WebProjectPath = "src/Uinsure.Policies.Web/Docket.Web.esproj";
    private const string WebTestsDirectory = "tests/Uinsure.Policies.Web.Tests";

    private static readonly string OldWebProjectDirectory = string.Join('/', "src", "web") + "/";
    private static readonly string OldWebTestsDirectory = string.Join('/', "tests", "web") + "/";

    // Either separator, any run of them (JSON escapes a backslash as two), and not part of a longer name.
    private static readonly Regex OldWebPath = new(@"(?<![\w.-])(src|tests)[\\/]+web(?![\w-])", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    // Receipts keep the old paths (U10 acceptance: trail records already committed are receipts). Each entry is a
    // repo-relative prefix, or a whole path, that the live-reference check skips.
    private static readonly (string Prefix, string Why)[] Receipts =
    [
        ("docs/trace/", "the committed trail: packets, verdicts, findings and events"),
        ("docs/ui/derived/", "screens derived from the trail at an earlier node"),
        ("docs/context/", "saved session context, a record of its time"),
        ("docs/plans/", "plans, whose node text records each node as it was planned"),
        ("docs/qa/", "QA scripts of earlier nodes, signed off as they were run"),
        ("docs/lessons.md", "lessons, a record of what was learnt when"),
        ("tests/Uinsure.Policies.Web.Tests/fixtures/trails/", "simulated trail receipts; the compiler accepts both paths"),
        ("docs/ui/fixture/", "the design fixture's trail records"),
        ("docs/ui/stylekit/", "signed-off G3 design output, stamped"),
        ("docs/ui/styles.md", "signed-off G3 design output, stamped"),
        ("docs/requirements.md", "the agreed brief, as written when agreed; the reserved-web-folder line is history"),
        ("docs/ui-requirements.md", "the agreed brief, as written when agreed; the reserved-web-folder line is history"),
        ("docs/documentation-requirements.md", "the agreed brief, as written when agreed; it quotes the rename itself"),
        ("src/Uinsure.Policies.Web/kit/project/agent-lanes/agent-lanes.examples.tsx", "kit example data naming trail paths; the kit is out of U10's scope"),
        ("tests/Uinsure.Policies.Web.Tests/e2e/U1/rule-1.spec.ts", "names paths inside a fixture trail's simulated repo, not this repo"),
        ("tests/Uinsure.Policies.Web.Tests/e2e/U2/rule-3.spec.ts", "names paths inside a fixture trail's simulated repo, not this repo"),
        ("tests/Uinsure.Policies.Web.Tests/e2e/U3/loop-3.spec.ts", "names paths inside a fixture trail's simulated repo, not this repo"),
        ("tests/Uinsure.Policies.Web.Tests/e2e/U3/loop-4.spec.ts", "names paths inside a fixture trail's simulated repo, not this repo"),
        ("tests/Uinsure.Policies.Web.Tests/unit/compiler/loop-3.test.ts", "names paths inside a fixture trail's simulated repo, not this repo"),
        ("tests/Uinsure.Policies.Web.Tests/unit/compiler/loop-4.test.ts", "names paths inside a fixture trail's simulated repo, not this repo"),
        ("tests/Uinsure.Policies.Web.Tests/unit/compiler/rule-1.test.ts", "names paths inside a fixture trail's simulated repo, not this repo"),
        ("tests/Uinsure.Policies.Web.Tests/unit/compiler/rule-3.test.ts", "names paths inside a fixture trail's simulated repo, not this repo"),
    ];

    // The current node's QA script is live: it is written after the rename and must name the new paths.
    private const string CurrentNodeQaScript = "docs/qa/ui-U10.md";

    [Fact]
    public void Docket_Web_esproj_lives_in_src_Uinsure_Policies_Web()
    {
        Assert.Contains(WebProjectPath, TrackedFiles.All);
        Assert.True(File.Exists(RepoPaths.Combine([.. WebProjectPath.Split('/')])), $"{WebProjectPath} does not exist.");
    }

    [Fact]
    public void No_tracked_file_remains_in_the_old_web_project_folder()
    {
        var left = TrackedFiles.All.Where(path => path.StartsWith(OldWebProjectDirectory, StringComparison.OrdinalIgnoreCase)).ToArray();

        Assert.True(left.Length == 0, $"{left.Length} tracked files are still under {OldWebProjectDirectory}, e.g. {string.Join(", ", left.Take(5))}.");
    }

    [Fact]
    public void Web_tests_live_in_tests_Uinsure_Policies_Web_Tests()
    {
        Assert.Contains(TrackedFiles.All, path => path.StartsWith(WebTestsDirectory + "/", StringComparison.Ordinal));
    }

    [Fact]
    public void No_tracked_file_remains_in_the_old_web_tests_folder()
    {
        var left = TrackedFiles.All.Where(path => path.StartsWith(OldWebTestsDirectory, StringComparison.OrdinalIgnoreCase)).ToArray();

        Assert.True(left.Length == 0, $"{left.Length} tracked files are still under {OldWebTestsDirectory}, e.g. {string.Join(", ", left.Take(5))}.");
    }

    [Fact]
    public void Docket_Web_esproj_points_its_JavaScript_test_root_at_tests_Uinsure_Policies_Web_Tests()
    {
        var project = RepoPaths.Combine([.. WebProjectPath.Split('/')]);
        Assert.True(File.Exists(project), $"{WebProjectPath} does not exist.");

        var testRoot = XDocument.Load(project).Descendants("JavaScriptTestRoot").Single().Value;
        var resolved = Path.GetFullPath(Path.Combine(Path.GetDirectoryName(project)!, testRoot.Replace('\\', Path.DirectorySeparatorChar)));

        Assert.Equal(RepoPaths.Combine(WebTestsDirectory.Split('/')), resolved.TrimEnd(Path.DirectorySeparatorChar));
    }

    // It moves folder and path, and stays unbuilt by dotnet build (Build Project="false"), as U9 left it.
    [Fact]
    public void Solution_lists_the_web_project_at_its_new_path_in_the_src_solution_folder_unbuilt()
    {
        var web = SolutionProjects.WebProject(SolutionProjects.Load());

        Assert.Equal(WebProjectPath, (string?)web.Attribute("Path"));
        Assert.Equal("/src/", (string?)web.Parent?.Attribute("Name"));
        Assert.Equal("false", (string?)web.Element("Build")?.Attribute("Project"));
    }

    [Fact]
    public void Solution_has_no_web_solution_folder()
    {
        var folders = SolutionProjects.Load().Descendants("Folder").Select(folder => (string?)folder.Attribute("Name")).ToArray();

        Assert.DoesNotContain("/web/", folders);
    }

    [Fact]
    public void No_live_tracked_file_names_the_old_web_paths()
    {
        var offenders = new List<string>();

        foreach (var path in TrackedFiles.All.Where(IsLive))
        {
            var full = RepoPaths.Combine([.. path.Split('/')]);
            if (!File.Exists(full) || !TrackedFiles.IsText(full))
            {
                continue;
            }

            var lines = File.ReadAllLines(full);
            var hit = Array.FindIndex(lines, line => OldWebPath.IsMatch(line));
            if (hit >= 0)
            {
                offenders.Add($"{path}:{hit + 1}: {lines[hit].Trim()}");
            }
        }

        Assert.True(offenders.Count == 0,
            $"{offenders.Count} live tracked files still name the old web paths (first hit in each):\n{string.Join("\n", offenders)}");
    }

    private static bool IsLive(string path) =>
        path == CurrentNodeQaScript
        || !Receipts.Any(receipt => receipt.Prefix.EndsWith('/')
            ? path.StartsWith(receipt.Prefix, StringComparison.Ordinal)
            : path == receipt.Prefix);
}
