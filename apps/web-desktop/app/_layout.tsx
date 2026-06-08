import { Stack } from 'expo-router'
import { AppShell } from '@neomovies/ui'
import '../global.css'

export default function RootLayout() {
  return (
    <AppShell>
      <Stack screenOptions={{ headerShown: false }} />
    </AppShell>
  )
}
