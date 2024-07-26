"use client"

import {
    Box,
    Flex,
    Heading,
    Button,
    Textarea,
    Checkbox,
    Image,
    VStack,
    Spinner,
    Container,
} from "@chakra-ui/react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import { Message } from "ai"
import { useChat } from "ai/react"
import { useRef, useState, ReactElement } from "react"
import type { FormEvent, KeyboardEvent } from "react"

import { ChatMessageBubble } from "@/components/ChatMessageBubble"
import { IntermediateStep } from "./IntermediateStep"

const logoUrl = "https://d1xiic2ql9d7gm.cloudfront.net/logo_cora.png"

export function ChatWindow(props: {
    endpoint: string
    emptyStateComponent: ReactElement
    placeholder?: string
    titleText?: string
    emoji?: string
    showIntermediateStepsToggle?: boolean
}) {
    const messageContainerRef = useRef<HTMLDivElement | null>(null)

    const {
        endpoint,
        emptyStateComponent,
        placeholder,
        titleText = "An LLM",
        showIntermediateStepsToggle,
        emoji,
    } = props

    const [showIntermediateSteps, setShowIntermediateSteps] = useState(false)
    const [intermediateStepsLoading, setIntermediateStepsLoading] = useState(false)
    const intemediateStepsToggle = showIntermediateStepsToggle && (
        <Flex align="center" mb={4}>
            <Checkbox
                id="show_intermediate_steps"
                isChecked={showIntermediateSteps}
                onChange={(e) => setShowIntermediateSteps(e.target.checked)}
            >
                Show intermediate steps
            </Checkbox>
        </Flex>
    )

    const [sourcesForMessages, setSourcesForMessages] = useState<Record<string, any>>({})

    const {
        messages,
        input,
        setInput,
        handleInputChange,
        handleSubmit,
        isLoading: chatEndpointIsLoading,
        setMessages,
    } = useChat({
        api: endpoint,
        onResponse(response) {
            const sourcesHeader = response.headers.get("x-sources")
            const sources = sourcesHeader ? JSON.parse(Buffer.from(sourcesHeader, "base64").toString("utf8")) : []
            const messageIndexHeader = response.headers.get("x-message-index")
            if (sources.length && messageIndexHeader !== null) {
                setSourcesForMessages({
                    ...sourcesForMessages,
                    [messageIndexHeader]: sources,
                })
            }
        },
        streamMode: "text",
        onError: (e) => {
            toast(e.message, {
                theme: "dark",
            })
        },
    })

    const [rows, setRows] = useState(1)

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            sendMessage(e as any)
        } else if (e.key === "Enter" && e.shiftKey) {
            setRows((prev) => prev + 1)
        }
    }

    async function sendMessage(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (messageContainerRef.current) {
            messageContainerRef.current.classList.add("grow")
        }
        if (!messages.length) {
            await new Promise((resolve) => setTimeout(resolve, 300))
        }
        if (chatEndpointIsLoading ?? intermediateStepsLoading) {
            return
        }
        if (!showIntermediateSteps) {
            handleSubmit(e)
            // Some extra work to show intermediate steps properly
        } else {
            setIntermediateStepsLoading(true)
            setInput("")
            const messagesWithUserReply = messages.concat({
                id: messages.length.toString(),
                content: input,
                role: "user",
            })
            setMessages(messagesWithUserReply)
            const response = await fetch(endpoint, {
                method: "POST",
                body: JSON.stringify({
                    messages: messagesWithUserReply,
                    show_intermediate_steps: true,
                }),
            })
            const json = await response.json()
            setIntermediateStepsLoading(false)
            if (response.status === 200) {
                const responseMessages: Message[] = json.messages
                // Represent intermediate steps as system messages for display purposes
                // TODO: Add proper support for tool messages
                const toolCallMessages = responseMessages.filter((responseMessage: Message) => {
                    return (
                        (responseMessage.role === "assistant" && !!responseMessage.tool_calls?.length) ||
                        responseMessage.role === "tool"
                    )
                })
                const intermediateStepMessages = []
                for (let i = 0; i < toolCallMessages.length; i += 2) {
                    const aiMessage = toolCallMessages[i]
                    const toolMessage = toolCallMessages[i + 1]
                    intermediateStepMessages.push({
                        id: (messagesWithUserReply.length + i / 2).toString(),
                        role: "system" as const,
                        content: JSON.stringify({
                            action: aiMessage.tool_calls?.[0],
                            observation: toolMessage.content,
                        }),
                    })
                }
                const newMessages = messagesWithUserReply
                for (const message of intermediateStepMessages) {
                    newMessages.push(message)
                    setMessages([...newMessages])
                    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))
                }
                setMessages([
                    ...newMessages,
                    {
                        id: newMessages.length.toString(),
                        content: responseMessages[responseMessages.length - 1].content,
                        role: "assistant",
                    },
                ])
            } else {
                if (json.error) {
                    toast(json.error, {
                        theme: "dark",
                    })
                    throw new Error(json.error)
                }
            }
        }
    }

    return (
        <Container maxW="container.md" py={8}>
            <VStack spacing={6} align="stretch">
                <Flex align="center" justify="center">
                    <Image src={logoUrl} alt="Cora Logo" boxSize="40px" mr={3} />
                    <Heading as="h1" size="lg">
                        Elevating AI through Empathy
                    </Heading>
                </Flex>

                <Box
                    borderWidth={messages.length > 0 ? "1px" : "0"}
                    borderRadius="lg"
                    p={4}
                    minH="50vh"
                    maxH="60vh"
                    overflowY="auto"
                    ref={messageContainerRef}
                    display="flex"
                    flexDirection="column-reverse"
                >
                    {messages.length === 0 ? (
                        emptyStateComponent
                    ) : (
                        <VStack spacing={4} align="stretch">
                            {messages.map((m, i) => {
                                const sourceKey = i.toString()
                                return m.role === "system" ? (
                                    <IntermediateStep key={m.id} message={m} />
                                ) : (
                                    <ChatMessageBubble
                                        key={m.id}
                                        message={m}
                                        aiEmoji={emoji}
                                        sources={sourcesForMessages[sourceKey]}
                                    />
                                )
                            })}
                        </VStack>
                    )}
                </Box>

                <form onSubmit={sendMessage}>
                    {intemediateStepsToggle}
                    <Flex>
                        <Textarea
                            flex={1}
                            mr={2}
                            value={input}
                            placeholder={placeholder ?? "How can I assist you today?"}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            resize="none"
                            rows={rows}
                            minH="40px"
                        />
                        <Button
                            type="submit"
                            colorScheme="blue"
                            isLoading={chatEndpointIsLoading || intermediateStepsLoading}
                            minW="80px"
                        >
                            {chatEndpointIsLoading || intermediateStepsLoading ? <Spinner size="sm" /> : "Send"}
                        </Button>
                    </Flex>
                </form>
            </VStack>
            <ToastContainer />
        </Container>
    )
}
