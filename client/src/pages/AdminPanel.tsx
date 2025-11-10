import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, LogOut, Shield, RefreshCw } from "lucide-react";

interface Token {
  id: number;
  token: string;
  used: boolean;
  createdAt: string;
}

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedTokens, setGeneratedTokens] = useState<string[]>([]);
  const [tokensCopied, setTokensCopied] = useState(false);
  const [numTokens, setNumTokens] = useState(1);
  const [unusedTokens, setUnusedTokens] = useState<Token[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnusedTokens();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/check");
      const data = await response.json();
      setIsAuthenticated(data.isAdmin);
    } catch (error) {
      console.error("Auth check failed:", error);
    }
  };

  const fetchUnusedTokens = async () => {
    setLoadingTokens(true);
    try {
      const response = await fetch("/api/admin/tokens");
      if (response.ok) {
        const data = await response.json();
        setUnusedTokens(data.tokens || []);
      }
    } catch (error) {
      console.error("Failed to fetch tokens:", error);
    } finally {
      setLoadingTokens(false);
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

  const handleGenerateTokens = async () => {
    setError("");
    setLoading(true);
    setGeneratedTokens([]);

    try {
      const response = await fetch("/api/admin/generate-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: numTokens }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedTokens(data.tokens);
        setTokensCopied(false);
        fetchUnusedTokens();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to generate tokens");
      }
    } catch (error) {
      setError("Token generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
  };

  const handleCopyAllTokens = () => {
    const allTokens = generatedTokens.join("\n");
    navigator.clipboard.writeText(allTokens);
    setTokensCopied(true);
    setTimeout(() => setTokensCopied(false), 2000);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      setIsAuthenticated(false);
      setGeneratedTokens([]);
      setUnusedTokens([]);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white border-amber-400 border-2 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2 justify-center mb-4">
              <Shield className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl text-center text-amber-900">
              Admin Panel
            </CardTitle>
            <CardDescription className="text-center text-amber-700">
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
                  className="bg-amber-50 border-amber-400 text-amber-900 placeholder:text-amber-400/50"
                  autoFocus
                />
              </div>
              {error && (
                <Alert className="bg-red-100 border-red-400">
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-amber-600" />
            <h1 className="text-3xl font-bold text-amber-900">Admin Panel</h1>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-amber-500 text-amber-700 hover:bg-amber-600 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-white border-amber-400 border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-amber-900">
                Access Token Generator
              </CardTitle>
              <CardDescription className="text-amber-700">
                Generate single-use access tokens for users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-amber-900 mb-2 block">
                  Number of tokens to generate
                </label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={numTokens}
                  onChange={(e) => setNumTokens(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="bg-amber-50 border-amber-400 text-amber-900"
                />
              </div>

              <Button
                onClick={handleGenerateTokens}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                disabled={loading}
              >
                {loading ? "Generating..." : `Generate ${numTokens} Token${numTokens > 1 ? 's' : ''}`}
              </Button>

              {error && (
                <Alert className="bg-red-100 border-red-400">
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {generatedTokens.length > 0 && (
                <div className="space-y-3">
                  <Alert className="bg-green-100 border-green-400">
                    <AlertDescription className="text-green-700">
                      {generatedTokens.length} token{generatedTokens.length > 1 ? 's' : ''} generated successfully!
                    </AlertDescription>
                  </Alert>
                  
                  <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-400">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-medium text-amber-900">Generated Tokens:</p>
                      <Button
                        onClick={handleCopyAllTokens}
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy All
                      </Button>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {generatedTokens.map((token, index) => (
                        <div key={index} className="flex items-center gap-2 bg-white p-2 rounded border border-amber-300">
                          <code className="flex-1 text-sm font-mono text-amber-900">
                            {token}
                          </code>
                          <Button
                            onClick={() => handleCopyToken(token)}
                            size="sm"
                            variant="ghost"
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    {tokensCopied && (
                      <p className="text-xs text-green-600 mt-2">Copied all tokens to clipboard!</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-amber-400 border-2 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl text-amber-900">
                    Unused Tokens
                  </CardTitle>
                  <CardDescription className="text-amber-700">
                    All active tokens that haven't been used yet
                  </CardDescription>
                </div>
                <Button
                  onClick={fetchUnusedTokens}
                  size="sm"
                  variant="outline"
                  className="border-amber-400 text-amber-600 hover:bg-amber-100"
                  disabled={loadingTokens}
                >
                  <RefreshCw className={`w-4 h-4 ${loadingTokens ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingTokens ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                  <p className="text-sm text-amber-700 mt-2">Loading tokens...</p>
                </div>
              ) : unusedTokens.length === 0 ? (
                <div className="text-center py-8 text-amber-600">
                  <p>No unused tokens found</p>
                  <p className="text-sm text-amber-500 mt-2">Generate some tokens to get started</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <p className="text-sm font-medium text-amber-900 mb-3">
                    Total: {unusedTokens.length} token{unusedTokens.length !== 1 ? 's' : ''}
                  </p>
                  {unusedTokens.map((tokenObj) => (
                    <div key={tokenObj.id} className="bg-amber-50 p-3 rounded-lg border border-amber-300">
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm font-mono text-amber-900 break-all">
                          {tokenObj.token}
                        </code>
                        <Button
                          onClick={() => handleCopyToken(tokenObj.token)}
                          size="sm"
                          variant="ghost"
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-amber-600 mt-1">
                        Created: {new Date(tokenObj.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
