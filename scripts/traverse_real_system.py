import subprocess, time, os, re, sys
import xml.etree.ElementTree as ET

serial = "159467059A001123"
outdir = ".local-evidence/SET-SYS-01/device/traversal"
os.makedirs(outdir, exist_ok=True)

def log(msg):
    print(msg, flush=True)

def adb_cmd(cmd, timeout=8):
    try:
        res = subprocess.run(["adb", "-s", serial] + cmd, capture_output=True, text=True, timeout=timeout)
        return res.stdout.strip()
    except subprocess.TimeoutExpired:
        log(f"[TIMEOUT] adb {' '.join(cmd)}")
        return ""

def adb_shell(cmd, timeout=8):
    try:
        res = subprocess.run(["adb", "-s", serial, "shell", cmd], capture_output=True, text=True, timeout=timeout)
        return res.stdout.strip()
    except subprocess.TimeoutExpired:
        log(f"[TIMEOUT] adb shell {cmd}")
        return ""

def dump_ui(tag):
    adb_shell(f"screencap -p /sdcard/{tag}.png")
    adb_shell(f"uiautomator dump /sdcard/{tag}.xml")
    adb_cmd(["pull", f"/sdcard/{tag}.png", f"{outdir}/{tag}.png"])
    adb_cmd(["pull", f"/sdcard/{tag}.xml", f"{outdir}/{tag}.xml"])
    
    xml_path = f"{outdir}/{tag}.xml"
    items = []
    if os.path.exists(xml_path):
        try:
            tree = ET.parse(xml_path)
            for node in tree.iter("node"):
                t = node.attrib.get("text", "") or node.attrib.get("content-desc", "")
                c = node.attrib.get("class", "")
                b = node.attrib.get("bounds", "")
                chk = node.attrib.get("checked", "")
                if t:
                    items.append({"text": t, "class": c, "bounds": b, "checked": chk})
        except Exception as e:
            pass
    log(f"[CAPTURED] {tag} -> {len(items)} items")
    return items

def find_bounds_by_text(items, target_text):
    for it in items:
        if target_text in it["text"]:
            m = re.findall(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", it["bounds"])
            if m:
                x1, y1, x2, y2 = map(int, m[0])
                return (x1 + x2) // 2, (y1 + y2) // 2
    return None

def tap(x, y):
    adb_shell(f"input tap {x} {y}")
    time.sleep(1.0)

def back():
    adb_shell("input keyevent 4")
    time.sleep(0.8)

log("Starting full real device traversal...")
# 0. System Dashboard
adb_shell("am start -n com.android.settings/.Settings\\$SystemDashboardActivity")
time.sleep(1.5)
dash_items = dump_ui("00_system_dashboard")

# 1. 系统导航
log("Traversing 1. 系统导航...")
pt = find_bounds_by_text(dash_items, "系统导航")
if pt:
    tap(pt[0], pt[1])
    dump_ui("01_system_navigation")
    back()

# 2. 日期与时间
log("Traversing 2. 日期与时间...")
pt = find_bounds_by_text(dash_items, "日期与时间")
if pt:
    tap(pt[0], pt[1])
    dt_items = dump_ui("02_date_time")
    
    # 尝试点常驻地
    res_pt = find_bounds_by_text(dt_items, "常驻地")
    if res_pt:
        tap(res_pt[0], res_pt[1])
        dump_ui("02_01_residence_popup")
        back()
        
    # 尝试点双时钟显示位置
    dual_pt = find_bounds_by_text(dt_items, "双时钟显示位置")
    if dual_pt:
        tap(dual_pt[0], dual_pt[1])
        dump_ui("02_02_dual_clock_position_popup")
        back()
    back()

# 3. 语言与输入法
log("Traversing 3. 语言与输入法...")
pt = find_bounds_by_text(dash_items, "语言与输入法")
if pt:
    tap(pt[0], pt[1])
    lang_items = dump_ui("03_language_input")
    # 点语言与地区
    sub_pt = find_bounds_by_text(lang_items, "语言与地区")
    if sub_pt:
        tap(sub_pt[0], sub_pt[1])
        dump_ui("03_01_languages_list")
        back()
    back()

# 4. 按住电源按钮
log("Traversing 4. 按住电源按钮...")
pt = find_bounds_by_text(dash_items, "按住电源按钮")
if pt:
    tap(pt[0], pt[1])
    dump_ui("04_power_button")
    back()

# 5. 定时开关机与重启
log("Traversing 5. 定时开关机与重启...")
pt = find_bounds_by_text(dash_items, "定时开关机与重启")
if pt:
    tap(pt[0], pt[1])
    pwr_items = dump_ui("05_power_schedule")
    t_pt = find_bounds_by_text(pwr_items, "定时开机")
    if t_pt:
        tap(t_pt[0], t_pt[1] + 60)
        dump_ui("05_01_power_on_time_picker")
        back()
    back()

# 6. USB 备份和恢复
log("Traversing 6. USB 备份和恢复...")
pt = find_bounds_by_text(dash_items, "USB 备份和恢复")
if pt:
    tap(pt[0], pt[1])
    dump_ui("06_usb_backup")
    back()

# 7. 重置手机
log("Traversing 7. 重置手机...")
pt = find_bounds_by_text(dash_items, "重置手机")
if pt:
    tap(pt[0], pt[1])
    reset_items = dump_ui("07_reset_phone")
    sub_pt = find_bounds_by_text(reset_items, "恢复出厂设置")
    if sub_pt:
        tap(sub_pt[0], sub_pt[1])
        dump_ui("07_01_factory_reset_confirm")
        back()
    back()

# 8. 开发者选项
log("Traversing 8. 开发者选项...")
pt = find_bounds_by_text(dash_items, "开发者选项")
if pt:
    tap(pt[0], pt[1])
    dump_ui("08_developer_options")
    back()

# 9. 增强服务
log("Traversing 9. 增强服务...")
pt = find_bounds_by_text(dash_items, "增强服务")
if pt:
    tap(pt[0], pt[1])
    dump_ui("09_enhanced_services")
    back()

log("Full real device traversal completed successfully!")
