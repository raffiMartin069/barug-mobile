import { chatStyles } from "@/constants/temp/bot/chatbot";
import { ChatBotMessageType } from "@/types/chatbotMessageType";
import React, { useState, useRef } from "react";
import { View, Text, Pressable, Modal, StyleSheet, TextInput, Platform } from "react-native";
import { IconBadge } from "./iconBadge";
import { LoadingDots } from "./loadingDots";
import * as Clipboard from 'expo-clipboard';
import { showToast } from '@/components/Toast';
import { Ionicons } from '@expo/vector-icons';

export const Bubble: React.FC<{ msg: ChatBotMessageType }> = ({ msg }) => {
    const isUser = msg.sender === 'user';
    const isLoading = !!msg.loading;
    const [botOptionsVisible, setBotOptionsVisible] = useState(false);
    const [manualVisible, setManualVisible] = useState(false);
    const manualRef = useRef<TextInput | null>(null);

    const handleCopy = async (text: string) => {
        try {
            await Clipboard.setStringAsync(text ?? '')
            showToast('Copied to clipboard')
        } catch (e) {
            console.warn('copy failed', e)
        }
    }

    const openManual = () => {
        setBotOptionsVisible(false)
        setManualVisible(true)
        // focus will be handled via ref and effect on Modal mount if needed
    }

    return (
        <View style={[chatStyles.row, { justifyContent: 'flex-start', width: '100%' }]}> 
            {!isUser && (
                <View style={chatStyles.avatar}>
                    <IconBadge name="chatbubbles" size={16} />
                </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'flex-end', flex: 1 }}>
                    <View style={{ flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', flex: 1, width: '100%' }}>
                    <Pressable
                        onLongPress={() => { if (!isUser) setBotOptionsVisible(true) }}
                        delayLongPress={300}
                        style={{ position: 'relative', flex: 1 }}
                    >
                        <View
                            style={[
                                chatStyles.bubble,
                                isUser ? chatStyles.userBubble : chatStyles.botBubble,
                                isUser ? { borderTopRightRadius: 6 } : { borderTopLeftRadius: 6 },
                            ]}
                        >
                            {isLoading ? (
                                <View style={chatStyles.loadingLine}>
                                    <Text style={[chatStyles.bubbleText, { textAlign: 'left' }]}>{msg.text}</Text>
                                    <LoadingDots />
                                </View>
                            ) : (
                                <>
                                    <Text style={[chatStyles.bubbleText, { textAlign: 'left' }]}>{msg.text}</Text>
                                    <Text style={[chatStyles.timeText, { alignSelf: 'flex-start' }]}> 
                                        {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </>
                            )}
                        </View>
                    </Pressable>
                </View>

                {isUser && (
                    <Pressable style={localStyles.copyRight} onPress={() => handleCopy(msg.text ?? '')} accessibilityLabel="Copy message">
                        <Ionicons name="copy-outline" size={18} color="#6b7280" />
                    </Pressable>
                )}
            </View>

            {/* Bot options modal */}
            <Modal visible={botOptionsVisible} transparent animationType="fade" onRequestClose={() => setBotOptionsVisible(false)}>
                <View style={localStyles.modalOverlay}>
                    <View style={localStyles.modalBox}>
                        <Pressable style={localStyles.modalButton} onPress={() => { handleCopy(msg.text ?? ''); setBotOptionsVisible(false) }}>
                            <Text style={localStyles.modalButtonText}>Copy all</Text>
                        </Pressable>
                        <Pressable style={localStyles.modalButton} onPress={() => openManual()}>
                            <Text style={localStyles.modalButtonText}>Copy manually</Text>
                        </Pressable>
                        <Pressable style={localStyles.modalCancel} onPress={() => setBotOptionsVisible(false)}>
                            <Text style={localStyles.modalCancelText}>Cancel</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* Manual copy modal with editable TextInput to allow native selection */}
            <Modal visible={manualVisible} transparent animationType="slide" onRequestClose={() => setManualVisible(false)}>
                <View style={localStyles.manualOverlay}>
                    <View style={localStyles.manualBox}>
                        <TextInput
                            ref={manualRef}
                            value={msg.text ?? ''}
                            editable
                            multiline
                            onChangeText={() => { /* user can edit/cut/copy as desired */ }}
                            style={localStyles.manualInput}
                            autoFocus
                            selectTextOnFocus
                            caretHidden={Platform.OS === 'ios' ? false : false}
                        />
                        <Pressable style={localStyles.manualDone} onPress={() => setManualVisible(false)}>
                            <Text style={localStyles.manualDoneText}>Done</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const localStyles = StyleSheet.create({
    copyContainer: {
        width: '100%',
        alignItems: 'flex-end',
        marginTop: 6,
        paddingRight: 6,
    },
    copyButton: {
        padding: 4,
    },
    copyRight: {
        marginLeft: 8,
        alignSelf: 'center',
        padding: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBox: {
        width: 260,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
    },
    modalButton: {
        paddingVertical: 10,
    },
    modalButtonText: {
        fontSize: 16,
    },
    modalCancel: {
        marginTop: 8,
        paddingVertical: 10,
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#888',
    },
    manualOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: 16,
    },
    manualBox: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        maxHeight: '80%'
    },
    manualInput: {
        minHeight: 120,
        maxHeight: 400,
        borderColor: '#ddd',
        borderWidth: 1,
        padding: 8,
        borderRadius: 6,
        textAlignVertical: 'top'
    },
    manualDone: {
        marginTop: 12,
        alignSelf: 'flex-end',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#eee',
        borderRadius: 6,
    },
    manualDoneText: {
        fontWeight: '600'
    }
})
