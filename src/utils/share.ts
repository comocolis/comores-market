interface NativeBridge {
  shareText?: (title: string, url: string) => void
}

/** Partage un lien : feuille native Android (WebView), sinon Web Share API, sinon copie dans le presse-papiers. */
export async function shareLink(title: string, url: string): Promise<'shared' | 'copied' | 'failed'> {
  const bridge = (window as unknown as { MedianBridge?: NativeBridge }).MedianBridge
  if (bridge && typeof bridge.shareText === 'function') {
    try {
      bridge.shareText(title, url)
      return 'shared'
    } catch {
      // On retombe sur les methodes web ci-dessous.
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({ title, url })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'failed'
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
