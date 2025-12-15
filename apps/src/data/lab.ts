export type LabWork = {
  id: string
  title: string
  image: string // /assets/...
  tags?: string[]
}

export const labArtist = {
  name: 'Анастасия',
  role: 'Художник ASKED LAB',
  avatar: '/assets/lab-anastasia.png',
  bio: [
    'Кастомы и ручная роспись одежды/аксессуаров.',
    'Работаю аэрографом и кистями, воплощу любую твою хотелку в реальность.',
    'Каждый кастом — уникален, согласование на каждом этапе. Такого точно ни у кого не будет',
  ],
  links: [
    { label: 'Портфолио', href: '#' },
    { label: 'Telegram', href: '#' },
  ],
}

export const labWorks: LabWork[] = [
  { id: 'w1', title: 'Hoodie — Chrome Drips', image: '/assets/lab-work-1.jpg', tags: ['hoodie', 'airbrush'] },
  { id: 'w2', title: 'Tee — Rune Lines', image: '/assets/lab-work-2.jpg', tags: ['tshirt'] },
  { id: 'w3', title: 'Sneakers — Split Ink', image: '/assets/lab-work-3.jpg', tags: ['sneakers'] },
  { id: 'w4', title: 'Cap — Minimal Tag', image: '/assets/lab-work-4.jpg', tags: ['cap'] },
]




