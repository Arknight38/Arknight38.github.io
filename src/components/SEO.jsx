import { Helmet } from 'react-helmet-async';

export function SEO({
  title,
  description = 'Saku Grossarth — Computer Engineer specializing in systems programming, kernel development, and low-level engineering.',
  pathname = '',
  image = '/og-image.png',
  type = 'website',
  article = null,
}) {
  const siteUrl = 'https://arknight38.github.io/Arknight38.github.io';
  const fullUrl = `${siteUrl}${pathname}`;
  const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{title ? `${title} — Saku Grossarth` : 'Saku Grossarth'}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={title || 'Saku Grossarth'} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content="Saku Grossarth" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || 'Saku Grossarth'} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* Article Meta */}
      {article && (
        <>
          <meta property="article:published_time" content={article.publishedTime} />
          <meta property="article:modified_time" content={article.modifiedTime} />
          <meta property="article:author" content="Saku Grossarth" />
          {article.tags?.map((tag) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': article ? 'Article' : 'WebSite',
          ...(article ? {
            headline: title,
            description: description,
            url: fullUrl,
            datePublished: article.publishedTime,
            dateModified: article.modifiedTime,
            author: {
              '@type': 'Person',
              name: 'Saku Grossarth',
              url: siteUrl,
            },
            publisher: {
              '@type': 'Person',
              name: 'Saku Grossarth',
            },
            image: fullImage,
          } : {
            name: 'Saku Grossarth',
            url: fullUrl,
            description: description,
            author: {
              '@type': 'Person',
              name: 'Saku Grossarth',
              jobTitle: 'Computer Engineer',
              url: siteUrl,
              sameAs: [
                'https://github.com/Arknight38',
                'https://linkedin.com/in/saku-grossarth',
              ],
            },
          }),
        })}
      </script>
    </Helmet>
  );
}
