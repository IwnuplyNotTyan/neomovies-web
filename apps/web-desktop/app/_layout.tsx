import { Stack } from 'expo-router'
import { AppShell } from '@neomovies/ui'
import '../global.css'
import '@neo-open-source/ui-web/styles.css'

export default function RootLayout() {
  return (
    <AppShell>
      <Stack screenOptions={{ headerShown: false }} />
    </AppShell>
  )
}
