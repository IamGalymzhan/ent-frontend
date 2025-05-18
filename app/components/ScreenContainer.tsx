import React, { ReactNode } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

interface ScreenContainerProps {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
  keyboardAvoiding?: boolean;
}

const ScreenContainer: React.FC<ScreenContainerProps> = ({ 
  children, 
  scroll = false,
  className = '',
  keyboardAvoiding = false
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  // Calculate bottom padding based on safe area
  // Instead of using the hook that requires Tab Navigator, just use safe area
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 20;
  
  const containerStyle = { 
    flex: 1,
  };
  
  const content = scroll ? (
    <ScrollView 
      style={containerStyle}
      contentContainerStyle={[
        styles.scrollContent, 
        { paddingBottom: bottomPadding + 20 } // Add extra padding at bottom for better scrolling
      ]} 
      className={className}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={true}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={containerStyle} className={`flex-1 ${className}`}>
      {children}
    </View>
  );
  
  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }
  
  return content;
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  }
});

export default ScreenContainer; 