import type { BrowserMultiFormatReader as BrowserMultiFormatReaderType } from '@zxing/library';

export class BarcodeScannerService {
  private reader: BrowserMultiFormatReaderType | null = null;
  private isScanning = false;
  private activeStream: MediaStream | null = null;
  private torchEnabled = false;

  isSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    );
  }

  async start(
    videoElement: HTMLVideoElement,
    onResult: (barcode: string) => void,
    onError?: (err: unknown) => void
  ): Promise<void> {
    this.stop();

    if (!this.isSupported()) {
      throw new Error('Camera not supported');
    }

    const { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } = await import('@zxing/library');

    const hints = new Map<typeof DecodeHintType[keyof typeof DecodeHintType], unknown>();
    const formats = [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.QR_CODE,
    ];
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);

    this.reader = new BrowserMultiFormatReader(hints, 200);
    this.isScanning = true;
    this.torchEnabled = false;

    try {
      await this.reader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        videoElement,
        (result, error) => {
          if (result && this.isScanning) {
            const text = result.getText().trim();
            if (text) {
              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                try {
                  navigator.vibrate(80);
                } catch {
                  // ignore vibration failure
                }
              }
              this.stop();
              onResult(text);
            }
          }
          if (error && onError) {
            const name = error.name || '';
            if (name !== 'NotFoundException' && name !== 'ChecksumException' && name !== 'FormatException') {
              onError(error);
            }
          }
        }
      );

      if (videoElement.srcObject instanceof MediaStream) {
        this.activeStream = videoElement.srcObject;
      }
    } catch (err) {
      this.stop();
      throw err;
    }
  }

  stop(): void {
    this.isScanning = false;
    this.torchEnabled = false;

    if (this.reader) {
      try {
        this.reader.reset();
      } catch {
        // ignore reset failure
      }
      this.reader = null;
    }

    if (this.activeStream) {
      try {
        this.activeStream.getTracks().forEach((track) => track.stop());
      } catch {
        // ignore track stop failure
      }
      this.activeStream = null;
    }
  }

  getIsScanning(): boolean {
    return this.isScanning;
  }

  hasTorch(): boolean {
    if (!this.activeStream) return false;
    const track = this.activeStream.getVideoTracks()[0];
    if (!track) return false;
    const capabilities = (track.getCapabilities?.() || {}) as { torch?: boolean };
    return !!capabilities.torch;
  }

  async toggleTorch(): Promise<boolean> {
    if (!this.activeStream) return false;
    const track = this.activeStream.getVideoTracks()[0];
    if (!track) return false;

    try {
      this.torchEnabled = !this.torchEnabled;
      const applyConstraints = track.applyConstraints.bind(track) as (c: unknown) => Promise<void>;
      await applyConstraints({
        advanced: [{ torch: this.torchEnabled }],
      });
      return this.torchEnabled;
    } catch {
      return false;
    }
  }

  isTorchOn(): boolean {
    return this.torchEnabled;
  }
}

export const barcodeScanner = new BarcodeScannerService();
