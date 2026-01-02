import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

const ProgressMin = ({ current = 6, max = 8 }) => {
  return (
    <View
      style={{
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        width: 300,
      }}
    >

      {/* Progress Blocks */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {Array.from({ length: max }).map((_, index) => {
          const filled = index < current
          return (
            <View
              key={index}
              style={{
                width: 30,
                height: 8,
                borderRadius: 4,
                backgroundColor: filled ? '#0d5da7ff' : '#E5E7EB',
              }}
            />
          )
        })}
      </View>
    </View>
  )
}

export default ProgressMin
