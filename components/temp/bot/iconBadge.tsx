import { chatStyles } from "@/constants/temp/bot/chatbot";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

export const IconBadge: React.FC<{ name: keyof typeof Ionicons.glyphMap; size?: number }> = ({ name, size = 16 }) => {
    return (
        <View style={chatStyles.iconBadge}>
            <Ionicons name={name} size={size} color="#fff" />
        </View>
    );
};