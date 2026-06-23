import type { Metadata } from 'next';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.scss';

export const metadata: Metadata = {
  title: 'CV Job Matcher',
  description: 'Намери подходящи обяви за работа, съобразени с твоето CV',
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
