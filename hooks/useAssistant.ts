import { CHATBOT_LOADING_SCREENS } from "@/constants/temp/bot/chatbot";
import { CHATBOT_URL } from "@/lib/chatbotSettings";
import { ChatBotMessageType } from "@/types/chatbotMessageType";
import { useCallback, useRef, useState } from "react";
import { Alert, FlatList } from "react-native";

export const useAssistant = () => {

    const [message, setMessage] = useState('');
    const [msgs, setMsgs] = useState<ChatBotMessageType[]>([]);
    const listRef = useRef<FlatList<ChatBotMessageType>>(null);
    const loadingTimersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});
    const controllersRef = useRef<Record<string, AbortController>>({});

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
            text: CHATBOT_LOADING_SCREENS[0],
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
            idx = (idx + 1) % CHATBOT_LOADING_SCREENS.length;
            setMsgs(prev =>
                prev.map(m => (m.id === loadingId ? { ...m, text: CHATBOT_LOADING_SCREENS[idx] } : m))
            );
        }, 1000);
        loadingTimersRef.current[loadingId] = interval;

        // Create an AbortController so the request can be cancelled by the user
        const controller = new AbortController();
        controllersRef.current[loadingId] = controller;

        const finalize = () => {
            const timer = loadingTimersRef.current[loadingId];
            if (timer) {
                clearInterval(timer);
                delete loadingTimersRef.current[loadingId];
            }
            const ctrl = controllersRef.current[loadingId];
            if (ctrl) {
                delete controllersRef.current[loadingId];
            }
        };

        const sendMessage = async () => {
            try {
                const response = await fetch(CHATBOT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: t }),
                    signal: controller.signal,
                });

                // dummy response
                // const response = await new Promise<Response>((resolve) => {
                //     setTimeout(() => {
                //         resolve(new Response(JSON.stringify({ reply: `You said: ${t}` }), { status: 200 }));
                //     }, 3000);
                // });

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
            } catch (error: any) {
                console.error('Error sending message:', error);
                finalize();
                // Remove loading bubble on error or abort
                setMsgs(prev => prev.filter(m => m.id !== loadingId));
                if (error.name === 'AbortError') {
                    // user cancelled, no alert necessary
                    return;
                }
                Alert.alert('Error', 'Something went wrong. Please try again.');
            }
        };
        sendMessage();
    }, [message]);

    const stopAll = useCallback(() => {
        // Abort any in-flight requests
        Object.values(controllersRef.current).forEach(ctrl => {
            try { ctrl.abort(); } catch (_) { }
        });
        controllersRef.current = {};

        // Clear any loading timers
        Object.values(loadingTimersRef.current).forEach(timer => clearInterval(timer));
        loadingTimersRef.current = {};

        // Remove only messages that are still marked as loading.
        // Previously we removed messages by `id` prefix which also matched
        // finalized bot responses (they reuse the loading id). That caused
        // previously received bot replies to vanish when cancelling.
        setMsgs(prev => prev.filter(m => !(m as any).loading));
    }, []);

    return { message, setMessage, msgs, setMsgs, listRef, loadingTimersRef, handleSend, stopAll };

}