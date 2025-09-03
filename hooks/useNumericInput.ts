import { useEffect } from "react"

export function useNumericInput(householdNumber: string, setHouseholdNumber: (value: string) => void) {
    useEffect(() => {
        setHouseholdNumber(householdNumber.replace(/[^0-9]/g, ''))
    }, [householdNumber])
}