import { View, Text, Pressable } from 'react-native'

type PlayerModalProps = {
  url: string | null
  html: string | null
  open: boolean
  onClose: () => void
}

export function PlayerModal({ url, html, open, onClose }: PlayerModalProps) {
  if (!open) return null

  return (
    <View className="absolute inset-0 z-50 bg-black">
      <Pressable
        className="absolute top-4 right-4 z-10 rounded-full bg-white/8 border border-white/10 px-5 py-2"
        onPress={onClose}
      >
        <Text className="text-zinc-100 font-medium">✕ Закрыть</Text>
      </Pressable>
      {url && (
        <iframe
          src={url}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen"
          style={{ border: 0 }}
        />
      )}
      {html && !url && (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-zinc-400 text-sm">
            Плеер не поддерживается в этом браузере
          </Text>
        </View>
      )}
    </View>
  )
}
