import { useEffect, useState } from "react"
import { Box, Text } from "@chakra-ui/react"

export function ConciergeMessage() {
    const [message, setMessage] = useState("")

    useEffect(() => {
        const eventSource = new EventSource("/api/concierge")

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data)
            if (data.concierge) {
                setMessage(data.message)
                // Set a timeout to change the message after 5 seconds
                setTimeout(() => {
                    setMessage("Elevating AI through Empathy")
                }, 3000)
            } else {
                throw new Error("Unexpected message received")
            }
        }

        return () => {
            eventSource.close()
        }
    }, [])


    return (
        <Text fontSize="sm">{message}</Text>
    )
}