use std::{
    fs,
    path::{Path, PathBuf},
    sync::{
        OnceLock,
        atomic::{AtomicU64, Ordering},
    },
    thread,
    time::Duration,
};

use serde::{Deserialize, Serialize};
use tauri::{PhysicalPosition, PhysicalSize, WebviewWindow};

use crate::data_store::DataStore;

const WINDOW_STATE_VERSION: u8 = 1;
const FILE_NAME: &str = "window-state.json";
// 与 App.tsx 的 MIN/MAX_WINDOW_* 和 tauri.conf.json 的 minWidth/minHeight 保持一致
const MIN_WIDTH: u32 = 180;
const MAX_WIDTH: u32 = 1600;
const MIN_HEIGHT: u32 = 64;
const MAX_HEIGHT: u32 = 680;
// Windows 最小化时窗口坐标为 -32000，低于该阈值视为无效位置
const MIN_VALID_COORDINATE: i32 = -10_000;
// 窗口至少要有这么多像素落在某个显示器内，否则视为不可见位置（恢复时放弃还原位置）
const MIN_VISIBLE_OVERLAP: i32 = 40;
const SAVE_DEBOUNCE_ATTEMPTS: usize = 8;
const SAVE_DEBOUNCE_INTERVAL: Duration = Duration::from_millis(150);

static SAVE_TOKEN: AtomicU64 = AtomicU64::new(0);

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct WindowStateDocument {
    version: u8,
    x: i32,
    y: i32,
    width: u32,
    height: u32,
}

fn state_path() -> Option<&'static Path> {
    static PATH: OnceLock<Option<PathBuf>> = OnceLock::new();
    PATH.get_or_init(|| {
        DataStore::open()
            .ok()
            .map(|store| store.data_directory().join(FILE_NAME))
    })
    .as_deref()
}

/// 立即落盘一次。关闭窗口时调用，保证最后一次位置/尺寸不丢。
pub fn save_now(window: &WebviewWindow) {
    if window.is_minimized().unwrap_or(true) {
        return;
    }
    let Ok(PhysicalPosition { x, y }) = window.outer_position() else {
        return;
    };
    let Ok(PhysicalSize { width, height }) = window.inner_size() else {
        return;
    };
    if x < MIN_VALID_COORDINATE || y < MIN_VALID_COORDINATE || width == 0 || height == 0 {
        return;
    }
    let Some(path) = state_path() else {
        return;
    };
    let document = WindowStateDocument {
        version: WINDOW_STATE_VERSION,
        x,
        y,
        width,
        height,
    };
    let Ok(bytes) = serde_json::to_vec(&document) else {
        return;
    };
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let _ = fs::write(path, bytes);
}

/// 拖动/缩放会高频触发，用「令牌过期」去抖：每次事件重置令牌，
/// 只有连续 SAVE_DEBOUNCE_ATTEMPTS 轮没有新事件才真正落盘。
pub fn schedule_save(window: &WebviewWindow) {
    let token = SAVE_TOKEN.fetch_add(1, Ordering::SeqCst) + 1;
    let window = window.clone();
    thread::spawn(move || {
        for _ in 0..SAVE_DEBOUNCE_ATTEMPTS {
            thread::sleep(SAVE_DEBOUNCE_INTERVAL);
            if SAVE_TOKEN.load(Ordering::SeqCst) != token {
                return;
            }
        }
        save_now(&window);
    });
}

/// 在窗口显示前调用。位置无效（如显示器被拔掉后坐标落在屏外）时只恢复大小，
/// 位置交给 tauri.conf.json 的 center。
pub fn restore(window: &WebviewWindow) {
    let Some(path) = state_path() else {
        return;
    };
    let Ok(bytes) = fs::read(path) else {
        return;
    };
    let Ok(document) = serde_json::from_slice::<WindowStateDocument>(&bytes) else {
        return;
    };
    if document.version != WINDOW_STATE_VERSION {
        return;
    }
    let width = document.width.clamp(MIN_WIDTH, MAX_WIDTH);
    let height = document.height.clamp(MIN_HEIGHT, MAX_HEIGHT);
    let _ = window.set_size(PhysicalSize::new(width, height));
    if is_position_visible(window, document.x, document.y, width as i32, height as i32) {
        let _ = window.set_position(PhysicalPosition::new(document.x, document.y));
    }
}

fn is_position_visible(window: &WebviewWindow, x: i32, y: i32, width: i32, height: i32) -> bool {
    let Ok(monitors) = window.available_monitors() else {
        return false;
    };
    monitors.iter().any(|monitor| {
        let position = monitor.position();
        let size = monitor.size();
        let overlap_x = (x + width).min(position.x + size.width as i32) - x.max(position.x);
        let overlap_y = (y + height).min(position.y + size.height as i32) - y.max(position.y);
        overlap_x >= MIN_VISIBLE_OVERLAP && overlap_y >= MIN_VISIBLE_OVERLAP
    })
}
