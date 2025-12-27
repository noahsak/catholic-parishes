// src/hooks/usePageMeta.jsx
import { useEffect } from 'react';

export function usePageMeta(title, description, image) {
  useEffect(() => {
    const baseTitle = "Catholic Parishes";
    const fullTitle = title ? `${title} | ${baseTitle}` : baseTitle;
    const fullDesc = description || "Find Catholic Mass times, confession, and adoration across Ontario.";
    const currentUrl = window.location.href;

    // 1. Update Document Title
    document.title = fullTitle;

    // 2. Helper to Update or Create Meta Tags
    const updateOrCreateMeta = (selector, attr, value, isProperty = false) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (isProperty) element.setAttribute('property', attr);
        else element.setAttribute('name', attr);
        document.head.appendChild(element);
      }
      element.setAttribute('content', value);
    };

    const absoluteImage =
      image && image.startsWith("http")
        ? image
        : image
        ? `${window.location.origin}${image}`
        : null;

    // Standard Meta
    updateOrCreateMeta('meta[name="description"]', 'description', fullDesc);

    // Open Graph (Social Media)
    updateOrCreateMeta('meta[property="og:title"]', 'og:title', fullTitle, true);
    updateOrCreateMeta('meta[property="og:description"]', 'og:description', fullDesc, true);
    updateOrCreateMeta('meta[property="og:url"]', 'og:url', currentUrl, true);
    updateOrCreateMeta('meta[property="og:type"]', 'og:type', 'website', true);

    // 3. Update Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    updateOrCreateMeta('meta[name="twitter:card"]', 'twitter:card', 'summary_large_image');
    updateOrCreateMeta('meta[name="twitter:title"]', 'twitter:title', fullTitle);
    updateOrCreateMeta('meta[name="twitter:description"]', 'twitter:description', fullDesc);
    if (image) {
      updateOrCreateMeta('meta[name="twitter:image"]', 'twitter:image', image);
    }

    if (absoluteImage) {
      updateOrCreateMeta('meta[property="og:image"]', 'og:image', absoluteImage, true);
      updateOrCreateMeta('meta[name="twitter:image"]', 'twitter:image', absoluteImage);
    }

  }, [title, description, image]);
}