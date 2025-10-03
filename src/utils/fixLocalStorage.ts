// Utility to fix corrupted localStorage data

export const fixPromotersData = (): void => {
  try {
    const promotersData = window.localStorage.getItem('merchandising-promoters');
    
    if (promotersData) {
      const parsed = JSON.parse(promotersData);
      
      // Check if it's an array of strings instead of objects
      if (Array.isArray(parsed) && parsed.length > 0) {
        const firstItem = parsed[0];
        
        // If it's a string, the data is corrupted
        if (typeof firstItem === 'string') {
          console.warn('Detected corrupted promoters data, clearing...');
          window.localStorage.removeItem('merchandising-promoters');
          
          // Also clear related chunks
          let i = 0;
          while (window.localStorage.getItem(`merchandising-promoters_chunk_${i}`)) {
            window.localStorage.removeItem(`merchandising-promoters_chunk_${i}`);
            i++;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fixing localStorage:', error);
    window.localStorage.removeItem('merchandising-promoters');
  }
};
