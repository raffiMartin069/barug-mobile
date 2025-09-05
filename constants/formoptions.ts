// =============================================
// File: src/constants/formoptions.tsx (UPDATED)
// =============================================

// ✅ Gender Options
export const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

export const genderMap = {
  male: 'MALE',
  female: 'FEMALE',
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
// Note: number-keyed map (1..5)
export const civilStatusMap: Record<number | string, string> = {
  1:'SINGLE',
  2:'MARRIED',
  3:'WIDOWED',
  4:'SEPARATED',
  5:'DIVORCED',
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
  '1': 'AMERICAN',
  '2': 'AUSTRALIAN',
  '3': 'BRAZILIAN',
  '4': 'BRITISH',
  '5': 'CANADIAN',
  '6': 'CHINESE',
  '7': 'FILIPINO',
  '8': 'FRENCH',
  '9': 'GERMAN',
  '10': 'INDIAN',
  '11': 'INDONESIAN',
  '12': 'ITALIAN',
  '13': 'JAPANESE',
  '14': 'KOREAN',
  '15': 'MALAYSIAN',
  '16': 'RUSSIAN',
  '17': 'SAUDI',
  '18': 'SPANISH',
  '19': 'THAI',
  '20': 'VIETNAMESE',
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
  1: 'AGNOSTIC',
  2: 'AMISH',
  3: 'BORN AGAIN',
  4: 'BUDDHIST',
  5: 'CHRISTIAN',
  6: 'EVANGELICAL',
  7: 'HINDU',
  8: 'IGLESIA NI CRISTO',
  9: 'ISLAM',
  10: "JEHOVAH'S WITNESS",
  11: 'ORTHODOX',
  12: 'PROTESTANT',
  13: 'ROMAN CATHOLIC',
  14: 'SEVENTH-DAY ADVENTIST',
  15: 'OTHERS',
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
  { label: 'Vocational Course', value: '6' },
  { label: 'College Level', value: '7' },
  { label: 'College Graduate', value: '8' },
  { label: 'Postgraduate', value: '9' },
];

export const educAttainmentMap: Record<number | string, string> = {
  1: 'NO FORMAL EDUCATION',
  2: 'ELEMENTARY LEVEL',
  3: 'ELEMENTARY GRADUATE',
  4: 'HIGH SCHOOL LEVEL',
  5: 'HIGH SCHOOL GRADUATE',
  6: 'VOCATIONAL COURSE',
  7: 'COLLEGE LEVEL',
  8: 'COLLEGE GRADUATE',
  9: 'POSTGRADUATE',
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
  1: 'EMPLOYED',
  2: 'UNEMPLOYED',
  3: 'OFW',
  4: 'STUDENT',
  5: 'RETIRED',
  6: 'SELF-EMPLOYED',
  7: 'PENSIONER',
  8: 'HOUSEWIFE',
  9: 'FREELANCER',
  10: 'DISABLED',
  11: 'LOOKING FOR WORK',
  12: 'PART-TIME',
  13: 'FULL-TIME',
  14: 'UNDEREMPLOYED',
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
  1: '4PS',
  2: 'GSIS',
  3: 'PHILHEALTH',
  4: 'PWD',
  5: 'SENIOR CITIZEN',
  6: 'SSS',
  7: 'NONE',
};


// ✅ ID Type Options (matches document_type table)
export const ocr_idTypeOptions = [
  { label: 'PHILIPPINE PASSPORT', value: '1' },
  { label: 'ePHILID', value: 'ephil_id' },
  { label: 'PHILIPPINE NATIONAL ID OCR 3', value: 'philippine_national_id' },
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