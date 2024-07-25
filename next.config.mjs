/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "d1xiic2ql9d7gm.cloudfront.net",
                port: "",
                pathname: "**",
            },
        ],
    },
}
