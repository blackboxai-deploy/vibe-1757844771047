"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { convertHtmlToMarkdownBrowser, type DocusaurusConfig } from "@/lib/html-to-markdown";
import { Download, Copy, FileText, Eye, Code2, Zap, CheckCircle, AlertCircle } from "lucide-react";

interface ConversionStats {
  htmlLines: number;
  markdownLines: number;
  elementsConverted: number;
  linksFound: number;
  imagesFound: number;
  tablesFound: number;
}

export default function HtmlToMarkdownConverter() {
  const [htmlInput, setHtmlInput] = useState("");
  const [markdownOutput, setMarkdownOutput] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [activePreview, setActivePreview] = useState("markdown");
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<ConversionStats | null>(null);
  
  const [docusaurusConfig, setDocusaurusConfig] = useState<DocusaurusConfig>({
    title: "",
    sidebarPosition: 1,
    description: "",
    tags: [],
    addFrontmatter: true,
    convertTabs: true,
    convertAdmonitions: true,
    convertCodeBlocks: true,
  });

  // Sample HTML for demonstration
  const sampleHtml = `<div class="documentation">
  <h1>Getting Started with RPG Builder</h1>
  <p class="intro">This guide will help you understand the basic concepts of RPG Builder abilities system.</p>
  
  <h2>Abilities Overview</h2>
  <p>Abilities are special actions that characters can perform in your RPG game. They can be:</p>
  <ul>
    <li><strong>Active abilities</strong> - Triggered by player input</li>
    <li><strong>Passive abilities</strong> - Always active effects</li>
    <li><strong>Conditional abilities</strong> - Activated under specific conditions</li>
  </ul>

  <h3>Creating Your First Ability</h3>
  <ol>
    <li>Open the abilities editor</li>
    <li>Click "New Ability"</li>
    <li>Configure the settings</li>
    <li>Save and test</li>
  </ol>

  <h2>Configuration Example</h2>
  <p>Here's how to configure a <code>fireball</code> ability in <strong>C#</strong>:</p>
  <pre><code class="language-csharp">
public class FireballAbility : Ability
{
    public override void Initialize()
    {
        Id = "fireball";
        Name = "Fireball";
        Damage = 50;
        ManaCost = 20;
        Cooldown = 5.0f;
    }
}
  </code></pre>

  <p>And here's the same in <em>JavaScript</em>:</p>
  <pre><code class="language-javascript">
const ability = {
  id: "fireball",
  name: "Fireball", 
  damage: 50,
  manaCost: 20,
  cooldown: 5000,
  cast: function(target) {
    // Implementation here
    return this.dealDamage(target, this.damage);
  }
};
  </code></pre>

  <blockquote>
    <p><strong>Warning:</strong> Remember to set appropriate cooldowns for powerful abilities to maintain game balance. Overpowered abilities can ruin the game experience!</p>
  </blockquote>

  <h2>Ability Types Reference</h2>
  <p>The following table shows different ability types and their characteristics:</p>
  <table>
    <thead>
      <tr>
        <th>Type</th>
        <th>Description</th>
        <th>Example</th>
        <th>Options</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Attack</strong></td>
        <td>Deal damage to targets</td>
        <td>Sword Strike</td>
        <td>Types:<ul><li>Melee</li><li>Ranged</li><li>Magic</li></ul></td>
      </tr>
      <tr>
        <td><strong>Heal</strong></td>
        <td>Restore health points</td>
        <td>Minor Healing</td>
        <td>Target:<ul><li>Self</li><li>Ally</li><li>Group</li></ul></td>
      </tr>
      <tr>
        <td><strong>Buff</strong></td>
        <td>Temporary stat increase</td>
        <td>Strength Boost</td>
        <td>Stats:<ul><li>Strength</li><li>Speed</li><li>Defense</li></ul></td>
      </tr>
      <tr>
        <td><strong>Collider Type</strong></td>
        <td>The type of collider for this projectile.</td>
        <td>Projectile Physics</td>
        <td>Shapes:<ul><li>Capsule</li><li>Sphere</li><li>Box</li></ul></td>
      </tr>
    </tbody>
  </table>

  <h3>Advanced Features</h3>
  <p>For more advanced functionality, you can:</p>
  <ul>
    <li>Chain abilities together</li>
    <li>Create <a href="/docs/combo-system">combo systems</a></li>
    <li>Add <em>visual effects</em> and <strong>sound effects</strong></li>
    <li>Implement <code>conditional triggers</code></li>
  </ul>

  <h4>Tips and Best Practices</h4>
  <blockquote>
    <p><strong>Tip:</strong> Always test your abilities in different scenarios to ensure they work as expected!</p>
  </blockquote>
</div>`;

  // Auto-convert when HTML changes
  useEffect(() => {
    if (htmlInput.trim()) {
      convertToMarkdown();
    } else {
      setMarkdownOutput("");
      setStats(null);
    }
  }, [htmlInput, docusaurusConfig]);

  const convertToMarkdown = async () => {
    if (!htmlInput.trim()) return;
    
    setIsConverting(true);
    try {
      const result = convertHtmlToMarkdownBrowser(htmlInput, docusaurusConfig);
      setMarkdownOutput(result.markdown);
      setStats(result.stats);
    } catch (error) {
      console.error("Conversion error:", error);
      setMarkdownOutput("Error during conversion. Please check your HTML input.");
      setStats(null);
    } finally {
      setIsConverting(false);
    }
  };

  const copyToClipboard = async () => {
    if (!markdownOutput) return;
    
    try {
      await navigator.clipboard.writeText(markdownOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const downloadMarkdown = () => {
    if (!markdownOutput) return;
    
    const blob = new Blob([markdownOutput], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docusaurusConfig.title || "converted-doc"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadSample = () => {
    setHtmlInput(sampleHtml);
    setDocusaurusConfig(prev => ({
      ...prev,
      title: "Getting Started with RPG Builder",
      description: "Learn the basics of RPG Builder abilities system",
      tags: ["rpg", "abilities", "getting-started"],
    }));
  };

  return (
    <div className="w-full space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button 
          variant="outline" 
          onClick={loadSample}
          className="flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Load Sample HTML
        </Button>
        <Button 
          onClick={convertToMarkdown} 
          disabled={!htmlInput.trim() || isConverting}
          className="flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          {isConverting ? "Converting..." : "Convert"}
        </Button>
        {markdownOutput && (
          <>
            <Button 
              variant="secondary" 
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
                  Copy
                </>
              )}
            </Button>
            <Button 
              variant="secondary" 
              onClick={downloadMarkdown}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download .md
            </Button>
          </>
        )}
      </div>

      {/* Conversion Stats */}
      {stats && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex flex-wrap gap-4 text-sm">
              <span><strong>Elements:</strong> {stats.elementsConverted}</span>
              <span><strong>Links:</strong> {stats.linksFound}</span>
              <span><strong>Images:</strong> {stats.imagesFound}</span>
              <span><strong>Tables:</strong> {stats.tablesFound}</span>
              <span><strong>Lines:</strong> {stats.htmlLines} → {stats.markdownLines}</span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Conversion Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HTML Input */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Code2 className="w-5 h-5" />
                HTML Input
              </CardTitle>
              <Badge variant="secondary">{htmlInput.length} chars</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={htmlInput}
              onChange={(e) => setHtmlInput(e.target.value)}
              placeholder="Paste your HTML content here..."
              className="min-h-[400px] font-mono text-sm resize-none"
            />
          </CardContent>
        </Card>

        {/* Markdown Output */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Markdown Output
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{markdownOutput.length} chars</Badge>
                {docusaurusConfig.addFrontmatter && (
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    Frontmatter
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activePreview} onValueChange={setActivePreview}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="markdown">Raw Markdown</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="markdown">
                <ScrollArea className="h-[400px] w-full">
                  <pre className="whitespace-pre-wrap font-mono text-sm p-4 bg-gray-50 rounded-lg">
                    {markdownOutput || "Converted markdown will appear here..."}
                  </pre>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="preview">
                <ScrollArea className="h-[400px] w-full">
                  <div 
                    className="prose prose-sm max-w-none p-4"
                    dangerouslySetInnerHTML={{ 
                      __html: markdownOutput ? 
                        markdownOutput
                          .replace(/^---[\s\S]*?---\n/, '') // Remove frontmatter for preview
                          .replace(/\n/g, '<br>') 
                        : "Markdown preview will appear here..." 
                    }}
                  />
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Docusaurus Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Docusaurus Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Page Title</label>
              <input
                type="text"
                value={docusaurusConfig.title}
                onChange={(e) => setDocusaurusConfig(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Page title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Sidebar Position</label>
              <input
                type="number"
                value={docusaurusConfig.sidebarPosition}
                onChange={(e) => setDocusaurusConfig(prev => ({ ...prev, sidebarPosition: parseInt(e.target.value) || 1 }))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <input
                type="text"
                value={docusaurusConfig.description}
                onChange={(e) => setDocusaurusConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Page description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Tags (comma separated)</label>
              <input
                type="text"
                value={docusaurusConfig.tags.join(", ")}
                onChange={(e) => setDocusaurusConfig(prev => ({ 
                  ...prev, 
                  tags: e.target.value.split(",").map(tag => tag.trim()).filter(Boolean)
                }))}
                placeholder="tag1, tag2, tag3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={docusaurusConfig.addFrontmatter}
                onChange={(e) => setDocusaurusConfig(prev => ({ ...prev, addFrontmatter: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Add Frontmatter</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={docusaurusConfig.convertTabs}
                onChange={(e) => setDocusaurusConfig(prev => ({ ...prev, convertTabs: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Convert to Tabs Component</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={docusaurusConfig.convertAdmonitions}
                onChange={(e) => setDocusaurusConfig(prev => ({ ...prev, convertAdmonitions: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Convert to Admonitions</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={docusaurusConfig.convertCodeBlocks}
                onChange={(e) => setDocusaurusConfig(prev => ({ ...prev, convertCodeBlocks: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Enhanced Code Blocks</span>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}