import os
import subprocess
import glob

script = """
import Cocoa
import Vision
import Foundation

let args = CommandLine.arguments
if args.count < 2 { exit(1) }
let path = args[1]

guard let image = NSImage(contentsOfFile: path), 
      let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    print("Cannot load image: \\(path)")
    exit(1)
}

let request = VNRecognizeTextRequest { req, err in
    guard let obs = req.results as? [VNRecognizedTextObservation] else { return }
    for o in obs {
        if let top = o.topCandidates(1).first {
            print(top.string)
        }
    }
}
request.recognitionLanguages = ["zh-Hans", "en-US"]
request.usesLanguageCorrection = true

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
try? handler.perform([request])
"""

with open("/tmp/ocr.swift", "w") as f:
    f.write(script)

# compile ocr.swift for speed
subprocess.run(["swiftc", "-O", "/tmp/ocr.swift", "-o", "/tmp/ocr_bin"])

pngs = sorted(glob.glob(".local-evidence/real_device_system/*.png"))
for p in pngs:
    print(f"\n==========================================")
    print(f"FILE: {os.path.basename(p)}")
    print(f"==========================================")
    res = subprocess.run(["/tmp/ocr_bin", p], capture_output=True, text=True)
    for line in res.stdout.strip().split("\n"):
        if line.strip():
            print(f"  {line.strip()}")
