import NiceModal, { ModalVariant } from '@/components/NiceModal'; // ✅ use NiceModal
import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedButton from '@/components/ThemedButton';
import ThemedDatePicker from '@/components/ThemedDatePicker';
import ThemedDropdown from '@/components/ThemedDropdown';
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView';
import ThemedProgressBar from '@/components/ThemedProgressBar';
import ThemedRadioButton from '@/components/ThemedRadioButton';
import ThemedText from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import ThemedView from '@/components/ThemedView';
import { civilStatusOptions, genderOptions, nationalityOptions, religionOptions, suffixOptions } from '@/constants/formOptions';
import { useResidentFormStore } from '@/store/forms';
import { useRouter } from 'expo-router';
import { useSearchParams } from 'expo-router/build/hooks';
import { default as React, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

const PersonalInfo = () => {
    const params = useSearchParams();

    function toTitleCase(str: string) {
        return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    }

    // Extract primitives once per render
    const streetParam = params.get('street') ?? '';
    const purokParam = toTitleCase(params.get('purok_name') ?? '');
    const brgyParam = params.get('brgy') ?? '';
    const cityParam = params.get('city') ?? '';

    const latParam = params.get('lat') ?? ''
    const lngParam = params.get('lng') ?? ''

    useEffect(() => {
        if (!streetParam && !purokParam && !brgyParam && !cityParam) return;

        const nextFull = `${streetParam}, ${purokParam}, ${brgyParam}, ${cityParam}`;

        const somethingChanged =
            street !== streetParam ||
            purokSitio !== purokParam ||
            brgy !== brgyParam ||
            city !== cityParam ||
            haddress !== nextFull;

        if (somethingChanged) {
            setStreet(streetParam);
            setPurokSitio(purokParam);
            setBrgy(brgyParam);
            setCity(cityParam);
            setHAddress(nextFull);
        }
    }, [streetParam, purokParam, brgyParam, cityParam, street, purokSitio, brgy, city, haddress]);

    useEffect(() => {
        // only write when at least one coord exists; avoids overwriting with ''
        if (latParam || lngParam) {
            setMany({
                latitude: latParam || '',
                longitude: lngParam || '',
            })
            console.log('[PersonalInfo] coords saved to store', { lat: latParam, lng: lngParam })
        }
    }, [latParam, lngParam])

    const router = useRouter();

    const {
        // personal fields from the store
        fname, mname, lname, suffix,
        gender, dob, civilStatus, nationality, religion,
        haddress, street, purokSitio, brgy, city,
        mobnum, email,
        setMany,
    } = useResidentFormStore();

    // --- Adapters that mimic React.useState's setter signature (value OR updater fn) ---

    const setSuffixAdapt = (updater: string | ((curr: string) => string)) => {
        const next = typeof updater === 'function' ? updater(suffix) : updater
        // store uppercase codes like 'JR', 'SR', '', etc.
        setMany({ suffix: String(next ?? '') })
    }

    const setGenderAdapt = (updater: string | ((curr: string) => string)) => {
        const next = typeof updater === 'function' ? updater(gender) : updater;
        setMany({ gender: String(next) });
    };
    const setCivilStatusAdapt = (updater: string | ((curr: string) => string)) => {
        const next = typeof updater === 'function' ? updater(civilStatus) : updater;
        setMany({ civilStatus: String(next) });
    };
    const setNationalityAdapt = (updater: string | ((curr: string) => string)) => {
        const next = typeof updater === 'function' ? updater(nationality) : updater;
        setMany({ nationality: String(next) });
    };
    const setReligionAdapt = (updater: string | ((curr: string) => string)) => {
        const next = typeof updater === 'function' ? updater(religion) : updater;
        setMany({ religion: String(next) });
    };

    // DatePicker may pass a Date/string; store string (normalize later at submit)
    const setDobAdapt = (updater: string | Date | ((curr: string) => string | Date)) => {
        const curr = dob;
        const nextAny = typeof updater === 'function' ? updater(curr) : updater;
        const next = nextAny instanceof Date ? nextAny.toString() : String(nextAny ?? '');
        setMany({ dob: next });
    };

    // TextInputs: simple direct setters
    const setFname = (v: string) => setMany({ fname: v });
    const setMname = (v: string) => setMany({ mname: v });
    const setLname = (v: string) => setMany({ lname: v });
    const setSuffix = (v: string) => setMany({ suffix: v });
    const setHAddress = (v: string) => setMany({ haddress: v });
    const setStreet = (v: string) => setMany({ street: v });
    const setPurokSitio = (v: string) => setMany({ purokSitio: v });
    const setBrgy = (v: string) => setMany({ brgy: v });
    const setCity = (v: string) => setMany({ city: v });
    const setMobNum = (v: string) => setMany({ mobnum: v });
    const setEmail = (v: string) => setMany({ email: v });

    // ----------------- Validation (NiceModal) -----------------
    const [modal, setModal] = useState<{
        visible: boolean;
        title: string;
        message?: string;
        variant?: ModalVariant;
    }>({ visible: false, title: '', message: '', variant: 'warn' });

    const openModal = (title: string, message?: string, variant: ModalVariant = 'warn') =>
        setModal({ visible: true, title, message, variant });
    const closeModal = () => setModal((m) => ({ ...m, visible: false }));

    const validateForm = () => {
        if (!fname.trim()) return 'First Name is required';
        if (!lname.trim()) return 'Last Name is required';
        if (!gender) return 'Sex is required';
        if (!dob) return 'Date of Birth is required';
        if (!civilStatus) return 'Civil Status is required';
        if (!nationality) return 'Nationality is required';
        if (!religion) return 'Religion is required';
        if (!mobnum.trim()) return 'Mobile Number is required'
        // Ensure it matches +63 + 10 digits
        if (!/^\+63\s?\d{10}$/.test(mobnum)) return 'Mobile Number must be in format +63XXXXXXXXXX'

        if (email.trim() && !/^[^@]+@[^@]+\.[^@]+$/.test(email)) return 'Invalid Email Address';
        return null;
    };

    const handleSubmit = () => {
        const error = validateForm();
        if (error) {
            // ✅ Use NiceModal instead of alerts
            openModal('Validation Error', error, 'warn');
            return;
        }
        router.push({ pathname: '/socioeconomicinfo' });
    };

    const handleHomeAddress = () => {
        router.push({
            pathname: '/mapaddress',
            params: { returnTo: '/residentaddress' },
        });
    };

    return (
        <ThemedView safe={true}>
            <ThemedAppBar title='Personal Information test' showNotif={false} showProfile={false} />

            <ThemedProgressBar step={1} totalStep={2} />

            <ThemedKeyboardAwareScrollView>
                <View>
                    <ThemedTextInput placeholder='First Name *' value={fname} onChangeText={setFname} />
                    <Spacer height={10} />
                    <ThemedTextInput placeholder='Middle Name' value={mname} onChangeText={setMname} />
                    <Spacer height={10} />
                    <ThemedTextInput placeholder='Last Name *' value={lname} onChangeText={setLname} />
                    <Spacer height={10} />

                    {/* Suffix */}
                    <ThemedDropdown
                        items={suffixOptions}     // uses your existing options
                        value={suffix}            // store value like '', 'JR', 'SR', 'III'...
                        setValue={setSuffixAdapt} // adapter
                        placeholder='Suffix'
                        order={0}
                    />

                    <Spacer height={10} />

                    <ThemedText subtitle={true}>Sex</ThemedText>
                    <ThemedRadioButton
                        value={gender}
                        onChange={setGenderAdapt}     // adapter, behaves like setState
                        options={genderOptions}
                    />

                    <Spacer height={10} />
                    <ThemedDatePicker
                        value={dob ? new Date(dob) : undefined}
                        mode="date"
                        onChange={(next) => {
                            if (next instanceof Date && !isNaN(next.getTime())) {
                                const pad = (n: number) => String(n).padStart(2, '0')
                                const formatted = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`
                                setMany({ dob: formatted })          // <-- use store setter here
                            } else {
                                setMany({ dob: '' })
                            }
                        }}
                        placeholder="Date of Birth *"
                        maximumDate={new Date()}
                    />

                    <Spacer height={10} />
                    <ThemedDropdown
                        items={civilStatusOptions}
                        value={civilStatus}
                        setValue={setCivilStatusAdapt} // adapter
                        placeholder='Civil Status *'
                        order={1}
                    />

                    <Spacer height={10} />
                    <ThemedDropdown
                        items={nationalityOptions}
                        value={nationality}
                        setValue={setNationalityAdapt} // adapter
                        placeholder='Nationality *'
                        order={2}
                    />

                    <Spacer height={10} />
                    <ThemedDropdown
                        items={religionOptions}
                        value={religion}
                        setValue={setReligionAdapt}    // adapter
                        placeholder='Religion *'
                        order={3}
                    />

                    <Spacer height={10} />
                    <Pressable onPress={handleHomeAddress}>
                        <ThemedTextInput
                            placeholder='Home Address'
                            multiline={true}
                            numberOfLines={2}
                            value={haddress}
                            onChangeText={setHAddress}
                            editable={false}
                            pointerEvents="none"
                        />
                    </Pressable>

                    <Spacer height={10} />

                    <ThemedTextInput
                        placeholder="Mobile Number *"
                        value={mobnum}
                        onChangeText={(val) => {
                            // Keep only digits
                            let digits = val.replace(/\D/g, '')

                            // Strip out any accidental leading "63"
                            if (digits.startsWith('63')) {
                                digits = digits.slice(2)
                            }

                            // Only allow up to 10 digits after +63
                            if (digits.length > 10) {
                                digits = digits.slice(0, 10)
                            }

                            // Save as +63 + digits (no space)
                            setMobNum(`+63${digits}`)
                        }}
                        keyboardType="phone-pad"
                    />



                    <Spacer height={10} />
                    <ThemedTextInput
                        placeholder='Email Address'
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>

                <Spacer height={15} />
                <View>
                    <ThemedButton onPress={handleSubmit}>
                        <ThemedText btn={true}>Continue</ThemedText>
                    </ThemedButton>
                </View>
            </ThemedKeyboardAwareScrollView>

            {/* ✅ NiceModal for validation messages */}
            <NiceModal
                visible={modal.visible}
                title={modal.title}
                message={modal.message}
                variant={modal.variant}
                primaryText="Got it"
                onPrimary={closeModal}
                onClose={closeModal}
            />
        </ThemedView>
    );
};

export default PersonalInfo;

const styles = StyleSheet.create({
    image: { width: '100%', height: 70, alignSelf: 'center' },
    text: { textAlign: 'center' },
    link: { textAlign: 'right' },
});
