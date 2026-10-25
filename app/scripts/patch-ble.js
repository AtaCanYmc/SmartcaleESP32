import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = path.resolve(
  __dirname,
  '../node_modules/@capacitor-community/bluetooth-le/ios/Sources/BluetoothLe/Plugin.swift'
);

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');

  // Replace faulty manufacturer data parsing
  const searchPattern =
    /for\s+index\s+in\s+0\.\.<manufacturerDataArray\.count\s*\{[\s\S]*?let\s+dataPrefix:\s*Data\?/;

  const replacement =
`for index in 0..<manufacturerDataArray.count {
            guard let dataObject = manufacturerDataArray[index] as? JSObject,
                  let companyId = (dataObject["companyIdentifier"] as? Int) ?? (dataObject["companyIdentifier"] as? NSNumber)?.intValue else {
                return nil
            }
            let companyIdentifier = UInt16(companyId & 0xFFFF)

            let dataPrefix: Data?`;

  content = content.replace(searchPattern, replacement);
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('✓ Successfully patched Plugin.swift');
} else {
  console.log('Plugin.swift not found at', targetFile);
}
