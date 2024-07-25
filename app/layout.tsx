import "@/app/globals.css"
import { Box } from "@chakra-ui/react"
import { Providers } from "./providers"

const logoUrl = "https://d1xiic2ql9d7gm.cloudfront.net/logo_cora.png"

export const metadata = {
    title: {
        default: "Cora: Heart-Centered SI",
        template: `%s - Cora: Heart-Centered SI`,
    },
    description: "Cora is the heart-centered interface for Super Intelligence",
    keywords: ["Cora", "Heart-Centered AI", "Super Intelligence"],
    icons: {
        icon: logoUrl,
        shortcut: logoUrl,
        apple: logoUrl,
    },
    openGraph: {
        images: [logoUrl],
    },
    twitter: {
        card: "summary_large_image",
        images: [logoUrl],
    },
}

export const viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "white" },
        { media: "(prefers-color-scheme: dark)", color: "black" },
    ],
}

interface RootLayoutProps {
    children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en">
            <body>
                <Providers>
                    <Box>{children}</Box>
                </Providers>
            </body>
        </html>
    )
}
