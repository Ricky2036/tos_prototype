import subprocess
import time
import os
import xml.etree.ElementTree as ET

DEVICE = "159467059A001123"
BASE_DIR = ".local-evidence/real_device_system"

def adb(cmd):
    full_cmd = ["adb", "-s", DEVICE] + cmd
    return subprocess.run(full_cmd, capture_output=True, text=True)

def adb_shell(cmd_str):
    return subprocess.run(["adb", "-s", DEVICE, "shell", cmd_str], capture_output=True, text=True)

def capture(name):
    os.makedirs(BASE_DIR, exist_ok=True)
    xml_path = os.path.join(BASE_DIR, f"{name}.xml")
    png_path = os.path.join(BASE_DIR, f"{name}.png")
    
    # screencap
    adb_shell("screencap -p /sdcard/screenshot.png")
    subprocess.run(["adb", "-s", DEVICE, "pull", "/sdcard/screenshot.png", png_path], capture_output=True)
    
    # dump
    adb_shell("uiautomator dump /sdcard/window_dump.xml")
    subprocess.run(["adb", "-s", DEVICE, "pull", "/sdcard/window_dump.xml", xml_path], capture_output=True)
    
    return xml_path, png_path

def parse_items(xml_path):
    tree = ET.parse(xml_path)
    items = []
    for node in tree.iter("node"):
        text = node.attrib.get("text", "").strip()
        rid = node.attrib.get("resource-id", "")
        bounds = node.attrib.get("bounds", "")
        cls = node.attrib.get("class", "")
        if text:
            items.append({"text": text, "rid": rid, "bounds": bounds, "class": cls})
    return items

def tap_bounds(bounds_str):
    # bounds is like "[107,416][901,490]"
    import re
    m = re.findall(r"\[(\d+),(\d+)\]", bounds_str)
    if len(m) == 2:
        x1, y1 = int(m[0][0]), int(m[0][1])
        x2, y2 = int(m[1][0]), int(m[1][1])
        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
        adb_shell(f"input tap {cx} {cy}")
        time.sleep(1)
        return True
    return False

def press_back():
    adb_shell("input keyevent 4")
    time.sleep(1)

def main():
    print("=== Starting Real Device System Menus Traversal ===")
    # 1. Start System root
    adb_shell("am start -n com.android.settings/.Settings\\$SystemDashboardActivity")
    time.sleep(1.5)
    
    root_xml, root_png = capture("00_system_root_top")
    print("Captured system root top")
    
    # Scroll down to capture bottom of system root
    adb_shell("input swipe 600 1800 600 600 300")
    time.sleep(1)
    capture("00_system_root_bottom")
    print("Captured system root bottom")
    
    # Reset to top
    adb_shell("input swipe 600 600 600 1800 300")
    time.sleep(1)

    targets = [
        "系统导航",
        "日期与时间",
        "语言与输入法",
        "按住电源按钮",
        "定时开关机与重启",
        "USB 备份和恢复",
        "重置手机",
        "增强服务"
    ]

    for target in targets:
        print(f"\n--- Traversing: {target} ---")
        # Ensure we are in system root
        adb_shell("am start -n com.android.settings/.Settings\\$SystemDashboardActivity")
        time.sleep(1)
        
        # Dump current root to find target coordinates
        adb_shell("uiautomator dump /sdcard/window_dump.xml")
        subprocess.run(["adb", "-s", DEVICE, "pull", "/sdcard/window_dump.xml", "/tmp/search.xml"], capture_output=True)
        items = parse_items("/tmp/search.xml")
        found = False
        for item in items:
            if target in item["text"]:
                print(f"Found {target} at {item['bounds']}, tapping...")
                tap_bounds(item["bounds"])
                found = True
                break
        
        if not found:
            # Scroll down and search
            adb_shell("input swipe 600 1500 600 700 300")
            time.sleep(1)
            adb_shell("uiautomator dump /sdcard/window_dump.xml")
            subprocess.run(["adb", "-s", DEVICE, "pull", "/sdcard/window_dump.xml", "/tmp/search.xml"], capture_output=True)
            items = parse_items("/tmp/search.xml")
            for item in items:
                if target in item["text"]:
                    print(f"Found {target} after scroll at {item['bounds']}, tapping...")
                    tap_bounds(item["bounds"])
                    found = True
                    break
        
        if found:
            time.sleep(1.2)
            safe_name = target.replace(" ", "_")
            capture(f"page_{safe_name}_top")
            # If it's scrollable, capture bottom too
            adb_shell("input swipe 600 1800 600 600 300")
            time.sleep(1)
            capture(f"page_{safe_name}_bottom")
            press_back()

    print("\n=== Traversal Complete ===")

if __name__ == "__main__":
    main()
