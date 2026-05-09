import Blits from '@lightningjs/blits'
import App from './App.js'

Blits.Launch(App, 'app', {
  w: 1920,
  h: 1080,
  debugLevel: 0,
  defaultFont: 'sans',
  fonts: [{ family: 'sans', type: 'web', file: 'fonts/OpenSans-Medium.ttf' }],
  canvasColor: '#0b1220',
})
