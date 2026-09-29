/**
 * Sanitizador seguro de SVG para proteção contra ataques de DOM-XSS.
 * Remove tags executáveis, links javascript: e atributos de manipuladores de eventos on*.
 */

const DANGEROUS_TAGS = [
  'script',
  'iframe',
  'object',
  'embed',
  'link',
  'meta',
  'style',
  'foreignobject',
];

/**
 * Sanitiza uma string contendo marcação SVG bruta antes da injeção no DOM.
 * @param svgString SVG em texto bruto fornecido pelo usuário ou template
 * @returns SVG seguro e higienizado
 */
export function sanitizeSvg(svgString: string | null | undefined): string {
  if (!svgString || typeof svgString !== 'string') {
    return '';
  }

  // 1. Remove comentários HTML/XML que possam ocultar payloads
  let clean = svgString.replace(/<!--[\s\S]*?-->/g, '');

  // 2. Remove tags perigosas e seus conteúdos
  for (const tag of DANGEROUS_TAGS) {
    const tagRegex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
    clean = clean.replace(tagRegex, '');
    const selfClosingRegex = new RegExp(`<${tag}[^>]*\\/?>`, 'gi');
    clean = clean.replace(selfClosingRegex, '');
  }

  // 3. Remove manipuladores de eventos on* (ex: onload, onerror, onclick)
  clean = clean.replace(/\s+on[a-z]+=(["'][^"']*["']|[^\s>]+)/gi, '');

  // 4. Remove referências javascript: em href ou xlink:href
  clean = clean.replace(/(href|xlink:href)=["']\s*javascript:[^"']*["']/gi, '$1=""');

  return clean.trim();
}
