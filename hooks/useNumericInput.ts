import { useEffect } from "react"

export function useNumericInput(val: string, setVal: (value: string) => void) {
    useEffect(() => {
        setVal(val.replace(/[^0-9]/g, ''))
    }, [val])
}