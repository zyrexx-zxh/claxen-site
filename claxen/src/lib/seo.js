const cfg = require('../site.js');

const U = (p = '') => `${cfg.url}/${p}`;
const ID = { site: U('#website'), person: U('#person'), biz: U('#business') };

const faqSchema = (faqs) => ({
  '@type': 'FAQPage',
  mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
});

const crumbs = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url }))
});

const serviceNode = (s) => ({
  '@type': 'Service',
  '@id': U(`${s.slug}/#service`),
  name: s.name,
  serviceType: s.name,
  description: s.seo.description,
  url: U(`${s.slug}/`),
  provider: { '@id': ID.biz },
  areaServed: 'Worldwide',
  offers: { '@type': 'PriceSpecification', priceCurrency: 'USD', minPrice: cfg.priceMin, maxPrice: cfg.priceMax }
});

function homeGraph(meta) {
  return [{
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite', '@id': ID.site, url: U(), name: cfg.name, description: meta.description, inLanguage: 'en',
        publisher: { '@id': ID.person }
      },
      {
        '@type': 'Person', '@id': ID.person, name: cfg.person, url: U(), email: cfg.email,
        jobTitle: 'Freelance developer', sameAs: [cfg.telegramUrl],
        knowsAbout: ['Website development', 'Telegram bots', 'Discord bots', 'Python automation', 'AI automation', 'Backend development']
      },
      {
        '@type': 'ProfessionalService', '@id': ID.biz, name: cfg.name, url: U(), image: U('assets/img/og-home.png'),
        email: cfg.email, priceRange: `$${cfg.priceMin} - $${cfg.priceMax.toLocaleString('en-US')}`,
        areaServed: 'Worldwide', founder: { '@id': ID.person }, sameAs: [cfg.telegramUrl],
        contactPoint: [{ '@type': 'ContactPoint', contactType: 'sales', email: cfg.email, availableLanguage: 'English' }],
        hasOfferCatalog: {
          '@type': 'OfferCatalog', name: 'Development services',
          itemListElement: cfg.services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, url: U(`${s.slug}/`), description: s.blurb } }))
        }
      },
      { '@type': 'WebPage', '@id': U('#webpage'), url: U(), name: meta.title, description: meta.description, isPartOf: { '@id': ID.site }, about: { '@id': ID.biz }, inLanguage: 'en', dateModified: cfg.lastmod },
      faqSchema(cfg.faqHome)
    ]
  }];
}

function serviceGraph(s) {
  const url = U(`${s.slug}/`);
  return [{
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: s.seo.title, description: s.seo.description, isPartOf: { '@id': ID.site }, about: { '@id': U(`${s.slug}/#service`) }, breadcrumb: { '@id': `${url}#breadcrumb` }, inLanguage: 'en', dateModified: cfg.lastmod },
      { ...crumbs([['Home', U()], [s.name, url]]), '@id': `${url}#breadcrumb` },
      serviceNode(s),
      faqSchema(s.faqs)
    ]
  }];
}

module.exports = { homeGraph, serviceGraph, U, ID };
