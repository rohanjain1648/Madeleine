import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Fraunces, Newsreader } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Madeleine: the taste of memory",
  description:
    "An AI agent that rebuilds the cultural world of someone living with dementia: the songs, films, faces and places of their youth, matched to their taste with Qloo, and turned into reminiscence sessions that learn from every smile.",
  openGraph: {
    title: "Madeleine: the taste of memory",
    description: "Give them back the songs, films and faces of their youth.",
    images: [
      {
        url: "/cover.jpg",
        width: 1792,
        height: 1024,
        alt: "Madeleine: the taste of memory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Madeleine: the taste of memory",
    description: "Give them back the songs, films and faces of their youth.",
    images: ["/cover.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1b1310",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${newsreader.variable} ${atkinson.variable} h-full`}>
      <body className="min-h-full bg-umber-900 text-paper">
        {children}
        <div className="vignette" aria-hidden />
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
