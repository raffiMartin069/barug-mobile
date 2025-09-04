// =============================================
// File: src/constants/formoptions.tsx (UPDATED)
// =============================================

// ✅ Gender Options
export const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

export const genderMap = {
  male: 'Male',
  female: 'Female',
};

// ✅ Civil Status Options
export const civilStatusOptions = [
  { label: 'Single', value: '1' },
  { label: 'Married', value: '2' },
  { label: 'Widowed', value: '3' },
  { label: 'Separated', value: '4' },
  { label: 'Divorced', value: '5' },
];

// Note: number-keyed map (1..5)
export const civilStatusMap: Record<number | string, string> = {
  1: 'Single',
  2: 'Married',
  3: 'Widowed',
  4: 'Separated',
  5: 'Divorced',
};

// ✅ Nationality Options
export const nationalityOptions = [
  { label: 'Filipino', value: '7' },
  { label: 'American', value: '1' },
  { label: 'Australian', value: '2' },
  { label: 'Brazilian', value: '3' },
  { label: 'British', value: '4' },
  { label: 'Canadian', value: '5' },
  { label: 'Chinese', value: '6' },
  { label: 'French', value: '8' },
  { label: 'German', value: '9' },
  { label: 'Indian', value: '10' },
  { label: 'Indonesian', value: '11' },
  { label: 'Italian', value: '12' },
  { label: 'Japanese', value: '13' },
  { label: 'Korean', value: '14' },
  { label: 'Malaysian', value: '15' },
  { label: 'Russian', value: '16' },
  { label: 'Saudi', value: '17' },
  { label: 'Spanish', value: '18' },
  { label: 'Thai', value: '19' },
  { label: 'Vietnamese', value: '20' },
];

// Note: string-keyed map ('1'..'20')
export const nationalityMap: Record<number | string, string> = {
  '1': 'American',
  '2': 'Australian',
  '3': 'Brazilian',
  '4': 'British',
  '5': 'Canadian',
  '6': 'Chinese',
  '7': 'Filipino',
  '8': 'French',
  '9': 'German',
  '10': 'Indian',
  '11': 'Indonesian',
  '12': 'Italian',
  '13': 'Japanese',
  '14': 'Korean',
  '15': 'Malaysian',
  '16': 'Russian',
  '17': 'Saudi',
  '18': 'Spanish',
  '19': 'Thai',
  '20': 'Vietnamese',
};

// ✅ Religion Options
export const religionOptions = [
  { label: 'Roman Catholic', value: '13' },
  { label: 'Islam', value: '9' },
  { label: 'Born Again', value: '3' },
  { label: 'Iglesia Ni Cristo', value: '8' },
  { label: 'Agnostic', value: '1' },
  { label: 'Amish', value: '2' },
  { label: 'Buddhist', value: '4' },
  { label: 'Christian', value: '5' },
  { label: 'Evangelical', value: '6' },
  { label: 'Hindu', value: '7' },
  { label: "Jehovah's Witness", value: '10' },
  { label: 'Orthodox', value: '11' },
  { label: 'Protestant', value: '12' },
  { label: 'Seventh-Day Adventist', value: '14' },
  { label: 'Others', value: '15' },
];

// ✅ Fixed to match options (number-keyed)
export const religionMap: Record<number | string, string> = {
  1: 'Agnostic',
  2: 'Amish',
  3: 'Born Again',
  4: 'Buddhist',
  5: 'Christian',
  6: 'Evangelical',
  7: 'Hindu',
  8: 'Iglesia Ni Cristo',
  9: 'Islam',
  10: "Jehovah's Witness",
  11: 'Orthodox',
  12: 'Protestant',
  13: 'Roman Catholic',
  14: 'Seventh-Day Adventist',
  15: 'Others',
};

// Local suffix options (values stored uppercase for backend consistency)
export const suffixOptions = [
  { label: 'None', value: '' },
  { label: 'Jr.', value: 'JR' },
  { label: 'Sr.', value: 'SR' },
  { label: 'III', value: 'III' },
  { label: 'IV', value: 'IV' },
  { label: 'V', value: 'V' },
];

// ✅ Educational Attainment Options
export const educAttainmentOptions = [
  { label: 'No Formal Education', value: '1' },
  { label: 'Elementary Level', value: '2' },
  { label: 'Elementary Graduate', value: '3' },
  { label: 'High School Level', value: '4' },
  { label: 'High School Graduate', value: '5' },
  { label: 'Vocational', value: '6' },
  { label: 'College Level', value: '7' },
  { label: 'College Graduate', value: '8' },
  { label: 'Postgraduate', value: '9' },
];

export const educAttainmentMap: Record<number | string, string> = {
  1: 'No Formal Education',
  2: 'Elementary Level',
  3: 'Elementary Graduate',
  4: 'High School Level',
  5: 'High School Graduate',
  6: 'Vocational',
  7: 'College Level',
  8: 'College Graduate',
  9: 'Postgraduate',
};

// ✅ Employment Status Options
export const empStatOptions = [
  { label: 'Employed', value: '1' },
  { label: 'Unemployed', value: '2' },
  { label: 'OFW', value: '3' },
  { label: 'Student', value: '4' },
  { label: 'Retired', value: '5' },
  { label: 'Self-Employed', value: '6' },
  { label: 'Pensioner', value: '7' },
  { label: 'Housewife', value: '8' },
  { label: 'Freelancer', value: '9' },
  { label: 'Disabled', value: '10' },
  { label: 'Looking for Work', value: '11' },
  { label: 'Part-Time', value: '12' },
  { label: 'Full-Time', value: '13' },
  { label: 'Underemployed', value: '14' },
];

// ✅ Employment Status Map
export const empStatMap: Record<number | string, string> = {
  1: 'Employed',
  2: 'Unemployed',
  3: 'OFW',
  4: 'Student',
  5: 'Retired',
  6: 'Self-Employed',
  7: 'Pensioner',
  8: 'Housewife',
  9: 'Freelancer',
  10: 'Disabled',
  11: 'Looking for Work',
  12: 'Part-Time',
  13: 'Full-Time',
  14: 'Underemployed',
};

// ✅ Monthly Personal Income Options
export const mnthlyPerosonalIncomeOptions = [
  { label: 'Below ₱5,000', value: '1' },
  { label: '₱5,001 - ₱10,000', value: '2' },
  { label: '₱10,001 - ₱15,000', value: '3' },
  { label: '₱15,001 - ₱20,000', value: '4' },
  { label: '₱20,001 - ₱30,000', value: '5' },
  { label: '₱30,001 - ₱50,000', value: '6' },
  { label: '₱50,001 - ₱75,000', value: '7' },
  { label: '₱75,001 - ₱100,000', value: '8' },
  { label: 'Above ₱100,000', value: '9' },
];

// ✅ Monthly Personal Income Map
export const mnthlyPersonalIncomeMap: Record<number | string, string> = {
  1: 'Below ₱5,000',
  2: '₱5,001 - ₱10,000',
  3: '₱10,001 - ₱15,000',
  4: '₱15,001 - ₱20,000',
  5: '₱20,001 - ₱30,000',
  6: '₱30,001 - ₱50,000',
  7: '₱50,001 - ₱75,000',
  8: '₱75,001 - ₱100,000',
  9: 'Above ₱100,000',
};

// ✅ Government Programs Options
export const govProgOptions = [
  { label: 'None', value: '7' },
  { label: '4Ps', value: '1' },
  { label: 'GSIS', value: '2' },
  { label: 'PhilHealth', value: '3' },
  { label: 'PWD', value: '4' },
  { label: 'Senior Citizen', value: '5' },
  { label: 'SSS', value: '6' },
];

// ✅ Government Programs Map
export const govProgMap: Record<number | string, string> = {
  1: '4Ps',
  2: 'GSIS',
  3: 'PhilHealth',
  4: 'PWD',
  5: 'Senior Citizen',
  6: 'SSS',
  7: 'None',
};


// ✅ ID Type Options (matches document_type table)
export const ocr_idTypeOptions = [
  { label: 'PHILIPPINE PASSPORT', value: '1' },
  { label: 'ePHILID', value: 'ephil_id' },
  { label: 'PHILIPPINE NATIONAL ID OCR', value: 'philippine_national_id' },
  { label: 'SSS/UMID CARD', value: '3' },
  { label: 'GSIS ECARD', value: '4' },
  { label: 'PRC ID', value: '5' },
  { label: "DRIVER'S LICENSE", value: '6' },
  { label: 'PHILHEALTH ID', value: '7' },
  { label: "VOTER'S ID", value: '8' },
  { label: 'POSTAL ID', value: '9' },
  { label: 'SENIOR CITIZEN ID', value: '10' },
  { label: 'PWD ID', value: '11' },
  { label: 'OWWA ID', value: '12' },
  { label: 'IBP ID', value: '13' },
  { label: 'TIN ID', value: '14' },
  { label: 'BIRTH CERTIFICATE', value: '15' },
  { label: 'BARANGAY CERTIFICATE', value: '16' },
  { label: 'SCHOOL ID', value: '17' },
  { label: 'RESIDENT PICTURE', value: '18' },
  { label: 'RESIDENT SELFIE', value: '19' },
];

export const ocr_idTypeMap: Record<number | string, string> = {
  1: 'PHILIPPINE PASSPORT',
  2: 'PHILIPPINE NATIONAL ID ocr',
  3: 'SSS/UMID CARD',
  4: 'GSIS ECARD',
  5: 'PRC ID',
  6: "DRIVER'S LICENSE",
  7: 'PHILHEALTH ID',
  8: "VOTER'S ID",
  9: 'POSTAL ID',
  10: 'SENIOR CITIZEN ID',
  11: 'PWD ID',
  12: 'OWWA ID',
  13: 'IBP ID',
  14: 'TIN ID',
  15: 'BIRTH CERTIFICATE',
  16: 'BARANGAY CERTIFICATE',
  17: 'SCHOOL ID',
  18: 'RESIDENT PICTURE',
  19: 'RESIDENT SELFIE',
};

// ✅ ID Type Options (matches document_type table)
export const idTypeOptions = [
  { label: 'PHILIPPINE PASSPORT', value: '1' },
  { label: 'PHILIPPINE NATIONAL ID', value: '2' },
  { label: 'SSS/UMID CARD', value: '3' },
  { label: 'GSIS ECARD', value: '4' },
  { label: 'PRC ID', value: '5' },
  { label: "DRIVER'S LICENSE", value: '6' },
  { label: 'PHILHEALTH ID', value: '7' },
  { label: "VOTER'S ID", value: '8' },
  { label: 'POSTAL ID', value: '9' },
  { label: 'SENIOR CITIZEN ID', value: '10' },
  { label: 'PWD ID', value: '11' },
  { label: 'OWWA ID', value: '12' },
  { label: 'IBP ID', value: '13' },
  { label: 'TIN ID', value: '14' },
  { label: 'BIRTH CERTIFICATE', value: '15' },
  { label: 'BARANGAY CERTIFICATE', value: '16' },
  { label: 'SCHOOL ID', value: '17' },
  { label: 'RESIDENT PICTURE', value: '18' },
  { label: 'RESIDENT SELFIE', value: '19' },
];

export const idTypeMap: Record<number | string, string> = {
  1: 'PHILIPPINE PASSPORT',
  2: 'PHILIPPINE NATIONAL ID',
  3: 'SSS/UMID CARD',
  4: 'GSIS ECARD',
  5: 'PRC ID',
  6: "DRIVER'S LICENSE",
  7: 'PHILHEALTH ID',
  8: "VOTER'S ID",
  9: 'POSTAL ID',
  10: 'SENIOR CITIZEN ID',
  11: 'PWD ID',
  12: 'OWWA ID',
  13: 'IBP ID',
  14: 'TIN ID',
  15: 'BIRTH CERTIFICATE',
  16: 'BARANGAY CERTIFICATE',
  17: 'SCHOOL ID',
  18: 'RESIDENT PICTURE',
  19: 'RESIDENT SELFIE',
};

export const relationshipOptions: Array<{label: string; value: string}> = [];
export const relationshipMap: Record<string, string> = {};

// ✅ NHTS Options
export const nhtsOptions = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

export const nhtsMap = {
  yes: 'Yes',
  no: 'No',
};

// ✅ Indigent Options
export const indigentOptions = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

export const indigentMap = {
  yes: 'Yes',
  no: 'No',
};

export const documentOptions = [
  { label: 'Barangay Clearance', value: 'brgy_clearance' },
  { label: 'Certificate of Residency', value: 'cert_residency' },
  { label: 'Certificate of Indigency', value: 'cert_indigency' },
  { label: 'Barangay Business Clearance', value: 'barangay_business_clearance' },
  { label: 'Certificate of Low Income', value: 'cert_lowincome' },
  { label: 'Certificate of Good Moral Character', value: 'cert_goodmoral' },
  { label: 'Barangay Death Certificate', value: 'cert_death' },
  { label: 'Permit to Conduct Activities', value: 'permit_conduct_activities' },
];

export const documentMap = {
  barangay_clearance: 'Barangay Clearance',
  residency_certificate: 'Certificate of Residency',
  certificate_indigency: 'Certificate of Indigency',
  barangay_business_clearance: 'Barangay Business Clearance',
  certificate_low_income: 'Certificate of Low Income',
  certificate_good_moral_character: 'Certificate of Good Moral Character',
  barangay_death_certificate: 'Barangay Death Certificate',
  permit_conduct_activities: 'Permit to Conduct Activities',
};