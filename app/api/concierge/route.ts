import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

let controller: ReadableStreamDefaultController | null = null

export async function GET(req: NextRequest) {
    const stream = new ReadableStream({
        start(c) {
            controller = c
            req.signal.addEventListener("abort", () => {
                controller = null
            })
            // Send the welcome message when a connection is established
            pushConciergeMessage("welcome", "Hi, I love you 😍")
        },
    })

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    })
}

export function pushConciergeMessage(type: string, message: string, metadata?: any) {
    const event = {
        concierge: true,
        type,
        message,
        metadata,
        timestamp: new Date().toISOString(),
    }

    // Format the data according to SSE protocol
    const formattedMessage = `data: ${JSON.stringify(event)}\n\n`
    controller?.enqueue(formattedMessage)
}