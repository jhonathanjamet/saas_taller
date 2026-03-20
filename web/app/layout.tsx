import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'TallerHub Admin',
  description: 'Panel administrativo TallerHub',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
