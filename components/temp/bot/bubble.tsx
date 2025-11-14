import { chatStyles } from "@/constants/temp/bot/chatbot";
import { ChatBotMessageType } from "@/types/chatbotMessageType";
import { View, Text } from "react-native";
import { IconBadge } from "./iconBadge";
import { LoadingDots } from "./loadingDots";

export const Bubble: React.FC<{ msg: ChatBotMessageType }> = ({ msg }) => {
    const isUser = msg.sender === 'user';
    const isLoading = !!msg.loading;
    return (
        <View style={[chatStyles.row, { justifyContent: isUser ? 'flex-end' : 'flex-start' }]}>
            {!isUser && (
                <View style={chatStyles.avatar}>
                    <IconBadge name="chatbubbles" size={16} />
                </View>
            )}
            <View
                style={[
                    chatStyles.bubble,
                    isUser ? chatStyles.userBubble : chatStyles.botBubble,
                    isUser ? { borderTopRightRadius: 6 } : { borderTopLeftRadius: 6 },
                ]}
            >
                {isLoading ? (
                    <View style={chatStyles.loadingLine}>
                        <Text style={chatStyles.bubbleText}>{msg.text}</Text>
                        <LoadingDots />
                    </View>
                ) : (
                    <>
                        <Text style={chatStyles.bubbleText}>{msg.text}</Text>
                        <Text style={chatStyles.timeText}>
                            {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </>
                )}
            </View>
        </View>
    );
};