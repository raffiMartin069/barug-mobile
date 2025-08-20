import { FamilyMembership } from "@/types/family_membership";
import { MembershipException } from "./exceptions/membership_exceptions";

export class FamilyMembershipValidator {

    static validate(data: FamilyMembership) {
        FamilyMembershipValidator.household_validity(data);
        FamilyMembershipValidator.family_validity(data);
        FamilyMembershipValidator.residency_validity(data);
    }

    private static residency_validity(data: FamilyMembership) {
        if (!data.years_of_residency) {
            throw new MembershipException("Please enter years of residency.");
        }

        if (isNaN(data.years_of_residency)) {
            throw new MembershipException("Years of residency must be a number");
        }

        if (data.years_of_residency < 0) {
            throw new MembershipException("Years of residency cannot be negative");
        }
    }

    private static family_validity(data: FamilyMembership) {
        if (!data.family_id) {
            throw new MembershipException("Please select a family.");
        }

        if (!data.family_head_relationship) {
            throw new MembershipException("Family head relationship is required");
        }
    }

    private static household_validity(data: FamilyMembership) {
        if (!data.household_id) {
            throw new MembershipException("Please select a household.");
        }

        if (!data.household_head_relationship) {
            throw new MembershipException("Please select a household head relationship.");
        }
    }
}