export type ChatBotMessageType = {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    ts: number;
    loading?: boolean;
};