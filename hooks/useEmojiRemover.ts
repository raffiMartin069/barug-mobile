import { useState } from 'react'

export const useEmojiRemover = () => {
    const emojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g
    const [err, setErr] = useState<string | null>(null)

    const containsEmoji = (text: string): boolean => {
        return emojiRegex.test(text)
    }

    const isValid = (data: { [key: string]: string }): boolean => {
        for (const key in data) {
            if (containsEmoji(data[key])) {
                setErr(`Emojis are not allowed in the field`)
                return false
            }
        }
        setErr(null)
        return true
    }

    return { isValid, err }
}