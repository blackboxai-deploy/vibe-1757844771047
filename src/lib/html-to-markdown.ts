import TurndownService from 'turndown';
import { tables, strikethrough, taskListItems } from 'turndown-plugin-gfm';

export interface DocusaurusConfig {
  title: string;
  sidebarPosition: number;
  description: string;
  tags: string[];
  keywords?: string[];
  slug?: string;
  sidebarLabel?: string;
  addFrontmatter: boolean;
  convertTabs: boolean;
  convertAdmonitions: boolean;
  convertCodeBlocks: boolean;
  processImages?: boolean;
  customFrontmatter?: string;
}

export interface ConversionResult {
  markdown: string;
  stats: {
    htmlLines: number;
    markdownLines: number;
    elementsConverted: number;
    linksFound: number;
    imagesFound: number;
    tablesFound: number;
  };
}

class DocusaurusConverter {
  private turndownService: TurndownService;
  private stats: ConversionResult['stats'];

  constructor(config: DocusaurusConfig) {
    this.stats = {
      htmlLines: 0,
      markdownLines: 0,
      elementsConverted: 0,
      linksFound: 0,
      imagesFound: 0,
      tablesFound: 0,
    };

    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      hr: '---',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      fence: '```',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined',
      linkReferenceStyle: 'full',
    });

    // Add GitHub Flavored Markdown support
    this.turndownService.use([tables, strikethrough, taskListItems]);

    this.setupCustomRules(config);
  }

  private setupCustomRules(config: DocusaurusConfig) {
    // Custom rule for Docusaurus admonitions
    if (config.convertAdmonitions) {
      this.turndownService.addRule('admonitions', {
        filter: ['blockquote'],
        replacement: (content, node) => {
          const blockquote = node as HTMLElement;
          const text = blockquote.textContent || '';
          
          // Detect different types of callouts
          let admonitionType = 'note';
          if (text.toLowerCase().includes('warning') || text.toLowerCase().includes('caution')) {
            admonitionType = 'warning';
          } else if (text.toLowerCase().includes('tip') || text.toLowerCase().includes('pro tip')) {
            admonitionType = 'tip';
          } else if (text.toLowerCase().includes('danger') || text.toLowerCase().includes('error')) {
            admonitionType = 'danger';
          } else if (text.toLowerCase().includes('info') || text.toLowerCase().includes('information')) {
            admonitionType = 'info';
          }

          return `\n::${admonitionType}\n${content.trim()}\n::\n\n`;
        }
      });
    }

    // Enhanced code block handling
    if (config.convertCodeBlocks) {
      this.turndownService.addRule('codeBlocks', {
        filter: ['pre'],
        replacement: (content, node) => {
          const pre = node as HTMLElement;
          const code = pre.querySelector('code');
          
          if (code) {
            let language = '';
            
            // Try to detect language from class names
            const classNames = code.className || '';
            const languageMatch = classNames.match(/language-(\w+)|lang-(\w+)|(\w+)-code/);
            if (languageMatch) {
              language = languageMatch[1] || languageMatch[2] || languageMatch[3];
            }

            // Clean up the code content
            const codeContent = code.textContent || '';
            return `\n\`\`\`${language}\n${codeContent}\n\`\`\`\n\n`;
          }
          
          return `\n\`\`\`\n${content}\n\`\`\`\n\n`;
        }
      });
    }

    // Image processing
    this.turndownService.addRule('images', {
      filter: 'img',
      replacement: (content, node) => {
        const img = node as HTMLImageElement;
        const src = img.getAttribute('src') || '';
        const alt = img.getAttribute('alt') || '';
        const title = img.getAttribute('title') || '';
        
        this.stats.imagesFound++;
        
        if (config.processImages) {
          // Convert relative paths to work with Docusaurus
          const processedSrc = src.startsWith('http') ? src : `./assets/${src}`;
          return title ? `![${alt}](${processedSrc} "${title}")` : `![${alt}](${processedSrc})`;
        }
        
        return title ? `![${alt}](${src} "${title}")` : `![${alt}](${src})`;
      }
    });

    // Link processing with stats tracking
    this.turndownService.addRule('links', {
      filter: 'a',
      replacement: (content, node) => {
        const a = node as HTMLAnchorElement;
        const href = a.getAttribute('href') || '';
        const title = a.getAttribute('title') || '';
        
        this.stats.linksFound++;
        
        if (!href) return content;
        
        return title ? `[${content}](${href} "${title}")` : `[${content}](${href})`;
      }
    });

    // Table processing with stats
    this.turndownService.addRule('tables', {
      filter: 'table',
      replacement: (content) => {
        this.stats.tablesFound++;
        return content; // Let the default GFM table handling work
      }
    });

    // Tab conversion for Docusaurus
    if (config.convertTabs) {
      this.turndownService.addRule('tabs', {
        filter: (node) => {
          const element = node as HTMLElement;
          return element.tagName === 'DIV' && 
                 (element.className.includes('tab') || 
                  element.querySelector('.tab-content, .tab-pane, [role="tabpanel"]') !== null);
        },
        replacement: (content, node) => {
          const tabContainer = node as HTMLElement;
          const tabHeaders = tabContainer.querySelectorAll('[role="tab"], .tab-header, .nav-tab');
          
          if (tabHeaders.length > 0) {
            let tabsMarkdown = '\n<Tabs>\n';
            
            tabHeaders.forEach((header, index) => {
              const tabLabel = header.textContent?.trim() || `Tab ${index + 1}`;
              const tabContent = this.extractTabContent(tabContainer, index);
              
              tabsMarkdown += `<TabItem value="tab${index}" label="${tabLabel}">\n\n${tabContent}\n\n</TabItem>\n`;
            });
            
            tabsMarkdown += '</Tabs>\n\n';
            return tabsMarkdown;
          }
          
          return content;
        }
      });
    }

    // Count elements for stats - Fixed unused parameters
    this.turndownService.addRule('elementCounter', {
      filter: () => true,
      replacement: (content, node) => {
        if (node.nodeType === 1) { // Element node
          this.stats.elementsConverted++;
        }
        return content;
      }
    });
  }

  private extractTabContent(container: HTMLElement, index: number): string {
    const tabPanes = container.querySelectorAll('.tab-content, .tab-pane, [role="tabpanel"]');
    if (tabPanes[index]) {
      return this.turndownService.turndown(tabPanes[index].innerHTML);
    }
    return 'Tab content here...';
  }

  public convert(html: string): string {
    // Reset stats
    this.stats = {
      htmlLines: html.split('\n').length,
      markdownLines: 0,
      elementsConverted: 0,
      linksFound: 0,
      imagesFound: 0,
      tablesFound: 0,
    };

    // Clean HTML before conversion
    const cleanedHtml = this.cleanHtml(html);
    
    // Convert to markdown
    let markdown = this.turndownService.turndown(cleanedHtml);
    
    // Post-process markdown
    markdown = this.postProcessMarkdown(markdown);
    
    // Update stats
    this.stats.markdownLines = markdown.split('\n').length;
    
    return markdown;
  }

  private cleanHtml(html: string): string {
    // Remove script tags
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove style tags
    html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove navigation elements
    html = html.replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, '');
    
    // Remove footer elements
    html = html.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, '');
    
    // Remove common non-content elements
    html = html.replace(/<div[^>]*class="[^"]*(?:sidebar|navigation|menu|breadcrumb)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    
    // Clean up extra whitespace
    html = html.replace(/\s+/g, ' ').trim();
    
    return html;
  }

  private postProcessMarkdown(markdown: string): string {
    // Fix multiple consecutive line breaks
    markdown = markdown.replace(/\n{3,}/g, '\n\n');
    
    // Ensure proper spacing around headers
    markdown = markdown.replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2');
    markdown = markdown.replace(/(#{1,6} [^\n]+)\n([^\n])/g, '$1\n\n$2');
    
    // Clean up list formatting
    markdown = markdown.replace(/([^\n])\n([-*+] )/g, '$1\n\n$2');
    markdown = markdown.replace(/([^\n])\n(\d+\. )/g, '$1\n\n$2');
    
    // Fix code block spacing
    markdown = markdown.replace(/([^\n])\n(```)/g, '$1\n\n$2');
    markdown = markdown.replace(/(```[^\n]*\n[\s\S]*?\n```)\n([^\n])/g, '$1\n\n$2');
    
    return markdown.trim();
  }

  public getStats(): ConversionResult['stats'] {
    return { ...this.stats };
  }
}

export async function convertHtmlToMarkdown(
  html: string, 
  config: DocusaurusConfig
): Promise<ConversionResult> {
  const converter = new DocusaurusConverter(config);
  const markdown = converter.convert(html);
  const stats = converter.getStats();

  // Generate frontmatter if enabled
  let finalMarkdown = markdown;
  if (config.addFrontmatter) {
    const frontmatter = generateFrontmatter(config);
    finalMarkdown = frontmatter + markdown;
  }

  return {
    markdown: finalMarkdown,
    stats
  };
}

function generateFrontmatter(config: DocusaurusConfig): string {
  const frontmatterObj: Record<string, any> = {};
  
  if (config.title) frontmatterObj.title = config.title;
  if (config.description) frontmatterObj.description = config.description;
  if (config.sidebarPosition) frontmatterObj.sidebar_position = config.sidebarPosition;
  if (config.sidebarLabel) frontmatterObj.sidebar_label = config.sidebarLabel;
  if (config.slug) frontmatterObj.slug = config.slug;
  if (config.tags && config.tags.length > 0) frontmatterObj.tags = config.tags;
  if (config.keywords && config.keywords.length > 0) frontmatterObj.keywords = config.keywords;

  // Parse custom frontmatter
  if (config.customFrontmatter) {
    try {
      const customLines = config.customFrontmatter.split('\n').filter(line => line.trim());
      for (const line of customLines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          let value = line.substring(colonIndex + 1).trim();
          
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          frontmatterObj[key] = value;
        }
      }
    } catch (error) {
      console.error('Error parsing custom frontmatter:', error);
    }
  }

  if (Object.keys(frontmatterObj).length === 0) {
    return '';
  }

  const yamlLines = Object.entries(frontmatterObj).map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}:\n${value.map(v => `  - ${v}`).join('\n')}`;
    }
    return `${key}: ${typeof value === 'string' ? `"${value}"` : value}`;
  });

  return `---\n${yamlLines.join('\n')}\n---\n\n`;
}

// Browser-compatible version that doesn't require Node.js modules
export function convertHtmlToMarkdownBrowser(html: string, config: DocusaurusConfig): ConversionResult {
  const stats = {
    htmlLines: html.split('\n').length,
    markdownLines: 0,
    elementsConverted: 0,
    linksFound: (html.match(/<a\s+[^>]*href/gi) || []).length,
    imagesFound: (html.match(/<img\s+[^>]*src/gi) || []).length,
    tablesFound: (html.match(/<table/gi) || []).length,
  };

  // Clean HTML before processing
  let cleanedHtml = html
    // Remove script and style tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, ''); // Remove comments

  // Advanced HTML to Markdown conversion
  let markdown = cleanedHtml
    // Handle Angular table components first
    .replace(/<app-table[^>]*>([\s\S]*?)<\/app-table>/gi, (match) => {
      return convertAngularTableToMarkdown(match, config);
    })
    
    // Handle regular tables (before other formatting processing)
    .replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (match, content) => {
      return convertTableToMarkdown(content);
    })
    
    // Handle code blocks with language detection - improved patterns
    .replace(/<pre[^>]*><code[^>]*class=["'][^"']*language-([^"'\s]+)[^"']*["'][^>]*>([\s\S]*?)<\/code><\/pre>/gi, (match, lang, code) => {
      const cleanCode = code.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      return `\n\`\`\`${lang}\n${cleanCode.trim()}\n\`\`\`\n\n`;
    })
    .replace(/<pre[^>]*><code[^>]*class=["']([^"'\s]*language-[^"'\s]+)[^"']*["'][^>]*>([\s\S]*?)<\/code><\/pre>/gi, (match, classAttr, code) => {
      const langMatch = classAttr.match(/language-([^"'\s]+)/);
      const lang = langMatch ? langMatch[1] : '';
      const cleanCode = code.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      return lang ? `\n\`\`\`${lang}\n${cleanCode.trim()}\n\`\`\`\n\n` : `\n\`\`\`\n${cleanCode.trim()}\n\`\`\`\n\n`;
    })
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (match, code) => {
      const cleanCode = code.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      return `\n\`\`\`\n${cleanCode.trim()}\n\`\`\`\n\n`;
    })
    .replace(/<code[^>]*class=["'][^"']*language-([^"'\s]+)[^"']*["'][^>]*>(.*?)<\/code>/gi, (match, lang, code) => {
      const cleanCode = code.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      return `\`${cleanCode}\``;
    })
    .replace(/<code[^>]*>(.*?)<\/code>/gi, (match, code) => {
      const cleanCode = code.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      return `\`${cleanCode}\``;
    })
    
    // Handle custom callout components first (Angular/React components)  
    .replace(/<app-callout[^>]*>([\s\S]*?)<\/app-callout>/gi, (match) => {
      const converted = convertCalloutToAdmonition(match, config);
      return `<!--CALLOUT_CONVERTED-->${converted}<!--/CALLOUT_CONVERTED-->`;
    })
    .replace(/<div[^>]*class="[^"]*callout\s+(?:success|warning|danger|info|note)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, (match) => {
      // Only process if not already converted
      if (match.includes('<!--CALLOUT_CONVERTED-->')) {
        return match; // Skip if already processed
      }
      const converted = convertCalloutToAdmonition(match, config);
      return `<!--CALLOUT_CONVERTED-->${converted}<!--/CALLOUT_CONVERTED-->`;
    })
    
    // Handle standard blockquotes (convert to admonitions if enabled)
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, content) => {
      const cleanContent = content.replace(/<[^>]+>/g, '').trim();
      if (config.convertAdmonitions) {
        // Detect admonition type based on content
        if (cleanContent.toLowerCase().includes('warning') || cleanContent.toLowerCase().includes('caution')) {
          return `\n:::warning\n${cleanContent}\n:::\n\n`;
        } else if (cleanContent.toLowerCase().includes('tip') || cleanContent.toLowerCase().includes('pro tip')) {
          return `\n:::tip\n${cleanContent}\n:::\n\n`;
        } else if (cleanContent.toLowerCase().includes('danger') || cleanContent.toLowerCase().includes('error')) {
          return `\n:::danger\n${cleanContent}\n:::\n\n`;
        } else if (cleanContent.toLowerCase().includes('info') || cleanContent.toLowerCase().includes('information')) {
          return `\n:::info\n${cleanContent}\n:::\n\n`;
        } else {
          return `\n:::note\n${cleanContent}\n:::\n\n`;
        }
      } else {
        return `\n> ${cleanContent}\n\n`;
      }
    })
    
    // Headers with proper spacing
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (match, content) => {
      const cleanContent = content.replace(/<[^>]+>/g, '').trim();
      return `\n# ${cleanContent}\n\n`;
    })
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (match, content) => {
      const cleanContent = content.replace(/<[^>]+>/g, '').trim();
      return `\n## ${cleanContent}\n\n`;
    })
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (match, content) => {
      const cleanContent = content.replace(/<[^>]+>/g, '').trim();
      return `\n### ${cleanContent}\n\n`;
    })
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (match, content) => {
      const cleanContent = content.replace(/<[^>]+>/g, '').trim();
      return `\n#### ${cleanContent}\n\n`;
    })
    .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, (match, content) => {
      const cleanContent = content.replace(/<[^>]+>/g, '').trim();
      return `\n##### ${cleanContent}\n\n`;
    })
    .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, (match, content) => {
      const cleanContent = content.replace(/<[^>]+>/g, '').trim();
      return `\n###### ${cleanContent}\n\n`;
    })
    
    // Lists - handle nested structure
    .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
      return convertListToMarkdown(content, '-');
    })
    .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
      return convertListToMarkdown(content, '1.');
    })
    
    // Links with proper handling
    .replace(/<a\s+[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (match, href, text) => {
      const cleanText = text.replace(/<[^>]+>/g, '').trim();
      const cleanHref = href.trim();
      return `[${cleanText}](${cleanHref})`;
    })
    
    // Images with proper handling
    .replace(/<img\s+[^>]*src\s*=\s*["']([^"']*)["'][^>]*alt\s*=\s*["']([^"']*)["'][^>]*\/?>/gi, '![$2]($1)')
    .replace(/<img\s+[^>]*alt\s*=\s*["']([^"']*)["'][^>]*src\s*=\s*["']([^"']*)["'][^>]*\/?>/gi, '![$1]($2)')
    .replace(/<img\s+[^>]*src\s*=\s*["']([^"']*)["'][^>]*\/?>/gi, '![]($1)')
    
    // Bold and italic with proper nesting
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/(strong|b)>/gi, '**$2**')
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/(em|i)>/gi, '*$2*')
    
    // Paragraphs
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (match, content) => {
      const cleanContent = content.replace(/<br\s*\/?>/gi, '\n').trim();
      return `${cleanContent}\n\n`;
    })
    
    // Line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, '')
    
    // Clean up HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    
    // Clean up excessive whitespace
    .replace(/[ \t]+/g, ' ') // Multiple spaces/tabs to single space
    .replace(/\n[ \t]+/g, '\n') // Remove leading spaces on lines
    .replace(/[ \t]+\n/g, '\n') // Remove trailing spaces on lines
    .replace(/\n{3,}/g, '\n\n') // Multiple line breaks to double
    .trim()
    // Remove conversion markers
    .replace(/<!--CALLOUT_CONVERTED-->/g, '')
    .replace(/<!--\/CALLOUT_CONVERTED-->/g, '');

  // Final cleanup and formatting
  markdown = markdown
    // Fix spacing around headers
    .replace(/\n(#{1,6}[^\n]*)\n([^\n])/g, '\n$1\n\n$2')
    // Fix spacing around code blocks
    .replace(/\n(```[\s\S]*?```)\n([^\n])/g, '\n$1\n\n$2')
    // Fix spacing around lists
    .replace(/\n((?:[-*+]|\d+\.)[ \t]+[^\n]*(?:\n(?:[-*+]|\d+\.)[ \t]+[^\n]*)*)\n([^\n])/g, '\n$1\n\n$2');

  stats.markdownLines = markdown.split('\n').length;
  stats.elementsConverted = (cleanedHtml.match(/<[^>]+>/g) || []).length;

  // Add frontmatter if enabled
  if (config.addFrontmatter) {
    const frontmatter = generateFrontmatter(config);
    markdown = frontmatter + markdown;
  }

  return { markdown, stats };
}

function convertTableToMarkdown(tableContent: string): string {
  // Extract table rows
  const rows = tableContent.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
  if (rows.length === 0) return '';

  let markdownTable = '\n';
  let isFirstRow = true;
  
  rows.forEach((row, index) => {
    const cells = row.match(/<(th|td)[^>]*>([\s\S]*?)<\/(th|td)>/gi) || [];
    if (cells.length === 0) return;
    
    const cellContents = cells.map(cell => {
      let cellContent = cell.replace(/<(th|td)[^>]*>/, '').replace(/<\/(th|td)>/, '');
      
      // Process formatting BEFORE removing tags
      cellContent = cellContent
        .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/(strong|b)>/gi, '**$2**')
        .replace(/<(em|i)[^>]*>([\s\S]*?)<\/(em|i)>/gi, '*$2*')
        .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
        .replace(/<a\s+[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
        // Handle lists within cells - preserve bullet points with HTML line breaks
        .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match: string, listContent: string) => {
          const listItems = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
          if (listItems.length === 0) return '';
          
          const processedItems = listItems.map((item: string) => {
            const itemText = item.replace(/<li[^>]*>/, '').replace(/<\/li>/, '').replace(/<[^>]+>/g, '').trim();
            return itemText;
          }).filter(item => item.length > 0);
          
          // For Markdown tables, create proper line breaks with bullet points
          return processedItems.map(item => `<br>• ${item}`).join('');
        })
        .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match: string, listContent: string) => {
          const listItems = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
          if (listItems.length === 0) return '';
          
          const processedItems = listItems.map((item: string, idx: number) => {
            const itemText = item.replace(/<li[^>]*>/, '').replace(/<\/li>/, '').replace(/<[^>]+>/g, '').trim();
            return `${idx + 1}. ${itemText}`;
          }).filter(item => item.length > 3);
          
          // For numbered lists in tables
          return processedItems.map(item => `<br>${item}`).join('');
        })
        // Handle paragraphs
        .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1 ')
        // Clean up entities first
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        // Convert <br> tags to actual line breaks (preserve them)
        .replace(/<br\s*\/?>/gi, '\n')
        // Remove remaining HTML tags (but preserve <br> tags)
        .replace(/<(?!br\s*\/?>)[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        // Clean up whitespace
        .replace(/\s+/g, ' ')
        .trim();
      
      // Escape pipe characters
      cellContent = cellContent.replace(/\|/g, '\\|');
      
      return cellContent;
    });
    
    markdownTable += '| ' + cellContents.join(' | ') + ' |\n';
    
    // Add header separator after first row
    if (isFirstRow) {
      markdownTable += '| ' + cellContents.map(() => '---').join(' | ') + ' |\n';
      isFirstRow = false;
    }
  });
  
  return markdownTable + '\n';
}

function convertListToMarkdown(listContent: string, marker: string): string {
  const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
  if (items.length === 0) return '';

  let markdownList = '\n';
  items.forEach((item, index) => {
    let itemContent = item.replace(/<li[^>]*>/, '').replace(/<\/li>/, '');
    
    // Process links within list items first
    itemContent = itemContent.replace(/<a\s+[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');
    
    // Process formatting
    itemContent = itemContent.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/(strong|b)>/gi, '**$2**');
    itemContent = itemContent.replace(/<(em|i)[^>]*>([\s\S]*?)<\/(em|i)>/gi, '*$2*');
    itemContent = itemContent.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
    
    // Clean remaining tags
    const cleanContent = itemContent.replace(/<[^>]+>/g, '').trim();
    const currentMarker = marker === '1.' ? `${index + 1}.` : marker;
    markdownList += `${currentMarker} ${cleanContent}\n`;
  });
  
  return markdownList + '\n';
}

function convertCalloutToAdmonition(content: string, config: DocusaurusConfig): string {
  if (!config.convertAdmonitions) {
    const cleanContent = content.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    return `\n> ${cleanContent}\n\n`;
  }

  // Extract the callout type from class names
  let admonitionType = 'note';
  
  if (content.includes('class="callout success"') || content.includes('callout-icon fas success') || content.includes('fa-check-circle')) {
    admonitionType = 'tip';
  } else if (content.includes('class="callout warning"') || content.includes('callout warning') || content.includes('fa-exclamation-triangle')) {
    admonitionType = 'warning';
  } else if (content.includes('class="callout danger"') || content.includes('callout danger') || content.includes('fa-times-circle')) {
    admonitionType = 'danger';
  } else if (content.includes('class="callout info"') || content.includes('callout info') || content.includes('fa-info-circle')) {
    admonitionType = 'info';
  }

  // Extract title from callout-title OR pluginobject data
  let title = '';
  
  // Try to get title from pluginobject data first
  const pluginMatch = content.match(/pluginobject="[^"]*&quot;title&quot;:&quot;([^&]*)&quot;[^"]*"/i);
  if (pluginMatch) {
    title = pluginMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
  }
  
  // Fallback to HTML content
  if (!title) {
    const titleMatch = content.match(/<div[^>]*class="[^"]*callout-title[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (titleMatch) {
      title = titleMatch[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    }
  }

  // Extract main content - get ALL content within the callout, not just callout-text
  let mainContent = '';
  
  // First try to get content from callout-text
  const textMatch = content.match(/<div[^>]*class="[^"]*callout-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (textMatch) {
    let textContent = textMatch[1];
    
    // Process nested callout-text divs
    if (textContent.includes('class="callout-text"')) {
      const nestedMatch = textContent.match(/<div[^>]*class="[^"]*callout-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      if (nestedMatch) {
        textContent = nestedMatch[1];
      }
    }
    
    // Process links and formatting BEFORE removing tags
    textContent = textContent.replace(/<a\s+[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');
    textContent = textContent.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/(strong|b)>/gi, '**$2**');
    textContent = textContent.replace(/<(em|i)[^>]*>([\s\S]*?)<\/(em|i)>/gi, '*$2*');
    textContent = textContent.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
    textContent = textContent.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');
    
    mainContent = textContent
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  // Build the admonition with proper title handling
  let admonition = `\n:::${admonitionType}`;
  if (title) {
    admonition += ` ${title}`;
  }
  admonition += `\n\n${mainContent}\n\n:::\n\n`;

  return admonition;
}

function convertAngularTableToMarkdown(content: string, config: DocusaurusConfig): string {
  // Extract table from HTML structure first (more reliable)
  const tableMatch = content.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
  if (tableMatch) {
    return convertTableToMarkdown(tableMatch[1]);
  }

  // Try to extract table data from pluginobject as fallback
  const pluginMatch = content.match(/pluginobject="([^"]*)"/);
  if (pluginMatch) {
    try {
      // More robust JSON parsing
      let jsonString = pluginMatch[1]
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'");
      
      const pluginData = JSON.parse(jsonString);
      if (pluginData.data && pluginData.data.contents && Array.isArray(pluginData.data.contents)) {
        return convertArrayToMarkdownTable(pluginData.data.contents);
      }
    } catch (error) {
      console.error('Error parsing plugin data, using HTML fallback:', error);
      // Continue to next fallback
    }
  }

  // Final fallback: try to extract any table-like data from the content
  if (content.includes('<th>') && content.includes('<td>')) {
    return convertTableToMarkdown(content);
  }

  // If no table found, return empty
  return '';
}

function convertArrayToMarkdownTable(tableArray: string[][]): string {
  if (!tableArray || tableArray.length === 0) return '';

  let markdownTable = '\n';
  
  tableArray.forEach((row, index) => {
    if (!Array.isArray(row)) return;
    
    // Process each cell content
    const cellContents = row.map(cell => {
      if (typeof cell !== 'string') return '';
      
      // Process markdown formatting within cells
      let processedCell = cell
        // Bold text (from **text** or <strong>)
        .replace(/\*\*([^*]+)\*\*/g, '**$1**')
        .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/(strong|b)>/gi, '**$2**')
        // Italic text
        .replace(/\*([^*]+)\*/g, '*$1*')
        .replace(/<(em|i)[^>]*>([\s\S]*?)<\/(em|i)>/gi, '*$2*')
        // Inline code
        .replace(/`([^`]+)`/g, '`$1`')
        .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
        // Links
        .replace(/<a\s+[^>]*href\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
        // Remove HTML tags
        .replace(/<[^>]+>/g, '')
        // Clean up entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      
      // Handle multi-line content in cells (lists, paragraphs)
      if (processedCell.includes('\n')) {
        // Convert lists to inline format for table cells
        processedCell = processedCell
          .replace(/\n-\s+/g, '; ')
          .replace(/\n\d+\.\s+/g, '; ')
          .replace(/\n{2,}/g, ' ')
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
      
      // Escape pipe characters in cell content
      processedCell = processedCell.replace(/\|/g, '\\|');
      
      return processedCell;
    });
    
    markdownTable += '| ' + cellContents.join(' | ') + ' |\n';
    
    // Add header separator after first row
    if (index === 0) {
      markdownTable += '| ' + cellContents.map(() => '---').join(' | ') + ' |\n';
    }
  });
  
  return markdownTable + '\n';
}