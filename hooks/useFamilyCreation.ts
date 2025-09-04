import { useState, useMemo } from "react"
import { FamilyCreationService } from "@/services/familyCreation"
import { FamilyCreationRepository } from "@/repository/familyCreation"
import { HouseholdRepository } from "@/repository/householdRepository"
import { FamilyCreationRequest } from "@/types/request/familyCreationRequest"
import { MembershipException } from "@/exception/database/membershipExcption"

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
            setError(err instanceof MembershipException ? err.message : String(err))
            return null
        } finally {
            setLoading(false)
        }
    }
    return { createFamily, loading, error, success }
}
