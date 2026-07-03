import type { Metadata } from 'next';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.scss';

// Resolve the public site URL (used to build absolute OG/Twitter image URLs).
// Prefer an explicit env (set NEXT_PUBLIC_SITE_URL to the custom domain once bought),
// otherwise use the stable Vercel alias in production and localhost in development.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://job-matcher-five.vercel.app'
    : 'http://localhost:3000');

const title = 'CV Job Matcher — AI подбор на IT обяви по твоето CV';
const description =
  'Качи своето CV и AI ще открие най-подходящите IT обяви от dev.bg, оценени спрямо твоя профил, умения и опит. Бързо, безплатно и на български.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: '%s | CV Job Matcher',
  },
  description,
  applicationName: 'CV Job Matcher',
  keywords: [
    'CV Job Matcher',
    'IT обяви',
    'dev.bg',
    'работа за програмисти',
    'AI подбор на обяви',
    'job matching',
    'разработчици',
    'remote работа',
  ],
  authors: [{ name: 'CV Job Matcher' }],
  openGraph: {
    type: 'website',
    locale: 'bg_BG',
    url: siteUrl,
    siteName: 'CV Job Matcher',
    title,
    description,
    // og image is provided by app/opengraph-image.tsx (file convention).
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    // twitter image is provided by app/twitter-image.tsx.
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bg" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-bs-theme',t)}catch(e){}})()`,
          }}
        />
      </head>
      <body className="d-flex flex-column">
        {children}
      </body>
    </html>
  );
}
