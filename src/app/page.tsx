"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Globe, Download, Copy, Zap } from "lucide-react";
import HtmlToMarkdownConverter from "@/components/HtmlToMarkdownConverter";
import UrlExtractor from "@/components/UrlExtractor";
import DocusaurusSettings from "@/components/DocusaurusSettings";

export default function Home() {
  const [activeTab, setActiveTab] = useState("converter");
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">HTML to MD Converter</h1>
                <p className="text-sm text-gray-600">For Docusaurus Projects</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
              <Zap className="w-3 h-3 mr-1" />
              Docusaurus Ready
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 text-center">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Convert HTML to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Docusaurus Markdown
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Migrate your online documentation to Docusaurus format with proper frontmatter, 
              component support, and optimized structure.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-white rounded-xl shadow-sm border">
                <Globe className="w-8 h-8 text-blue-600 mb-3 mx-auto" />
                <h3 className="font-semibold mb-2">URL Extraction</h3>
                <p className="text-gray-600 text-sm">
                  Fetch HTML directly from online documentation
                </p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-sm border">
                <FileText className="w-8 h-8 text-green-600 mb-3 mx-auto" />
                <h3 className="font-semibold mb-2">Smart Conversion</h3>
                <p className="text-gray-600 text-sm">
                  Intelligent HTML to Markdown with Docusaurus features
                </p>
              </div>
              <div className="p-6 bg-white rounded-xl shadow-sm border">
                <Download className="w-8 h-8 text-purple-600 mb-3 mx-auto" />
                <h3 className="font-semibold mb-2">Ready to Use</h3>
                <p className="text-gray-600 text-sm">
                  Download or copy Markdown files for immediate use
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Converter Interface */}
      <section className="pb-12">
        <div className="container mx-auto px-4">
          <Card className="max-w-7xl mx-auto shadow-xl border-0 bg-white/95 backdrop-blur">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl">HTML to Markdown Converter</CardTitle>
              <CardDescription>
                Convert HTML content to Docusaurus-compatible Markdown format
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="converter" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Converter
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    URL Extractor
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Docusaurus Settings
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="converter" className="mt-0">
                  <HtmlToMarkdownConverter />
                </TabsContent>
                
                <TabsContent value="url" className="mt-0">
                  <UrlExtractor />
                </TabsContent>
                
                <TabsContent value="settings" className="mt-0">
                  <DocusaurusSettings />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">
              Powerful Features for Documentation Migration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h4 className="font-semibold mb-2 text-blue-900">Docusaurus Frontmatter</h4>
                <p className="text-gray-600 text-sm">
                  Automatically generate proper frontmatter with title, sidebar position, and metadata
                </p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h4 className="font-semibold mb-2 text-green-900">Component Support</h4>
                <p className="text-gray-600 text-sm">
                  Convert to Docusaurus components like Tabs, CodeBlocks, and Admonitions
                </p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h4 className="font-semibold mb-2 text-purple-900">Table Processing</h4>
                <p className="text-gray-600 text-sm">
                  Smart table conversion with proper alignment and formatting
                </p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h4 className="font-semibold mb-2 text-orange-900">Link Preservation</h4>
                <p className="text-gray-600 text-sm">
                  Maintain all links and references with proper Markdown syntax
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            Built for seamless documentation migration to Docusaurus
          </p>
        </div>
      </footer>
    </div>
  );
}