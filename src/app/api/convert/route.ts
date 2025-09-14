import { NextRequest, NextResponse } from 'next/server';
import { convertHtmlToMarkdownBrowser, type DocusaurusConfig } from '@/lib/html-to-markdown';

export async function POST(request: NextRequest) {
  try {
    const { html, config } = await request.json();

    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
    }

    if (html.trim().length === 0) {
      return NextResponse.json({ error: 'HTML content cannot be empty' }, { status: 400 });
    }

    // Validate and set default config
    const docusaurusConfig: DocusaurusConfig = {
      title: config?.title || '',
      sidebarPosition: config?.sidebarPosition || 1,
      description: config?.description || '',
      tags: Array.isArray(config?.tags) ? config.tags : [],
      keywords: Array.isArray(config?.keywords) ? config.keywords : [],
      slug: config?.slug || '',
      sidebarLabel: config?.sidebarLabel || '',
      addFrontmatter: config?.addFrontmatter !== false,
      convertTabs: config?.convertTabs !== false,
      convertAdmonitions: config?.convertAdmonitions !== false,
      convertCodeBlocks: config?.convertCodeBlocks !== false,
      processImages: config?.processImages !== false,
      customFrontmatter: config?.customFrontmatter || '',
    };

    console.log('Converting HTML to Markdown:', {
      htmlLength: html.length,
      config: docusaurusConfig
    });

    // Convert HTML to Markdown
    const result = convertHtmlToMarkdownBrowser(html, docusaurusConfig);

    if (!result || !result.markdown) {
      return NextResponse.json(
        { error: 'Conversion failed - no markdown output generated' },
        { status: 500 }
      );
    }

    console.log('Conversion successful:', {
      markdownLength: result.markdown.length,
      stats: result.stats
    });

    return NextResponse.json({
      markdown: result.markdown,
      stats: result.stats,
      config: docusaurusConfig,
      convertedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Conversion error:', error);
    
    return NextResponse.json(
      { error: 'Conversion failed: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}