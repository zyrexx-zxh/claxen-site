/* ---------------------------------------------------------------------------
   CLAXEN — site data. Everything that is content (names, links, service copy,
   FAQ answers) lives here so the pages stay in sync and you can edit it in one place.
   Run `node tools/set-domain.js https://your-real-domain.com` after you pick a domain.
   --------------------------------------------------------------------------- */
module.exports = {
  name: 'CLAXEN',
  person: 'Claxen',
  // placeholder domain (.example is reserved, it can never be a real site). Replaced by tools/set-domain.js
  url: process.env.SITE_URL || 'https://your-domain.example',
  email: 'claxen@outlook.com',
  telegramUrl: 'https://t.me/claxen',
  telegramText: 't.me/claxen',
  year: 2026,
  lastmod: '2026-10-24',
  priceMin: 10,
  priceMax: 10000,

  services: [
    {
      slug: 'website-development',
      id: 'web',
      name: 'Website development',
      nav: 'Websites',
      color: 'blue',
      tags: ['Landing pages', 'Web apps', '3D and WebGL', 'SEO'],
      blurb: 'Fast, responsive sites and web apps that look the part and get found on Google.',
      seo: {
        title: 'Custom Website Development, Fast and SEO-Ready | CLAXEN',
        description: 'Custom websites and web apps in clean, fast, search-friendly code. Landing pages, business sites, 3D experiences. Projects from $10. Message Claxen.',
        h1: 'Custom websites that load fast and get found',
        keywords: 'website development, custom website, freelance web developer, landing page, SEO-friendly website'
      },
      cta: 'Have a website to build?',
      faqHead: 'Questions about websites.',
      lead: 'I design and build websites in clean, semantic code: landing pages, business sites, portfolios and web apps. They load fast on a phone, they are easy for search engines to read, and every page is built around what you want a visitor to do next.',
      gets: [
        ['Responsive by default', 'Layouts that work on phones, tablets and desktops, tested on real screen sizes.'],
        ['Speed you can measure', 'Optimised images, minimal scripts and fast hosting, with Core Web Vitals in mind from day one.'],
        ['Search-friendly foundations', 'Semantic HTML, titles and descriptions, a sitemap and structured data, so Google understands each page.'],
        ['Accessible and usable', 'Keyboard navigation, readable contrast and respect for reduced-motion settings.'],
        ['Motion and 3D when it helps', 'Animation, WebGL and interactive scenes for sites that need to stand out, without slowing the page down.'],
        ['Launch and handover', 'I deploy the site on the hosting you choose, connect your domain and hand over the code and access.']
      ],
      fits: [
        'A landing page for a product, service or event',
        'A business or portfolio website',
        'A web app, dashboard or directory',
        'A redesign or speed and SEO fix for an existing site',
        'An interactive or 3D showcase'
      ],
      tools: ['Next.js', 'JavaScript', 'Node.js', 'Three.js and WebGL', 'HTML and CSS'],
      faqs: [
        ['How long does a website take?', 'It depends on scope. A one-page site is quick, while a multi-page site with forms, integrations or custom animation takes longer. You get a timeline together with the quote, before any work starts.'],
        ['Do you use templates?', 'No. I write the design and the code for your project. I use proven frameworks and libraries underneath, but the result is made for you, not reskinned from a theme.'],
        ['Can you speed up or fix the SEO of my existing site?', 'Yes. Send me the address and I will check loading speed, page structure, metadata and mobile layout, then tell you what to change and what it would cost.'],
        ['Will my site rank first on Google?', 'I build every site so search engines can read it and so it loads quickly. Rankings also depend on your content, competition and time, so nobody honest can promise a position.'],
        ['Who owns the site and the domain?', 'You do. I set things up under your accounts, and hand over the code and access at launch unless we agree otherwise.']
      ]
    },
    {
      slug: 'bot-development',
      id: 'bot',
      name: 'Bot development',
      nav: 'Bots',
      color: 'sun',
      tags: ['Telegram', 'Discord', 'Support', 'Sales'],
      blurb: 'Telegram and Discord bots that answer, sell, moderate and run your community around the clock.',
      seo: {
        title: 'Telegram and Discord Bot Development for Hire | CLAXEN',
        description: 'Custom Telegram and Discord bots for support, sales, moderation and alerts. Built in Python, running 24/7. Projects from $10. Tell Claxen what you need.',
        h1: 'Telegram and Discord bots that run your chat around the clock',
        keywords: 'telegram bot development, discord bot development, custom chatbot, bot developer for hire, python bot'
      },
      cta: 'Need a bot built?',
      faqHead: 'Questions about bots.',
      lead: 'I build custom Telegram and Discord bots that handle the repetitive part of running a community or a business: answering the same questions, taking orders, moderating chats and sending alerts. They run on a server, so they work while you sleep.',
      gets: [
        ['Commands, menus and buttons', 'A clear flow your users can follow without reading instructions, from /start to the last reply.'],
        ['Automatic answers', 'Common questions answered instantly, with a hand-off to you when a person is needed.'],
        ['Orders and lead capture', 'Collect requests, details and confirmations, and send them to you or to a spreadsheet, database or other tool.'],
        ['Moderation and community tools', 'Welcome messages, spam and link filters, roles, rules and announcements.'],
        ['Admin controls', 'A way for you to manage content, users and settings without touching code.'],
        ['Hosting and monitoring', 'I deploy the bot on a server, set it to restart itself if it fails, and hand over documentation.']
      ],
      fits: [
        'Customer support and FAQ answers in Telegram',
        'Order, booking or request bots for a small business',
        'Discord moderation and community management',
        'Alerts, reminders and daily summaries',
        'A Telegram Mini App or web app connected to a bot'
      ],
      tools: ['Python', 'Telegram Bot API', 'Discord API', 'Webhooks', 'Databases'],
      faqs: [
        ['Can the bot run 24/7?', 'Yes. I deploy it on a server and set it up to restart automatically, so it stays online without your computer being on.'],
        ['Telegram or Discord?', 'I build for both. Telegram suits customer-facing bots, shops and announcements. Discord suits communities, roles and moderation. If you are unsure, describe your audience and I will suggest one.'],
        ['Can the bot connect to my website or spreadsheet?', 'Yes. Bots talk to other tools through APIs and webhooks, so orders, leads and messages can flow into the places you already work in.'],
        ['What does a bot cost?', 'Projects run from $10 to $10,000. A simple command bot sits at the low end, while a bot with payments, an admin panel and several integrations needs a bigger budget. Send a brief and I will quote it.'],
        ['Can you fix or extend a bot I already have?', 'Yes. Share the code or describe what it does, and I will review it before suggesting a fix or a rebuild.']
      ]
    },
    {
      slug: 'python-automation',
      id: 'py',
      name: 'Python automations',
      nav: 'Automation',
      color: 'ink',
      tags: ['Scraping', 'Scheduling', 'APIs', 'Backend'],
      blurb: 'Scripts and backends that remove repetitive work: scraping, reports, integrations and scheduled jobs.',
      seo: {
        title: 'Python Automation and Backend Scripting Services | CLAXEN',
        description: 'Python scripts and backends that automate repetitive work: scraping, reports, API integrations, scheduled jobs. Projects from $10. Describe your task.',
        h1: 'Python automation that does the repetitive work for you',
        keywords: 'python automation, python scripting, web scraping, backend development, api integration, freelance python developer'
      },
      cta: 'Got something to automate?',
      faqHead: 'Questions about automation.',
      lead: 'If you do the same task every day, a script can do it for you. I write Python automations and small backends that collect data, move it between tools, build reports and run on a schedule, with logging and alerts so you know when something needs attention.',
      gets: [
        ['Data collection', 'Scripts that gather information from websites and APIs, where you have the right to use it, and clean it into a usable format.'],
        ['Scheduled jobs', 'Tasks that run every hour, day or week on a server, without anyone pressing a button.'],
        ['Integrations', 'Connect the tools you use through their APIs and webhooks, so data moves on its own.'],
        ['Reports and spreadsheets', 'Generate CSV, Excel and summary reports automatically and send them where they are needed.'],
        ['Small backends and APIs', 'A server-side service for your app, bot or site, with the endpoints it needs.'],
        ['Logs, alerts and handover', 'Clear logs and failure notifications, plus documentation so the script is not a black box.']
      ],
      fits: [
        'Collecting prices, listings or leads into a spreadsheet',
        'Daily or weekly reports sent by email or chat',
        'Syncing data between two services',
        'Cleaning and converting large files',
        'A backend for a bot, site or internal tool'
      ],
      tools: ['Python', 'REST APIs', 'Webhooks', 'Scheduling', 'CSV and Excel'],
      faqs: [
        ['What kind of tasks can be automated?', 'Anything repetitive and rule-based: copying data between tools, collecting information, renaming and converting files, building reports, sending notifications. If a person does it the same way each time, it can usually be scripted.'],
        ['Is web scraping allowed?', 'It depends on the site and how the data will be used. I only build automations for data you are allowed to use, and I respect site terms and rate limits.'],
        ['Where will the script run?', 'On a small server or a service you already pay for. I set up the schedule, logging and restarts, and tell you what it costs to keep running.'],
        ['What if the script breaks later?', 'Websites and APIs change. I add logging and alerts so failures are visible, and I stay reachable for fixes after launch.'],
        ['Do I need to know how to code?', 'No. You describe the task in plain language, and I handle the code. You receive a short guide on how to run it and what it does.']
      ]
    },
    {
      slug: 'ai-automation-tools',
      id: 'ai',
      name: 'AI automated tools',
      nav: 'AI tools',
      color: 'lilac',
      tags: ['LLM apps', 'Agents', 'Workflows', 'Custom tools'],
      blurb: 'AI-powered tools and agents that write, summarise and decide, wired into the apps you already use.',
      seo: {
        title: 'AI Automation Tools and LLM Workflows for Hire | CLAXEN',
        description: 'Custom AI tools, agents and LLM workflows that write, summarise and classify, connected to your apps. Projects from $10. Tell Claxen which task to hand to AI.',
        h1: 'AI tools and agents that write, summarise and decide for you',
        keywords: 'AI automation, LLM integration, custom AI tools, AI agents, AI workflow developer, chatgpt api integration'
      },
      cta: 'Got a task for AI?',
      faqHead: 'Questions about AI tools.',
      lead: 'I build AI-powered tools that take over the text-heavy parts of your work: summarising long documents, sorting incoming messages, drafting replies and answering questions from your own content. They connect to the apps you already use, and a human stays in the loop where it matters.',
      gets: [
        ['LLM features inside your product', 'Add summaries, drafting, classification or search to your site, app or bot.'],
        ['Document and message processing', 'Turn long text, emails and forms into structured data, short summaries and next steps.'],
        ['Assistants that use your content', 'Question answering based on your own documents and FAQs, with sources you can check.'],
        ['Agents and multi-step workflows', 'Chains of actions that read, decide and update other tools, with review steps you control.'],
        ['Prompt design and testing', 'Prompts tested on your real examples, so results are consistent before launch.'],
        ['Cost and privacy awareness', 'Sensible model choices, caching and limits to keep costs predictable, and care with sensitive data.']
      ],
      fits: [
        'Summarising support tickets, calls or long documents',
        'Sorting and answering incoming messages',
        'Generating product descriptions or drafts at scale',
        'A chatbot that answers from your own knowledge base',
        'Adding AI features to an existing site or bot'
      ],
      tools: ['LLM APIs', 'Python', 'JavaScript', 'Webhooks', 'Vector search'],
      faqs: [
        ['Which AI models do you use?', 'I work with the major LLM APIs and choose by quality, cost and privacy needs for your task. If a simple rule or a small script does the job, I will say so rather than sell you AI.'],
        ['Will the AI make mistakes?', 'Sometimes. I design tools so that important outputs can be reviewed before they are sent or saved, and I test prompts on real examples to catch weak spots early.'],
        ['Is my data safe?', 'I only send the data that a task needs, avoid storing what is not required, and talk through privacy options with you before building. Tell me early if the data is sensitive.'],
        ['How much do the AI services cost to run?', 'Model providers charge by usage. I estimate monthly running costs during scoping and build in limits and caching to keep them predictable.'],
        ['Can you add AI to my existing bot or website?', 'Yes. Most AI projects are an extension of something that already exists, such as a Telegram bot, a form or a dashboard.']
      ]
    }
  ],

  faqHome: [
    ['How much does a project cost?', 'Projects start at $10 and go up to $10,000, depending on scope. A small script is a different job from a full web app with an admin panel. Send a brief with your budget and I will tell you what is realistic.'],
    ['What do you build?', 'Four things: custom websites and web apps, Telegram and Discord bots, Python automations and backends, and AI-powered tools. Each has its own page with details.'],
    ['How do we get started?', 'Message me on Telegram at t.me/claxen or email claxen@outlook.com with what you need, your budget and your deadline. The brief form on this page writes that message for you.'],
    ['Can you work with something that already exists?', 'Yes. I can fix, extend or rebuild an existing site, bot or script. Share the code or access and I will review it before suggesting what to do.'],
    ['Will my website show up on Google?', 'I build sites with fast loading, clean semantic HTML, metadata and structured data so search engines can understand them. Rankings also depend on content and competition, so I do not promise a position.'],
    ['Do you help after launch?', 'Yes. I stay reachable for fixes and updates, and we can agree on ongoing work if you want it.'],
    ['Do I get the source code?', 'You get the code and the access at launch, unless we agree otherwise at the start.']
  ]
};
