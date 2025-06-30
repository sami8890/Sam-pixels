import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: string;
  noIndex?: boolean;
}

export const SEO: React.FC<SEOProps> = ({
  title = 'SamPixel - AI Image Toolkit | Background Remover, Upscaler & More',
  description = 'Transform your images with AI-powered tools. Remove backgrounds, upscale quality, add watermarks, and crop for social media. Fast, free, and professional results.',
  keywords = ['AI image editor', 'background remover', 'image upscaler', 'watermark tool', 'image processing', 'photo editor'],
  image = '/og-image.jpg',
  url = 'https://sampixel.com',
  type = 'website',
  noIndex = false,
}) => {
  const fullTitle = title.includes('SamPixel') ? title : `${title} | SamPixel`;
  const fullUrl = url.startsWith('http') ? url : `https://sampixel.com${url}`;
  const fullImage = image.startsWith('http') ? image : `https://sampixel.com${image}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="SamPixel" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:creator" content="@sampixel" />
      
      {/* Additional Meta Tags */}
      <meta name="author" content="SamPixel Team" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#3B82F6" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "SamPixel",
          "description": description,
          "url": fullUrl,
          "applicationCategory": "MultimediaApplication",
          "operatingSystem": "Web Browser",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "creator": {
            "@type": "Organization",
            "name": "SamPixel"
          }
        })}
      </script>
    </Helmet>
  );
};

// Page-specific SEO components
export const HomePageSEO = () => (
  <SEO
    title="SamPixel - AI Image Toolkit | Background Remover, Upscaler & More"
    description="Transform your images with AI-powered tools. Remove backgrounds, upscale quality, add watermarks, and crop for social media. Fast, free, and professional results."
    keywords={['AI image editor', 'background remover', 'image upscaler', 'watermark tool', 'photo editor', 'image processing']}
  />
);

export const BackgroundRemoverSEO = () => (
  <SEO
    title="AI Background Remover - Remove Image Backgrounds Instantly"
    description="Remove backgrounds from images instantly with AI. Perfect for product photos, portraits, and social media. Free online background removal tool."
    keywords={['background remover', 'remove background', 'AI background removal', 'transparent background', 'photo editing']}
    url="/tools/background-remover"
  />
);

export const ImageUpscalerSEO = () => (
  <SEO
    title="AI Image Upscaler - Enhance Photo Quality & Resolution"
    description="Upscale images up to 8x with AI. Enhance photo quality and resolution without losing detail. Perfect for printing and professional use."
    keywords={['image upscaler', 'AI upscaling', 'enhance image quality', 'increase resolution', 'photo enhancement']}
    url="/tools/image-upscaler"
  />
);

export const WatermarkSEO = () => (
  <SEO
    title="Text Watermark Tool - Add Custom Watermarks to Images"
    description="Add custom text watermarks to protect your images. Choose fonts, colors, and positioning. Perfect for photographers and content creators."
    keywords={['watermark tool', 'add watermark', 'text watermark', 'image protection', 'copyright protection']}
    url="/tools/text-watermark"
  />
);

export const CropResizeSEO = () => (
  <SEO
    title="Image Crop & Resize Tool - Perfect Sizing for Social Media"
    description="Crop and resize images for any platform. Pre-built templates for Instagram, Facebook, Twitter, and more. Professional image sizing made easy."
    keywords={['crop image', 'resize image', 'social media sizes', 'image dimensions', 'photo cropping']}
    url="/tools/crop-resize"
  />
);