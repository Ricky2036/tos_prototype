import subprocess
import time
import os
import xml.etree.ElementTree as ET

DEVICE = "159467059A001123"
OUT_DIR = ".local-evidence/real_device_system"

def adb(cmd, timeout=10):
    full_cmd = ["adb", "-s", DEVICE] + cmd
    res = subprocess.run(full_cmd, capture_output=True, text=True, timeout=timeout)
    return res.stdout

def adb_screencap(out_path):
    subprocess.run(f"adb -s {DEVICE} exec-out screencap -p > {out_path}", shell=True, timeout=10)

def dump_ui(name):
    # uiautomator dump to file
    adb(["shell", "uiautomator", "dump", f"/data/local/tmp/{name}.xml"], timeout=15)
    xml_path = os.path.join(OUT_DIR, f"{name}.xml")
    adb(["pull", f"/data/local/tmp/{name}.xml", xml_path], timeout=10)
    png_path = os.path.join(OUT_DIR, f"{name}.png")
    adb_screencap(png_path)
    return xml_path, png_path

def parse_nodes(xml_path):
    tree = ET.parse(xml_path)
    root = tree.getroot()
    nodes = []
    for node in root.iter('node'):
        text = node.attrib.get('text', '')
        desc = node.attrib.get('content-desc', '')
        cls = node.attrib.get('class', '')
        rid = node.attrib.get('resource-id', '')
        bounds = node.attrib.get('bounds', '')
        clickable = node.attrib.get('clickable', 'false')
        if text or desc:
            nodes.append({
                'text': text,
                'desc': desc,
                'class': cls,
                'rid': rid,
                'bounds': bounds,
                'clickable': clickable
            })
    return nodes

if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)
    # Open System settings
    print("Launching SystemDashboardActivity...")
    adb(["shell", "am", "start", "-n", "com.android.settings/.Settings$SystemDashboardActivity"])
    time.sleep(1.5)
    xml_p, png_p = dump_ui("00_system_root")
    print(f"Saved root: {xml_p}, {png_p}")
    nodes = parse_nodes(xml_p)
    print("\n--- System Root Items ---")
    for n in nodes:
        print(f"[{n['text'] or n['desc']}] bounds={n['bounds']} id={n['rid']}")
