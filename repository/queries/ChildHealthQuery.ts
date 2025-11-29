import { supabase } from '@/constants/supabase';
import { AddressLite, FamilyLite, HouseholdLite, PersonLite, PurokLite } from '../../types/ChildLiteTypes';

// minimal delivery place type for DTO hydration
export type DeliveryPlaceTypeLite = {
	delivery_place_type_id: number;
	delivery_place_type_name: string | null;
};

export type ChildHealthDto = {
	child_record_id: number;
	created_at: string | null;
	birth_order: number | null;
	family_id: number | null;
	family?: FamilyLite | null;
	household?: HouseholdLite | null;
	address?: AddressLite | null;
	purok?: PurokLite | null;
	person_id: number | null;
	person: PersonLite | null;
	mother_id: number | null;
	mother: PersonLite | null;
	father_id: number | null;
	father: PersonLite | null;
	delivery_place_type_id: number | null;
	delivery_place_type?: DeliveryPlaceTypeLite | null;
	added_by_id: number | null;
	is_transferred: boolean;
};

export class ChildHealthQuery {
	/**
	 * Internal helper: build persons & family maps for a set of records
	 */
	private async buildRelatedMaps(records: any[]) {
		const personIds = new Set<number>();
		const familyIds = new Set<number>();

		for (const r of records) {
			if (r.person_id) personIds.add(Number(r.person_id));
			if (r.mother_id) personIds.add(Number(r.mother_id));
			if (r.father_id) personIds.add(Number(r.father_id));
			if (r.family_id) familyIds.add(Number(r.family_id));
		}

		const personsMap: Record<number, PersonLite> = {};
		if (personIds.size > 0) {
			const uniq = Array.from(personIds);
			const { data: persons, error: personsErr } = await supabase
				.from('person')
				.select('person_id, first_name, middle_name, last_name, suffix, birthdate, sex_id, person_img, mobile_num')
				.in('person_id', uniq);

			if (personsErr) {
				console.error('Error fetching person rows:', personsErr);
			} else if (persons && Array.isArray(persons)) {
				for (const p of persons) {
					personsMap[Number(p.person_id)] = {
						person_id: Number(p.person_id),
						first_name: p.first_name ?? null,
						middle_name: p.middle_name ?? null,
						last_name: p.last_name ?? null,
						suffix: p.suffix ?? null,
						birthdate: p.birthdate ?? null,
						sex_id: p.sex_id ?? null,
						person_img: p.person_img ?? null,
						mobile_num: p.mobile_num ?? null,
					};
				}
			}
		}

		const familyMap: Record<number, FamilyLite | null> = {};
		if (familyIds.size > 0) {
			const uniqF = Array.from(familyIds);
			const { data: families, error: famErr } = await supabase
				.from('family_unit')
				.select('family_id, family_num, household_id, family_head_id, is_active, created_date, source_of_income')
				.in('family_id', uniqF);

			if (famErr) {
				console.error('Error fetching family_unit rows:', famErr);
			} else if (families && Array.isArray(families)) {
				for (const f of families) {
					familyMap[Number(f.family_id)] = {
						family_id: Number(f.family_id),
						family_num: f.family_num ?? null,
						household_id: f.household_id ?? null,
						family_head_id: f.family_head_id ?? null,
						is_active: f.is_active ?? null,
						created_date: f.created_date ?? null,
						source_of_income: f.source_of_income ?? null,
					};
				}
			}
		}

		// build household map from family -> household_id
		const householdIds = new Set<number>();
		for (const k of Object.keys(familyMap)) {
			const f = familyMap[Number(k)];
			if (f && f.household_id) householdIds.add(Number(f.household_id));
		}

		const householdMap: Record<number, HouseholdLite | null> = {};
		if (householdIds.size > 0) {
			const uniqH = Array.from(householdIds);
			const { data: households, error: hhErr } = await supabase
				.from('household_info')
				.select('household_id, household_num, house_number, household_head_id, house_type_id, house_ownership_id, address_id')
				.in('household_id', uniqH);

			if (hhErr) {
				console.error('Error fetching household_info rows:', hhErr);
			} else if (households && Array.isArray(households)) {
				for (const h of households) {
					householdMap[Number(h.household_id)] = {
						household_id: Number(h.household_id),
						household_num: h.household_num ?? null,
						house_number: h.house_number ?? null,
						household_head_id: h.household_head_id ?? null,
						house_type_id: h.house_type_id ?? null,
						house_ownership_id: h.house_ownership_id ?? null,
						address_id: h.address_id ?? null,
					};
				}
			}
		}

		// build address map from household -> address_id
		const addressIds = new Set<number>();
		for (const k of Object.keys(householdMap)) {
			const h = householdMap[Number(k)];
			if (h && h.address_id) addressIds.add(Number(h.address_id));
		}

		const addressMap: Record<number, AddressLite | null> = {};
		if (addressIds.size > 0) {
			const uniqA = Array.from(addressIds);
			const { data: addrs, error: addrErr } = await supabase
				.from('addresss')
				.select('address_id, street, barangay, city, latitude, longitude, purok_sitio_id')
				.in('address_id', uniqA);

			if (addrErr) {
				console.error('Error fetching addresss rows:', addrErr);
			} else if (addrs && Array.isArray(addrs)) {
				for (const a of addrs) {
					addressMap[Number(a.address_id)] = {
						address_id: Number(a.address_id),
						street: a.street ?? null,
						barangay: a.barangay ?? null,
						city: a.city ?? null,
						latitude: a.latitude ?? null,
						longitude: a.longitude ?? null,
						purok_sitio_id: a.purok_sitio_id ?? null,
					};
				}
			}
		}

		// build purok map from address -> purok_sitio_id
		const purokIds = new Set<number>();
		for (const k of Object.keys(addressMap)) {
			const a = addressMap[Number(k)];
			if (a && a.purok_sitio_id) purokIds.add(Number(a.purok_sitio_id));
		}

		const purokMap: Record<number, PurokLite | null> = {};
		if (purokIds.size > 0) {
			const uniqP = Array.from(purokIds);
			const { data: pds, error: pErr } = await supabase
				.from('purok_sitio')
				.select('purok_sitio_id, purok_sitio_code, purok_sitio_name')
				.in('purok_sitio_id', uniqP);

			if (pErr) {
				console.error('Error fetching purok_sitio rows:', pErr);
			} else if (pds && Array.isArray(pds)) {
				for (const p of pds) {
					purokMap[Number(p.purok_sitio_id)] = {
						purok_sitio_id: Number(p.purok_sitio_id),
						purok_sitio_code: p.purok_sitio_code ?? null,
						purok_sitio_name: p.purok_sitio_name ?? null,
					};
				}
			}
		}

		// delivery_place_type map: collect any ids present on the records
		const deliveryPlaceIds = new Set<number>();
		for (const r of records) {
			if (r.delivery_place_type_id) deliveryPlaceIds.add(Number(r.delivery_place_type_id));
		}

		const deliveryPlaceMap: Record<number, DeliveryPlaceTypeLite | null> = {};
		if (deliveryPlaceIds.size > 0) {
			const uniqD = Array.from(deliveryPlaceIds);
			const { data: dps, error: dErr } = await supabase
				.from('delivery_place_type')
				.select('delivery_place_type_id, delivery_place_type_name')
				.in('delivery_place_type_id', uniqD);

			if (dErr) {
				console.error('Error fetching delivery_place_type rows:', dErr);
			} else if (dps && Array.isArray(dps)) {
				for (const d of dps) {
					deliveryPlaceMap[Number(d.delivery_place_type_id)] = {
						delivery_place_type_id: Number(d.delivery_place_type_id),
						delivery_place_type_name: d.delivery_place_type_name ?? null,
					};
				}
			}
		}

		return { personsMap, familyMap, householdMap, addressMap, purokMap, deliveryPlaceMap };
	}

	private mapRecordToDto(
		rec: any,
		personsMap: Record<number, PersonLite>,
		familyMap: Record<number, FamilyLite | null>,
		householdMap: Record<number, HouseholdLite | null>,
		addressMap: Record<number, AddressLite | null>,
		purokMap: Record<number, PurokLite | null>,
		deliveryPlaceMap: Record<number, DeliveryPlaceTypeLite | null>
	): ChildHealthDto {
		const family = rec.family_id ? (familyMap[Number(rec.family_id)] ?? null) : null;
		let household: HouseholdLite | null = null;
		let address: AddressLite | null = null;
		let purok: PurokLite | null = null;

		if (family && family.household_id && householdMap[Number(family.household_id)]) {
			household = householdMap[Number(family.household_id)];
			if (household && household.address_id && addressMap[Number(household.address_id)]) {
				address = addressMap[Number(household.address_id)];
				if (address && address.purok_sitio_id && purokMap[Number(address.purok_sitio_id)]) {
					purok = purokMap[Number(address.purok_sitio_id)];
				}
			}
		}

		return {
			child_record_id: Number(rec.child_record_id),
			created_at: rec.created_at ?? null,
			birth_order: rec.birth_order ? Number(rec.birth_order) : null,
			family_id: rec.family_id ? Number(rec.family_id) : null,
			family,
			household,
			address,
			purok,
			delivery_place_type: rec.delivery_place_type_id
				? (deliveryPlaceMap[Number(rec.delivery_place_type_id)] ?? null)
				: null,
			person_id: rec.person_id ? Number(rec.person_id) : null,
			person: rec.person_id ? (personsMap[Number(rec.person_id)] ?? null) : null,
			mother_id: rec.mother_id ? Number(rec.mother_id) : null,
			mother: rec.mother_id ? (personsMap[Number(rec.mother_id)] ?? null) : null,
			father_id: rec.father_id ? Number(rec.father_id) : null,
			father: rec.father_id ? (personsMap[Number(rec.father_id)] ?? null) : null,
			delivery_place_type_id: rec.delivery_place_type_id ? Number(rec.delivery_place_type_id) : null,
			added_by_id: rec.added_by_id ? Number(rec.added_by_id) : null,
			is_transferred: !!rec.is_transferred,
		};
	}

	/**
	 * Fetch a single child health record by id
	 */
	async GetChildHealthRecordById(childRecordId: number): Promise<ChildHealthDto | null> {
		try {
			const { data: rec, error } = await supabase
				.from('child_health_record')
				.select('*')
				.eq('child_record_id', childRecordId)
				.single();

			if (error) {
				console.error('Error fetching child_health_record by id:', error);
				return null;
			}
			if (!rec) return null;

			const { personsMap, familyMap, householdMap, addressMap, purokMap, deliveryPlaceMap } = await this.buildRelatedMaps([rec]);
			return this.mapRecordToDto(rec, personsMap, familyMap, householdMap, addressMap, purokMap, deliveryPlaceMap);
		} catch (err) {
			console.error('Unexpected error fetching child health record by id:', err);
			return null;
		}
	}

	/**
	 * Fetch all child health records
	 */
	async GetAllChildHealthRecords(): Promise<ChildHealthDto[] | null> {
		try {
			const { data: recs, error } = await supabase
				.from('child_health_record')
				.select('*')
				.order('child_record_id', { ascending: true });

			if (error) {
				console.error('Error fetching child_health_record rows:', error);
				return null;
			}
			if (!recs || !Array.isArray(recs)) return [];

			const { personsMap, familyMap, householdMap, addressMap, purokMap, deliveryPlaceMap } = await this.buildRelatedMaps(recs);
			return recs.map((r: any) => this.mapRecordToDto(r, personsMap, familyMap, householdMap, addressMap, purokMap, deliveryPlaceMap));
		} catch (err) {
			console.error('Unexpected error fetching all child health records:', err);
			return null;
		}
	}

	/**
	 * Fetch records by family id
	 */
	async GetChildHealthRecordsByFamilyId(familyId: number): Promise<ChildHealthDto[] | null> {
		try {
			const { data: recs, error } = await supabase
				.from('child_health_record')
				.select('*')
				.eq('family_id', familyId)
				.order('child_record_id', { ascending: true });

			if (error) {
				console.error('Error fetching child_health_record by family_id:', error);
				return null;
			}
			if (!recs || !Array.isArray(recs)) return [];

			const { personsMap, familyMap, householdMap, addressMap, purokMap, deliveryPlaceMap } = await this.buildRelatedMaps(recs);
			return recs.map((r: any) => this.mapRecordToDto(r, personsMap, familyMap, householdMap, addressMap, purokMap, deliveryPlaceMap));
		} catch (err) {
			console.error('Unexpected error fetching child health records by family id:', err);
			return null;
		}
	}

	/**
	 * Fetch records by person id (child)
	 */
	async GetChildHealthRecordsByPersonId(personId: number): Promise<ChildHealthDto[] | null> {
		try {
			const { data: recs, error } = await supabase
				.from('child_health_record')
				.select('*')
				.eq('person_id', personId)
				.order('child_record_id', { ascending: true });

			if (error) {
				console.error('Error fetching child_health_record by person_id:', error);
				return null;
			}
			if (!recs || !Array.isArray(recs)) return [];

			const { personsMap, familyMap, householdMap, addressMap, purokMap, deliveryPlaceMap } = await this.buildRelatedMaps(recs);
			return recs.map((r: any) => this.mapRecordToDto(r, personsMap, familyMap, householdMap, addressMap, purokMap, deliveryPlaceMap));
		} catch (err) {
			console.error('Unexpected error fetching child health records by person id:', err);
			return null;
		}
	}

	/**
	 * Create a child health record and return hydrated DTO
	 */
	async CreateChildHealthRecord(info: Record<string, any>): Promise<ChildHealthDto | null> {
		try {
			const { data, error } = await supabase
				.from('child_health_record')
				.insert(info)
				.single();

			if (error) {
				console.error('Error inserting child_health_record:', error);
				return null;
			}
			if (!data) return null;

			return await this.GetChildHealthRecordById(Number((data as any).child_record_id));
		} catch (err) {
			console.error('Unexpected error creating child health record:', err);
			return null;
		}
	}

	/**
	 * Update a child health record and return hydrated DTO
	 */
	async UpdateChildHealthRecord(childRecordId: number, info: Record<string, any>): Promise<ChildHealthDto | null> {
		try {
			const { data, error } = await supabase
				.from('child_health_record')
				.update(info)
				.eq('child_record_id', childRecordId)
				.single();

			if (error) {
				console.error('Error updating child_health_record:', error);
				return null;
			}
			if (!data) return null;

			return await this.GetChildHealthRecordById(Number((data as any).child_record_id));
		} catch (err) {
			console.error('Unexpected error updating child health record:', err);
			return null;
		}
	}

	/**
	 * Delete a child health record by id
	 */
	async DeleteChildHealthRecord(childRecordId: number): Promise<boolean> {
		try {
			const { error } = await supabase
				.from('child_health_record')
				.delete()
				.eq('child_record_id', childRecordId);

			if (error) {
				console.error('Error deleting child_health_record:', error);
				return false;
			}
			return true;
		} catch (err) {
			console.error('Unexpected error deleting child health record:', err);
			return false;
		}
	}

}

export default ChildHealthQuery;