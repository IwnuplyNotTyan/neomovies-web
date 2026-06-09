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
    <View
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'rgba(0,0,0,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Pressable
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
          paddingHorizontal: 20,
          paddingVertical: 8,
        }}
        onPress={onClose}
      >
        <Text style={{ color: '#e4e4e7', fontWeight: 500, fontSize: 14 }}>
          ✕ Закрыть
        </Text>
      </Pressable>
      {url && (
        <View
          style={{
            width: '100%',
            maxWidth: 1024,
            paddingHorizontal: 16,
            aspectRatio: 16 / 9,
          }}
        >
          <iframe
            src={url}
            allowFullScreen
            allow="autoplay; fullscreen"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 12,
              border: 0,
            }}
          />
        </View>
      )}
      {html && !url && (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
          }}
        >
          <Text style={{ color: '#a1a1aa', fontSize: 14 }}>
            Плеер не поддерживается в этом браузере
          </Text>
        </View>
      )}
    </View>
  )
}