import "@/app/globals.css"

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
                <div className="flex flex-col min-h-screen">
                    <main className="flex flex-col flex-1 bg-muted/50">{children}</main>
                </div>
            </body>
        </html>
    )
}
