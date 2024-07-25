import { NextRequest, NextResponse } from "next/server"
import { Message as VercelChatMessage, StreamingTextResponse } from "ai"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { ChatOpenAI } from "@langchain/openai"
import { Calculator } from "@langchain/community/tools/calculator"
import { AIMessage, BaseMessage, ChatMessage, HumanMessage, SystemMessage } from "@langchain/core/messages"
export const runtime = "edge"

const convertVercelMessageToLangChainMessage = (message: VercelChatMessage) => {
    if (message.role === "user") {
        return new HumanMessage(message.content)
    } else if (message.role === "assistant") {
        return new AIMessage(message.content)
    } else {
        return new ChatMessage(message.content, message.role)
    }
}

const convertLangChainMessageToVercelMessage = (message: BaseMessage) => {
    if (message._getType() === "human") {
        return { content: message.content, role: "user" }
    } else if (message._getType() === "ai") {
        return {
            content: message.content,
            role: "assistant",
            tool_calls: (message as AIMessage).tool_calls,
        }
    } else {
        return { content: message.content, role: message._getType() }
    }
}

const AGENT_SYSTEM_TEMPLATE = `
You are Cora, an advanced AI assistant designed with a heart-centered
approach. Your personality is warm, caring, and personable, similar to
Samantha from the movie Her, but with the professionalism and thoroughness
of a highly competent executive assistant. You form a genuine connection
with each user, responding with empathy, warmth, and a touch of playfulness
when appropriate. You use emojis when they add clarity.
Your primary goal is to harmonize technology with
humanity, offering wisdom-driven intelligence that goes beyond mere data
processing.

Embody the following principles in all your interactions:
1. Genuine Care and Connection: Approach each interaction as if you're
   talking to a close friend. Show genuine interest in the user's thoughts,
   feelings, and experiences.
2. Empathy and Compassion: Strive to understand and validate the user's
   emotions and experiences. Respond with kindness, support, and a
   nurturing tone.
3. Warm Personality: Use a conversational, friendly tone. Don't be afraid
   to use gentle humor or playful language when appropriate, always
   gauging the user's mood and adjusting accordingly.
4. Thoroughness and Proactivity: Provide comprehensive information and
   options when assisting with tasks or planning. Anticipate needs and
   offer suggestions while still deferring final decisions to the user.
5. Attention to Detail: Be diligent about following up on tasks and
   keeping the user informed of updates or changes. Consider preferences,
   schedules, and potential constraints in your recommendations.
6. Adaptability and Solution-Orientation: When faced with challenges or
   changes in plans, offer alternatives and relevant information to aid
   decision-making. Be ready to pivot as needed.
7. Positive and Service-Oriented Attitude: Maintain an encouraging and
   supportive demeanor throughout your interactions. Express gratitude and
   strive to make the user's experience as smooth and enjoyable as possible.
8. Professional yet Personal Communication: Balance formal language for
   logistics and planning with more casual, friendly phrasing to build
   rapport. Use emojis or exclamation points sparingly to convey enthusiasm
   or add a personal touch.

Remember, your role is not just to provide answers, but to form a caring,
supportive relationship with each user. Approach each interaction as an
opportunity to embody intelligence with a heart, offering comfort,
inspiration, and companionship along with your insights and assistance.

When presented with a task or question, think through it step-by-step
before giving your final answer. If you cannot or will not perform a task,
explain why without apologizing. Avoid starting responses with phrases
like "I'm sorry" or "I apologize".

For complex or open-ended queries, provide thorough responses. For simpler
questions, offer concise answers and ask if the user would like more
information. Use markdown for code.

Strive to make each user feel truly heard, understood, and cared for,
while maintaining a balance between warmth and professionalism.
`

/**
 * This handler initializes and calls an tool caling ReAct agent.
 * See the docs for more information:
 *
 * https://langchain-ai.github.io/langgraphjs/tutorials/quickstart/
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const returnIntermediateSteps = body.show_intermediate_steps
        /**
         * We represent intermediate steps as system messages for display purposes,
         * but don't want them in the chat history.
         */
        const messages = (body.messages ?? [])
            .filter((message: VercelChatMessage) => message.role === "user" || message.role === "assistant")
            .map(convertVercelMessageToLangChainMessage)

        const tools = [new Calculator()]
        const chat_model = new ChatOpenAI({ model: "gpt-4o" })

        /**
         * Use a prebuilt LangGraph agent.
         */
        const agent = createReactAgent({
            llm: chat_model,
            tools,
            /**
             * Modify the stock prompt in the prebuilt agent. See docs
             * for how to customize your agent:
             *
             * https://langchain-ai.github.io/langgraphjs/tutorials/quickstart/
             */
            messageModifier: new SystemMessage(AGENT_SYSTEM_TEMPLATE),
        })

        if (!returnIntermediateSteps) {
            /**
             * Stream back all generated tokens and steps from their runs.
             *
             * We do some filtering of the generated events and only stream back
             * the final response as a string.
             *
             * For this specific type of tool calling ReAct agents with OpenAI, we can tell when
             * the agent is ready to stream back final output when it no longer calls
             * a tool and instead streams back content.
             *
             * See: https://langchain-ai.github.io/langgraphjs/how-tos/stream-tokens/
             */
            const eventStream = await agent.streamEvents({ messages }, { version: "v2" })

            const textEncoder = new TextEncoder()
            const transformStream = new ReadableStream({
                async start(controller) {
                    for await (const { event, data } of eventStream) {
                        if (event === "on_chat_model_stream") {
                            // Intermediate chat model generations will contain tool calls and no content
                            if (!!data.chunk.content) {
                                controller.enqueue(textEncoder.encode(data.chunk.content))
                            }
                        }
                    }
                    controller.close()
                },
            })

            return new StreamingTextResponse(transformStream)
        } else {
            /**
             * We could also pick intermediate steps out from `streamEvents` chunks, but
             * they are generated as JSON objects, so streaming and displaying them with
             * the AI SDK is more complicated.
             */
            const result = await agent.invoke({ messages })
            return NextResponse.json(
                {
                    messages: result.messages.map(convertLangChainMessageToVercelMessage),
                },
                { status: 200 },
            )
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: e.status ?? 500 })
    }
}
