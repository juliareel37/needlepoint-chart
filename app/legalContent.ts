export type LegalSection = {
  title: string;
  body: readonly string[];
};

export type LegalPageContent = {
  metadata: {
    title: string;
    description: string;
  };
  lastUpdated: string;
  title: string;
  intro: string;
  sections: readonly LegalSection[];
  contact: string;
  alternatePolicy: {
    href: string;
    label: string;
  };
};

export const privacyPolicyContent = {
  metadata: {
    title: "Privacy Policy | Wippa",
    description: "How Wippa collects, uses, stores, and protects information.",
  },
  lastUpdated: "May 26, 2026",
  title: "Privacy Policy",
  intro:
    "This Privacy Policy explains how Wippa collects, uses, stores, shares, and protects personal information when you use our web-based needlepoint pattern editing tool, create an account, save designs, upload images, export patterns, or communicate with us.",
  sections: [
    {
      title: "Who we are",
      body: [
        "Wippa is a web-based needlepoint pattern editing tool operated by Julia Reel. You can contact us about this Privacy Policy or your personal information at support@wippaeditor.com.",
        "Wippa is currently available as a web app. We may offer mobile apps in the future, and we will update this Privacy Policy if our practices materially change.",
      ],
    },
    {
      title: "Information we collect",
      body: [
        "We collect information you provide directly, including your name, email address, account credentials, support messages, and any other information you choose to provide.",
        "If you sign in using Google OAuth, we may receive information associated with your Google account, such as your name, email address, and profile photo.",
        "We collect user content you create, upload, save, or manage in Wippa, including needlepoint designs, drafts, projects, uploaded images, chart data, color palettes, editor settings, and export-related information.",
        "We may also collect technical and usage information, including browser type, device information, log data, authentication events, app performance data, feature usage, and other signals that help us keep Wippa secure, reliable, and useful.",
      ],
    },
    {
      title: "Accounts and authentication",
      body: [
        "Wippa uses Neon Auth to manage user accounts and authentication, including email and password sign-in and Google OAuth sign-in options.",
        "We use account information to create and manage accounts, authenticate users, keep accounts secure, provide access to saved designs, and send account-related communications such as login codes, password reset emails, and account notifications.",
      ],
    },
    {
      title: "Designs, uploads, and user content",
      body: [
        "Your designs, uploaded images, chart data, color palettes, drafts, projects, and exports remain your content. We process this content so that the editor, library, persistence, caching, and export features can work.",
        "Designs are private by default. If you choose to export a design, Wippa may generate a local PDF file for you to download or save.",
        "Some design data may be stored in our database or cloud infrastructure, and some may be cached locally in your browser to help preserve your work and improve performance.",
        "Please avoid uploading content that you do not have the right to use or that includes sensitive personal information you do not want stored or processed in Wippa.",
      ],
    },
    {
      title: "Local storage, IndexedDB, cookies, and similar technologies",
      body: [
        "Wippa uses browser-based storage technologies, including localStorage and IndexedDB, as well as cookies or similar technologies where needed for authentication, security, preferences, caching, and app functionality.",
        "These technologies may be used to keep you logged in, remember preferences, cache designs, preserve draft work, improve performance, and reduce the risk of losing work during a refresh, browser issue, or temporary connection problem.",
        "Your browser may allow you to limit cookies, localStorage, or IndexedDB, but some parts of Wippa may not work correctly without them.",
      ],
    },
    {
      title: "How we use information",
      body: [
        "We use information to provide, operate, maintain, and improve Wippa, including account management, authentication, design saving, image upload, project persistence, PDF export, support, security, analytics, debugging, and product development.",
        "We may use information to send transactional emails, such as login codes, password resets, account notifications, security alerts, and other service-related messages.",
        "We may also use information to send marketing emails, product updates, newsletters, or announcements. You can unsubscribe from marketing emails where available, though we may still send transactional or service-related messages.",
      ],
    },
    {
      title: "Analytics",
      body: [
        "We may use analytics tools to understand how users interact with Wippa, improve the product, identify issues, and evaluate feature usage.",
        "Analytics information may include pages or features viewed, usage patterns, browser type, device type, approximate location derived from technical information, session data, performance data, and error information.",
        "Wippa is deployed through Vercel, and we may use Vercel or other analytics providers in the future. We do not currently use advertising pixels or retargeting technologies.",
      ],
    },
    {
      title: "AI-powered features",
      body: [
        "Wippa does not currently use AI-powered features, but we may add them in the future.",
        "If we introduce AI-powered features, they will be clearly labeled. Uploaded images, designs, or other user content will only be sent to a third-party AI provider if you specifically choose to use an AI-powered feature that requires that processing.",
        "We do not use user-uploaded images, designs, or other user content to train AI models.",
      ],
    },
    {
      title: "Payments",
      body: [
        "Wippa does not currently process payments. If we introduce paid features in the future, we may use a third-party payment processor such as Stripe or another payment provider.",
        "If payments are introduced, payment details will be handled by the payment processor. We do not intend to store full payment card information ourselves.",
      ],
    },
    {
      title: "How we share information",
      body: [
        "We do not sell personal information.",
        "We may share information with service providers that help us operate Wippa, including hosting, deployment, database, authentication, email, analytics, security, support, AI processing, and payment processing providers.",
        "Current and planned service providers may include Vercel, Neon, Mailchimp, OpenAI, and Stripe or another payment processor if paid features are introduced.",
        "We may also disclose information if required by law, legal process, or government request; to enforce our terms or policies; to detect, prevent, or address fraud, abuse, security, or technical issues; to protect the rights, property, or safety of Wippa, users, or others; or in connection with a business transfer such as a merger, acquisition, financing, reorganization, or sale of assets.",
      ],
    },
    {
      title: "Data retention",
      body: [
        "We retain personal information for as long as reasonably necessary to provide Wippa, maintain your account, comply with legal obligations, resolve disputes, enforce agreements, and support legitimate business purposes.",
        "Account data and saved designs may be retained until you delete your account or delete the applicable content.",
        "Deleted drafts may remain in a recently deleted state for 30 days before being permanently deleted.",
        "Some information may remain in backups, logs, or archival systems for a limited period after deletion where necessary for security, legal compliance, or system integrity.",
      ],
    },
    {
      title: "Account deletion and user controls",
      body: [
        "You may delete your account through account settings. When you delete your account, Wippa will delete your account and associated user data, subject to limited exceptions such as legal compliance, security, fraud prevention, backup retention, or legitimate operational needs.",
        "You may also contact us at support@wippaeditor.com to request assistance with accessing, correcting, exporting, or deleting your personal information.",
      ],
    },
    {
      title: "California privacy rights",
      body: [
        "California residents may have certain rights regarding their personal information, subject to legal limitations. These rights may include the right to know what personal information we collect, use, disclose, or share; the right to request access to personal information; the right to request deletion of personal information; the right to request correction of inaccurate personal information; and the right not to be discriminated against for exercising privacy rights.",
        "California residents may also have the right to opt out of the sale or sharing of personal information and the right to limit certain uses of sensitive personal information where applicable.",
        "We do not sell personal information, and we do not currently use advertising pixels or retargeting technologies. If our practices change, we will update this Privacy Policy and provide any legally required opt-out mechanisms.",
        "To exercise privacy rights, contact us at support@wippaeditor.com. We may need to verify your identity before fulfilling certain requests.",
      ],
    },
    {
      title: "Children’s privacy",
      body: [
        "Wippa is intended for general audiences, but it is not directed to children under 13, and we do not knowingly market to children under 13.",
        "If we learn that we have collected personal information from a child under 13 without appropriate consent, we will take reasonable steps to delete that information.",
      ],
    },
    {
      title: "Security",
      body: [
        "We use reasonable administrative, technical, and organizational measures designed to protect personal information.",
        "No online service, database, or transmission method can guarantee absolute security. You are responsible for maintaining the confidentiality of your account credentials and using a secure password.",
      ],
    },
    {
      title: "International users",
      body: [
        "Wippa is currently targeted primarily to users in the United States. If you access Wippa from outside the United States, your information may be processed and stored in the United States or other countries where our service providers operate.",
      ],
    },
    {
      title: "Third-party services",
      body: [
        "Wippa may contain links to third-party websites or services, or may integrate with third-party providers. We are not responsible for the privacy practices of third parties. Their use of your information is governed by their own privacy policies.",
        "Current and planned third-party providers may include Vercel, Neon, Mailchimp, OpenAI, Stripe or another payment processor, and future analytics, infrastructure, security, or support providers.",
      ],
    },
    {
      title: "Changes to this policy",
      body: [
        "We may update this Privacy Policy from time to time as Wippa changes. If we make material changes, we may notify users by email, through the app, or by posting an updated version of this policy.",
        "The “Last Updated” date at the top of this Privacy Policy indicates when it was last revised.",
      ],
    },
  ],
  contact:
    "If you have questions, requests, or concerns about this Privacy Policy or your personal information, contact Wippa at support@wippaeditor.com.",
  alternatePolicy: {
    href: "/terms",
    label: "Terms",
  },
} as const satisfies LegalPageContent;

export const termsContent = {
  metadata: {
    title: "Terms | Wippa",
    description: "Terms for using Wippa.",
  },
  lastUpdated: "May 26, 2026",
  title: "Terms",
  intro:
    "These Terms describe the rules for accessing and using Wippa, a web-based needlepoint pattern editing tool operated by Julia Reel. By accessing or using Wippa, creating an account, joining the waitlist, using the editor, uploading content, saving designs, or exporting files, you agree to these Terms.",
  sections: [
    {
      title: "Wippa’s current status",
      body: [
        "Wippa is currently in a pre-launch and beta stage. Access may be invite-only, waitlist-based, limited, experimental, or subject to change.",
        "Because Wippa is still in development, features may be incomplete, unavailable, modified, limited, or removed at any time. Beta features may contain bugs, errors, outages, design limitations, data-loss issues, or unexpected behavior.",
        "We may change, suspend, limit, or discontinue any part of Wippa at any time, including free features, beta features, storage limits, export options, usage limits, and invite-only access.",
      ],
    },
    {
      title: "Eligibility",
      body: [
        "You must be at least 13 years old to use Wippa. Wippa is not directed to children under 13, and we do not knowingly allow children under 13 to create accounts.",
        "By using Wippa, you represent that you are at least 13 years old, have the legal ability to agree to these Terms, will provide accurate account information, and will use Wippa only in compliance with applicable laws.",
      ],
    },
    {
      title: "Accounts and access",
      body: [
        "Wippa may require an account to access certain features. Accounts may be invite-only or waitlist-based.",
        "You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You may not share, sell, transfer, sublicense, or allow others to use your account. Each account is for one person only.",
        "We may suspend, limit, or terminate access to Wippa if we believe you have violated these Terms, created risk for Wippa or other users, misused the service, provided false information, attempted to bypass access controls, or used Wippa in a way that may harm the product, infrastructure, users, or third parties.",
      ],
    },
    {
      title: "Your content",
      body: [
        "You retain ownership of the content you upload, create, save, edit, or otherwise provide through Wippa, including designs, patterns, drafts, uploaded images, color palettes, project settings, chart data, and exports.",
        "By using Wippa, you grant Wippa a limited, non-exclusive, worldwide, royalty-free license to host, store, copy, process, display, transmit, modify, and otherwise use your content only as reasonably necessary to provide, operate, maintain, secure, support, and improve Wippa.",
        "This license allows us to save, restore, sync, and display your designs; process uploads; generate patterns; provide editor, storage, export, and account features; provide support; troubleshoot issues; comply with law; and enforce these Terms. This license does not give Wippa ownership of your designs.",
      ],
    },
    {
      title: "Uploaded images and third-party rights",
      body: [
        "You may only upload images, artwork, logos, characters, designs, photographs, trademarks, or other materials that you have the right to use.",
        "You may not use Wippa to copy, reproduce, convert, distribute, sell, or otherwise exploit content that infringes another person’s copyright, trademark, publicity rights, privacy rights, or other legal rights.",
        "This includes copyrighted artwork, brand logos, sports team marks, fictional characters, celebrity images, protected designs, and other third-party materials unless you have the appropriate rights or permissions.",
        "Wippa does not verify that you have rights to uploaded content. You are solely responsible for the content you upload and the patterns or exports you create from it.",
      ],
    },
    {
      title: "Designs, exports, and commercial use",
      body: [
        "Subject to these Terms, you may use the designs and patterns you create in Wippa for personal or commercial purposes, including selling, gifting, stitching, printing, or distributing finished pattern exports.",
        "Wippa exports may include a small “Created with Wippa” or similar attribution mark. You may not remove, crop out, obscure, alter, or intentionally hide that attribution mark from exported files unless Wippa provides a paid feature, written permission, or other authorized method to remove it.",
        "You are responsible for reviewing your designs, charts, colors, sizing, stitch counts, and exports before using, selling, printing, or stitching them.",
      ],
    },
    {
      title: "Wippa-owned content and assets",
      body: [
        "Wippa and its licensors own all rights, title, and interest in the Wippa service and related materials, including the app, editor, software, code, systems, infrastructure, user interface, user experience, name, logos, branding, templates, frames, built-in icons, shapes, fonts, libraries, design elements, documentation, copy, graphics, layouts, algorithms, workflows, features, and platform functionality.",
        "Subject to these Terms, Wippa grants you a limited, non-exclusive, non-transferable, revocable license to use Wippa-owned templates, icons, frames, shapes, and other built-in assets as incorporated into designs and pattern exports created through Wippa.",
        "You may not extract Wippa assets from the app; resell, redistribute, sublicense, or republish Wippa assets as standalone files; create or sell standalone icon packs, frame packs, SVG packs, template packs, or asset libraries based on Wippa assets; or use Wippa assets to build a competing product, asset marketplace, pattern editor, or design tool.",
        "You may not copy, scrape, reverse engineer, or systematically reproduce Wippa’s asset libraries, UI, editor, or functionality, or remove Wippa branding, proprietary notices, or attribution from exported files where such notices are included.",
      ],
    },
    {
      title: "Image conversion and pattern accuracy",
      body: [
        "Wippa may provide tools for converting images, text, icons, frames, shapes, colors, and other materials into needlepoint patterns.",
        "Output quality may vary. Wippa does not guarantee that any generated pattern, converted image, color match, DMC mapping, stitch count, sizing calculation, export, or preview will be accurate, complete, commercially suitable, or free from errors.",
        "You are responsible for reviewing all final patterns before stitching, printing, selling, or relying on them. Wippa is not responsible for stitching errors, color mismatches, sizing issues, thread conversion issues, chart inaccuracies, failed exports, corrupted files, or results that do not meet your expectations.",
      ],
    },
    {
      title: "AI-powered features",
      body: [
        "Wippa does not currently offer AI-powered features, but we may add optional AI-powered features in the future.",
        "If AI-powered features are introduced, they may be clearly labeled and may require sending selected content, such as uploaded images or design inputs, to a third-party AI provider.",
        "AI-generated or AI-assisted outputs may be inaccurate, incomplete, non-unique, unsuitable, or similar to outputs generated for other users. You are responsible for reviewing AI outputs before using, selling, publishing, stitching, or relying on them.",
        "You may not use AI-powered features to create, upload, process, or distribute content that is illegal, infringing, abusive, hateful, sexually exploitative, violent, deceptive, harmful, or otherwise violates these Terms.",
        "Wippa does not use your uploaded images, designs, or user content to train AI models.",
      ],
    },
    {
      title: "Free and paid features",
      body: [
        "Wippa may offer free features, limited free usage, beta access, subscriptions, paid exports, premium assets, premium templates, or other paid features.",
        "Wippa is currently not processing payments. If paid features are introduced, additional payment terms may apply. Paid features may be handled by a third-party payment processor such as Stripe or another provider.",
        "We may offer waitlist, beta, early-access, founding-member, promotional, or launch-related offers from time to time. These offers are not guaranteed unless expressly stated, and they may be limited, modified, discontinued, or subject to additional terms.",
        "We may add, change, limit, or discontinue free or paid features at any time. We may also impose or modify limits on storage, exports, projects, uploads, AI usage, account access, or other functionality.",
      ],
    },
    {
      title: "Acceptable use",
      body: [
        "You agree not to use Wippa to violate any law or regulation; infringe or misappropriate intellectual property, privacy, publicity, or other rights; upload or distribute content you do not have the right to use; or create, upload, or distribute hateful, harassing, abusive, sexually explicit, exploitative, violent, threatening, defamatory, deceptive, or otherwise harmful content.",
        "You may not upload malware, viruses, harmful code, or malicious files; attempt to gain unauthorized access to Wippa, user accounts, systems, networks, databases, or infrastructure; bypass, disable, or interfere with access controls, security features, authentication systems, usage limits, attribution marks, or payment restrictions; or interfere with Wippa’s performance, reliability, security, or availability.",
        "You may not scrape, crawl, harvest, or systematically collect data from Wippa without permission; reverse engineer, decompile, copy, reproduce, or attempt to derive the source code, design, systems, or underlying structure of Wippa except where legally permitted; use bots, scripts, automation, or other non-human methods to overload or abuse the service; misrepresent your identity or affiliation; or use Wippa to build or train a competing product without permission.",
        "We may investigate suspected violations and may remove content, suspend accounts, terminate access, or take other appropriate action.",
      ],
    },
    {
      title: "Feedback",
      body: [
        "If you provide feedback, ideas, suggestions, bug reports, feature requests, or other comments about Wippa, you grant Wippa the right to use that feedback without restriction or compensation to you.",
        "We may use feedback to improve, modify, market, or develop Wippa and related products.",
      ],
    },
    {
      title: "Data storage, backups, and data loss",
      body: [
        "Wippa may store some data in your browser using localStorage, IndexedDB, cookies, or similar technologies. Wippa may also store account data, saved projects, uploaded images, drafts, and related content in databases or cloud infrastructure.",
        "You are responsible for exporting or backing up important designs. Wippa is not a backup service and does not guarantee that drafts, projects, uploaded images, exports, or account data will always be available, recoverable, accurate, or error-free.",
        "Data may be lost, corrupted, unavailable, overwritten, or deleted due to bugs, user error, browser storage limitations, device issues, account deletion, outages, beta limitations, third-party service issues, or other causes.",
      ],
    },
    {
      title: "Account deletion and termination",
      body: [
        "You may delete your account through account settings where available. When you delete your account, Wippa will delete your account and associated user data, subject to limited exceptions such as legal compliance, security, fraud prevention, backup retention, dispute resolution, or legitimate operational needs.",
        "Deleted drafts may remain in a recently deleted state for 30 days before being permanently deleted, as described in our Privacy Policy.",
        "You may stop using Wippa at any time. We may suspend, restrict, or terminate your access to Wippa if we reasonably believe you violated these Terms, created legal, security, operational, or reputational risk, attempted to bypass limits or controls, or if we discontinue Wippa or a related feature.",
        "Upon termination, your right to access and use Wippa will end. Sections that by their nature should survive termination will survive, including ownership, user responsibilities, disclaimers, limitation of liability, indemnification, dispute terms, and payment obligations if applicable.",
      ],
    },
    {
      title: "Privacy",
      body: [
        "Your use of Wippa is also governed by our Privacy Policy, which explains how we collect, use, store, and share information.",
      ],
    },
    {
      title: "Third-party services",
      body: [
        "Wippa may rely on third-party services, such as hosting providers, database providers, authentication providers, analytics providers, email providers, AI providers, and payment processors.",
        "These third-party services are not controlled by Wippa. We are not responsible for third-party services, outages, terms, policies, actions, errors, or security practices.",
        "Your use of third-party services may be subject to their own terms and privacy policies.",
      ],
    },
    {
      title: "Disclaimers",
      body: [
        "Wippa is provided on an “as is” and “as available” basis.",
        "To the fullest extent permitted by law, Wippa disclaims all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, title, non-infringement, availability, accuracy, reliability, and error-free operation.",
        "We do not guarantee that Wippa will be uninterrupted, secure, or available at all times; that Wippa will be free from bugs, defects, or errors; that designs, drafts, uploads, exports, or account data will never be lost or corrupted; that pattern outputs, color conversions, stitch counts, sizing, DMC mappings, previews, or exports will be accurate; that Wippa will meet your needs or expectations; or that any beta or free feature will remain available.",
        "You use Wippa at your own risk.",
      ],
    },
    {
      title: "Limitation of liability",
      body: [
        "To the fullest extent permitted by law, Wippa and its operator, service providers, contractors, and affiliates will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, including lost profits, lost revenue, lost data, lost designs, business interruption, loss of goodwill, or costs of substitute services.",
        "To the fullest extent permitted by law, Wippa’s total liability for any claim arising out of or relating to these Terms or your use of Wippa will not exceed the greater of the amount you paid to Wippa in the 12 months before the claim arose or $100.",
        "Some jurisdictions do not allow certain limitations of liability, so some of the above limitations may not apply to you.",
      ],
    },
    {
      title: "Indemnification",
      body: [
        "You agree to defend, indemnify, and hold harmless Wippa, Julia Reel, and any service providers, contractors, or affiliates from and against any claims, damages, liabilities, losses, costs, and expenses, including reasonable attorneys’ fees, arising out of or related to your use of Wippa, your content, your uploaded images or designs, your violation of these Terms, your violation of any law or third-party right, your sale or distribution of patterns or exports created with Wippa, or any claim that content you uploaded, converted, created, sold, or distributed infringes or violates another person’s rights.",
      ],
    },
    {
      title: "Governing law",
      body: [
        "These Terms are governed by the laws of the State of Illinois, without regard to conflict-of-law principles.",
        "Subject to applicable law, any dispute arising out of or relating to these Terms or Wippa will be brought in the state or federal courts located in Illinois, and you consent to the jurisdiction and venue of those courts.",
      ],
    },
    {
      title: "Changes to these Terms",
      body: [
        "We may update these Terms from time to time. If we make material changes, we may notify users by email, through Wippa, by updating this page, or by other reasonable means.",
        "The Last Updated date at the top of this page indicates when these Terms were last revised.",
        "Your continued use of Wippa after updated Terms become effective means you accept the updated Terms.",
      ],
    },
  ],
  contact:
    "If you have questions about these Terms, contact Wippa at support@wippaeditor.com.",
  alternatePolicy: {
    href: "/privacy",
    label: "Privacy Policy",
  },
} as const satisfies LegalPageContent;
