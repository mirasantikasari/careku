import React from 'react'
import { View, Text } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

const ProgressCard = ({ value = 2, max = 10, title="" }) => {
  const progress = (value / max) * 100

  return (
    <View style={{ width: '100%' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        {
          title &&
        <Text>{title}</Text>
        }
        <Text>{value}/{max}</Text>
      </View>

      {/* Progress Bar Background */}
      <View
        style={{
          height: 12,
          backgroundColor: '#E5E7EB',
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        {/* Progress with gradient */}
        <LinearGradient
          colors={['#2d34ecff', '#EF4444']} // hijau → kuning → merah
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            width: `${progress}%`,
            height: '100%',
          }}
        />
      </View>
    </View>
  )
}

export default ProgressCard
