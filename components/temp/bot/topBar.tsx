import { CHATBOT_COLORS, chatStyles } from "@/constants/temp/bot/chatbot";
import { useColorScheme, View, Text } from "react-native";

export const TopBar: React.FC<{ title: string }> = ({ title }) => {
    const scheme = useColorScheme() ?? 'light';
    const themeText = scheme === 'dark' ? CHATBOT_COLORS.textDark : CHATBOT_COLORS.textLight;
    const divider = 'rgba(0,0,0,0.06)';
    return (
        <View style={[chatStyles.header, { borderBottomColor: divider }]}>
            <Text style={[chatStyles.headerTitle, { color: themeText }]} numberOfLines={1}>
                {title}
            </Text>
        </View>
    );
};
