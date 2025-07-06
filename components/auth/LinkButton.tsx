import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface LinkButtonProps {
  question: string;
  linkText: string;
  onPress: () => void;
  textAlign?: 'left' | 'center' | 'right';
}

export default function LinkButton({ 
  question,
  linkText,
  onPress,
  textAlign = 'center'
}: LinkButtonProps) {
  return (
    <View style={[styles.container, { justifyContent: 
      textAlign === 'left' ? 'flex-start' : 
      textAlign === 'right' ? 'flex-end' : 'center' 
    }]}>
      <Text style={styles.questionText}>{question} </Text>
      <TouchableOpacity onPress={onPress} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <Text style={styles.linkText}>{linkText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  questionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  linkText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
});