import * as React from 'react';

export const ThemeStyles: React.FC<{ theme?: { primaryColor: string; secondaryColor: string } }> = ({ theme }) => {
  const defaultTheme = {
    primaryColor: '#DC2626', // red-600
    secondaryColor: '#7F1D1D', // red-900
  };

  const currentTheme = theme && theme.primaryColor ? theme : defaultTheme;
  const { primaryColor, secondaryColor } = currentTheme;

  // Helper para escurecer uma cor hexadecimal
  const darkenColor = (hex: string, percent: number) => {
    hex = hex.replace(/^#/, '');
    const num = parseInt(hex, 16);
    let r = (num >> 16) + percent;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + percent;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + percent;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return `#${(g | (b << 8) | (r << 16)).toString(16).padStart(6, '0')}`;
  };
  
  const primaryHover = darkenColor(primaryColor, -20);
  const effectiveSecondaryColor = secondaryColor || primaryHover;

  const css = `
    :root {
      --color-primary: ${primaryColor};
      --color-primary-hover: ${primaryHover};
      --color-secondary: ${effectiveSecondaryColor};
    }
    .bg-primary { background-color: var(--color-primary); }
    .hover\\:bg-primary-dark:hover { background-color: var(--color-primary-hover); }
    .text-primary { color: var(--color-primary); }
    .border-primary { border-color: var(--color-primary); }
    .hover\\:bg-primary:hover { background-color: var(--color-primary); }
    .ring-primary:focus {
      --tw-ring-color: var(--color-primary);
      --tw-ring-opacity: 1;
      box-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
    }
    .bg-gradient-primary {
      background-image: linear-gradient(to right, var(--color-primary), var(--color-secondary));
    }
  `;

  return <style>{css}</style>;
};
