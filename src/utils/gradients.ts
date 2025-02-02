// Define gradient presets with vibrant, modern color combinations
export const gradientPresets = [
  {
    from: 'from-purple-500',
    to: 'to-indigo-600',
    orbs: ['bg-purple-400', 'bg-indigo-400', 'bg-pink-400']
  },
  {
    from: 'from-blue-500',
    to: 'to-teal-500',
    orbs: ['bg-blue-400', 'bg-teal-400', 'bg-cyan-400']
  },
  {
    from: 'from-rose-500',
    to: 'to-orange-500',
    orbs: ['bg-rose-400', 'bg-orange-400', 'bg-red-400']
  },
  {
    from: 'from-emerald-500',
    to: 'to-cyan-500',
    orbs: ['bg-emerald-400', 'bg-cyan-400', 'bg-green-400']
  },
  {
    from: 'from-fuchsia-500',
    to: 'to-pink-600',
    orbs: ['bg-fuchsia-400', 'bg-pink-400', 'bg-violet-400']
  }
];

export function getRandomGradient() {
  return gradientPresets[Math.floor(Math.random() * gradientPresets.length)];
}