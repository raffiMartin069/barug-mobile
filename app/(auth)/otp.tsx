import Spacer from '@/components/Spacer';
import ThemedButton from '@/components/ThemedButton';
import ThemedCard from '@/components/ThemedCard';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import React, { useRef, useState } from 'react';
import { NativeSyntheticEvent, StyleSheet, TextInput, TextInputKeyPressEventData, TouchableWithoutFeedback, View } from 'react-native';

export default function Otp() {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);

  const focusNext = (i: number) => inputs.current[i + 1]?.focus();
  const focusPrev = (i: number) => inputs.current[i - 1]?.focus();

  const handleChange = (text: string, i: number) => {
    if (text.length > 1) {
      const digits = text.replace(/\D/g, '').slice(0, 6).split('');
      const next = [...code];
      for (let k = 0; k < 6; k++) next[k] = digits[k] ?? next[k];
      setCode(next);
      const last = Math.min(digits.length - 1, 5);
      if (last >= i) inputs.current[last]?.focus();
      return;
    }

    const next = [...code];
    next[i] = text.replace(/\D/g, '').slice(0, 1);
    setCode(next);
    if (next[i] && i < 5) focusNext(i);
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    i: number
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !code[i] && i > 0) {
      focusPrev(i);
    }
  };

  return (
    <ThemedView safe>
        <TouchableWithoutFeedback>
            <ThemedCard>
                <ThemedText>We sent a 6-digit authentication code to your registered mobile number</ThemedText>

                <Spacer />

                <ThemedText style={styles.maskedNumber}>+63945****160</ThemedText>

                <Spacer />
                
                <ThemedText>Please enter the authentication code</ThemedText>

                <View style={styles.otpContainer}>
                {code.map((digit, i) => (
                    <TextInput
                    key={i}
                    ref={(r: TextInput | null) => { inputs.current[i] = r; }}
                    style={styles.otpInput}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    maxLength={1}
                    autoFocus={i === 0}
                    value={digit}
                    onChangeText={(t) => handleChange(t, i)}
                    onKeyPress={(e) => handleKeyPress(e, i)}
                    textAlign="center"
                    returnKeyType="done"
                    />
                ))}
                </View>

                <Spacer />

                <ThemedText style={{textAlign: 'center'}}>Didn't get the code? <ThemedText link>Tap here to resend</ThemedText></ThemedText>

                <Spacer height={10}/>

                <ThemedButton>
                    <ThemedText btn>Submit</ThemedText>
                </ThemedButton>
            </ThemedCard>
        </TouchableWithoutFeedback>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  maskedNumber: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 700,
  },
  otpInput: {
    borderBottomWidth: 2,
    borderColor: '#000',
    fontSize: 16,
    paddingVertical: 10,
    width: 30,
  },
});
