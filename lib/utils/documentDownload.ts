import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Linking } from 'react-native';

function safeFilenameFromUrl(url: string, fallback: string): string {
  try {
    const path = new URL(url).pathname.split('/').pop();
    if (path && /\.[a-z0-9]+$/i.test(path)) {
      return decodeURIComponent(path).replace(/[^\w.\-]/g, '_');
    }
  } catch {
    // ignore
  }
  return fallback;
}

/**
 * Downloads a remote PDF to the app cache and opens the system share sheet
 * so the user can save to Files, AirDrop, etc.
 */
export async function downloadPdfFromUrl(url: string, fallbackFilename: string): Promise<void> {
  if (!url?.trim()) {
    Alert.alert('No file', 'There is no document URL to download.');
    return;
  }

  const name = safeFilenameFromUrl(url, fallbackFilename);
  const dest = `${FileSystem.cacheDirectory}${name}`;

  const { uri } = await FileSystem.downloadAsync(url, dest);

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Save or share PDF',
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Linking.openURL(uri);
  }
}

export function openPdfInBrowser(url: string): void {
  if (!url?.trim()) return;
  Linking.openURL(url);
}
