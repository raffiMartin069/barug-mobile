import React, { useMemo, useRef, useEffect } from 'react';
import {
    View,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    useColorScheme,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatBotMessageType } from '@/types/chatbotMessageType';
import { CHATBOT_COLORS, CHATBOT_HEADER_HEIGHT, chatStyles } from '@/constants/temp/bot/chatbot';
import { TopBar } from '@/components/temp/bot/topBar';
import { Bubble } from '@/components/temp/bot/bubble';
import { Composer } from '@/components/temp/bot/composer';
import { useAssistant } from '@/hooks/useAssistant';

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
}

const ChatBot: React.FC = () => {
    const scheme = useColorScheme() ?? 'light';
    const insets = useSafeAreaInsets();
    const themeBg = scheme === 'dark' ? CHATBOT_COLORS.darkBg : CHATBOT_COLORS.lightBg;

    const welcomedRef = useRef(false);

    const { message, setMessage, msgs, setMsgs, listRef, loadingTimersRef, handleSend } = useAssistant();

    useEffect(() => {
        if (welcomedRef.current) return;
        welcomedRef.current = true;

        const welcomeMsg: ChatBotMessageType = {
            id: `welcome_${Date.now()}`,
            sender: 'bot',
            ts: Date.now(),
            text: `${getGreeting()} 👋\nWelcome—chat with Kabayan! Ask about barangay services, requirements, fees, or schedules.`,
        };
        setMsgs(prev => [...prev, welcomeMsg]);
    }, []);

    const data = useMemo(() => [...msgs].reverse(), [msgs]);

    useEffect(() => {
        return () => {
            Object.values(loadingTimersRef.current).forEach(timer => clearInterval(timer));
            loadingTimersRef.current = {};
        };
    }, []);

    const keyboardOffset = CHATBOT_HEADER_HEIGHT + insets.top;

    return (
        <SafeAreaView style={[chatStyles.safe, { backgroundColor: themeBg }]} edges={['top']}>
            <TopBar title="Barangay Assistant" />

            <KeyboardAvoidingView
                style={chatStyles.flex}
                behavior={Platform.select({ ios: 'padding', android: 'height' })}
                keyboardVerticalOffset={Platform.select({ ios: keyboardOffset, android: 0 }) ?? 0}
            >
                <View style={[chatStyles.container, { paddingBottom: insets.bottom }]}>
                    <FlatList
                        style={chatStyles.flex}
                        ref={listRef}
                        data={data}
                        keyExtractor={(item) => item.id}
                        inverted
                        contentContainerStyle={chatStyles.listContent}
                        renderItem={({ item }) => <Bubble msg={item} />}
                        keyboardShouldPersistTaps="handled"
                        automaticallyAdjustKeyboardInsets
                        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
                    />

                    <Composer value={message} onChange={setMessage} onSend={handleSend} />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ChatBot;

