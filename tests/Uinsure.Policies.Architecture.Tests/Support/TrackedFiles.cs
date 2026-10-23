using System.Diagnostics;

namespace Uinsure.Policies.Architecture.Tests.Support;

// The files git tracks in this checkout, repo-relative with forward slashes, from `git ls-files -z`.
internal static class TrackedFiles
{
    public static IReadOnlyList<string> All { get; } = List();

    private static string[] List()
    {
        var start = new ProcessStartInfo("git")
        {
            WorkingDirectory = RepoPaths.Root,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
        };
        start.ArgumentList.Add("ls-files");
        start.ArgumentList.Add("-z");

        using var git = Process.Start(start) ?? throw new InvalidOperationException("git could not be started.");
        var errors = git.StandardError.ReadToEndAsync();
        var output = git.StandardOutput.ReadToEnd();
        git.WaitForExit();

        if (git.ExitCode != 0)
        {
            throw new InvalidOperationException($"git ls-files exited {git.ExitCode}: {errors.Result}");
        }

        return output.Split('\0', StringSplitOptions.RemoveEmptyEntries);
    }

    // Git's own test: a NUL byte in the first 8000 bytes marks a binary file.
    public static bool IsText(string fullPath)
    {
        using var stream = File.OpenRead(fullPath);
        var buffer = new byte[8000];
        var read = stream.Read(buffer, 0, buffer.Length);
        return Array.IndexOf(buffer, (byte)0, 0, read) < 0;
    }
}
