export interface WorkCategory {
  id: string;
  title: string;
  countOrBadge: string;
  description: string;
  imageUrl: string;
  isHighlight?: boolean;
}
// 1. Importas las imágenes de la carpeta assets/mundos
import harryPotterImg from '../assets/mundos/HARRYPOTTER_CATEGORIAS.png';
import mangasImg from '../assets/mundos/ANIME_CATEGORIAS.png';
import mundoInfantilImg from '../assets/mundos/MUNDOINFANTIL_CATEGORIAS.png';
import fondoPropioImg from '../assets/mundos/FONDOPROPIO_CATEGORIAS.png';

// 2. Definición de la constante
export const WORKS_DATA: WorkCategory[] = [
  {
    id: 'harry-potter',
    title: 'HARRY POTTER',
    countOrBadge: '↗',
    description: 'Explora una colección mágica inspirada en el mundo de la hechicería y sus personajes icónicos.',
    imageUrl: harryPotterImg,
    isHighlight: true,
  },
  {
    id: 'mangas',
    title: 'MANGAS',
    countOrBadge: '↗',
    description: 'Historias llenas de acción, emoción e imaginación directa del cómic japonés.',
    imageUrl: mangasImg,
    isHighlight: false,
  },
  {
    id: 'infantil',
    title: 'MUNDO INFANTIL',
    countOrBadge: '↗',
    description: 'Aventuras diseñadas para despertar la curiosidad y alegría de los más pequeños.',
    imageUrl: mundoInfantilImg,
    isHighlight: false,
  },
  {
    id: 'fondo-propio',
    title: 'FONDO PROPIO',
    countOrBadge: '↗',
    description: 'Obras y publicaciones exclusivas de nuestro catálogo editorial.',
    imageUrl: fondoPropioImg,
    isHighlight: false,
  },
];