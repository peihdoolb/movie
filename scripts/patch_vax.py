import sys
import zipfile
import zlib
import hashlib
import struct

def patch_vax_apk(input_apk_path, output_apk_path):
    old_url = b"https://raw.githubusercontent.com/youngbi/vaxapp/main/update.json"
    new_url = b"https://raw.githubusercontent.com/peihdoolb/movie/main/up.json?x="

    assert len(old_url) == len(new_url), f"URL length mismatch: {len(old_url)} vs {len(new_url)}"

    with zipfile.ZipFile(input_apk_path, "r") as zin:
        with zipfile.ZipFile(output_apk_path, "w", compression=zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                data = zin.read(item.filename)
                
                # Skip old signatures so it can be re-signed cleanly
                if item.filename.startswith("META-INF/") and (item.filename.endswith(".RSA") or item.filename.endswith(".SF") or item.filename.endswith(".MF")):
                    continue

                if item.filename == "classes2.dex":
                    dex = bytearray(data)
                    idx = dex.find(old_url)
                    if idx != -1:
                        print(f"[+] Found update URL at 0x{idx:x} in classes2.dex, patching...")
                        dex[idx:idx+len(old_url)] = new_url

                        # Recalculate SHA-1 (bytes 12..31 over bytes 32..end)
                        dex[12:32] = hashlib.sha1(dex[32:]).digest()

                        # Recalculate Adler-32 (bytes 8..11 over bytes 12..end)
                        checksum = zlib.adler32(dex[12:]) & 0xffffffff
                        dex[8:12] = struct.pack("<I", checksum)
                        print("[+] Checksum and SHA-1 updated successfully!")
                        data = bytes(dex)
                    else:
                        print("[-] Warning: update URL not found in classes2.dex")

                zout.writestr(item, data)

    print(f"[+] Output written to {output_apk_path}")

if __name__ == "__main__":
    in_apk = sys.argv[1] if len(sys.argv) > 1 else "vax_orig.apk"
    out_apk = sys.argv[2] if len(sys.argv) > 2 else "vax_unsigned.apk"
    patch_vax_apk(in_apk, out_apk)
