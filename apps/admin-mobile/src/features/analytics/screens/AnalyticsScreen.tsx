import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { format } from 'date-fns'
import { KpiCard } from '@/components/common/KpiCard'
import { ListMeta } from '@/components/common/ListMeta'
import { QueryState } from '@/components/common/QueryState'
import { Screen } from '@/components/layout/Screen'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import { useGetAnalyticsDashboardQuery } from '@/store/api/phase2Api'
import { palette, radius, spacing } from '@/theme'

function MiniBarChart({
  items,
}: {
  items: Array<{ label: string; value: number; max: number }>
}) {
  return (
    <View style={styles.chart}>
      {items.map((item) => {
        const pct = item.max > 0 ? Math.min(100, (item.value / item.max) * 100) : 0
        return (
          <View key={item.label} style={styles.barRow}>
            <Text variant="caption" color="body" style={styles.barLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct}%` }]} />
            </View>
            <Text variant="caption" color="ink" style={styles.barValue}>
              {item.value}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

export function AnalyticsScreen() {
  const { data, isLoading, isError, refetch, isFetching } = useGetAnalyticsDashboardQuery()

  const overview = data?.overview
  const serviceStats = data?.serviceStats ?? []
  const maxRequests = Math.max(1, ...serviceStats.map((s) => s.totalRequests))

  return (
    <PermissionGate webPath="/analytics">
      <Screen scroll surface="canvas">
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={palette.primary} />
          }
        >
          <ListMeta text="Platform performance" />
          <QueryState isLoading={isLoading} isError={isError} onRetry={refetch}>
            <View style={styles.kpis}>
              <KpiCard
                label="Revenue"
                value={`₹${(overview?.totalRevenue ?? 0).toLocaleString('en-IN')}`}
                icon="wallet"
                accent
              />
              <KpiCard label="Bookings" value={String(overview?.totalBookings ?? 0)} icon="briefcase" />
              <KpiCard label="Users" value={String(overview?.totalUsers ?? 0)} icon="users" />
              <KpiCard label="Providers" value={String(overview?.totalProviders ?? 0)} icon="user" />
            </View>

            {serviceStats.length > 0 ? (
              <Card variant="content" padding="lg" style={styles.section}>
                <Text variant="bodyMdStrong" color="ink">
                  Requests by service
                </Text>
                <MiniBarChart
                  items={serviceStats.slice(0, 6).map((s) => ({
                    label: s.serviceType,
                    value: s.totalRequests,
                    max: maxRequests,
                  }))}
                />
              </Card>
            ) : null}

            {(data?.recentActivity?.length ?? 0) > 0 ? (
              <Card variant="content" padding="lg" style={styles.section}>
                <Text variant="bodyMdStrong" color="ink">
                  Recent activity
                </Text>
                {data!.recentActivity.slice(0, 8).map((row, idx) => (
                  <View key={`${row.timestamp}-${idx}`} style={styles.activityRow}>
                    <Text variant="bodySm" color="ink">
                      {row.description}
                    </Text>
                    <Text variant="caption" color="body">
                      {row.timestamp ? format(new Date(row.timestamp), 'dd MMM · HH:mm') : '—'}
                    </Text>
                  </View>
                ))}
              </Card>
            ) : null}
          </QueryState>
        </ScrollView>
      </Screen>
    </PermissionGate>
  )
}

const styles = StyleSheet.create({
  kpis: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  section: { marginBottom: spacing.lg, gap: spacing.md },
  chart: { gap: spacing.sm, marginTop: spacing.sm },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barLabel: { width: 72 },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: palette.canvasSoft,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: palette.primary,
    borderRadius: radius.full,
  },
  barValue: { width: 28, textAlign: 'right' },
  activityRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.surfacePressed,
    gap: 2,
  },
})
