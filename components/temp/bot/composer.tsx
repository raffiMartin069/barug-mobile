import { CHATBOT_COLORS, chatStyles } from "@/constants/temp/bot/chatbot";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme, View, TextInput, Pressable } from "react-native";

export const Composer: React.FC<{
    value: string;
    onChange: (t: string) => void;
    onSend: () => void;
    disabled?: boolean;
    isProcessing?: boolean;
    onStop?: () => void;
}> = ({ value, onChange, onSend, disabled, isProcessing, onStop }) => {
    const scheme = useColorScheme() ?? 'light';
    const themeBg = scheme === 'dark' ? CHATBOT_COLORS.darkBg : CHATBOT_COLORS.lightBg;
    const themeText = scheme === 'dark' ? CHATBOT_COLORS.textDark : CHATBOT_COLORS.textLight;
    return (
        <View style={[chatStyles.inputContainer, { backgroundColor: themeBg, borderTopColor: CHATBOT_COLORS.divider }]}>
            <TextInput
                style={[chatStyles.textInput, { color: themeText }]}
                placeholder="Type your message..."
                placeholderTextColor={CHATBOT_COLORS.placeholder}
                value={value}
                onChangeText={onChange}
                multiline
                textAlignVertical="center"
                returnKeyType="send"
                onSubmitEditing={onSend}
                editable={!disabled}
                accessibilityLabel="Message input"
            />
            <Pressable
                onPress={isProcessing ? onStop : onSend}
                disabled={isProcessing ? false : (!value.trim() || disabled)}
                style={({ pressed }) => [
                    chatStyles.sendButton,
                    { opacity: pressed ? 0.9 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={isProcessing ? 'Stop response' : 'Send message'}
            >
                <View style={[chatStyles.sendFab, { backgroundColor: isProcessing ? '#b91c1c' : (!value.trim() || disabled ? '#a8a8a8' : CHATBOT_COLORS.primary) }]}> 
                    <Ionicons name={isProcessing ? 'square' : 'send'} size={20} color="#fff" />
                </View>
            </Pressable>
        </View>
    );
};