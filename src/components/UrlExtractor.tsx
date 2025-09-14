"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Globe, Download, AlertCircle, CheckCircle, Loader2, ExternalLink, Copy, FileText } from "lucide-react";

interface ExtractionResult {
  html: string;
  title: string;
  url: string;
  contentLength: number;
  extractedAt: string;
}

export default function UrlExtractor() {
  const [url, setUrl] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Sample URLs for testing
  const sampleUrls = [
    "https://blink.developerhub.io/rpg-builder/abilities",
    "https://docusaurus.io/docs/markdown-features",
    "https://docs.github.com/en/get-started",
  ];

  const extractFromUrl = async () => {
    if (!url.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL (including http:// or https://)");
      return;
    }

    setIsExtracting(true);
    setError("");
    setExtractionResult(null);

    try {
      const response = await fetch("/api/extract-html", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setExtractionResult({
        html: result.html,
        title: result.title || "Untitled",
        url: url,
        contentLength: result.html?.length || 0,
        extractedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Extraction error:", err);
      setError(err instanceof Error ? err.message : "Failed to extract HTML from URL");
    } finally {
      setIsExtracting(false);
    }
  };

  const copyHtml = async () => {
    if (!extractionResult?.html) return;

    try {
      await navigator.clipboard.writeText(extractionResult.html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy HTML:", error);
    }
  };

  const downloadHtml = () => {
    if (!extractionResult) return;

    const blob = new Blob([extractionResult.html], { type: "text/html" });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${extractionResult.title.replace(/[^a-zA-Z0-9]/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  };

  const useAsInput = () => {
    if (!extractionResult?.html) return;
    
    // This would typically send the HTML to the main converter
    // For now, we'll copy it and show a message
    copyHtml();
    // You can emit an event or use a callback prop to send data to parent
    console.log("HTML ready for conversion:", extractionResult.html.substring(0, 100) + "...");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="w-full space-y-6">
      {/* URL Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Extract HTML from URL
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/documentation"
                className="w-full"
                disabled={isExtracting}
              />
            </div>
            <Button 
              onClick={extractFromUrl} 
              disabled={!url.trim() || isExtracting}
              className="flex items-center gap-2"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Extract HTML
                </>
              )}
            </Button>
          </div>

          {/* Sample URLs */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Try these sample URLs:</p>
            <div className="flex flex-wrap gap-2">
              {sampleUrls.map((sampleUrl, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setUrl(sampleUrl)}
                  className="text-xs"
                  disabled={isExtracting}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Sample {index + 1}
                </Button>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Extraction Result */}
      {extractionResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Extraction Complete
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary">
                  {formatFileSize(extractionResult.contentLength)}
                </Badge>
                <Badge variant="outline">
                  {new Date(extractionResult.extractedAt).toLocaleTimeString()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Extraction Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Page Title:</p>
                <p className="text-sm text-gray-900">{extractionResult.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Source URL:</p>
                <p className="text-sm text-blue-600 truncate">
                  <a 
                    href={extractionResult.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {extractionResult.url}
                  </a>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={useAsInput}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Use in Converter
              </Button>
              <Button 
                variant="secondary" 
                onClick={copyHtml}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy HTML
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={downloadHtml}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download HTML
              </Button>
            </div>

            {/* HTML Preview */}
            <div className="space-y-2">
              <p className="text-sm font-medium">HTML Preview (first 500 characters):</p>
              <Textarea
                value={extractionResult.html.substring(0, 500) + (extractionResult.html.length > 500 ? "..." : "")}
                readOnly
                className="font-mono text-xs resize-none"
                rows={8}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">How to use URL Extractor:</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Enter a URL to any webpage with documentation content</li>
              <li>Click "Extract HTML" to fetch the page content</li>
              <li>Use "Use in Converter" to automatically transfer HTML to the main converter</li>
              <li>The extractor will attempt to get clean, readable content from the page</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* Technical Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Technical Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>CORS Limitations:</strong> Some websites may block direct access due to CORS policies. 
              The extractor uses a server-side proxy to bypass these restrictions when possible.
            </p>
            <p>
              <strong>Content Processing:</strong> The extractor attempts to identify and extract the main 
              content area of web pages, filtering out navigation, ads, and other non-content elements.
            </p>
            <p>
              <strong>JavaScript Content:</strong> Pages that rely heavily on JavaScript for content rendering 
              may not extract properly. Static HTML content works best.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}