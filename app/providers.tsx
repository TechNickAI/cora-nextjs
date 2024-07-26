"use client"
// This page needs to be separate from layout.tsx because it needs to be a client component
import { ChakraProvider, extendTheme } from "@chakra-ui/react"

const theme = extendTheme({
    fonts: {
        body: "Verdana, sans-serif",
        heading: "Verdana, sans-seriff",
        mono: "Verdana, monospace",
    },
    colors: {
        brand: {
            50: "#FAF5FF",
            100: "#E9D8FD",
            200: "#D6BCFA",
            300: "#B794F4",
            400: "#9F7AEA",
            500: "#805AD5",
            600: "#6B46C1",
            700: "#553C9A",
            800: "#44337A",
            900: "#322659",
        },
    },
})

export function Providers({ children }: { children: React.ReactNode }) {
    return <ChakraProvider theme={theme}>{children}</ChakraProvider>
}
