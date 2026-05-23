import type { Metadata } from 'next'
import { Public_Sans, Inter } from 'next/font/google'
import '../globals.css'
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

const publicSans = Public_Sans({ 
  subsets: ['latin'], 
  variable: '--font-public-sans',
  weight: ['400', '600', '700', '800', '900'] 
})
const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  weight: ['300', '400', '500', '600']
})

export const metadata: Metadata = {
  title: {
    default: 'COMEX.AI | Comercio exterior inteligente · ZEEP Chancay',
    template: '%s | COMEX.AI',
  },
  description:
    'COMEX.AI — plataforma de comercio exterior con IA para inversión, matchmaking y asesoría legal en la Zona Económica Especial de Chancay.',
  icons: {
    icon: '/logo-comex.png',
    apple: '/logo-comex.png',
  },
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode,
  params: Promise<{locale: string}>
}) {
  const {locale} = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link rel="icon" href="/logo-comex.png" type="image/png" />
      </head>
      <body className={`${publicSans.variable} ${inter.variable} bg-surface text-on-surface font-body antialiased selection:bg-red-500/30`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
