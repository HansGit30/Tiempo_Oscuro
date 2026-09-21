export interface NewsItem {
  id: string;
  title: string;
  date: string;
  imageUrl: string;
  link: string;
}

export const NEWS_DATA: NewsItem[] = [
  {
    id: '1',
    title: "Tiempo Oscuro obtiene el premio a la Mejor Edición Independiente en FIL Lima",
    date: '2026.07.25',
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800',
    link: '#',
  },
  {
    id: '2',
    title: "Lanzamiento oficial de la colección exclusiva de narrativa peruana contemporánea",
    date: '2026.05.18',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800',
    link: '#',
  },
  {
    id: '3',
    title: "Expansión del catálogo digital: Envíos e historias independientes en todo el Perú",
    date: '2026.03.10',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800',
    link: '#',
  },
];