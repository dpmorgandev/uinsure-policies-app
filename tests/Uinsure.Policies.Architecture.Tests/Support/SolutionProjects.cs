using System.Xml.Linq;

namespace Uinsure.Policies.Architecture.Tests.Support;

// The projects Uinsure.Policies.slnx lists, read from the source file, each with its solution folder.
internal static class SolutionProjects
{
    public static readonly string Solution = RepoPaths.Combine("Uinsure.Policies.slnx");

    public static XDocument Load() => XDocument.Load(Solution);

    // The one JavaScript project (Docket.Web.esproj): its path as the slnx writes it, forward slashes.
    public static XElement WebProject(XDocument solution)
    {
        var projects = solution.Descendants("Project")
            .Where(project => ((string?)project.Attribute("Path") ?? "").EndsWith("/Docket.Web.esproj", StringComparison.Ordinal))
            .ToArray();

        if (projects.Length != 1)
        {
            throw new InvalidOperationException($"Uinsure.Policies.slnx lists {projects.Length} Docket.Web.esproj projects; expected one.");
        }

        return projects[0];
    }

    public static string WebProjectPath() => (string)WebProject(Load()).Attribute("Path")!;

    public static string WebProjectFile() => RepoPaths.Combine([.. WebProjectPath().Split('/')]);

    public static string WebProjectDirectory() => Path.GetDirectoryName(WebProjectFile())!;
}
