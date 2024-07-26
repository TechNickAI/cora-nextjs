import type { Message } from "ai/react"
import { ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import "github-markdown-css/github-markdown-light.css"

export function ChatMessageBubble(props: { message: Message; aiEmoji?: string; sources: any[] }) {
    const isUser = props.message.role === "user"
    const colorClassName = isUser ? "bg-sky-600 text-white" : "bg-slate-50 text-black"
    const alignmentClassName = isUser ? "ml-auto" : "mr-auto"
    const prefix = isUser ? "🧑" : props.aiEmoji

    return (
        <div className={`${alignmentClassName} ${colorClassName} rounded px-4 py-2 max-w-[80%] mb-8 flex`}>
            <div className="mr-2">{prefix}</div>
            <div className={`whitespace-pre-wrap flex flex-col ${!isUser && "markdown-body"}`}>
                {isUser ? (
                    <span>{props.message.content}</span>
                ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{props.message.content}</ReactMarkdown>
                )}
                {props.sources && props.sources.length ? (
                    <>
                        <code className="mt-4 mr-auto bg-slate-600 px-2 py-1 rounded">
                            <h2>🔍 Sources:</h2>
                        </code>
                        <code className="mt-1 mr-2 bg-slate-600 px-2 py-1 rounded text-xs">
                            {props.sources?.map((source, i) => (
                                <div className="mt-2" key={"source:" + i}>
                                    {i + 1}. &quot;{source.pageContent}&quot;
                                    {source.metadata?.loc?.lines !== undefined ? (
                                        <div>
                                            <br />
                                            Lines {source.metadata?.loc?.lines?.from} to{" "}
                                            {source.metadata?.loc?.lines?.to}
                                        </div>
                                    ) : (
                                        ""
                                    )}
                                </div>
                            ))}
                        </code>
                    </>
                ) : (
                    ""
                )}
            </div>
        </div>
    )
}
