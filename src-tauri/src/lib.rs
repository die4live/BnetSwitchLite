mod account_reader;
mod app_service;
mod commands;
mod contracts;
mod data_store;
mod error;
mod login_completion;
mod platform;
mod service_common;
mod window_state;

use commands::AppState;
use tauri::{
    Manager, WindowEvent,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn setup_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    let open_item = MenuItem::with_id(app, "open", "显示窗口", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open_item, &quit_item])?;

    let mut builder = TrayIconBuilder::with_id("main")
        .tooltip("战网切号器")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "open" => show_main_window(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        });
    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }
    builder.build(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            show_main_window(app);
        }))
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::new())
        .setup(|app| {
            #[cfg(windows)]
            if let Some(window) = app.get_webview_window("main") {
                let icons = platform::windows::window_icon::install(&window)?;
                app.manage(icons);
            }

            let window = app
                .get_webview_window("main")
                .ok_or("main window is missing")?;

            // 标题栏带上 tauri.conf.json 的 version，版本号更新时无需改这里。
            // 基准文案与 tauri.conf.json 的 app.windows[0].title 保持一致。
            let title = match app.config().version.as_deref() {
                Some(version) if !version.is_empty() => format!("战网切号器 v{version}"),
                _ => "战网切号器".to_string(),
            };
            let _ = window.set_title(&title);

            // 显示前恢复上次的窗口位置和大小
            window_state::restore(&window);

            setup_tray(app.handle())?;

            // 统一的窗口事件监听：
            // - Windows: DPI 变化时刷新窗口/任务栏图标
            // - 最小化即隐藏（缩进系统托盘，托盘左键点击恢复）
            // - 拖动/缩放防抖保存窗口状态，关闭前落盘一次
            let event_window = window.clone();
            window.on_window_event(move |event| match event {
                #[cfg(windows)]
                WindowEvent::ScaleFactorChanged { .. } => {
                    let icons =
                        event_window.state::<platform::windows::window_icon::WindowIconManager>();
                    let _ = icons.refresh(&event_window);
                }
                WindowEvent::Moved(_) | WindowEvent::Resized(_) => {
                    if event_window.is_minimized().unwrap_or(false) {
                        let _ = event_window.hide();
                    }
                    window_state::schedule_save(&event_window);
                }
                WindowEvent::CloseRequested { .. } => {
                    window_state::save_now(&event_window);
                }
                _ => {}
            });

            window.show()?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_app_snapshot,
            commands::refresh_accounts,
            commands::switch_account,
            commands::begin_login,
            commands::complete_login,
            commands::request_login_cancellation,
            commands::cancel_login,
            commands::remove_account,
            commands::set_client_path,
            commands::open_client,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
