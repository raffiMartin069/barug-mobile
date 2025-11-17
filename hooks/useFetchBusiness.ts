import { BusinessListService } from "@/services/businessListService";
import { Business } from "@/types/businessType";
import { useState } from "react";

export const useFetchBusiness = () => {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  async function getBusinesses(service?: BusinessListService, ownerId?: number) {
    if (!ownerId) return;

    const svc = service ?? new BusinessListService();
    const data = await svc.fetchByOwner(ownerId);

    if (data) setBusinesses(data);
    }

  return { businesses, setBusinesses, getBusinesses, selectedBusiness, setSelectedBusiness };
}