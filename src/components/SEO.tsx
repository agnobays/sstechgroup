import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  schema?: Record<string, any> | Record<string, any>[];
}

const DEFAULT_TITLE = 'S&S Tech Group — Digital Solutions, Web Development & Intelligent Systems';
const DEFAULT_DESC =
  'S&S Tech Group (Pty) Ltd designs, develops, and delivers high-performance enterprise websites, custom web applications, email marketing automation, and cloud platforms across South Africa.';
const DEFAULT_KEYWORDS =
  'web development south africa, web design cape town, custom software development johannesburg, enterprise web platforms durban, email marketing automation, school website development, professional website packages, react typescript web developers';
const BASE_URL = 'https://sstechgroup.co.za';

export const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESC,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  ogType = 'website',
  ogImage = 'https://sstechgroup.co.za/og-image.png',
  schema,
}) => {
  const location = useLocation();
  const fullTitle = title
    ? `${title} | S&S Tech Group (Pty) Ltd`
    : DEFAULT_TITLE;
  const canonicalUrl = canonical || `${BASE_URL}${location.pathname}`;

  useEffect(() => {
    // 1. Page Title
    document.title = fullTitle;

    // Helper to set or create meta tags
    const setMetaTag = (attribute: 'name' | 'property', attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${attribute}="${attrValue}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Primary Meta Tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);
    setMetaTag('name', 'author', 'S&S Tech Group (Pty) Ltd');
    setMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // 3. Open Graph Tags
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:site_name', 'S&S Tech Group');
    setMetaTag('property', 'og:locale', 'en_ZA');
    if (ogImage) {
      setMetaTag('property', 'og:image', ogImage);
    }

    // 4. Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', description);
    if (ogImage) {
      setMetaTag('name', 'twitter:image', ogImage);
    }

    // 5. Canonical Link Tag
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // 6. JSON-LD Schema
    const existingSchemaScript = document.getElementById('page-json-ld');
    if (existingSchemaScript) {
      existingSchemaScript.remove();
    }

    if (schema) {
      const script = document.createElement('script');
      script.id = 'page-json-ld';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    return () => {
      const s = document.getElementById('page-json-ld');
      if (s) s.remove();
    };
  }, [fullTitle, description, keywords, canonicalUrl, ogType, ogImage, schema]);

  return null;
};
