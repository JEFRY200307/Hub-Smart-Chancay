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
  title: 'P.L.A.I.A. | Plataforma de Legalidad, Arrendamiento e Instalación Automatizada',
  description: 'Plataforma institucional de soporte técnico y legal para la Zona Económica Especial de Chancay - Respaldo CIP Lima.',
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
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${publicSans.variable} ${inter.variable} bg-surface text-on-surface font-body antialiased selection:bg-red-500/30`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
