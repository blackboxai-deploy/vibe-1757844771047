"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Eye, Code, Download, Copy, CheckCircle } from "lucide-react";

interface ConversionPreviewProps {
  markdown: string;
  stats?: {
    htmlLines: number;
    markdownLines: number;
    elementsConverted: number;
    linksFound: number;
    imagesFound: number;
    tablesFound: number;
  };
  title?: string;
}

export default function ConversionPreview({ markdown, stats, title }: ConversionPreviewProps) {
  const [activeTab, setActiveTab] = useState("markdown");
  const [copied, setCopied] = useState(false);

  // Render markdown as HTML for preview (simplified)
  const renderMarkdownPreview = (md: string) => {
    if (!md) return "Preview will appear here...";

    // Remove frontmatter for preview
    const withoutFrontmatter = md.replace(/^---[\s\S]*?---\n/, '');

    // Simple markdown to HTML conversion for preview
    return withoutFrontmatter
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/```([^`]*)```/gim, '<pre><code>$1</code></pre>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img alt="$1" src="$2" style="max-width: 100%; height: auto;" />')
      .replace(/\n/gim, '<br>');
  };

  const copyToClipboard = async () => {
    if (!markdown) return;
    
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const downloadMarkdown = () => {
    if (!markdown) return;
    
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "converted-doc"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!markdown || markdown.trim().length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-12">
            <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Markdown preview will appear here after conversion</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Conversion Preview
          </CardTitle>
          <div className="flex items-center gap-2">
            {stats && (
              <div className="flex gap-1">
                <Badge variant="secondary">{markdown.length} chars</Badge>
                <Badge variant="outline">{stats.markdownLines} lines</Badge>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={copyToClipboard}
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
                Copy Markdown
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={downloadMarkdown}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download .md
          </Button>
        </div>

        {/* Stats Display */}
        {stats && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <div className="text-center">
              <div className="font-semibold text-blue-600">{stats.elementsConverted}</div>
              <div className="text-xs text-gray-600">Elements</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">{stats.linksFound}</div>
              <div className="text-xs text-gray-600">Links</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-600">{stats.imagesFound}</div>
              <div className="text-xs text-gray-600">Images</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-orange-600">{stats.tablesFound}</div>
              <div className="text-xs text-gray-600">Tables</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-red-600">{stats.htmlLines}</div>
              <div className="text-xs text-gray-600">HTML Lines</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-indigo-600">{stats.markdownLines}</div>
              <div className="text-xs text-gray-600">MD Lines</div>
            </div>
          </div>
        )}

        {/* Tabs for Raw/Preview */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="markdown" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Raw Markdown
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Visual Preview
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="markdown">
            <ScrollArea className="h-[500px] w-full">
              <pre className="whitespace-pre-wrap font-mono text-sm p-4 bg-gray-50 rounded-lg overflow-x-auto">
                {markdown}
              </pre>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="preview">
            <ScrollArea className="h-[500px] w-full">
              <div 
                className="prose prose-sm max-w-none p-4 bg-white rounded-lg border"
                dangerouslySetInnerHTML={{ 
                  __html: renderMarkdownPreview(markdown)
                }}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Frontmatter Detection */}
        {markdown.startsWith('---') && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Docusaurus Frontmatter Detected</span>
            </div>
            <p className="text-blue-600 text-xs mt-1">
              This markdown includes proper frontmatter for Docusaurus integration
            </p>
          </div>
        )}

        {/* Component Usage Detection */}
        {(markdown.includes(':::') || markdown.includes('<Tabs>') || markdown.includes('<TabItem>')) && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Docusaurus Components Found</span>
            </div>
            <p className="text-green-600 text-xs mt-1">
              Converted content includes Docusaurus-specific components (Admonitions, Tabs, etc.)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}