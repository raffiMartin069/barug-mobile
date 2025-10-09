import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Pressable,
    useColorScheme,
    Alert,
    Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CHATBOT_URL } from '@/lib/chatbotSettings';
import { ChatBotMessageType } from '@/types/chatbotMessageType';



const COLORS = {
    primary: '#310101',
    lightBg: '#ffffff',
    darkBg: '#151718',
    userBubble: '#e9f0ff',
    botBubble: '#f2f2f2',
    divider: '#dddddd',
    textLight: '#11181C',
    textDark: '#ECEDEE',
    placeholder: '#A0A0A0',
    dot: 'rgba(49, 1, 1, 0.85)',
};

const HEADER_HEIGHT = 56;

// const LOADING_SCREENS = [
//     'Thinking',
//     'Checking records',
//     'Organizing details',
//     'Drafting a helpful reply',
// ];

const LOADING_SCREENS = [
    "Kabayan is currently thinking...",
    "Calculating probabilities...",
    "Gathering relevant information from the depths of the universe...",
    "Using ultra super instinct...",
];

const TopBar: React.FC<{ title: string }> = ({ title }) => {
    const scheme = useColorScheme() ?? 'light';
    const themeText = scheme === 'dark' ? COLORS.textDark : COLORS.textLight;
    const divider = 'rgba(0,0,0,0.06)';
    return (
        <View style={[styles.header, { borderBottomColor: divider }]}>
            <Text style={[styles.headerTitle, { color: themeText }]} numberOfLines={1}>
                {title}
            </Text>
        </View>
    );
};

const IconBadge: React.FC<{ name: keyof typeof Ionicons.glyphMap; size?: number }> = ({ name, size = 16 }) => {
    return (
        <View style={styles.iconBadge}>
            <Ionicons name={name} size={size} color="#fff" />
        </View>
    );
};

// Animated bouncing three dots shown after loading text
const LoadingDots: React.FC = () => {
    const a1 = useRef(new Animated.Value(0)).current;
    const a2 = useRef(new Animated.Value(0)).current;
    const a3 = useRef(new Animated.Value(0)).current;
    const loopsRef = useRef<Animated.CompositeAnimation[]>([]);

    useEffect(() => {
        const makeLoop = (anim: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, { toValue: -4, duration: 280, delay, useNativeDriver: true }),
                    Animated.timing(anim, { toValue: 0, duration: 280, useNativeDriver: true }),
                ])
            );

        const l1 = makeLoop(a1, 0);
        const l2 = makeLoop(a2, 120);
        const l3 = makeLoop(a3, 240);
        loopsRef.current = [l1, l2, l3];
        l1.start(); l2.start(); l3.start();

        return () => {
            loopsRef.current.forEach(loop => loop.stop());
        };
    }, [a1, a2, a3]);

    const Dot = ({ anim }: { anim: Animated.Value }) => (
        <Animated.View
            style={[
                styles.dot,
                {
                    transform: [{ translateY: anim }],
                },
            ]}
        />
    );

    return (
        <View style={styles.dotsRow} accessibilityLabel="Loading indicator">
            <Dot anim={a1} />
            <Dot anim={a2} />
            <Dot anim={a3} />
        </View>
    );
};

const Bubble: React.FC<{ msg: ChatBotMessageType }> = ({ msg }) => {
    const isUser = msg.sender === 'user';
    const isLoading = !!msg.loading;
    return (
        <View style={[styles.row, { justifyContent: isUser ? 'flex-end' : 'flex-start' }]}>
            {!isUser && (
                <View style={styles.avatar}>
                    <IconBadge name="chatbubbles" size={16} />
                </View>
            )}
            <View
                style={[
                    styles.bubble,
                    isUser ? styles.userBubble : styles.botBubble,
                    isUser ? { borderTopRightRadius: 6 } : { borderTopLeftRadius: 6 },
                ]}
            >
                {isLoading ? (
                    <View style={styles.loadingLine}>
                        <Text style={styles.bubbleText}>{msg.text}</Text>
                        <LoadingDots />
                    </View>
                ) : (
                    <>
                        <Text style={styles.bubbleText}>{msg.text}</Text>
                        <Text style={styles.timeText}>
                            {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </>
                )}
            </View>
        </View>
    );
};

const Composer: React.FC<{
    value: string;
    onChange: (t: string) => void;
    onSend: () => void;
    disabled?: boolean;
}> = ({ value, onChange, onSend, disabled }) => {
    const scheme = useColorScheme() ?? 'light';
    const themeBg = scheme === 'dark' ? COLORS.darkBg : COLORS.lightBg;
    const themeText = scheme === 'dark' ? COLORS.textDark : COLORS.textLight;
    return (
        <View style={[styles.inputContainer, { backgroundColor: themeBg, borderTopColor: COLORS.divider }]}>
            <TextInput
                style={[styles.textInput, { color: themeText }]}
                placeholder="Type your message..."
                placeholderTextColor={COLORS.placeholder}
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
                onPress={onSend}
                disabled={!value.trim() || disabled}
                style={({ pressed }) => [
                    styles.sendButton,
                    { opacity: pressed ? 0.9 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Send message"
            >
                <View style={[styles.sendFab, { backgroundColor: !value.trim() || disabled ? '#a8a8a8' : COLORS.primary }]}>
                    <Ionicons name="send" size={20} color="#fff" />
                </View>
            </Pressable>
        </View>
    );
};

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
}

const ChatBot: React.FC = () => {
    const scheme = useColorScheme() ?? 'light';
    const insets = useSafeAreaInsets();
    const themeBg = scheme === 'dark' ? COLORS.darkBg : COLORS.lightBg;

    const [message, setMessage] = useState('');
    const [msgs, setMsgs] = useState<ChatBotMessageType[]>([]);
    const welcomedRef = useRef(false);

    // Keep timers for any active loading bubbles (supports multiple requests if needed)
    const loadingTimersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

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
    const listRef = useRef<FlatList<ChatBotMessageType>>(null);

    const handleSend = useCallback(() => {
        const t = message.trim();
        if (!t) return;

        const now = Date.now();
        const userMsg: ChatBotMessageType = {
            id: `u_${now}`,
            text: t,
            sender: 'user',
            ts: now,
        };

        // Insert loading placeholder (bot) with rotating loading screens
        const loadingId = `loading_${now}`;
        const loadingMsg: ChatBotMessageType = {
            id: loadingId,
            text: LOADING_SCREENS[0],
            sender: 'bot',
            ts: now + 1,
            loading: true,
        };

        setMsgs(prev => [...prev, userMsg, loadingMsg]);
        requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));
        setMessage('');

        // Rotate loading screens while waiting for the backend
        let idx = 0;
        const interval = setInterval(() => {
            idx = (idx + 1) % LOADING_SCREENS.length;
            setMsgs(prev =>
                prev.map(m => (m.id === loadingId ? { ...m, text: LOADING_SCREENS[idx] } : m))
            );
        }, 1000);
        loadingTimersRef.current[loadingId] = interval;

        const finalize = () => {
            const timer = loadingTimersRef.current[loadingId];
            if (timer) {
                clearInterval(timer);
                delete loadingTimersRef.current[loadingId];
            }
        };

        console.log(CHATBOT_URL)

        const sendMessage = async () => {
            try {
                const response = await fetch(CHATBOT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: t }),
                });

                let res: any = null;
                try {
                    res = await response.json();
                } catch (_) {
                    // fallback in case response is not JSON
                    res = null;
                }

                if (!response.ok) {
                    console.error('Error from chatbot API:', res);
                    finalize();
                    // Remove loading bubble on error
                    setMsgs(prev => prev.filter(m => m.id !== loadingId));
                    Alert.alert('Error', 'Chat is currently not available. Please try again later.');
                    return;
                }

                const botText = typeof res === 'string' ? res : res?.reply || JSON.stringify(res);
                const botMsg: ChatBotMessageType = {
                    id: loadingId, // replace the loading bubble in place
                    text: botText,
                    sender: 'bot',
                    ts: Date.now(),
                    loading: false,
                };

                finalize();
                // Replace loading bubble with the real bot answer
                setMsgs(prev => prev.map(m => (m.id === loadingId ? botMsg : m)));
                requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));
            } catch (error) {
                console.error('Error sending message:', error);
                finalize();
                // Remove loading bubble on error
                setMsgs(prev => prev.filter(m => m.id !== loadingId));
                Alert.alert('Error', 'Something went wrong. Please try again.');
            }
        };
        // sendMessage();
    }, [message]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            Object.values(loadingTimersRef.current).forEach(timer => clearInterval(timer));
            loadingTimersRef.current = {};
        };
    }, []);

    const keyboardOffset = HEADER_HEIGHT + insets.top;

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: themeBg }]} edges={['top']}>
            <TopBar title="Barangay Assistant" />

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.select({ ios: 'padding', android: 'height' })}
                keyboardVerticalOffset={Platform.select({ ios: keyboardOffset, android: 0 }) ?? 0}
            >
                <View style={[styles.container, { paddingBottom: insets.bottom }]}>
                    <FlatList
                        style={styles.flex}
                        ref={listRef}
                        data={data}
                        keyExtractor={(item) => item.id}
                        inverted
                        contentContainerStyle={styles.listContent}
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

const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    header: {
        height: HEADER_HEIGHT,
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    container: {
        flex: 1,
    },
    listContent: {
        padding: 12,
        flexGrow: 1,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    avatar: {
        marginRight: 8,
        alignSelf: 'flex-end',
    },
    iconBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bubble: {
        maxWidth: '80%',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 14,
    },
    userBubble: {
        backgroundColor: COLORS.userBubble,
        alignSelf: 'flex-end',
    },
    botBubble: {
        backgroundColor: COLORS.botBubble,
        alignSelf: 'flex-start',
    },
    bubbleText: {
        fontSize: 15,
        lineHeight: 20,
    },
    timeText: {
        marginTop: 4,
        fontSize: 11,
        opacity: 0.6,
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: COLORS.divider,
    },
    textInput: {
        flex: 1,
        minHeight: 40,
        maxHeight: 120,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 16,
    },
    sendButton: {
        marginLeft: 8,
        justifyContent: 'flex-end',
    },
    sendFab: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingLine: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dotsRow: {
        marginLeft: 6,
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 10,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.dot,
        marginLeft: 4,
    },
});