import { chatStyles } from "@/constants/temp/bot/chatbot";
import { ChatBotMessageType } from "@/types/chatbotMessageType";
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from "react-native";
import { IconBadge } from "./iconBadge";
import { LoadingDots } from "./loadingDots";
import { showToast } from './Toast';

export const Bubble: React.FC<{ msg: ChatBotMessageType; isProcessing?: boolean }> = ({ msg, isProcessing = false }) => {
    const isUser = msg.sender === 'user';
    const isLoading = !!msg.loading;
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState(String(msg.text ?? ''))

    const startEdit = () => {
        if (isProcessing) {
            showToast('Wait for AI to finish or stop it first')
            return
        }
        setEditText(String(msg.text ?? ''))
        setIsEditing(true)
    }

    const cancelEdit = () => {
        setIsEditing(false)
        setEditText(String(msg.text ?? ''))
    }

    const saveEdit = () => {
        // call global resend handler which ChatBot registers
        try {
            // @ts-ignore
            if (typeof window?.__CHATBOT_RESEND === 'function') window.__CHATBOT_RESEND(msg.id, editText)
            setIsEditing(false)
        } catch (e) {
            console.error('resend handler missing', e)
            showToast('Unable to resend')
        }
    }

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
                ) : isEditing ? (
                    <View>
                        <TextInput
                            value={editText}
                            onChangeText={setEditText}
                            multiline
                            style={{ minWidth: 140, maxWidth: '100%', padding: 6 }}
                        />
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                            <Pressable onPress={cancelEdit} style={{ padding: 6 }} accessibilityRole="button">
                                <Ionicons name="close" size={18} color="#6b7280" />
                            </Pressable>
                            <Pressable onPress={saveEdit} style={{ padding: 6 }} accessibilityRole="button">
                                <Ionicons name="send" size={18} color="#6b7280" />
                            </Pressable>
                        </View>
                    </View>
                ) : (
                    <>
                        <Text style={chatStyles.bubbleText}>{msg.text}{msg.edited ? ' • edited' : ''}</Text>
                        <Text style={chatStyles.timeText}>
                            {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </>
                )}
            </View>
            {isUser && !isLoading && !isEditing && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, alignSelf: 'flex-end' }}>
                    <Pressable
                        onPress={async () => {
                            try {
                                await Clipboard.setStringAsync(String(msg.text ?? ''))
                                showToast('Prompt copied')
                            } catch (e) {
                                console.error('copy failed', e)
                                showToast('Unable to copy')
                            }
                        }}
                        style={{ padding: 6 }}
                        accessibilityRole="button"
                        accessibilityLabel="Copy prompt"
                    >
                        <Ionicons name="copy-outline" size={18} color="#6b7280" />
                    </Pressable>

                    <Pressable
                        onPress={startEdit}
                        style={{ padding: 6, marginLeft: 6 }}
                        accessibilityRole="button"
                        accessibilityLabel="Edit prompt"
                    >
                        <Ionicons name="pencil-outline" size={18} color="#6b7280" />
                    </Pressable>
                </View>
            )}
        </View>
    );
};