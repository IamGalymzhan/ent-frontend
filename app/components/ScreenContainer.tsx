import React, { ReactNode } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

interface ScreenContainerProps {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
}

const ScreenContainer: React.FC<ScreenContainerProps> = ({ 
  children, 
  scroll = false,
  className = ''
}) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  
  // Calculate bottom padding to account for the tab bar
  const bottomPadding = Math.max(tabBarHeight, insets.bottom);
  
  const containerStyle = { 
    flex: 1,
    paddingBottom: bottomPadding 
  };
  
  if (scroll) {
    return (
      <ScrollView 
        style={containerStyle}
        contentContainerStyle={styles.scrollContent} 
        className={className}
      >
        {children}
      </ScrollView>
    );
  }
  
  return (
    <View style={containerStyle} className={`flex-1 ${className}`}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  }
});

export default ScreenContainer; 