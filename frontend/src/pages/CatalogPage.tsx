import React from 'react';
import { useBooks } from '../hooks/useBooks';

export const CatalogPage: React.FC = () => {
  const { books, loading, error } = useBooks();

  if (loading) {
    return <div style={styles.catalogStatus}>Cargando catálogo...</div>;
  }

  if (error) {
    return (
      <div style={{ ...styles.catalogStatus, color: '#dc2626' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={styles.catalogContainer}>
      <h1 style={styles.catalogTitle}>Catálogo de Libros - Tiempo Oscuro</h1>

      <div style={styles.booksGrid}>
        {books.map((book) => (
          <div key={book.id} style={styles.bookCard}>
            {/* Contenedor de la portada con sombra inferior */}
            <div style={styles.bookCoverWrapper}>
              <img
                src={book.cover_url || '/placeholder-cover.jpg'}
                alt={book.title}
                style={styles.bookCover}
              />
            </div>

            {/* Título del libro */}
            <h3 style={styles.bookItemTitle}>{book.title}</h3>

            {/* Autor */}
            <p style={styles.bookAuthor}>
              By <span style={{ fontStyle: 'normal', color: '#444' }}>{book.author || 'Tiempo Oscuro'}</span>
            </p>

            {/* Información de precio y stock */}
            <div style={styles.bookDetails}>
              <span>S/ {book.price ? book.price.toFixed(2) : '0.00'}</span>
              <span style={{ color: '#aaa' }}>•</span>
              <span>Stock: {book.stock}</span>
            </div>

            {/* Etiqueta de Best Seller */}
            {book.is_best_seller && (
              <span style={styles.badgeBestSeller}>★ Más Vendido</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- ESTILOS EN OBJETO ---
const styles: Record<string, React.CSSProperties> = {
  catalogContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  catalogTitle: {
    textAlign: 'center',
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#111',
    marginBottom: '40px',
  },
  booksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '48px 32px',
    justifyItems: 'center',
    alignItems: 'start',
  },
  bookCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    width: '100%',
    maxWidth: '280px',
  },
  bookCoverWrapper: {
    position: 'relative',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'center',
  },
  bookCover: {
    width: '210px',
    height: '310px',
    objectFit: 'cover',
    borderRadius: '4px',
    filter: 'drop-shadow(0px 16px 12px rgba(0, 0, 0, 0.28))',
  },
  bookItemTitle: {
    fontSize: '1.05rem',
    fontWeight: '600',
    color: '#222',
    margin: '0 0 6px 0',
    lineHeight: 1.3,
  },
  bookAuthor: {
    fontFamily: 'Georgia, serif',
    fontStyle: 'italic',
    fontSize: '0.88rem',
    color: '#666',
    margin: '0 0 10px 0',
  },
  bookDetails: {
    fontSize: '0.85rem',
    color: '#555',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  badgeBestSeller: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#b45309',
    backgroundColor: '#fef3c7',
    padding: '4px 10px',
    borderRadius: '12px',
    marginTop: '4px',
    display: 'inline-block',
  },
  catalogStatus: {
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '1.1rem',
    color: '#555',
  },
};

export default CatalogPage;