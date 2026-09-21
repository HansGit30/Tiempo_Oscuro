export interface Poster {
  id: string;
  title: string;
  imageUrl: string;
}

export const POSTERS_DATA: Poster[] = [
  { id: '1', title: 'Cinema', imageUrl: new URL('../assets/libros/H1.jpg', import.meta.url).href },
  { id: '2', title: 'Red Character', imageUrl: new URL('../assets/libros/H2.jpg', import.meta.url).href },
  { id: '3', title: 'Castle', imageUrl: new URL('../assets/libros/H3.jpg', import.meta.url).href },
  { id: '4', title: 'Gradient Art', imageUrl: new URL('../assets/libros/H4.jpg', import.meta.url).href },
  { id: '5', title: 'Architecture', imageUrl: new URL('../assets/libros/H5.jpg', import.meta.url).href },
  { id: '6', title: 'Night Sky', imageUrl: new URL('../assets/libros/H6.jpg', import.meta.url).href },
  { id: '7', title: 'Controller', imageUrl: new URL('../assets/libros/H7.jpg', import.meta.url).href },
];