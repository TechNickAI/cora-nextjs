import { ChatWindow } from "@/components/ChatWindow"

export default function Home() {
    const InfoCard = <div></div>
    return (
        <ChatWindow
            endpoint="api/si"
            emoji="💙"
            titleText="Cora: Heart-Centered AI Assistant"
            placeholder="How can I assist you today?"
            emptyStateComponent={InfoCard}
        ></ChatWindow>
    )
}
