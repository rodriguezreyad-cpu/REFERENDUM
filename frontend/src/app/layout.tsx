import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "REFERENDUM",
  description: "Encrypted on-chain voting",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof global === 'undefined') {
                window.global = window;
              }
              if (typeof Buffer === 'undefined') {
                window.Buffer = window.Buffer || { isBuffer: () => false };
              }
              if (typeof process === 'undefined') {
                window.process = { env: {}, version: '' };
              }
            `,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
