import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

const DEFAULT_SIZE = 20;

export const IconHome = ({ className = '', size = DEFAULT_SIZE }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 10L10 3L17 10V17H13V13H7V17H3Z" />
  </svg>
);

export const IconExplore = ({ className = '', size = DEFAULT_SIZE }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="10" cy="10" r="8" />
    <path d="M10 6V10L13 13" />
  </svg>
);

export const IconMessages = ({ className = '', size = DEFAULT_SIZE }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17 13L12 8M3 7H13C14.1 7 15 7.9 15 9V13C15 14.1 14.1 15 13 15H3C1.9 15 1 14.1 1 13V9C1 7.9 1.9 7 3 7Z" />
  </svg>
);

export const IconProfile = ({ className = '', size = DEFAULT_SIZE }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="10" cy="7" r="3" />
    <path d="M10 10C6.13 10 3 12.5 3 16V17H17V16C17 12.5 13.87 10 10 10Z" />
  </svg>
);

export const IconSearch = ({ className = '', size = DEFAULT_SIZE }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="8.5" cy="8.5" r="5.5" />
    <path d="M13 13L18 18" />
  </svg>
);

export const IconHeart = ({ className = '', size = DEFAULT_SIZE }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17.5 3.5C16.2 2.2 14.1 2.2 12.8 3.5L10 6.3L7.2 3.5C5.9 2.2 3.8 2.2 2.5 3.5C1.2 4.8 1.2 6.9 2.5 8.2L10 15.7L17.5 8.2C18.8 6.9 18.8 4.8 17.5 3.5Z" />
  </svg>
);

export const IconComment = ({ className = '', size = DEFAULT_SIZE }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17 8H3C1.9 8 1 8.9 1 10V15C1 16.1 1.9 17 3 17H6L8 19V17H17C18.1 17 19 16.1 19 15V10C19 8.9 18.1 8 17 8Z" />
  </svg>
);

export const IconShare = ({ className = '', size = DEFAULT_SIZE }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14 4H16V6M14 4L6 12M18 6V14C18 15.1 17.1 16 16 16H4C2.9 16 2 15.1 2 14V6C2 4.9 2.9 4 4 4H12" />
  </svg>
);

export const IconBell = ({ className = '', size = DEFAULT_SIZE }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 7C15 5.67 14.5 4.4 13.7 3.4C12.9 2.4 11.8 1.7 10.5 1.5C8 1 5.5 2.5 5.5 5V8C5.5 9 4.8 10 3.5 11H16.5C15.2 10 14.5 9 14.5 8V7H15Z" />
    <path d="M7 18H13C13 18.55 12.55 19 12 19H8C7.45 19 7 18.55 7 18Z" />
    <circle cx="17" cy="5" r="2.5" fill="currentColor" />
  </svg>
);

export const IconMap = ({ className = '', size = DEFAULT_SIZE }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 2C6.13 2 3 5.13 3 9C3 14.25 10 18 10 18S17 14.25 17 9C17 5.13 13.87 2 10 2Z" />
    <circle cx="10" cy="9" r="1.5" fill="currentColor" />
  </svg>
);

export const IconMail = ({ className = '', size = DEFAULT_SIZE }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 4H18C19.1 4 20 4.9 20 6V14C20 15.1 19.1 16 18 16H2C0.9 16 0 15.1 0 14V6C0 4.9 0.9 4 2 4Z" />
    <path d="M20 6L10 11L0 6" />
  </svg>
);

export const IconLock = ({ className = '', size = DEFAULT_SIZE }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="10" width="14" height="8" rx="1" />
    <path d="M5 10V6C5 3.24 7.24 1 10 1C12.76 1 15 3.24 15 6V10" />
  </svg>
);

export const IconBook = ({ className = '', size = DEFAULT_SIZE }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 4C2 2.9 2.9 2 4 2H16C17.1 2 18 2.9 18 4V14C18 15.1 17.1 16 16 16H4C2.9 16 2 15.1 2 14V4Z" />
    <path d="M6 6V12" />
    <path d="M10 6V12" />
    <path d="M14 6V12" />
  </svg>
);

export const IconChatBolt = ({ className = '', size = DEFAULT_SIZE }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17 8H3C1.9 8 1 8.9 1 10V15C1 16.1 1.9 17 3 17H6L8 19V17H17C18.1 17 19 16.1 19 15V10C19 8.9 18.1 8 17 8Z" />
    <path d="M12 10L10 14H12L10 18" />
  </svg>
);

export const IconVerified = ({ className = '', size = DEFAULT_SIZE }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 1L4 3V9C4 14.5 10 19 10 19C10 19 16 14.5 16 9V3L10 1Z" />
    <path d="M7 10L9 12L13 8" />
  </svg>
);

export const IconDots = ({ className = '', size = DEFAULT_SIZE }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    className={className}
  >
    <circle cx="10" cy="10" r="1.5" fill="currentColor" />
    <circle cx="17" cy="10" r="1.5" fill="currentColor" />
    <circle cx="3" cy="10" r="1.5" fill="currentColor" />
  </svg>
);

export const IconArrow = ({ className = '', size = DEFAULT_SIZE }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 10H15M10 5L15 10L10 15" />
  </svg>
);
