import { MembershipException } from "@/exception/membershipExcption"
import { FamilyCreationRepository } from "@/repository/familyCreation"
import { HouseholdRepository } from "@/repository/householdRepository"
import { FamilyCreationService } from "@/services/familyCreation"
import { FamilyCreationRequest } from "@/types/request/familyCreationRequest"
import { useMemo, useState } from "react"

export function useFamilyCreation() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const service = useMemo(
        () => new FamilyCreationService(
            new FamilyCreationRepository(), 
            new HouseholdRepository()),
            [])

    const createFamily = async (data: FamilyCreationRequest) => {
        setLoading(true)
        setError(null)
        setSuccess(false)
        try {
            const result = await service.createFamily(data)
            if (!result) {
                setError("Failed to create family")
                return null
            }
            setSuccess(true)
            return result
        } catch (err) {
            if (err instanceof MembershipException) {
                setError(err.message)
                return null
            }
            console.error("Unexpected error:", err)
            return null
        } finally {
            setLoading(false)
        }
    }
    return { createFamily, loading, error, success }
}
