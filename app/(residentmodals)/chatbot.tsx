import { Bubble } from '@/components/temp/bot/bubble';
import { Composer } from '@/components/temp/bot/composer';
import { ToastContainer } from '@/components/temp/bot/Toast';
import { TopBar } from '@/components/temp/bot/topBar';
import { CHATBOT_COLORS, CHATBOT_HEADER_HEIGHT, chatStyles } from '@/constants/temp/bot/chatbot';
import { useAssistant } from '@/hooks/useAssistant';
import { ChatBotMessageType } from '@/types/chatbotMessageType';
import React, { useEffect, useMemo, useRef } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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

    const { message, setMessage, msgs, setMsgs, listRef, loadingTimersRef, handleSend, sendDirect, stopAll } = useAssistant();

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
    }, [setMsgs]);

    const data = useMemo(() => [...msgs].reverse(), [msgs]);

    useEffect(() => {
        return () => {
            Object.values(loadingTimersRef.current).forEach(timer => clearInterval(timer));
            loadingTimersRef.current = {};
        };
    }, [loadingTimersRef]);

    // register a global resend handler so Bubble can signal an inline edit -> resend
    useEffect(() => {
        // @ts-ignore
        window.__CHATBOT_RESEND = (msgId: string, newText: string) => {
            try {
                // mark original message as edited but keep it in the thread
                setMsgs((prev: ChatBotMessageType[]) => prev.map((m) => (m.id === msgId ? { ...m, text: newText, edited: true, edited_at: Date.now() } : m)));
                // send the edited text as a new user message
                sendDirect(newText)
            } catch (e) {
                console.error('chatbot resend handler failed', e)
            }
        }

        return () => {
            // @ts-ignore
            if (typeof window !== 'undefined' && window.__CHATBOT_RESEND) delete window.__CHATBOT_RESEND
        }
    }, [setMsgs, sendDirect]);

    const keyboardOffset = CHATBOT_HEADER_HEIGHT + insets.top;

    return (
        <SafeAreaView style={[chatStyles.safe, { backgroundColor: themeBg }]} edges={['top']}>
            <ToastContainer />
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
                        renderItem={({ item }) => (
                            <Bubble
                                msg={item}
                                isProcessing={msgs.some(m => !!m.loading)}
                            />
                        )}
                        keyboardShouldPersistTaps="handled"
                        automaticallyAdjustKeyboardInsets
                        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
                    />

                    <Composer value={message} onChange={setMessage} onSend={handleSend} isProcessing={msgs.some(m => !!m.loading)} onStop={stopAll} />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ChatBot;

