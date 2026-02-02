import * as React from 'react';

export const Icon: React.FC<{ path: string, className?: string }> = ({ path, className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);

export const ClockIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" />;
export const CreditCardIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm2 2h2v2H6V6zm4 0h2v2h-2V6zM6 9h2v2H6V9zm4 0h2v2h-2V9z" />;
export const MapPinIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" />;
export const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => <Icon className={className} path="M15 19l-7-7 7-7" />;
export const ChevronRightIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => <Icon className={className} path="M5 19l7-7-7-7" />;
export const UploadIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M4 12a1 1 0 011 1v3a1 1 0 001 1h8a1 1 0 001-1v-3a1 1 0 112 0v3a3 3 0 01-3 3H6a3 3 0 01-3-3v-3a1 1 0 011-1zm5-10a1 1 0 011 1v7.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 10.586V3a1 1 0 011-1z" />;
export const PlusIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => <Icon className={className} path="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />;
export const SyncIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M10 3a7 7 0 015.65 11.35l1.42 1.42A9 9 0 109 19v-2a7 7 0 111-7H8l3 3 3-3h-2a5 5 0 10-4.53 7.59L5.9 16.17A7 7 0 0110 3z" />;

// Ícones específicos
export const WhatsAppIcon: React.FC<{className?: string}> = ({className = "h-5 w-5 mr-2"}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M10.3 2.2C5.7 2.2 2 5.9 2 10.5c0 1.6.4 3.1 1.3 4.4L2 20l5.2-1.3c1.3.8 2.8 1.2 4.4 1.2 4.6 0 8.3-3.7 8.3-8.3S14.9 2.2 10.3 2.2zM10.3 18.1c-1.4 0-2.8-.4-4-1.2l-.3-.2-3 .8.8-2.9-.2-.3c-.8-1.2-1.3-2.7-1.3-4.2 0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5-2.9 6.5-6.5 6.5zm3.2-4.9c-.2-.1-1.1-.5-1.3-.6-.2-.1-.3-.1-.5.1s-.5.6-.6.7c-.1.1-.2.2-.4.1-.2 0-.8-.3-1.5-.9s-1.1-1.3-1.2-1.5c-.1-.2 0-.3.1-.4l.3-.3c.1-.1.1-.2.2-.3.1-.1 0-.3-.1-.4-.1-.1-.5-1.1-.6-1.5-.2-.4-.3-.3-.5-.3h-.4c-.2 0-.4.1-.6.3s-.7.7-.7 1.6.7 1.9 1.4 2.6c1.1 1.1 2.1 1.7 3.3 1.7.2 0 .4 0 .6-.1.6-.2 1.1-.7 1.2-1.3.1-.6.1-1.1 0-1.2-.1-.1-.3-.2-.5-.3z" /></svg>;
export const LogoutIcon: React.FC<{className?: string}> = ({className = "h-5 w-5 mr-2"}) => <Icon className={className} path="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" />;
export const UserIcon: React.FC<{className?: string}> = ({className = "h-6 w-6"}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
export const VisualsIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => <Icon className={className} path="M10 3.22l-.61-.6a10 10 0 00-12.78 12.78l.61.61A10 10 0 0010 3.22zM17.39 6.61a10 10 0 00-10.78-3.39l-3.22 3.22a10 10 0 003.39 10.78l3.22-3.22A10 10 0 0017.39 6.61zM10 12a2 2 0 110-4 2 2 0 010 4z" />;

// Ícones do Painel Admin
export const DashboardIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />;
export const ShopIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />;
export const ScissorsIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm0 12c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3z" />;
export const TagIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />;
export const GalleryIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z" />;
export const CalendarIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />;
export const StarIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />;
export const UsersIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M9 6a3 3 0 11-6 0 3 3 0 016 0zm8 0a3 3 0 11-6 0 3 3 0 016 0zm-4 6a3 3 0 11-6 0 3 3 0 016 0zM5 20a2 2 0 01-2-2v-6a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2-2H5z" />;
export const ChartBarIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M3 12v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2zm2-2a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H7a2 2 0 01-2-2v-2zm10-4a2 2 0 00-2-2h-2a2 2 0 00-2 2v12a2 2 0 002 2h2a2 2 0 002-2V6z" />;
export const TrendingUpIcon: React.FC<{className?: string}> = ({className = "h-6 w-6"}) => <Icon className={className} path="M13 7h8v8h-2V9.414l-6.293 6.293-4-4L1 19.414 2.414 18l7.293-7.293 4 4L19.586 9H15V7z" />;
export const ArrowSmDownIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M10 14l-5-5h10l-5 5z" />;
export const ArrowSmUpIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M10 6l5 5H5l5-5z" />;
export const TrashIcon: React.FC<{className?: string}> = ({className = "h-5 w-5"}) => <Icon className={className} path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />;
// End of icons
