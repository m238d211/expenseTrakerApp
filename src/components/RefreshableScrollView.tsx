import React, { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  ScrollViewProps,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { colors } from '../design/tokens';

export function RefreshableScrollView({ children, ...props }: ScrollViewProps) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await queryClient.refetchQueries({ type: 'active' });
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <ScrollView
      {...props}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          colors={[colors.emerald]}
          tintColor={colors.emerald}
          progressBackgroundColor={colors.surface}
        />
      }
    >
      {children}
    </ScrollView>
  );
}
