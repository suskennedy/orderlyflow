import React from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ScrollViewProps,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  containerStyle?: ViewStyle;
  keyboardVerticalOffset?: number;
  extraScrollHeight?: number;
}

export default function KeyboardAwareScrollView({
  children,
  containerStyle,
  keyboardVerticalOffset,
  extraScrollHeight = 100,
  ...scrollViewProps
}: KeyboardAwareScrollViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={[styles.container, containerStyle]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset || (Platform.OS === 'ios' ? 0 : 20)}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          { paddingBottom: insets.bottom + extraScrollHeight },
          scrollViewProps.contentContainerStyle,
        ]}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 