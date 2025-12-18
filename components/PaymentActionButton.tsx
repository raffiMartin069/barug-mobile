import React from 'react'
import { TouchableOpacity, Linking, Alert, StyleSheet } from 'react-native'
import ThemedIcon from './ThemedIcon'
import { useAccountRole } from '@/store/useAccountRole'
import { startBlotterPayment } from '@/services/payments'

interface PaymentActionButtonProps {
  reportId: number
  amount?: number
  onPress?: () => void
}

const PaymentActionButton: React.FC<PaymentActionButtonProps> = ({ 
  reportId, 
  amount = 100, 
  onPress 
}) => {
  const { getProfile, currentRole } = useAccountRole()
  const profile = getProfile()
  
  const isTreasurer = currentRole === 'staff' && 
    profile?.role_name_db?.toLowerCase().includes('treasurer')

  const handlePayment = async () => {
    try {
      if (onPress) {
        onPress()
        return
      }

      const { checkout_url } = await startBlotterPayment(reportId, {
        success_url: 'barugapp://payment/success',
        cancel_url: 'barugapp://payment/cancel',
        amount
      })
      
      const supported = await Linking.canOpenURL(checkout_url)
      
      if (supported) {
        await Linking.openURL(checkout_url)
      } else {
        Alert.alert('Error', 'Cannot open payment URL')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process payment')
      console.error('Payment error:', error)
    }
  }

  if (!isTreasurer) {
    return (
      <TouchableOpacity style={styles.eyeButton}>
        <ThemedIcon
          name="eye-outline"
          size={16}
          iconColor="#6c757d"
          bgColor="#f8f9fa"
          containerSize={32}
        />
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity onPress={handlePayment} style={styles.payButton}>
      <ThemedIcon
        name="card-outline"
        size={16}
        iconColor="#fff"
        bgColor="#007bff"
        containerSize={32}
      />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  eyeButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  payButton: {
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
})

export default PaymentActionButton