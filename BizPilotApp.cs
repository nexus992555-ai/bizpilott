using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

namespace BizPilotLauncher
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            string serverUrl = "http://localhost:8123";
            Process serverProc = null;

            if (!IsServerAlive(serverUrl + "/api/health"))
            {
                try
                {
                    var psi = new ProcessStartInfo
                    {
                        FileName = "python",
                        Arguments = "server.py",
                        WorkingDirectory = appDir,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };
                    serverProc = Process.Start(psi);

                    for (int i = 0; i < 30; i++)
                    {
                        if (IsServerAlive(serverUrl + "/api/health")) break;
                        Thread.Sleep(200);
                    }
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Не удалось запустить сервер BizPilot:\n" + ex.Message,
                        "BizPilot", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }
            }

            string browser = FindAppBrowser();
            if (browser != null)
            {
                string profileDir = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "BizPilotAppProfile"
                );
                Directory.CreateDirectory(profileDir);

                var appPsi = new ProcessStartInfo
                {
                    FileName = browser,
                    Arguments = string.Format(
                        "--app=\"{0}\" --user-data-dir=\"{1}\" --no-first-run --no-default-browser-check --window-size=1280,840",
                        serverUrl, profileDir),
                    UseShellExecute = false
                };
                var appProc = Process.Start(appPsi);
                if (appProc != null)
                {
                    appProc.WaitForExit();
                }
            }
            else
            {
                Process.Start(new ProcessStartInfo(serverUrl) { UseShellExecute = true });
            }

            if (serverProc != null && !serverProc.HasExited)
            {
                try { serverProc.Kill(); } catch { }
            }
        }

        static bool IsServerAlive(string url)
        {
            try
            {
                var req = (HttpWebRequest)WebRequest.Create(url);
                req.Timeout = 400;
                using (var resp = (HttpWebResponse)req.GetResponse())
                {
                    return (int)resp.StatusCode == 200;
                }
            }
            catch
            {
                return false;
            }
        }

        static string FindAppBrowser()
        {
            string[] candidates = new[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe")
            };
            foreach (string path in candidates)
            {
                if (File.Exists(path)) return path;
            }
            return null;
        }
    }
}
