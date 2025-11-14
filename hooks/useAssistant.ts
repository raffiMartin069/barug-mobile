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
    const abortControllersRef = useRef<Record<string, AbortController>>({});

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

        const finalize = () => {
            const timer = loadingTimersRef.current[loadingId];
            if (timer) {
                clearInterval(timer);
                delete loadingTimersRef.current[loadingId];
            }
            const ctrl = abortControllersRef.current[loadingId];
            if (ctrl) {
                delete abortControllersRef.current[loadingId];
            }
        };

        const sendMessage = async () => {
            try {
                const controller = new AbortController()
                abortControllersRef.current[loadingId] = controller
                const response = await fetch(CHATBOT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: t }),
                    signal: controller.signal,
                });

                let res: any = null;
                try {
                    res = await response.json();
                } catch {
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

                console.log('Bot response:', botText);

                finalize();
                // Replace loading bubble with the real bot answer
                setMsgs(prev => prev.map(m => (m.id === loadingId ? botMsg : m)));
                requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));
            } catch (error) {
                console.error('Error sending message:', error);
                finalize();
                // Remove loading bubble on error or abort
                setMsgs(prev => prev.filter(m => m.id !== loadingId));
            }
        };
        sendMessage();
    }, [message]);

    // send an arbitrary text (used for resending edited bubbles)
    const sendDirect = useCallback(async (text: string) => {
        const t = String(text ?? '').trim()
        if (!t) return

        const now = Date.now();
        const userMsg: ChatBotMessageType = {
            id: `u_${now}`,
            text: t,
            sender: 'user',
            ts: now,
        };

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

        let idx = 0;
        const interval = setInterval(() => {
            idx = (idx + 1) % CHATBOT_LOADING_SCREENS.length;
            setMsgs(prev =>
                prev.map(m => (m.id === loadingId ? { ...m, text: CHATBOT_LOADING_SCREENS[idx] } : m))
            );
        }, 1000);
        loadingTimersRef.current[loadingId] = interval;

        const finalize = () => {
            const timer = loadingTimersRef.current[loadingId];
            if (timer) {
                clearInterval(timer);
                delete loadingTimersRef.current[loadingId];
            }
            const ctrl = abortControllersRef.current[loadingId];
            if (ctrl) delete abortControllersRef.current[loadingId];
        };

        try {
            const controller = new AbortController()
            abortControllersRef.current[loadingId] = controller
            const response = await fetch(CHATBOT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: t }),
                signal: controller.signal,
            });

            let res: any = null;
            try {
                res = await response.json();
            } catch {
                res = null;
            }

            if (!response.ok) {
                console.error('Error from chatbot API:', res);
                finalize();
                setMsgs(prev => prev.filter(m => m.id !== loadingId));
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

            console.log('Bot response:', botText);

            finalize();
            setMsgs(prev => prev.map(m => (m.id === loadingId ? botMsg : m)));
            requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));
        } catch (errorSend) {
            console.error('Error sending message:', errorSend);
            finalize();
            setMsgs(prev => prev.filter(m => m.id !== loadingId));
        }
    }, []);

    const stopAll = useCallback(() => {
        // abort all running controllers and clear their loading placeholders
        Object.keys(abortControllersRef.current).forEach((id) => {
            try {
                abortControllersRef.current[id].abort()
            } catch (e) {
                // ignore
            }
            delete abortControllersRef.current[id]
        })
        // clear intervals
        Object.values(loadingTimersRef.current).forEach((iv) => clearInterval(iv))
        loadingTimersRef.current = {}
        // remove loading placeholders
        setMsgs(prev => prev.filter(m => !m.loading))
    }, []);

    return { message, setMessage, msgs, setMsgs, listRef, loadingTimersRef, handleSend, sendDirect, stopAll };

}