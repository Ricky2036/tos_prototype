import subprocess
import time
import os

DEVICE = "159467059A001123"
OUT_DIR = ".local-evidence/real_device_system"
os.makedirs(OUT_DIR, exist_ok=True)

def adb_shell(cmd):
    return subprocess.run(["adb", "-s", DEVICE, "shell", cmd], capture_output=True, text=True)

def screencap(name):
    path = os.path.join(OUT_DIR, f"{name}.png")
    subprocess.run(f"adb -s {DEVICE} exec-out screencap -p > {path}", shell=True)
    print(f"Captured: {path}")
    return path

def tap(x, y, delay=1.0):
    adb_shell(f"input tap {x} {y}")
    time.sleep(delay)

def back(delay=1.0):
    adb_shell("input keyevent 4")
    time.sleep(delay)

def open_system_root():
    adb_shell("am start -n com.android.settings/.Settings\\$SystemDashboardActivity")
    time.sleep(1.0)

def main():
    print("=== Capturing All System Pages ===")
    open_system_root()
    screencap("00_system_root")

    # 1. 系统导航 (503, 430)
    print("--- 1. 系统导航 ---")
    tap(503, 430)
    screencap("01_system_nav_gesture")
    # 往下滚一点看看
    adb_shell("input swipe 600 1800 600 800 300")
    time.sleep(0.5)
    screencap("01_system_nav_gesture_scrolled")
    # 点三键导航 (大约在 y=700 处？先回滚)
    adb_shell("input swipe 600 800 600 1800 300")
    time.sleep(0.5)
    # 点三键导航
    tap(500, 850)
    screencap("01_system_nav_three_btn")
    # 点回手势导航
    tap(500, 480)
    time.sleep(0.5)
    back()

    # 2. 日期与时间 (503, 593)
    print("--- 2. 日期与时间 ---")
    open_system_root()
    tap(503, 593)
    screencap("02_datetime_root")
    # 往下滑看完整日期与时间页面
    adb_shell("input swipe 600 1800 600 800 300")
    time.sleep(0.5)
    screencap("02_datetime_root_scrolled")
    # 恢复原位
    adb_shell("input swipe 600 800 600 1800 300")
    time.sleep(0.5)
    # 点击常驻地 (通常在底部)
    # 先往下滚
    adb_shell("input swipe 600 1800 600 800 300")
    time.sleep(0.5)
    # 常驻地大约在中间偏下
    tap(500, 1500)
    screencap("02_datetime_modal_resident")
    back() # 关闭弹窗
    # 点双时钟显示位置
    tap(500, 1300)
    screencap("02_datetime_modal_dual_clock")
    back()
    # 滚回顶部看日期和时间点击
    adb_shell("input swipe 600 800 600 1800 300")
    time.sleep(0.5)
    # 确保自动时间关闭以点击日期和时间
    # 日期大约在 (500, 680)
    tap(500, 680)
    screencap("02_datetime_picker_date")
    back()
    # 时间大约在 (500, 880)
    tap(500, 880)
    screencap("02_datetime_picker_time")
    back()
    back()

    # 3. 语言与输入法 (503, 756)
    print("--- 3. 语言与输入法 ---")
    open_system_root()
    tap(503, 756)
    screencap("03_language_root")
    adb_shell("input swipe 600 1800 600 800 300")
    time.sleep(0.5)
    screencap("03_language_root_scrolled")
    back()

    # 4. 按住电源按钮 (503, 1004)
    print("--- 4. 按住电源按钮 ---")
    open_system_root()
    tap(503, 1004)
    screencap("04_power_button_root")
    back()

    # 5. 定时开关机与重启 (503, 1173)
    print("--- 5. 定时开关机与重启 ---")
    open_system_root()
    tap(503, 1173)
    screencap("05_schedule_power_root")
    # 点开第一项看它的编辑页面
    tap(500, 500)
    screencap("05_schedule_power_edit")
    back()
    back()

    # 6. USB 备份和恢复 (503, 1680)
    print("--- 6. USB 备份和恢复 ---")
    open_system_root()
    tap(503, 1680)
    screencap("06_usb_backup_root")
    back()

    # 7. 重置手机 (503, 1843)
    print("--- 7. 重置手机 ---")
    open_system_root()
    tap(503, 1843)
    screencap("07_reset_phone_root")
    back()

    # 8. 增强服务 (503, 2249)
    print("--- 8. 增强服务 ---")
    open_system_root()
    tap(503, 2249)
    screencap("08_enhanced_services_root")
    adb_shell("input swipe 600 1800 600 800 300")
    time.sleep(0.5)
    screencap("08_enhanced_services_scrolled")
    back()

    print("=== Finished All Captures Successfully ===")

if __name__ == "__main__":
    main()
