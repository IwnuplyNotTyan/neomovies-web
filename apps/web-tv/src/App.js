import Blits from '@lightningjs/blits'

const menu = ['Home', 'Movies', 'TV shows', 'Live TV', 'Subscriptions']

export default Blits.Application({
  template: `
    <Element w="1920" h="1080" color="#0b1220">
      <Element x="0" y="0" w="1920" h="420" color="#111827" />
      <Element x="0" y="420" w="1920" h="660" color="#0d1526" />

      <Element x="70" y="80" w="1780" h="62" color="#1e293b" :effects="$glass" radius="31">
        <Element x="36" y="18" w="140" h="26" color="#64748b" radius="13" />
        <Element :for="(item, idx) in $menu" :key="item" :x="240 + idx * 190" y="18" w="120" h="24" color="#334155" radius="12" />
      </Element>

      <Element x="70" y="180" w="64" h="520" color="#1e293b" radius="32">
        <Element y="180" x="14" w="36" h="36" color="#334155" radius="18" />
        <Element y="240" x="14" w="36" h="36" color="#334155" radius="18" />
        <Element y="300" x="14" w="36" h="36" color="#334155" radius="18" />
      </Element>

      <Element x="170" y="190" w="1040" h="290">
        <Element x="0" y="0" w="250" h="34" color="#334155" radius="8" />
        <Element x="0" y="54" w="560" h="92" color="#475569" radius="14" />
        <Element x="0" y="166" w="350" h="52" color="#334155" radius="26" />
      </Element>

      <Element x="170" y="520" w="1560" h="34" color="#334155" radius="8" />
      <Element :for="(card, idx) in $rowOne" :key="idx" :x="170 + idx * 300" y="574" w="270" h="160" color="#1e293b" radius="16" />

      <Element x="170" y="770" w="520" h="34" color="#334155" radius="8" />
      <Element :for="(card, idx) in $rowTwo" :key="idx" :x="170 + idx * 300" y="824" w="270" h="160" color="#1e293b" radius="16" />
    </Element>
  `,
  state() {
    return {
      menu,
      rowOne: new Array(5).fill(0),
      rowTwo: new Array(5).fill(0),
      glass: [
        {
          type: 'radius',
          props: { radius: 31 },
        },
      ],
    }
  },
})
