import { NextRequest, NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    console.log(`Extracting HTML from: ${url}`);

    // Fetch the webpage
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HTML-to-MD Converter/1.0; +https://html-to-md-converter.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return NextResponse.json(
        { error: 'URL does not return HTML content' },
        { status: 400 }
      );
    }

    const html = await response.text();

    if (!html || html.trim().length === 0) {
      return NextResponse.json(
        { error: 'No HTML content found at URL' },
        { status: 400 }
      );
    }

    // Parse HTML and extract main content
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract title
    const titleElement = document.querySelector('title');
    const title = titleElement?.textContent?.trim() || 'Untitled';

    // Try to find main content area
    let mainContent = '';
    
    // Common selectors for main content
    const contentSelectors = [
      'main',
      '[role="main"]',
      '.main-content',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.documentation',
      '.docs',
      '.markdown-body',
      'article',
      '.container .row .col', // Bootstrap-like layouts
      '#content',
      '#main',
    ];

    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element && element.innerHTML.trim()) {
        mainContent = element.innerHTML;
        break;
      }
    }

    // Fallback: use body content but remove common non-content elements
    if (!mainContent) {
      const body = document.body.cloneNode(true) as HTMLElement;
      
      // Remove unwanted elements
      const unwantedSelectors = [
        'nav',
        'header', 
        'footer',
        '.navigation',
        '.navbar',
        '.sidebar',
        '.menu',
        '.breadcrumb',
        '.ad',
        '.advertisement',
        '.social',
        '.share',
        '.related',
        '.comments',
        'script',
        'style',
        'noscript',
      ];

      unwantedSelectors.forEach(selector => {
        const elements = body.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });

      mainContent = body.innerHTML;
    }

    if (!mainContent || mainContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'No meaningful content found on the page' },
        { status: 400 }
      );
    }

    // Clean up the HTML
    mainContent = cleanHtml(mainContent);

    console.log(`Successfully extracted ${mainContent.length} characters from ${url}`);

    return NextResponse.json({
      html: mainContent,
      title: title,
      url: url,
      extractedAt: new Date().toISOString(),
      contentLength: mainContent.length,
    });

  } catch (error: any) {
    console.error('HTML extraction error:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - the webpage took too long to respond' },
        { status: 408 }
      );
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: 'Cannot connect to the specified URL' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to extract HTML: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

function cleanHtml(html: string): string {
  // Remove script and style tags
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove comments
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove empty attributes and clean up spacing
  html = html.replace(/\s+/g, ' ');
  html = html.replace(/\s*=\s*""\s*/g, '');
  
  // Remove common tracking and analytics elements
  html = html.replace(/<[^>]*(?:google-analytics|gtag|facebook|twitter|linkedin)[^>]*>/gi, '');
  
  return html.trim();
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