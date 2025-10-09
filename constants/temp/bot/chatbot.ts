import { StyleSheet } from 'react-native';


// export const LOADING_SCREENS = [
//     'Thinking',
//     'Checking records',
//     'Organizing details',
//     'Drafting a helpful reply',
// ];

export const CHATBOT_LOADING_SCREENS = [
    "Kabayan is currently thinking...",
    "Calculating probabilities...",
    "Gathering relevant information from the depths of the universe...",
    "Using ultra super instinct...",
];

export const CHATBOT_HEADER_HEIGHT = 56;

export const CHATBOT_COLORS = {
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

export const chatStyles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    header: {
        height: CHATBOT_HEADER_HEIGHT,
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
        backgroundColor: CHATBOT_COLORS.primary,
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
        backgroundColor: CHATBOT_COLORS.userBubble,
        alignSelf: 'flex-end',
    },
    botBubble: {
        backgroundColor: CHATBOT_COLORS.botBubble,
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
        borderTopColor: CHATBOT_COLORS.divider,
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
        backgroundColor: CHATBOT_COLORS.dot,
        marginLeft: 4,
    },
});