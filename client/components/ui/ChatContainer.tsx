"use client"

export interface Message {
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
}

export interface ChatContainerProps {
    messages: Message[];
    isLoading: boolean;
}

const ChatContainer = ({ messages, isLoading }: ChatContainerProps) => {
    return (
        <div className="space-y-4 max-w-4xl mx-auto px-4 py-6 min-h-[350px]">
            {messages.length === 0 && !isLoading && (
                <div className="flex items-center justify-center min-h-[200px] border border-dashed border-border/60 rounded-2xl p-8 text-center bg-card/40">
                    <p className="text-sm font-medium text-muted-foreground">Start an interview to begin</p>
                </div>
            )}
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                >
                    <div
                        className={`max-w-2xl p-4 rounded-2xl text-sm leading-relaxed ${
                            message.isUser
                                ? "bg-blue-600 text-white rounded-br-none shadow-xs"
                                : "bg-card border border-border/60 text-foreground rounded-bl-none shadow-xs"
                        }`}
                    >
                        <p className="font-semibold text-xs mb-1 opacity-70">
                            {message.isUser ? "You" : "AI Interviewer"}
                        </p>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-card border border-border/60 p-4 rounded-2xl rounded-bl-none text-sm text-muted-foreground flex items-center gap-2 shadow-xs">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <p>Ai is thinking..</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ChatContainer
