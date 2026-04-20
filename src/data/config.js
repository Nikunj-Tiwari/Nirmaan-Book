export const COLOURS = [
  { name: 'White', sub: 'Solid', hex: '#F0EDE8' },
  { name: 'Grey', sub: 'Solid', hex: '#9EA09E' },
  { name: 'Twist Ivory', sub: 'Textured', hex: '#D5CAAD' },
  { name: 'Twist Grey', sub: 'Textured', hex: '#8E8F88' },
  { name: 'Virginia Walnut', sub: 'Wood Grain', hex: '#5C3822' },
  { name: 'Swiss Chestnut', sub: 'Wood Grain', hex: '#6E5342' },
  { name: 'Iconic Chestnut', sub: 'Wood Grain', hex: '#4A3325' },
];

export const MATERIALS = [
  { id: 'pb', name: 'Particle Board', sub: 'Economy grade', multiplier: 1.0 },
  { id: 'mdf', name: 'MDF', sub: 'Smooth finish', multiplier: 1.2 },
  { id: 'bwr', name: 'BWR', sub: 'Boiling water resistant', multiplier: 1.5 },
  { id: 'bwp', name: 'BWP', sub: 'Boiling waterproof — marine grade', multiplier: 1.8 },
];

export const FASCIAS = [
  'Akila',
  'Nubia',
  'Eugiene',
  'Rebeka',
  'Carmen',
  'Sofia',
  'Xena B',
  'Xena A',
  'Mandisa',
];

export const HANDLES = [
  { name: 'Matte Black', icon: '◼', sub: 'Metal bar pull, 160mm', price: 450 },
  { name: 'Brushed Gold', icon: '🟡', sub: 'Brass finish, 128mm', price: 850 },
  { name: 'Satin Steel', icon: '◻', sub: 'SS304, 192mm', price: 550 },
  { name: 'Handleless', icon: '—', sub: 'Integrated J-pull groove', price: 1200 },
];

export const LIGHTING = [
  { name: 'LED Strip', icon: '━', sub: 'Warm 3000K, shelf-edge', price: 2500 },
  { name: 'Spot Lights', icon: '◉', sub: 'Recessed, top-mount', price: 3200 },
  { name: 'Motion Sensor', icon: '◈', sub: 'Auto on/off, 30s delay', price: 4500 },
  { name: 'No Lighting', icon: '○', sub: 'Skip lighting', price: 0 },
];

export const ACCESSORIES = [
  {
    id: 'rack-t',
    name: 'Trouser Rack',
    icon: '📏',
    desc: 'Pull-out, fits 10–14 trousers, soft-close',
    price: 4500,
  },
  {
    id: 'jewel-g',
    name: 'Jewellery Tray (Glass)',
    icon: '💍',
    desc: 'Velvet-lined, glass cover shelf',
    price: 8500,
  },
  {
    id: 'acc-g',
    name: 'Accessory Tray (Glass)',
    icon: '🕶️',
    desc: 'Segmented, glass cover shelf',
    price: 7200,
  },
  {
    id: 'jewel-w',
    name: 'Jewellery Tray (Wood)',
    icon: '💎',
    desc: 'Velvet-lined, wooden cover shelf',
    price: 6500,
  },
  {
    id: 'acc-w',
    name: 'Accessory Tray (Wood)',
    icon: '⌚',
    desc: 'Segmented, wooden cover shelf',
    price: 5800,
  },
  {
    id: 'shoe',
    name: 'Shoe Rack Shelves',
    icon: '👟',
    desc: 'Angled fixed shelves for footwear',
    price: 2200,
  },
  {
    id: 'side',
    name: 'Side Hanger Rod',
    icon: '🧷',
    desc: 'Pull-out side rod, scarves & ties',
    price: 1800,
  },
  { id: 'top', name: 'Top Hanger Rod', icon: '👕', desc: 'Top-mounted garment rail', price: 1200 },
  {
    id: 'mirror',
    name: 'Mirror Panel',
    icon: '🪞',
    desc: 'Full-length door or fixed mirror',
    price: 4200,
  },
];

export const STEPS = [
  { id: 1, title: 'Dimensions', sub: 'Set your wall type and size' },
  { id: 2, title: 'Select Modules', sub: 'Choose wardrobe components' },
  { id: 3, title: 'Materials', sub: 'Pick finishes and colours' },
  { id: 4, title: 'Hardware', sub: 'Choose handles and accessories' },
  { id: 5, title: 'Summary', sub: 'Review and finalize' },
];

export const WALL_TYPES = [
  { id: 'single', name: 'Single Wall', sub: 'Linear', icon: '▬' },
  { id: 'l-shape', name: 'L-Shape', sub: 'Two walls', icon: '⌐' },
  { id: 'u-shape', name: 'U-Shape', sub: 'Three walls', icon: '⊓' },
  { id: 'walkin', name: 'Walk-In', sub: 'Island layout', icon: '⬜' },
];
