import { Platform, useWindowDimensions } from 'react-native';

export const NINOU_DESKTOP_BREAKPOINT = 1080;
export const NINOU_DESKTOP_RAIL_WIDTH = 272;

export function useNinouLayout() {
  const { width, height } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= NINOU_DESKTOP_BREAKPOINT;
  return {
    width,
    height,
    isDesktop,
    contentOffset: isDesktop ? NINOU_DESKTOP_RAIL_WIDTH + 36 : 0,
  };
}
