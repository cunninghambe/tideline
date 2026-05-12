import Constants from 'expo-constants';

/** Returns true when running inside the Expo Go client. */
export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}
