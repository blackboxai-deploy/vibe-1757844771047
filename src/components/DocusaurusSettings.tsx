"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Settings, Zap, FileText, Code2, Info, Copy, CheckCircle } from "lucide-react";

interface DocusaurusSettings {
  // Frontmatter settings
  title: string;
  description: string;
  sidebarPosition: number;
  sidebarLabel: string;
  tags: string[];
  keywords: string[];
  slug: string;
  
  // Processing options
  addFrontmatter: boolean;
  convertTabs: boolean;
  convertAdmonitions: boolean;
  convertCodeBlocks: boolean;
  processImages: boolean;
  preserveHtmlComments: boolean;
  
  // Advanced options
  customFrontmatter: string;
  sidebarPath: string;
  customComponents: boolean;
}

export default function DocusaurusSettings() {
  const [settings, setSettings] = useState<DocusaurusSettings>({
    title: "",
    description: "",
    sidebarPosition: 1,
    sidebarLabel: "",
    tags: [],
    keywords: [],
    slug: "",
    
    addFrontmatter: true,
    convertTabs: true,
    convertAdmonitions: true,
    convertCodeBlocks: true,
    processImages: true,
    preserveHtmlComments: false,
    
    customFrontmatter: "",
    sidebarPath: "",
    customComponents: false,
  });

  const [activeTab, setActiveTab] = useState("frontmatter");
  const [copied, setCopied] = useState(false);

  const updateSetting = (key: keyof DocusaurusSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateArraySetting = (key: 'tags' | 'keywords', value: string) => {
    const array = value.split(',').map(item => item.trim()).filter(Boolean);
    updateSetting(key, array);
  };

  const generatePreview = () => {
    const frontmatter: any = {};
    
    if (settings.title) frontmatter.title = settings.title;
    if (settings.description) frontmatter.description = settings.description;
    if (settings.sidebarPosition) frontmatter.sidebar_position = settings.sidebarPosition;
    if (settings.sidebarLabel) frontmatter.sidebar_label = settings.sidebarLabel;
    if (settings.slug) frontmatter.slug = settings.slug;
    if (settings.tags.length > 0) frontmatter.tags = settings.tags;
    if (settings.keywords.length > 0) frontmatter.keywords = settings.keywords;

    // Add custom frontmatter
    if (settings.customFrontmatter.trim()) {
      try {
        const customFields = settings.customFrontmatter
          .split('\n')
          .filter(line => line.trim())
          .reduce((acc: any, line) => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
              const value = valueParts.join(':').trim();
              acc[key.trim()] = value.startsWith('"') && value.endsWith('"') ? 
                value.slice(1, -1) : value;
            }
            return acc;
          }, {});
        Object.assign(frontmatter, customFields);
      } catch (error) {
        console.error("Error parsing custom frontmatter:", error);
      }
    }

    const frontmatterText = Object.keys(frontmatter).length > 0 ? 
      `---\n${Object.entries(frontmatter)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}:\n${value.map(v => `  - ${v}`).join('\n')}`;
          }
          return `${key}: ${typeof value === 'string' ? `"${value}"` : value}`;
        })
        .join('\n')}\n---\n\n` : '';

    return frontmatterText + "# Your converted content will appear here\n\nThis is a preview of how your frontmatter will look.";
  };

  const copyPreview = async () => {
    try {
      await navigator.clipboard.writeText(generatePreview());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy preview:", error);
    }
  };

  const loadPreset = (preset: 'basic' | 'advanced' | 'api') => {
    switch (preset) {
      case 'basic':
        setSettings(prev => ({
          ...prev,
          title: "Getting Started",
          description: "Basic introduction and setup guide",
          sidebarPosition: 1,
          tags: ["getting-started", "basics"],
          convertTabs: true,
          convertAdmonitions: true,
          convertCodeBlocks: true,
        }));
        break;
      case 'advanced':
        setSettings(prev => ({
          ...prev,
          title: "Advanced Configuration",
          description: "Advanced features and configuration options",
          sidebarPosition: 10,
          tags: ["advanced", "configuration", "customization"],
          keywords: ["config", "setup", "advanced"],
          customComponents: true,
          processImages: true,
        }));
        break;
      case 'api':
        setSettings(prev => ({
          ...prev,
          title: "API Reference",
          description: "Complete API documentation and examples",
          sidebarPosition: 100,
          sidebarLabel: "API Docs",
          tags: ["api", "reference", "documentation"],
          keywords: ["api", "endpoints", "methods"],
          convertCodeBlocks: true,
          customComponents: true,
        }));
        break;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Quick Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Presets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => loadPreset('basic')}>
              Basic Documentation
            </Button>
            <Button variant="outline" onClick={() => loadPreset('advanced')}>
              Advanced Guide
            </Button>
            <Button variant="outline" onClick={() => loadPreset('api')}>
              API Reference
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Docusaurus Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="frontmatter">Frontmatter</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* Frontmatter Settings */}
            <TabsContent value="frontmatter" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Page Title</Label>
                  <Input
                    id="title"
                    value={settings.title}
                    onChange={(e) => updateSetting('title', e.target.value)}
                    placeholder="Getting Started"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sidebarPosition">Sidebar Position</Label>
                  <Input
                    id="sidebarPosition"
                    type="number"
                    value={settings.sidebarPosition}
                    onChange={(e) => updateSetting('sidebarPosition', parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sidebarLabel">Sidebar Label (optional)</Label>
                  <Input
                    id="sidebarLabel"
                    value={settings.sidebarLabel}
                    onChange={(e) => updateSetting('sidebarLabel', e.target.value)}
                    placeholder="Custom sidebar label"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Custom Slug (optional)</Label>
                  <Input
                    id="slug"
                    value={settings.slug}
                    onChange={(e) => updateSetting('slug', e.target.value)}
                    placeholder="/custom-url-path"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={settings.description}
                  onChange={(e) => updateSetting('description', e.target.value)}
                  placeholder="Brief description of the page content"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={settings.tags.join(', ')}
                    onChange={(e) => updateArraySetting('tags', e.target.value)}
                    placeholder="getting-started, tutorial, basics"
                  />
                  <div className="flex flex-wrap gap-1">
                    {settings.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords (comma separated)</Label>
                  <Input
                    id="keywords"
                    value={settings.keywords.join(', ')}
                    onChange={(e) => updateArraySetting('keywords', e.target.value)}
                    placeholder="documentation, guide, tutorial"
                  />
                  <div className="flex flex-wrap gap-1">
                    {settings.keywords.map(keyword => (
                      <Badge key={keyword} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Processing Options */}
            <TabsContent value="processing" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Add Frontmatter</Label>
                    <p className="text-sm text-gray-600">Include YAML frontmatter at the top of the document</p>
                  </div>
                  <Switch
                    checked={settings.addFrontmatter}
                    onCheckedChange={(checked) => updateSetting('addFrontmatter', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Convert to Tabs Component</Label>
                    <p className="text-sm text-gray-600">Transform tab-like HTML structures to Docusaurus Tabs</p>
                  </div>
                  <Switch
                    checked={settings.convertTabs}
                    onCheckedChange={(checked) => updateSetting('convertTabs', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Convert to Admonitions</Label>
                    <p className="text-sm text-gray-600">Transform blockquotes and callouts to Docusaurus admonitions</p>
                  </div>
                  <Switch
                    checked={settings.convertAdmonitions}
                    onCheckedChange={(checked) => updateSetting('convertAdmonitions', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Enhanced Code Blocks</Label>
                    <p className="text-sm text-gray-600">Add syntax highlighting and language detection to code blocks</p>
                  </div>
                  <Switch
                    checked={settings.convertCodeBlocks}
                    onCheckedChange={(checked) => updateSetting('convertCodeBlocks', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Process Images</Label>
                    <p className="text-sm text-gray-600">Optimize and process image references for Docusaurus</p>
                  </div>
                  <Switch
                    checked={settings.processImages}
                    onCheckedChange={(checked) => updateSetting('processImages', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Preserve HTML Comments</Label>
                    <p className="text-sm text-gray-600">Keep HTML comments in the converted Markdown</p>
                  </div>
                  <Switch
                    checked={settings.preserveHtmlComments}
                    onCheckedChange={(checked) => updateSetting('preserveHtmlComments', checked)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Advanced Settings */}
            <TabsContent value="advanced" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customFrontmatter">Custom Frontmatter Fields</Label>
                  <Textarea
                    id="customFrontmatter"
                    value={settings.customFrontmatter}
                    onChange={(e) => updateSetting('customFrontmatter', e.target.value)}
                    placeholder={`author: John Doe\ndate: 2024-01-01\ncategory: Tutorial`}
                    rows={4}
                  />
                  <p className="text-xs text-gray-600">
                    Add custom frontmatter fields (one per line, format: key: value)
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Custom Components Support</Label>
                    <p className="text-sm text-gray-600">Enable conversion to custom Docusaurus components</p>
                  </div>
                  <Switch
                    checked={settings.customComponents}
                    onCheckedChange={(checked) => updateSetting('customComponents', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sidebarPath">Sidebar Category Path</Label>
                  <Input
                    id="sidebarPath"
                    value={settings.sidebarPath}
                    onChange={(e) => updateSetting('sidebarPath', e.target.value)}
                    placeholder="docs/category/subcategory"
                  />
                  <p className="text-xs text-gray-600">
                    Specify the sidebar category path for nested organization
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Frontmatter Preview
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={copyPreview}
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
                  Copy Preview
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-50 rounded-lg p-4 text-sm font-mono overflow-x-auto">
            {generatePreview()}
          </pre>
        </CardContent>
      </Card>

      {/* Help Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Docusaurus Configuration Tips:</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li><strong>Sidebar Position:</strong> Lower numbers appear first in the sidebar</li>
              <li><strong>Tags:</strong> Used for categorization and can be displayed on the page</li>
              <li><strong>Custom Slug:</strong> Override the default URL path for this page</li>
              <li><strong>Admonitions:</strong> Callout boxes like :::tip, :::warning, :::note</li>
              <li><strong>Tabs Component:</strong> Interactive tabs for code examples or content sections</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}