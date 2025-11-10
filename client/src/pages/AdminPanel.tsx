import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, LogOut, Shield } from "lucide-react";

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedToken, setGeneratedToken] = useState("");
  const [tokenCopied, setTokenCopied] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/check");
      const data = await response.json();
      setIsAuthenticated(data.isAdmin);
    } catch (error) {
      console.error("Auth check failed:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setKeyword("");
      } else {
        const data = await response.json();
        setError(data.error || "Invalid keyword");
      }
    } catch (error) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateToken = async () => {
    setError("");
    setLoading(true);
    setGeneratedToken("");

    try {
      const response = await fetch("/api/admin/generate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedToken(data.token);
        setTokenCopied(false);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to generate token");
      }
    } catch (error) {
      setError("Token generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      setIsAuthenticated(false);
      setGeneratedToken("");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-amber-500">
          <CardHeader>
            <div className="flex items-center gap-2 justify-center mb-4">
              <Shield className="w-8 h-8 text-amber-400" />
            </div>
            <CardTitle className="text-2xl text-center text-amber-400">
              Admin Panel
            </CardTitle>
            <CardDescription className="text-center text-amber-200">
              Enter the keyword to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Enter keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="bg-slate-700 border-amber-500 text-amber-100 placeholder:text-amber-200/50"
                  autoFocus
                />
              </div>
              {error && (
                <Alert className="bg-red-900/50 border-red-500">
                  <AlertDescription className="text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-500 text-slate-900"
                disabled={loading || !keyword}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-amber-400" />
            <h1 className="text-3xl font-bold text-amber-400">Admin Panel</h1>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-amber-500 text-amber-400 hover:bg-amber-600 hover:text-slate-900"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <Card className="bg-slate-800 border-amber-500">
          <CardHeader>
            <CardTitle className="text-xl text-amber-400">
              Access Token Generator
            </CardTitle>
            <CardDescription className="text-amber-200">
              Generate single-use access tokens for users to login to the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGenerateToken}
              className="w-full bg-amber-600 hover:bg-amber-500 text-slate-900"
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate New Token"}
            </Button>

            {error && (
              <Alert className="bg-red-900/50 border-red-500">
                <AlertDescription className="text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {generatedToken && (
              <div className="space-y-3">
                <Alert className="bg-green-900/50 border-green-500">
                  <AlertDescription className="text-green-200">
                    Token generated successfully! This token can only be used once.
                  </AlertDescription>
                </Alert>
                
                <div className="bg-slate-700 p-4 rounded-lg border border-amber-500">
                  <p className="text-xs text-amber-200 mb-2">Generated Token:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-lg font-mono text-amber-100 bg-slate-900 p-3 rounded">
                      {generatedToken}
                    </code>
                    <Button
                      onClick={handleCopyToken}
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-500 text-slate-900"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  {tokenCopied && (
                    <p className="text-xs text-green-400 mt-2">Copied to clipboard!</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
