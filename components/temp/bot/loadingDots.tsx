import { chatStyles } from "@/constants/temp/bot/chatbot";
import { useRef, useEffect } from "react";
import { Animated, View } from "react-native";

export const LoadingDots: React.FC = () => {
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
                chatStyles.dot,
                {
                    transform: [{ translateY: anim }],
                },
            ]}
        />
    );

    return (
        <View style={chatStyles.dotsRow} accessibilityLabel="Loading indicator">
            <Dot anim={a1} />
            <Dot anim={a2} />
            <Dot anim={a3} />
        </View>
    );
};