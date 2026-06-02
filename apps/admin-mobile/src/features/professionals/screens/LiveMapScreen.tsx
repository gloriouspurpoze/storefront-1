import { useMemo, useState } from 'react'
import { Linking, Pressable, StyleSheet, View } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { FilterChips } from '@/components/common/FilterChips'
import { QueryState } from '@/components/common/QueryState'
import { ScreenHeader } from '@/components/common/ScreenHeader'
import { Screen } from '@/components/layout/Screen'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { navigateToProfessionalDetail } from '@/lib/deepNavigation'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import { useGetLiveLocationsQuery } from '@/store/api/opsApi'
import { palette, radius, spacing } from '@/theme'

const DEFAULT_REGION = {
  latitude: 19.076,
  longitude: 72.8777,
  latitudeDelta: 0.35,
  longitudeDelta: 0.35,
}

type AvFilter = 'all' | 'available' | 'busy' | 'offline'

const AV_FILTERS: { id: AvFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'available', label: 'Available' },
  { id: 'busy', label: 'On job' },
  { id: 'offline', label: 'Offline' },
]

export function LiveMapScreen() {
  const { data = [], isLoading, isError, refetch } = useGetLiveLocationsQuery(undefined, {
    pollingInterval: 30_000,
  })
  const [filter, setFilter] = useState<AvFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const markers = useMemo(
    () =>
      data.filter((r) => {
        if (r.latitude == null || r.longitude == null) return false
        if (filter === 'all') return true
        return r.availability === filter
      }),
    [data, filter],
  )

  const selected = markers.find((m) => m.id === selectedId) ?? null

  const region = useMemo(() => {
    if (markers.length === 0) return DEFAULT_REGION
    const lat = markers.reduce((s, m) => s + (m.latitude ?? 0), 0) / markers.length
    const lng = markers.reduce((s, m) => s + (m.longitude ?? 0), 0) / markers.length
    return { latitude: lat, longitude: lng, latitudeDelta: 0.25, longitudeDelta: 0.25 }
  }, [markers])

  return (
    <PermissionGate webPath="/professionals/live-locations">
      <Screen edges={['top']} surface="canvas" gutter="none">
        <View style={styles.headerPad}>
          <ScreenHeader title="Live map" subtitle={`${markers.length} on map`} />
          <FilterChips options={AV_FILTERS} value={filter} onChange={setFilter} />
        </View>
        <QueryState isLoading={isLoading} isError={isError} onRetry={refetch}>
          <View style={styles.mapWrap}>
            <MapView style={styles.map} provider={PROVIDER_GOOGLE} initialRegion={region}>
              {markers.map((m) => (
                <Marker
                  key={m.id}
                  coordinate={{ latitude: m.latitude!, longitude: m.longitude! }}
                  title={m.name}
                  description={`${m.availability} · ${m.phone}`}
                  pinColor={
                    m.availability === 'available'
                      ? palette.success
                      : m.availability === 'busy'
                        ? palette.secondary
                        : palette.mute
                  }
                  onPress={() => setSelectedId(m.id)}
                />
              ))}
            </MapView>
            {markers.length === 0 && !isLoading ? (
              <View style={styles.overlay}>
                <Text variant="bodyMd" color="onDark" align="center">
                  No live coordinates for this filter.
                </Text>
              </View>
            ) : null}
          </View>
          {selected ? (
            <View style={styles.sheet}>
              <Pressable onPress={() => setSelectedId(null)} style={styles.sheetDismiss}>
                <Text variant="caption" color="body">
                  Tap map to dismiss
                </Text>
              </Pressable>
              <Text variant="bodyMdStrong" color="ink">
                {selected.name}
              </Text>
              <Text variant="bodySm" color="body">
                {selected.availability} · {selected.phone}
              </Text>
              <View style={styles.sheetActions}>
                <Button
                  label="Call"
                  variant="subtle"
                  block={false}
                  iconLeft="phone"
                  onPress={() => void Linking.openURL(`tel:${selected.phone}`)}
                  style={styles.sheetBtn}
                />
                {selected.professionalId ? (
                  <Button
                    label="Profile"
                    variant="primary"
                    block={false}
                    onPress={() => navigateToProfessionalDetail(selected.professionalId!)}
                    style={styles.sheetBtn}
                  />
                ) : null}
              </View>
            </View>
          ) : null}
        </QueryState>
      </Screen>
    </PermissionGate>
  )
}

const styles = StyleSheet.create({
  headerPad: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  mapWrap: { flex: 1, minHeight: 360 },
  map: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 20, 47, 0.55)',
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
  },
  sheet: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: palette.canvas,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.surfacePressed,
    gap: spacing.xs,
  },
  sheetDismiss: { alignSelf: 'flex-end', marginBottom: spacing.xs },
  sheetActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  sheetBtn: { flex: 1 },
})
