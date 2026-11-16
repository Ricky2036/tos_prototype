import subprocess, time, os
import xml.etree.ElementTree as ET

serial = "159467059A001123"
outdir = ".local-evidence/SET-SYS-01/device/traversal"
os.makedirs(outdir, exist_ok=True)

def adb_cmd(cmd):
    return subprocess.run(["adb", "-s", serial] + cmd, capture_output=True, text=True).stdout.strip()

def adb_shell(cmd):
    return subprocess.run(["adb", "-s", serial, "shell", cmd], capture_output=True, text=True).stdout.strip()

def dump_ui(tag):
    adb_shell(f"screencap -p /sdcard/{tag}.png")
    adb_shell(f"uiautomator dump --compressed /sdcard/{tag}.xml")
    adb_cmd(["pull", f"/sdcard/{tag}.png", f"{outdir}/{tag}.png"])
    adb_cmd(["pull", f"/sdcard/{tag}.xml", f"{outdir}/{tag}.xml"])
    print(f"[CAPTURED] {tag}", flush=True)

def tap(x, y):
    adb_shell(f"input tap {x} {y}")
    time.sleep(1.2)

def back():
    adb_shell("input keyevent 4")
    time.sleep(1.0)

# Start from dashboard
adb_shell("am start -n com.android.settings/.Settings\\$SystemDashboardActivity")
time.sleep(1.5)

# 04. 按住电源按钮 [108,973][713,1036]
tap(500, 1000)
dump_ui("04_power_button")
back()

# 05. 定时开关机与重启 [108,1142][899,1205]
tap(500, 1170)
dump_ui("05_power_schedule")
# tap power on row
tap(500, 480)
dump_ui("05_01_power_on_edit")
back()
back()

# 06. USB 备份和恢复 [108,1649][899,1712]
tap(500, 1680)
dump_ui("06_usb_backup")
back()

# 07. 重置手机 [108,1812][899,1875]
tap(500, 1840)
dump_ui("07_reset_phone")
# tap 恢复出厂设置 [108,562]
tap(500, 560)
dump_ui("07_01_factory_reset_details")
back()
back()

# 08. 开发者选项 [108,2055][899,2118]
tap(500, 2080)
dump_ui("08_developer_options")
back()

# 09. 增强服务 [108,2218][899,2281]
tap(500, 2250)
dump_ui("09_enhanced_services")
back()

print("ALL SUBPAGES CAPTURED SUCCESSFULLY!", flush=True)
